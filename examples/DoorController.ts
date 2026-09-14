/**
 * Door Controller Example - Hybrid Off-chain Verification + On-chain Audit
 *
 * This example demonstrates how to implement a physical access control system
 * using the AccessManagement smart contract with instant response times.
 *
 * Architecture:
 * 1. Permissions are stored on-chain (blockchain is the source of truth)
 * 2. Door controller caches permissions locally for instant validation
 * 3. Access attempts are logged locally and batched to blockchain periodically
 *
 * Benefits:
 * - Instant access validation (<500ms)
 * - No gas cost for users
 * - Works during brief network outages
 * - Maintains audit trail on blockchain
 * - Tamper-proof permission management
 *
 * Requirements:
 * - The controller's signing key must be the asset owner or hold an authorization
 *   on the door asset: batchLogAccess() only accepts entries from an accountable
 *   reporter, and records that reporter in every AccessLogReported event.
 */

import { ethers } from 'ethers';

// Contract ABI - only the functions we need
const ACCESS_MANAGEMENT_ABI = [
  "function canAccess(string assetKey, address user) external view returns(bool)",
  "function getAssetAuthorizationCount(string assetKey) external view returns(uint)",
  "function getAssetAuthorizationAtIndex(string assetKey, uint row) external view returns(address)",
  "function getAuthorizationDetails(string assetKey, address authorizationKey) external view returns(string role, bool active, uint256 expiresAt)",
  "function getAsset(string assetKey) external view returns(address owner, string description, bool initialized, uint authorizationCount)",
  "function batchLogAccess(tuple(address user, string assetKey, uint256 timestamp, bool granted)[] entries) external returns(bool)",
  "event AuthorizationCreate(address indexed account, string indexed assetKey, string authorizationRole)",
  "event AuthorizationRemove(address indexed account, string indexed assetKey)"
];

interface AccessLogEntry {
  user: string;
  assetKey: string;
  timestamp: number;
  granted: boolean;
}

interface PermissionCache {
  owner: string;
  /** address (lowercase) -> expiry as a Unix timestamp, 0 when the grant never expires */
  authorized: Map<string, number>;
  lastSync: number;
}

