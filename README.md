# OPEN - Blockchain Access Management

A Solidity-based access management system with smart contracts for asset tracking, role-based access control, and authorization management. Features a web-based frontend for interacting with Ethereum smart contracts.

## Overview

OPEN provides a decentralized solution for managing assets and access control on the Ethereum blockchain. The system enables:

- **Asset Tracking**: Create and transfer digital assets with unique identifiers
- **Role-Based Access Control**: Hierarchical permission management
- **Authorization Management**: Fine-grained access control for assets
- **Web Interface**: Browser-based interaction with smart contracts

## Smart Contracts

### AssetTracker (`AssetTracker.sol`)

Manages asset creation, ownership, and transfers on the blockchain.

**Solidity Version**: `^0.4.10`

**Key Features:**
- Create assets with unique UUIDs
- Transfer asset ownership between addresses
- Query asset details and ownership
- Event emission for transparency

**Main Functions:**
```solidity
createAsset(string name, string description, string uuid, string manufacturer)
transferAsset(address to, string uuid)
getAssetByUUID(string uuid) returns (string, string, string)
isOwnerOf(address owner, string uuid) returns (bool)
```

**Events:**
- `AssetCreate(address account, string uuid, string manufacturer)`
- `AssetTransfer(address from, address to, string uuid)`
- `RejectCreate(address account, string uuid, string message)`
- `RejectTransfer(address from, address to, string uuid, string message)`

### RoleBasedAcl (`RoleBasedAcl.sol`)

Implements hierarchical role-based access control with a superadmin role.

**Solidity Version**: `^0.4.10`

**Key Features:**
- Assign and revoke roles dynamically
- Superadmin role for contract creator
- Role-based function modifiers
- Event-driven role changes

**Main Functions:**
```solidity
assignRole(address entity, string role)     // superadmin only
unassignRole(address entity, string role)   // superadmin only
isAssignedRole(address entity, string role) returns (bool)
```

**Events:**
- `RoleChange(address _client, string _role)`

**Modifiers:**
- `hasRole(string role)`: Restricts function access to specific roles

### AccessManagement (`aaas.sol`)

Comprehensive asset access and authorization management system.

**Solidity Version**: `^0.4.24`

**Key Features:**
- Asset creation with ownership tracking
- Authorization lists per asset
- Role-based authorizations
- Access verification and logging

**Main Functions:**
```solidity
newAsset(string assetKey, string assetDescription) returns (bool)
getAsset(string assetKey) returns (address, string, bool, uint)
addAuthorization(string assetKey, address authorizationKey, string authorizationRole) returns (bool)
removeAuthorization(string assetKey, address authorizationKey) returns (bool)
getAssetAuthorization(string assetKey, address authorizationKey) returns (string)
getAccess(string assetKey) returns (bool)
```

**Events:**
- `AssetCreate(address account, string assetKey, string assetDescription)`
- `RejectCreate(address account, string assetKey, string message)`
- `AuthorizationCreate(address account, string assetKey, string authorizationRole)`
- `AuthorizationRemove(address account, string assetKey)`
- `AccessLog(address account, string assetKey, bool accessGranted)`

## Web Frontend

The project includes a web-based interface for interacting with the smart contracts.

**Files:**
- `index.html`: Main application interface
- `user2.js`: Web3 integration and contract interaction logic
- `abi_aaas.js`: Contract ABI definitions
- `bootstrap.min.css`: Bootstrap 4 styling
- `aaas.css`: Custom styles
- `jquery-3.2.1.js`: jQuery library

**Features:**
- Connect to MetaMask or Web3 provider
- Create new assets
- Manage authorizations
- Check access permissions
- View asset details

## Getting Started

### Prerequisites

- **MetaMask** or another Web3-enabled browser
- **Node.js** (for local development server)
- **Ethereum Test Network** (Ropsten, Rinkeby, or local network)
- **Solidity Compiler** (solc 0.4.x)

### Deployment

1. **Compile the contracts:**

   ```bash
   solc --abi --bin AssetTracker.sol -o build/
   solc --abi --bin RoleBasedAcl.sol -o build/
   solc --abi --bin aaas.sol -o build/
   ```

2. **Deploy to Ethereum network:**

   Use Remix IDE, Truffle, or web3.js to deploy the contracts to your target network.

3. **Update contract addresses:**

   Update the contract addresses in `user2.js` after deployment:
   ```javascript
   var contractAddress = '0xYourContractAddressHere';
   ```

4. **Serve the web interface:**

   ```bash
   # Using Python 3
   python3 -m http.server 8000

   # Using Node.js http-server
   npx http-server -p 8000
   ```

