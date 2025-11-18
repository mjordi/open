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
 */

import { ethers } from 'ethers';

// Contract ABI - only the functions we need
const ACCESS_MANAGEMENT_ABI = [
  "function canAccess(string assetKey, address user) external view returns(bool)",
  "function getAssetAuthorizationCount(string assetKey) external view returns(uint)",
  "function getAssetAuthorizationAtIndex(string assetKey, uint row) external view returns(address)",
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
  authorized: Set<string>;
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
      authorized: new Set(),
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

      // Clear and rebuild authorized set
      const newAuthorized = new Set<string>();

      // Fetch all authorized addresses
      for (let i = 0; i < authCount; i++) {
        const address = await this.contract.getAssetAuthorizationAtIndex(
          this.doorAssetKey,
          i
        );
        newAuthorized.add(address.toLowerCase());
      }

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
    // Listen for new authorizations
    this.contract.on('AuthorizationCreate', async (account, assetKey, role) => {
      if (assetKey === this.doorAssetKey) {
        console.log(`[DoorController] Real-time: Authorization added for ${account}`);
        this.permissionCache.authorized.add(account.toLowerCase());
      }
    });

    // Listen for authorization removals
    this.contract.on('AuthorizationRemove', async (account, assetKey) => {
      if (assetKey === this.doorAssetKey) {
        console.log(`[DoorController] Real-time: Authorization removed for ${account}`);
        this.permissionCache.authorized.delete(account.toLowerCase());
      }
    });
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
    const isAuthorized = this.permissionCache.authorized.has(normalizedAddress);
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
    if (this.localAuditLog.length === 0) {
      console.log('[DoorController] No logs to upload');
      return;
    }

    try {
      // Split logs into batches
      const batches = this.chunkArray(this.localAuditLog, this.MAX_BATCH_SIZE);

      console.log(`[DoorController] Uploading ${this.localAuditLog.length} logs in ${batches.length} batches...`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        console.log(`[DoorController] Uploading batch ${i + 1}/${batches.length} (${batch.length} entries)...`);

        // Send transaction
        const tx = await this.contract.batchLogAccess(batch);
        const receipt = await tx.wait();

        console.log(`[DoorController] Batch ${i + 1} uploaded: ${receipt.hash}`);
      }

      // Clear uploaded logs
      this.localAuditLog = [];

      console.log('[DoorController] All logs uploaded successfully');
    } catch (error) {
      console.error('[DoorController] Failed to upload logs:', error);
      // Keep logs for retry
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