export class DoorController {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private doorAssetKey: string;
  private permissionCache: PermissionCache;
  private localAuditLog: AccessLogEntry[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private uploadInterval: NodeJS.Timeout | null = null;
  private isUploading = false;

  // Configuration
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly UPLOAD_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  private readonly MAX_CACHE_AGE_MS = 60 * 60 * 1000; // 1 hour
  private readonly MAX_BATCH_SIZE = 100;

  constructor(
    providerUrl: string,
    contractAddress: string,
    doorAssetKey: string,
    privateKey?: string // Optional: for signing batch uploads
  ) {
    this.provider = new ethers.JsonRpcProvider(providerUrl);

    // If private key provided, create a signer for batch uploads
    const signerOrProvider = privateKey
      ? new ethers.Wallet(privateKey, this.provider)
      : this.provider;

    this.contract = new ethers.Contract(
      contractAddress,
      ACCESS_MANAGEMENT_ABI,
      signerOrProvider
    );

    this.doorAssetKey = doorAssetKey;
    this.permissionCache = {
      owner: '',
      authorized: new Map(),
      lastSync: 0
    };
  }

  /**
   * Initialize the door controller
   * - Sync permissions from blockchain
   * - Set up event listeners
   * - Start periodic sync and upload
   */
  async initialize(): Promise<void> {
    console.log(`[DoorController] Initializing for asset: ${this.doorAssetKey}`);

    // Initial permission sync
    await this.syncPermissions();

    // Listen for permission changes in real-time
    this.setupEventListeners();

    // Start periodic sync
    this.syncInterval = setInterval(() => {
      this.syncPermissions().catch(err =>
        console.error('[DoorController] Sync failed:', err)
      );
    }, this.SYNC_INTERVAL_MS);

    // Start periodic log upload
    this.uploadInterval = setInterval(() => {
      this.uploadAuditLogs().catch(err =>
        console.error('[DoorController] Upload failed:', err)
      );
    }, this.UPLOAD_INTERVAL_MS);

    console.log('[DoorController] Initialization complete');
  }

  /**
   * Sync permissions from blockchain
   * This is a view call, so it's free and fast
   */
  private async syncPermissions(): Promise<void> {
    try {
      console.log('[DoorController] Syncing permissions from blockchain...');

      // Get asset info (including owner)
      const [owner, , initialized, authCount] = await this.contract.getAsset(this.doorAssetKey);

      if (!initialized) {
        throw new Error(`Asset ${this.doorAssetKey} does not exist`);
      }

      // Clear and rebuild the authorized map
      const newAuthorized = new Map<string, number>();

      // Fetch all listed addresses. The list also holds revoked and expired entries,
      // so every address is checked against its authorization record before caching.
      const total = Number(authCount);
      const addresses: string[] = await Promise.all(
        Array.from({ length: total }, (_, i) =>
          this.contract.getAssetAuthorizationAtIndex(this.doorAssetKey, i)
        )
      );

      const details = await Promise.all(
        addresses.map(address =>
          this.contract.getAuthorizationDetails(this.doorAssetKey, address)
        )
      );

      addresses.forEach((address, i) => {
        const [, active, expiresAt] = details[i];
        if (!active) return; // revoked since it was added to the list
        newAuthorized.set(address.toLowerCase(), Number(expiresAt));
      });

      // Update cache
      this.permissionCache = {
        owner: owner.toLowerCase(),
        authorized: newAuthorized,
        lastSync: Date.now()
      };

      console.log(`[DoorController] Synced: Owner=${owner}, Authorized=${newAuthorized.size} addresses`);
    } catch (error) {
      console.error('[DoorController] Failed to sync permissions:', error);
      throw error;
    }
  }

  /**
   * Listen for real-time permission changes
   */
  private setupEventListeners(): void {
    // `assetKey` is an indexed string, so the event only carries its keccak256 hash and
    // cannot be compared to the plain key in the handler. Filter on the topic instead:
    // ethers hashes the string when building the filter.
    const createdFilter = this.contract.filters.AuthorizationCreate(null, this.doorAssetKey);
    const removedFilter = this.contract.filters.AuthorizationRemove(null, this.doorAssetKey);

    // Listen for new authorizations
    this.contract.on(createdFilter, async (account: string) => {
      console.log(`[DoorController] Real-time: Authorization added for ${account}`);
      await this.refreshAuthorization(account);
    });

    // Listen for authorization removals
    this.contract.on(removedFilter, (account: string) => {
      console.log(`[DoorController] Real-time: Authorization removed for ${account}`);
      this.permissionCache.authorized.delete(account.toLowerCase());
    });
  }

  /**
   * Refresh a single address in the cache, including its expiry.
   * The AuthorizationCreate event does not carry the expiration timestamp,
   * so it has to be read back from the contract.
   */
  private async refreshAuthorization(account: string): Promise<void> {
    try {
      const [, active, expiresAt] = await this.contract.getAuthorizationDetails(
        this.doorAssetKey,
        account
      );

      if (active) {
        this.permissionCache.authorized.set(account.toLowerCase(), Number(expiresAt));
      } else {
        this.permissionCache.authorized.delete(account.toLowerCase());
      }
    } catch (error) {
      console.error(`[DoorController] Failed to refresh authorization for ${account}:`, error);
      // Fail secure: drop the cached grant until the next full sync confirms it
      this.permissionCache.authorized.delete(account.toLowerCase());
    }
  }

  /**
   * Is there a cached grant for this address that has not expired yet?
   * Temporary authorizations expire on their own, without any event being emitted,
   * so the expiry has to be re-checked on every validation and not only at sync time.
   */
  private hasValidGrant(normalizedAddress: string): boolean {
    const expiresAt = this.permissionCache.authorized.get(normalizedAddress);
    if (expiresAt === undefined) return false;
    if (expiresAt === 0) return true; // never expires

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (expiresAt <= nowSeconds) {
      this.permissionCache.authorized.delete(normalizedAddress);
      return false;
    }

    return true;
  }

  /**
   * Validate access - INSTANT response using cached permissions
   * This is the main function called when someone tries to open the door
   */
  async validateAccess(userAddress: string): Promise<boolean> {
    const normalizedAddress = userAddress.toLowerCase();

    // Check if cache is too old (safety measure)
    const cacheAge = Date.now() - this.permissionCache.lastSync;
    if (cacheAge > this.MAX_CACHE_AGE_MS) {
      console.warn('[DoorController] Cache is stale, denying access until sync');
      this.logAccess(userAddress, false);

      // Trigger immediate sync in background
      this.syncPermissions().catch(err =>
        console.error('[DoorController] Emergency sync failed:', err)
      );

      return false;
    }

    // Check cached permissions (instant!)
    const isOwner = normalizedAddress === this.permissionCache.owner;
    const isAuthorized = this.hasValidGrant(normalizedAddress);
    const hasAccess = isOwner || isAuthorized;

    // Log locally
    this.logAccess(userAddress, hasAccess);

    if (hasAccess) {
      console.log(`[DoorController] ✓ Access GRANTED for ${userAddress}`);
      this.unlockDoor();
    } else {
      console.log(`[DoorController] ✗ Access DENIED for ${userAddress}`);
      this.triggerDeniedAlert(userAddress);
    }

    return hasAccess;
  }

  /**
   * Alternative: Validate with on-chain verification (slower but guaranteed accurate)
   * Use this for critical security checks or when cache is unavailable
   */
  async validateAccessOnChain(userAddress: string): Promise<boolean> {
    try {
      console.log(`[DoorController] On-chain verification for ${userAddress}...`);

      // This is a view call, so it's free but requires network round-trip (~100-500ms)
      const hasAccess = await this.contract.canAccess(this.doorAssetKey, userAddress);

      this.logAccess(userAddress, hasAccess);

      if (hasAccess) {
        console.log(`[DoorController] ✓ Access GRANTED (on-chain) for ${userAddress}`);
        this.unlockDoor();
      } else {
        console.log(`[DoorController] ✗ Access DENIED (on-chain) for ${userAddress}`);
      }

      return hasAccess;
    } catch (error) {
      console.error('[DoorController] On-chain verification failed:', error);
      this.logAccess(userAddress, false);
      return false;
    }
  }

  /**
   * Log access attempt locally
   */
  private logAccess(userAddress: string, granted: boolean): void {
    const entry: AccessLogEntry = {
      user: userAddress,
      assetKey: this.doorAssetKey,
      timestamp: Math.floor(Date.now() / 1000), // Unix timestamp
      granted
    };

    this.localAuditLog.push(entry);

    // Also log to local storage/file for persistence
    this.persistLog(entry);
  }

  /**
   * Upload audit logs to blockchain in batches
   * This creates the immutable audit trail
   */
  private async uploadAuditLogs(): Promise<void> {
    // A slow upload must not overlap with the next interval tick, or entries
    // would be submitted twice.
    if (this.isUploading) {
      console.log('[DoorController] Upload already in progress, skipping');
      return;
    }

    if (this.localAuditLog.length === 0) {
      console.log('[DoorController] No logs to upload');
      return;
    }

    this.isUploading = true;

    // Take the pending entries out of the buffer up front: entries logged while the
    // upload runs stay queued for the next round instead of being dropped.
    const pending = this.localAuditLog.splice(0, this.localAuditLog.length);
    const batches = this.chunkArray(pending, this.MAX_BATCH_SIZE);
    let uploaded = 0;

    try {
      console.log(`[DoorController] Uploading ${pending.length} logs in ${batches.length} batches...`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        console.log(`[DoorController] Uploading batch ${i + 1}/${batches.length} (${batch.length} entries)...`);

        // Send transaction
        const tx = await this.contract.batchLogAccess(batch);
        const receipt = await tx.wait();
        uploaded = i + 1;

        console.log(`[DoorController] Batch ${i + 1} uploaded: ${receipt.hash}`);
      }

      console.log('[DoorController] All logs uploaded successfully');
    } catch (error) {
      console.error('[DoorController] Failed to upload logs:', error);
      // Re-queue only what was not confirmed on-chain, so a failure halfway
      // through does not duplicate the batches that already succeeded.
      const notUploaded = batches.slice(uploaded).flat();
      this.localAuditLog.unshift(...notUploaded);
    } finally {
      this.isUploading = false;
    }
  }

  /**
   * Utility: Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Hardware integration: Unlock the door
   * Replace with actual GPIO/relay control
   */
  private unlockDoor(): void {
    console.log('[DoorController] 🚪 DOOR UNLOCKED');

    // Example: GPIO control on Raspberry Pi
    // gpio.write(DOOR_RELAY_PIN, gpio.HIGH);
    // setTimeout(() => gpio.write(DOOR_RELAY_PIN, gpio.LOW), 3000);

    // Example: HTTP call to door controller
    // fetch('http://door-controller.local/unlock', { method: 'POST' });
  }

  /**
   * Security: Alert on denied access attempts
   */
  private triggerDeniedAlert(userAddress: string): void {
    console.log(`[DoorController] 🚨 SECURITY ALERT: Denied access for ${userAddress}`);

    // Example: Send notification
    // sendNotification(`Unauthorized access attempt by ${userAddress}`);

    // Example: Trigger alarm
    // if (consecutiveDeniedAttempts > 3) { triggerAlarm(); }
  }

  /**
   * Persist log to local storage
   * Ensures logs aren't lost if device restarts before upload
   */
  private persistLog(entry: AccessLogEntry): void {
    // Example: Append to file
    // fs.appendFileSync('/var/log/door-access.log', JSON.stringify(entry) + '\n');

    // Example: SQLite database
    // db.run('INSERT INTO access_logs VALUES (?, ?, ?, ?)', [entry.user, entry.assetKey, entry.timestamp, entry.granted]);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[DoorController] Shutting down...');

    // Stop intervals
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.uploadInterval) clearInterval(this.uploadInterval);

    // Upload remaining logs
    await this.uploadAuditLogs();

    // Remove event listeners
    this.contract.removeAllListeners();

    console.log('[DoorController] Shutdown complete');
  }