5. **Access the application:**

   Open your browser to `http://localhost:8000` and connect your Web3 wallet.

## Usage

### Creating an Asset

```javascript
// Using web3.js
assetTrackerContract.methods.createAsset(
  'Asset Name',
  'Description',
  'unique-uuid-123',
  'Manufacturer'
).send({ from: userAddress });
```

### Transferring an Asset

```javascript
assetTrackerContract.methods.transferAsset(
  recipientAddress,
  'unique-uuid-123'
).send({ from: userAddress });
```

### Assigning a Role

```javascript
// Requires superadmin role
roleBasedAclContract.methods.assignRole(
  userAddress,
  'admin'
).send({ from: superadminAddress });
```

### Managing Asset Authorization

```javascript
// Create an asset
accessManagementContract.methods.newAsset(
  'asset-key-001',
  'Asset Description'
).send({ from: ownerAddress });

// Add authorization
accessManagementContract.methods.addAuthorization(
  'asset-key-001',
  authorizedUserAddress,
  'viewer'
).send({ from: ownerAddress });

// Check access
accessManagementContract.methods.getAccess(
  'asset-key-001'
).call({ from: userAddress });
```

## Project Structure

```
open/
├── AssetTracker.sol       # Asset tracking contract
├── RoleBasedAcl.sol       # Role-based access control
├── aaas.sol               # Access management contract
├── index.html             # Web interface
├── user2.js               # Web3 integration
├── abi_aaas.js            # Contract ABIs
├── bootstrap.min.css      # Bootstrap styles
├── aaas.css               # Custom styles
├── jquery-3.2.1.js        # jQuery library
├── holder.min.js          # Placeholder library
├── logo_open_header.png   # Logo image
├── favicon.ico            # Favicon
└── README.md              # This file
```

## Architecture

### Contract Relationships

```
┌─────────────────┐
│  AssetTracker   │  - Simple asset creation and transfer
└─────────────────┘

┌─────────────────┐
│ RoleBasedAcl    │  - Role assignment and verification
└─────────────────┘

┌─────────────────┐
│ AccessManagement│  - Complex access control per asset
│    (aaas.sol)   │  - Authorization with roles
└─────────────────┘
```

These contracts can be used independently or combined for comprehensive access management.

## Security Considerations

### Solidity Version

This project uses Solidity versions `^0.4.10` and `^0.4.24`, which are older versions. Consider the following:

- **Integer Overflow**: No built-in protection (added in 0.8.0)
- **Deprecated Features**: `throw` is deprecated (use `revert`, `require`, `assert`)
- **Function Visibility**: Explicitly declare visibility (`public`, `external`, etc.)

### Best Practices

1. **Test Thoroughly**: Test all contract functions on testnet before mainnet deployment
2. **Access Control**: Only superadmin can assign roles in RoleBasedAcl
3. **Event Monitoring**: Listen to events for unauthorized access attempts
4. **Gas Optimization**: Be mindful of gas costs for storage operations
5. **UUID Uniqueness**: Ensure UUIDs are truly unique before asset creation

### Known Limitations

- **No Upgrade Path**: Contracts are not upgradeable
- **No Pausability**: No emergency stop mechanism
- **Authorization List Growth**: Unbounded arrays may cause gas issues
- **String Storage**: Storing strings is gas-expensive

## References

- [Implementing Smart Contracts - Codecentric Blog](https://blog.codecentric.de/en/2018/01/implementing-smart-contracts/)
- [Asset Tracker Demo](https://asset-tracker.codecentric.de/)
- [Introduction to Solidity ACL and Events - Blockgeeks](https://blockgeeks.com/introduction-to-solidity-acl-and-events-part-2/)
- [RBAC Smart Contract Examples](https://github.com/jpmcruz/RBAC-SC)
- [Web3j Tutorials](https://github.com/eugenp/tutorials/tree/master/ethereum/src/main/java/com/baeldung/web3j)

## Future Improvements

- Upgrade to Solidity 0.8.x for better security
- Add comprehensive test suite
- Implement upgradeable contract pattern
- Add pausability for emergency situations
- Optimize storage and gas usage
- Implement ERC standards for tokens
- Add multi-signature support

## License

This project is provided as-is for educational and demonstration purposes.

## Contributing

Contributions are welcome! Please ensure:
- Code is well-documented
- Contracts are tested on testnet
- Follow Solidity best practices
- Update documentation for changes

## Support

For issues or questions about the smart contracts, please refer to:
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [Ethereum Development Resources](https://ethereum.org/en/developers/)
