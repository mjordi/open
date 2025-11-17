# AGENTS - Roles and Actors in the OPEN System

This document describes the different agents (actors/roles) that interact with the OPEN blockchain access management system, their permissions, capabilities, and responsibilities.

## Overview

The OPEN system implements a hierarchical access control model with multiple agent types, each having specific privileges and permissions. Understanding these roles is crucial for properly implementing and using the system.

## Agent Types

### 1. Contract Deployer

**Description**: The Ethereum address that deploys the AccessManagement smart contract to the blockchain.

**Capabilities**:
- Deploy new instances of the AccessManagement contract
- Initialize the contract on the blockchain
- Pay gas fees for contract deployment

**Limitations**:
- No special ongoing privileges after deployment
- Does not automatically become owner of assets
- Cannot modify the contract after deployment (immutable)

**Typical Use Case**: System administrator or organization setting up the access management infrastructure.

---

### 2. Asset Owner

**Description**: The creator and primary controller of a specific asset. Automatically assigned when an asset is created.

**Key Characteristics**:
- Ethereum address: Stored in `Asset.owner` field
- Becomes owner by calling `newAsset()` function
- Highest level of control over their specific asset

**Capabilities**:
- Create new assets (`newAsset()`)
- Grant access to any Ethereum address (`addAuthorization()`)
- Revoke access from any address (`removeAuthorization()`)
- Assign any role (Admin, Permanent, Temporary)
- Automatic full access to their own assets
- Cannot be removed from their own asset

**Limitations**:
- Only controls assets they create
- Cannot modify or access other owners' assets (unless explicitly authorized)
- Cannot transfer ownership (not implemented)

**Smart Contract Reference**:
- Owner assignment: `aaas.sol:34`
- Owner verification: `aaas.sol:48`, `aaas.sol:59`, `aaas.sol:89`

**Typical Use Case**: Organization or individual managing access to their digital assets (documents, resources, services).

---

### 3. Admin User

**Description**: An authorized agent with elevated privileges to manage access control for a specific asset.

**Key Characteristics**:
- Role assigned by Asset Owner
- Role string: `"admin"`
- Delegation of management capabilities

**Capabilities**:
- Grant access to other users (`addAuthorization()`)
- Revoke access from other users (`removeAuthorization()`)
- Assign roles (Admin, Permanent, Temporary) to others
- Access the asset they're authorized for
- Delegate admin privileges to others

**Limitations**:
- Cannot transfer asset ownership
- Cannot remove the original asset owner
- Admin privileges limited to specific asset(s)
- Can be removed by asset owner

**Smart Contract Reference**: `aaas.sol:48`, `aaas.sol:59`

**Typical Use Case**: Department manager, team lead, or delegated administrator managing access for a team or project.

---

### 4. Permanent User

**Description**: An authorized agent with permanent access rights to a specific asset.

**Key Characteristics**:
- Role assigned by Asset Owner or Admin
- Role string: `"permanent"`
- Long-term access without expiration

**Capabilities**:
- Access the authorized asset (`getAccess()`)
- Verify their role (`getAssetAuthorization()`)
- View asset information

**Limitations**:
- Cannot grant or revoke access to others
- Cannot modify asset properties
- Can be removed by owner or admin
- Access limited to authorized assets only

**Smart Contract Reference**: `aaas.sol:46-54`

**Typical Use Case**: Employee, permanent team member, or long-term partner requiring ongoing access.

---

### 5. Temporary User

**Description**: An authorized agent with temporary access rights (though expiration is not yet enforced by the contract).

**Key Characteristics**:
- Role assigned by Asset Owner or Admin
- Role string: `"temporary"`
- Intended for short-term or conditional access

**Capabilities**:
- Access the authorized asset (`getAccess()`)
- Verify their role (`getAssetAuthorization()`)
- View asset information

**Limitations**:
- Cannot grant or revoke access to others
- Cannot modify asset properties
- Can be removed by owner or admin
- **Note**: Time-based expiration is not currently implemented in the smart contract

**Smart Contract Reference**: `aaas.sol:46-54`

**Typical Use Case**: Contractor, temporary worker, guest user, or time-limited access scenarios.

**Implementation Note**: The current contract version marks users as temporary but does not automatically revoke access after a time period. This would need to be implemented in a future version.

---

### 6. Unauthorized User

**Description**: Any Ethereum address that has not been granted access to a specific asset.

**Capabilities**:
- Create their own assets (becoming an Asset Owner)
- View public blockchain data (events, transaction history)
- Attempt access verification (will receive `false` response)

**Limitations**:
- Cannot access assets they're not authorized for
- Cannot view asset details beyond public information
- Cannot grant or revoke access
- Access attempts are logged on blockchain (`AccessLog` event)

**Smart Contract Reference**: `aaas.sol:88-96`

**Typical Use Case**: General public, unauthenticated users, or users not yet granted access.

---

## Role Hierarchy

```
┌─────────────────────────────────────┐
│         Asset Owner (Creator)       │
│  • Full Control                     │
│  • Cannot be removed                │
└──────────────┬──────────────────────┘
               │
               ├─────────────────────────────┐
               │                             │
        ┌──────▼─────────┐          ┌───────▼────────┐
        │  Admin User    │          │ Regular Users  │
        │  • Manage      │          │                │
        │    Access      │          └────────┬───────┘
        └────────────────┘                   │
                                    ┌────────┴────────┐
                                    │                 │
                            ┌───────▼──────┐  ┌──────▼────────┐
                            │  Permanent   │  │   Temporary   │
                            │    User      │  │     User      │
                            └──────────────┘  └───────────────┘
```