  /**
   * Get current cache status (for monitoring/debugging)
   */
  getStatus() {
    return {
      doorAssetKey: this.doorAssetKey,
      owner: this.permissionCache.owner,
      authorizedCount: this.permissionCache.authorized.size,
      lastSync: new Date(this.permissionCache.lastSync).toISOString(),
      cacheAge: Date.now() - this.permissionCache.lastSync,
      pendingLogs: this.localAuditLog.length
    };
  }
}

// Example usage
async function main() {
  const controller = new DoorController(
    'https://mainnet.infura.io/v3/YOUR_PROJECT_ID', // or your RPC URL
    '0x1234567890123456789012345678901234567890', // Contract address
    'office-front-door', // Asset key
    process.env.DOOR_CONTROLLER_PRIVATE_KEY // Private key for batch uploads
  );

  try {
    // Initialize
    await controller.initialize();

    // Simulate access attempts
    const userAddress = '0xabcdef1234567890abcdef1234567890abcdef12';

    // Fast validation using cache
    await controller.validateAccess(userAddress);

    // Or use on-chain verification for critical situations
    // await controller.validateAccessOnChain(userAddress);

    // Check status
    console.log('Status:', controller.getStatus());

    // Keep running...
    // The controller will sync permissions every 5 minutes
    // and upload logs every hour automatically

  } catch (error) {
    console.error('Error:', error);
    await controller.shutdown();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
