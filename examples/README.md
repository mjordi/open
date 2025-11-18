# Access Control Examples

This directory contains example implementations demonstrating how to use the AccessManagement smart contract for real-world applications.

## Door Controller - Hybrid Off-chain Verification

### Overview

The `DoorController.ts` example demonstrates how to build a physical access control system (e.g., smart door lock) that provides **instant response times** while maintaining **blockchain-based security and audit trails**.

### The Challenge

Using blockchain for physical access control faces these challenges:

| Requirement | Traditional Blockchain Approach | Issue |
|------------|--------------------------------|-------|
| **Speed** | Wait for transaction confirmation | 12+ seconds - too slow for door access |
| **Cost** | Pay gas for each access | $1-50 per door entry - impractical |
| **UX** | User signs transaction | Requires wallet interaction every time |
| **Offline** | Must be connected to network | No access during network issues |

### The Solution: Hybrid Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Blockchain (Ethereum)                                   │
│ • Single source of truth for permissions                │
│ • Updated when adding/removing users (infrequent)       │
│ • Immutable audit trail                                 │
└─────────────────────────────────────────────────────────┘
                        ↓ sync every 5 min
┌─────────────────────────────────────────────────────────┐
│ Door Controller (Edge Device)                           │
│ • Cached permission list                                │
│ • Validates access instantly (<500ms)                   │
│ • Logs access locally                                   │
└─────────────────────────────────────────────────────────┘
                        ↓ batch upload hourly
┌─────────────────────────────────────────────────────────┐
│ Blockchain Audit Trail                                  │
│ • Batched access logs                                   │
│ • Cost-efficient (~$1 for 100 entries)                  │
└─────────────────────────────────────────────────────────┘
```

### How It Works

#### 1. **Permission Management (On-chain)**

```typescript
// Admin adds user to authorized list (one-time transaction)
await contract.addAuthorization(
  "office-front-door",
  "0xUserAddress...",
  "employee"
);
```

#### 2. **Permission Sync (Periodic, Free)**

```typescript
// Door controller syncs every 5 minutes
const controller = new DoorController(rpcUrl, contractAddress, "office-front-door");
await controller.initialize();

// Uses view calls - FREE and FAST
// Downloads: owner + all authorized addresses
```

#### 3. **Access Validation (Instant)**

```typescript
// User presents credential (NFC card, QR code, phone)
const hasAccess = await controller.validateAccess(userAddress);
// ✓ Checks cached permissions
// ✓ Returns in <500ms
// ✓ No gas cost
// ✓ Works offline
```

#### 4. **Audit Trail (Batched)**

```typescript
// Every hour, upload accumulated logs
await controller.uploadAuditLogs();
// Batches 100 entries in one transaction
// Cost: ~$1-5 depending on network
// Creates immutable record on blockchain
```

### Key Features

#### ✅ Instant Access
- **<500ms response time** - comparable to traditional access control
- No waiting for blockchain confirmation
- No user interaction required

#### ✅ Cost Efficient
- **Zero cost for users** - no gas fees for daily access
- **Batched audit logs** - ~$1 for 100 access logs
- Only admins pay gas when modifying permissions

#### ✅ Security
- **Blockchain = source of truth** - tamper-proof permission registry
- **Real-time updates** - listens for permission changes via events
- **Cryptographic verification** - optional signature-based challenges
- **Fail-secure** - denies access if cache is too old

#### ✅ Reliability
- **Works offline** - uses cached permissions during brief outages
- **Automatic recovery** - syncs when connection restored
- **Local logging** - never loses audit data

### Installation & Setup

#### Prerequisites

```bash
npm install ethers
```

#### Configuration

```typescript
const controller = new DoorController(
  'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',  // RPC URL
  '0xYourContractAddress',                         // Contract address
  'your-asset-key',                                // Door identifier
  process.env.DOOR_CONTROLLER_PRIVATE_KEY          // For batch uploads
);
```

#### Running

```typescript
// Initialize and start
await controller.initialize();

// The controller now:
// - Syncs permissions every 5 minutes
// - Uploads logs every hour
// - Listens for real-time permission changes