## Permission Matrix

| Action | Owner | Admin | Permanent | Temporary | Unauthorized |
|--------|-------|-------|-----------|-----------|--------------|
| Create Asset | ✓ | ✓ | ✓ | ✓ | ✓ |
| Access Own Asset | ✓ | - | - | - | - |
| Access Authorized Asset | ✓ | ✓ | ✓ | ✓ | ✗ |
| Grant Access | ✓ | ✓ | ✗ | ✗ | ✗ |
| Revoke Access | ✓ | ✓ | ✗ | ✗ | ✗ |
| Assign Admin Role | ✓ | ✓ | ✗ | ✗ | ✗ |
| View Public Events | ✓ | ✓ | ✓ | ✓ | ✓ |
| Transfer Ownership | ✗ | ✗ | ✗ | ✗ | ✗ |

*Note: ✓ = Allowed, ✗ = Not Allowed, - = Not Applicable*

## Agent Lifecycle

### Becoming an Asset Owner
```
1. User connects MetaMask wallet
2. User calls newAsset() with serial number and description
3. Transaction confirmed on blockchain
4. User becomes Asset Owner for that asset
5. AssetCreate event emitted
```

### Becoming an Authorized User (Admin/Permanent/Temporary)
```
1. Asset Owner or Admin calls addAuthorization()
2. Provides: asset key, user address, role
3. Transaction confirmed on blockchain
4. User gains access according to assigned role
5. AuthorizationCreate event emitted
```

### Losing Authorization
```
1. Asset Owner or Admin calls removeAuthorization()
2. Provides: asset key, user address
3. Transaction confirmed on blockchain
4. User loses access to the asset
5. AuthorizationRemove event emitted
```

## Security Considerations by Agent Type

### For Asset Owners
- **Private Key Security**: Losing your private key means losing control of your assets
- **Admin Delegation**: Be cautious when granting admin rights; admins can modify access control
- **Gas Costs**: All transactions require ETH for gas fees
- **Immutability**: Cannot undo actions; plan carefully before granting/revoking access

### For Admin Users
- **Scope of Authority**: Admins can add other admins; use this power responsibly
- **Accountability**: All actions are logged on blockchain; audit trails are permanent
- **Role Assignment**: Verify addresses carefully before granting access

### For Permanent/Temporary Users
- **Access Logging**: All access attempts are logged on the blockchain
- **Revocable Access**: Access can be revoked at any time by owner or admin
- **Address Verification**: Ensure you're using the correct wallet/address

### For All Agents
- **MetaMask Security**: Keep your MetaMask wallet secure with a strong password
- **Transaction Verification**: Always review transactions before signing
- **Network Selection**: Ensure you're on the correct Ethereum network
- **Phishing Protection**: Verify the contract address before interacting

## Best Practices

### For Asset Owners
1. Create descriptive asset keys and descriptions
2. Document who has access and why
3. Regularly audit authorization lists
4. Assign admin roles to trusted parties only
5. Keep backup of asset serial numbers

### For Admins
1. Follow organizational access policies
2. Revoke access when no longer needed
3. Document authorization decisions
4. Use temporary roles when appropriate
5. Communicate with asset owners about changes

### For Regular Users
1. Only request access you actually need
2. Notify admins when access is no longer needed
3. Keep your MetaMask wallet secure
4. Verify you have the correct role for your needs
5. Report any access issues immediately

## Future Enhancements

Potential improvements to the agent system:

1. **Ownership Transfer**: Ability to transfer asset ownership to another address
2. **Time-Based Expiration**: Automatic revocation for temporary roles
3. **Multi-Signature Requirements**: Require multiple admins to approve critical actions
4. **Role Hierarchies**: More granular permission levels
5. **Delegation Limits**: Restrict what admins can do (e.g., cannot create other admins)
6. **Access Request Workflow**: Users can request access, pending owner/admin approval
7. **Audit Dashboard**: View all authorization changes and access attempts
8. **Emergency Revocation**: Quick revocation of all access in case of security breach

## Smart Contract Integration

### Reading Agent Information

```javascript
// Get asset owner
const asset = await contract.methods.getAsset(assetKey).call();
const owner = asset.assetOwner;

// Check user's role
const role = await contract.methods.getAssetAuthorization(assetKey, userAddress).call();

// Verify access
const hasAccess = await contract.methods.getAccess(assetKey).call({from: userAddress});
```

### Managing Agents

```javascript
// Grant admin access
await contract.methods.addAuthorization(assetKey, userAddress, "admin").send({from: ownerAddress});

// Grant permanent access
await contract.methods.addAuthorization(assetKey, userAddress, "permanent").send({from: ownerAddress});

// Grant temporary access
await contract.methods.addAuthorization(assetKey, userAddress, "temporary").send({from: ownerAddress});

// Revoke access
await contract.methods.removeAuthorization(assetKey, userAddress).send({from: ownerAddress});
```

## Events and Logging

All agent actions emit events that can be monitored:

- **AssetCreate**: When an agent becomes an asset owner
- **AuthorizationCreate**: When an agent gains access
- **AuthorizationRemove**: When an agent loses access
- **AccessLog**: When an agent attempts to access an asset

These events provide an immutable audit trail of all agent activities in the system.

---

## Summary

The OPEN system implements a flexible, blockchain-based access control model with clear separation of privileges across different agent types. Understanding these roles is essential for secure and effective use of the platform. All agent interactions are transparently logged on the blockchain, providing accountability and traceability for access management decisions.
