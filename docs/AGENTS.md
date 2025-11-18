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
- Becomes owner by calling `newAsset()` function or receiving via `transferOwnership()`
- Highest level of control over their specific asset

**Capabilities**:
- Create new assets (`newAsset()`)
- Grant access to any Ethereum address (`addAuthorization()`)
- Revoke access from any address (`removeAuthorization()`)
- Assign any role (Admin, Permanent, Temporary)
- Transfer asset ownership to another address (`transferOwnership()`)
- Use batch operations for efficient authorization management
- Automatic full access to their own assets
- Cannot be removed from their own asset

**Limitations**:
- Only controls assets they create or receive via transfer
- Cannot modify or access other owners' assets (unless explicitly authorized)

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

**Description**: An authorized agent with time-limited temporary access rights that automatically expire.

**Key Characteristics**:
- Role assigned by Asset Owner or Admin
- Role string: `"temporary"`
- **Time-limited access with automatic expiration** (implemented with duration parameter)
- Requires expiration duration when assigned

**Capabilities**:
- Access the authorized asset (`getAccess()`) until expiration
- Verify their role (`getAssetAuthorization()`)
- View asset information while access is valid

**Limitations**:
- Cannot grant or revoke access to others
- Cannot modify asset properties
- Can be removed by owner or admin before expiration
- **Access automatically expires after specified duration**
- Expired users cannot perform any actions on the asset

**Smart Contract Reference**: `aaas.sol` (with expiration implementation)

**Typical Use Case**: Contractor, temporary worker, guest user, or time-limited access scenarios.

**Implementation Note**: Temporary roles now enforce time-based expiration. When adding a temporary authorization, you must specify a duration (in seconds). Access is automatically revoked when `block.timestamp` exceeds the expiration time.

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

1. **Multi-Signature Requirements**: Require multiple admins to approve critical actions
2. **Role Hierarchies**: More granular permission levels (e.g., read-only, write-only)
3. **Role Enumeration**: Use Solidity enums instead of strings for role validation
4. **Delegation Limits**: Restrict what admins can do (e.g., cannot create other admins)
5. **Access Request Workflow**: Users can request access, pending owner/admin approval
6. **Audit Dashboard**: View all authorization changes and access attempts
7. **Emergency Revocation**: Quick revocation of all access in case of security breach
8. **Role Templates**: Predefined role bundles for common use cases

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

// Grant temporary access (with 7-day expiration)
const duration = 7 * 24 * 60 * 60; // 7 days in seconds
await contract.methods.addAuthorization(assetKey, userAddress, "temporary", duration).send({from: ownerAddress});

// Revoke access
await contract.methods.removeAuthorization(assetKey, userAddress).send({from: ownerAddress});

// Transfer ownership
await contract.methods.transferOwnership(assetKey, newOwnerAddress).send({from: ownerAddress});

// Batch add authorizations
await contract.methods.addAuthorizationBatch(
    assetKey,
    [addr1, addr2, addr3],
    ["admin", "permanent", "permanent"]
).send({from: ownerAddress});

// Batch add authorizations with durations
await contract.methods.addAuthorizationBatchWithDuration(
    assetKey,
    [addr1, addr2],
    ["temporary", "temporary"],
    [86400, 604800] // 1 day, 7 days in seconds
).send({from: ownerAddress});

// Batch remove authorizations
await contract.methods.removeAuthorizationBatch(
    assetKey,
    [addr1, addr2, addr3]
).send({from: ownerAddress});
```

## Events and Logging

All agent actions emit events that can be monitored:

- **AssetCreate**: When an agent becomes an asset owner
- **AuthorizationCreate**: When an agent gains access
- **AuthorizationRemove**: When an agent loses access
- **AccessLog**: When an agent attempts to access an asset
- **OwnershipTransferred**: When asset ownership is transferred to a new owner

These events provide an immutable audit trail of all agent activities in the system.

---

## Development Guidelines

### Testing Requirements

**CRITICAL**: All changes to smart contracts or core functionality **MUST** be verified with running tests before completing any task or marking work as complete.

#### Required Testing Protocol

1. **Before Completion**: Run the full test suite using `npx hardhat test`
2. **All Tests Must Pass**: Ensure all 87 tests pass (100% success rate)
3. **Update Tests**: If adding new functionality or changing behavior, update tests accordingly
4. **Input Validation Tests**: Any new input validation must have corresponding tests that verify the validation works correctly

#### Running Tests

```bash
# Install dependencies (first time only)
npm install

# Run all tests
npx hardhat test

# Expected output: "87 passing"
```

#### Test Coverage

The project includes comprehensive tests for:
- **AccessManagement Contract**: 32 tests covering asset creation, authorization, access control, and edge cases
- **AssetTracker Contract**: 22 tests covering asset creation, transfers, ownership verification
- **RoleBasedAcl Contract**: 33 tests covering role assignment, unassignment, and permission checking

#### Why This Matters

- **Security**: Tests verify that input validation prevents invalid data (empty strings, zero addresses)
- **Correctness**: Tests ensure all business logic works as expected
- **Regression Prevention**: Tests catch breaking changes before they reach production
- **Documentation**: Tests serve as executable documentation of expected behavior

**NEVER mark a task as complete without running and passing all tests first.** This is non-negotiable for maintaining the security and integrity of the blockchain contracts.

### Documentation Update Requirements

**CRITICAL**: All tasks involving code changes, configuration updates, or new features **MUST** include documentation updates before the task can be considered complete.

#### Required Documentation Review

Before marking any task as complete, verify that all relevant documentation files have been reviewed and updated:

1. **README.md**: Update if changes affect:
   - Installation instructions
   - Prerequisites or requirements
   - Usage instructions
   - Features list
   - Project structure
   - Configuration steps

2. **DEVELOPMENT.md**: Update if changes affect:
   - Development environment setup
   - Build process or scripts
   - Testing procedures
   - Code quality requirements
   - Dependency versions

3. **AGENTS.md**: Update if changes affect:
   - Agent roles or permissions
   - Access control logic
   - Authorization workflows
   - Security considerations
   - Smart contract interactions

4. **TESTING.md**: Update if changes affect:
   - Test procedures
   - Test coverage
   - Testing tools or frameworks
   - Test environment setup

5. **IMPROVEMENTS.md**: Update if changes:
   - Resolve existing issues
   - Add new known issues
   - Affect future enhancement plans

#### Documentation Update Checklist

- [ ] Identify all documentation files affected by the change
- [ ] Update version numbers, dependencies, or requirements
- [ ] Add or update code examples if applicable
- [ ] Update configuration examples
- [ ] Verify all cross-references between documentation files
- [ ] Check for outdated information that contradicts the changes
- [ ] Update table of contents if structure changed
- [ ] Review for clarity and completeness

#### Why This Matters

- **Maintainability**: Outdated documentation leads to confusion and errors
- **Onboarding**: New developers rely on accurate documentation
- **Collaboration**: Team members need current information to work effectively
- **Support**: Users depend on documentation to resolve issues
- **Knowledge Transfer**: Documentation preserves institutional knowledge

**A task is NOT complete until all relevant documentation has been updated to reflect the changes.** Incomplete documentation is a form of technical debt that compounds over time.

---

## Summary

The OPEN system implements a flexible, blockchain-based access control model with clear separation of privileges across different agent types. Understanding these roles is essential for secure and effective use of the platform. All agent interactions are transparently logged on the blockchain, providing accountability and traceability for access management decisions.