// Validate access
const hasAccess = await controller.validateAccess('0xUserAddress...');
if (hasAccess) {
  // Open door
}
```

### Hardware Integration Examples

#### Raspberry Pi GPIO

```typescript
private unlockDoor(): void {
  const Gpio = require('onoff').Gpio;
  const relay = new Gpio(17, 'out');

  relay.writeSync(1); // Unlock
  setTimeout(() => relay.writeSync(0), 3000); // Lock after 3s
}
```

#### HTTP-based Door Controller

```typescript
private async unlockDoor(): Promise<void> {
  await fetch('http://door-controller.local/unlock', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SECRET_TOKEN}` }
  });
}
```

#### MQTT for Smart Home

```typescript
private unlockDoor(): void {
  mqttClient.publish('home/door/front/unlock', 'true');
}
```

### Security Considerations

#### 1. **Cache Staleness**
```typescript
// Controller denies access if cache is >1 hour old
const MAX_CACHE_AGE_MS = 60 * 60 * 1000; // 1 hour
```

**Mitigation:**
- Regular sync (every 5 minutes)
- Fail-secure mode (deny when stale)
- Alert admins if sync fails repeatedly

#### 2. **Revocation Latency**
```typescript
// Time between revocation and door update
sync_interval = 5 minutes (worst case)
```

**Mitigation:**
- Critical revocations trigger immediate sync
- Event listeners for real-time updates (when online)
- Monitor for failed sync attempts

#### 3. **Log Integrity**
```typescript
// Logs stored locally before blockchain upload
```

**Mitigation:**
- Tamper-evident local storage (append-only file with hashes)
- Door controller signs each log entry
- Regular blockchain uploads (hourly)
- Alerts if upload fails

#### 4. **Replay Attacks**

For enhanced security, add signature-based challenge-response:

```typescript
// Door generates random challenge
const challenge = crypto.randomBytes(32);

// User signs with private key (proves ownership)
const signature = await wallet.signMessage(challenge);

// Door verifies signature
const signer = ethers.verifyMessage(challenge, signature);
const hasAccess = await controller.validateAccess(signer);
```

### Cost Analysis

#### Traditional Approach (Every Access On-chain)
- **Per access:** $1-50 gas
- **100 employees, 2x daily:** $200-10,000/day 💸
- **Annual:** $73,000-3,650,000 🚨

#### Hybrid Approach
- **Per access:** $0 (instant, cached)
- **Batch 200 logs/day:** $1-5/day
- **Annual:** $365-1,825 ✅

**Savings: ~99.5%**

### Monitoring & Debugging

```typescript
// Get controller status
const status = controller.getStatus();
console.log(status);

// Output:
// {
//   doorAssetKey: 'office-front-door',
//   owner: '0x...',
//   authorizedCount: 25,
//   lastSync: '2025-11-18T12:00:00.000Z',
//   cacheAge: 120000, // 2 minutes
//   pendingLogs: 15
// }
```

### Production Deployment Checklist

- [ ] Use HTTPS RPC endpoint with redundancy
- [ ] Set up Infura/Alchemy account with alerting
- [ ] Configure multiple RPC providers for failover
- [ ] Set up secure key management (HSM or encrypted storage)
- [ ] Implement persistent local log storage
- [ ] Add monitoring and alerting (failed syncs, upload errors)
- [ ] Configure proper sync intervals for your use case
- [ ] Test network failure scenarios
- [ ] Set up backup power for door controller
- [ ] Document emergency access procedures
- [ ] Consider L2 deployment for lower costs

### Alternative: Layer 2 Deployment

For even lower costs, deploy on:

| Network | Confirmation Time | Cost per 100 Logs |
|---------|------------------|-------------------|
| **Ethereum Mainnet** | 12s | $50-500 |
| **Polygon** | 2s | $0.01-0.10 |
| **Arbitrum** | 1s | $0.10-1.00 |
| **Base** | 2s | $0.01-0.10 |

### Advanced: Multi-Door Setup

```typescript
// Create controllers for multiple doors
const doors = [
  new DoorController(rpcUrl, contractAddress, 'front-door'),
  new DoorController(rpcUrl, contractAddress, 'back-door'),
  new DoorController(rpcUrl, contractAddress, 'garage')
];

// Initialize all
await Promise.all(doors.map(d => d.initialize()));

// Each door has its own asset key with separate permissions
```

### Support & Questions

For issues or questions:
1. Check the contract documentation in `/docs`
2. Review test cases in `/test`
3. Open an issue on GitHub

### License

MIT
