# OPEN - Blockchain Access Management System

A decentralized access management system built on Ethereum that provides tamper-proof, blockchain-based authorization control for digital assets.

## Overview

OPEN is a proof-of-concept application demonstrating how blockchain technology can be used to manage access control in a decentralized manner. Instead of relying on centralized databases, OPEN uses Ethereum smart contracts to create, track, and verify access permissions for digital assets.

## Features

- **Decentralized Asset Management**: Create and track digital assets on the blockchain
- **Role-Based Access Control**: Assign different authorization roles (admin, permanent, temporary)
- **Permission Management**: Grant and revoke access permissions to Ethereum addresses
- **Access Verification**: Verify permissions in a tamper-proof, transparent manner
- **Immutable Audit Trail**: All access attempts and permission changes are logged on the blockchain
- **MetaMask Integration**: Seamless wallet connection for transaction signing

## Technologies

### Smart Contracts
- **Solidity 0.8.20**: Smart contract development language (upgraded from 0.4.x)
- **Hardhat**: Development environment for testing and deployment
- **Ethereum**: Blockchain platform for deploying contracts

### Testing
- **Hardhat**: Testing framework and development environment
- **Chai**: Assertion library for tests
- **Ethers.js**: Library for interacting with Ethereum (v6)
- **87 comprehensive tests** covering all contract functionality

### Frontend
- **Web3.js**: Library for interacting with Ethereum blockchain
- **Bootstrap 4.1.3**: Responsive UI framework
- **jQuery 3.2.1**: DOM manipulation and AJAX
- **MetaMask**: Browser wallet for signing transactions

## Project Structure

```
/
├── contracts/           # Smart contracts (Solidity 0.8.20)
│   ├── aaas.sol        # Main AccessManagement smart contract
│   ├── AssetTracker.sol # Alternative asset tracking contract with UUID system
│   └── RoleBasedAcl.sol # Role-based access control template
├── test/               # Comprehensive test suites (87 tests)
│   ├── AccessManagement.test.js  # 32 tests for main contract
│   ├── AssetTracker.test.js      # 22 tests for asset tracker
│   └── RoleBasedAcl.test.js      # 33 tests for RBAC
├── hardhat.config.js   # Hardhat configuration
├── package.json        # Node.js dependencies
├── index.html          # Web interface
├── user2.js            # Main application logic and Web3 integration
├── abi_aaas.js        # Smart contract ABI definition
├── aaas.css           # Custom styling
└── assets/            # Images and icons
```

## Getting Started

### Prerequisites

1. **MetaMask Browser Extension**
   - Install MetaMask from [https://metamask.io](https://metamask.io)
   - Create or import an Ethereum wallet
   - Connect to your preferred network (Mainnet, Testnet, or local)

2. **Ethereum Testnet ETH** (for testing)
   - Get free testnet ETH from faucets like:
     - Sepolia: https://sepoliafaucet.com
     - Goerli: https://goerlifaucet.com

3. **Web Server** (optional)
   - Any static file server (Python's `http.server`, Node's `http-server`, etc.)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd open
```

2. Install dependencies for smart contract development and testing:
```bash
npm install
```

3. Compile the smart contracts:
```bash
npx hardhat compile
```

4. Run the test suite (87 tests):
```bash
npx hardhat test
```

5. For frontend usage, open `index.html` in a web browser, or serve it using a local web server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000
```

6. Navigate to `http://localhost:8000` in your browser

7. Connect your MetaMask wallet when prompted

### Configuration

The default smart contract address is configured in `user2.js`:
```javascript
const contractAddress = "0x1614c607e0e36d210196941b954f9e5128f3e0f5";
```

To use your own deployed contract, update this address after deploying the `aaas.sol` contract.

## Testing

The project includes a comprehensive test suite with 87 tests covering all smart contract functionality:

### Run All Tests
```bash
npx hardhat test
```

### Test Coverage by Contract
- **AccessManagement (32 tests)**: Asset creation, authorization management, access control, edge cases
- **AssetTracker (22 tests)**: Asset creation, transfers, ownership verification, edge cases
- **RoleBasedAcl (33 tests)**: Role assignment, unassignment, access control, modifiers

### Example Test Output
```
  AccessManagement
    ✔ Should create a new asset successfully
    ✔ Should allow owner to add authorization
    ✔ Should grant access to authorized user
    ... (32 tests total)

  AssetTracker
    ✔ Should create a new asset successfully
    ✔ Should transfer asset successfully
    ... (22 tests total)

  RoleBasedAcl
    ✔ Should allow creator to assign roles
    ✔ Should correctly identify assigned roles
    ... (33 tests total)

  87 passing (5s)
```

All tests verify:
- Correct functionality with valid inputs
- Proper error handling with invalid inputs
- Event emission verification
- Access control enforcement
- Edge case handling (empty strings, special characters, etc.)

## Usage

### 1. Deploy Smart Contract

Deploy a new instance of the AccessManagement contract to the blockchain:
- Click "Deploy Smart Contract"
- Confirm the transaction in MetaMask
- Wait for transaction confirmation

### 2. Add Asset

Create a new asset on the blockchain:
- Enter a unique serial number
- Provide an asset description
- Submit and confirm the transaction

### 3. Add Authorization

Grant access permissions to an Ethereum address:
- Enter the asset serial number
- Provide the Ethereum address to authorize
- Select a role (admin, permanent, or temporary)
- Submit and confirm the transaction

### 4. Check Role

Verify the role assigned to a specific address for an asset:
- Enter asset serial number
- Enter Ethereum address to check
- View the assigned role

### 5. Access Asset

Check if the current connected wallet has access to an asset:
- Enter asset serial number
- System verifies access permissions
- View access status

### 6. Remove Authorization

Revoke access from an Ethereum address:
- Enter asset serial number
- Provide the address to remove
- Confirm the transaction

## Smart Contracts

### AccessManagement Contract (aaas.sol)

The main contract implementing the access management system with the following key functions:

- `createAsset(uint256 serialNumber, string description)`: Create a new asset
- `addAuthorization(uint256 serialNumber, address authorized, Role role)`: Grant access
- `removeAuthorization(uint256 serialNumber, address authorized)`: Revoke access
- `checkRole(uint256 serialNumber, address authorized)`: Verify role assignment
- `verifyAccess(uint256 serialNumber)`: Check access for current user

### Events Logged

- `AssetCreate`: When a new asset is created
- `AuthorizationCreate`: When access is granted
- `AuthorizationRemove`: When access is revoked
- `AccessLog`: When access verification occurs

## Security Considerations

- **Access Control**: Contract owner has special privileges
- **Role Validation**: Roles are validated before assignment
- **Transaction Signing**: All state changes require MetaMask transaction approval
- **Immutability**: Blockchain records cannot be altered after confirmation

## Development Workflow

The application follows a 6-step workflow:

1. Deploy contract
2. Create assets
3. Assign permissions
4. Verify roles
5. Check access
6. Manage authorizations

## Gas Optimization

Smart contracts are optimized for gas efficiency:
- Uses mapping data structures for O(1) lookups
- Efficient storage patterns
- Minimal state changes

## Browser Compatibility

Tested with:
- Chrome + MetaMask
- Firefox + MetaMask
- Brave + MetaMask

## Known Limitations

- Requires MetaMask browser extension
- Transaction costs gas fees (ETH)
- No backend server (purely client-side)
- Hardcoded contract address in frontend (update manually after deployment)
- Frontend needs ABI regeneration after contract changes

## Recent Improvements

- ✅ **Upgraded to Solidity 0.8.20** with built-in overflow/underflow protection
- ✅ **Added comprehensive test suite** with 87 tests covering all functionality
- ✅ **Implemented Hardhat** development and testing framework
- ✅ **Fixed encoding issues** in AssetTracker.sol
- ✅ **Fixed struct initialization bug** in AssetTracker.sol
- ✅ **Modern syntax** with proper visibility modifiers and memory keywords

## Future Enhancements

- Add role expiration timestamps for temporary roles
- Implement batch authorization operations
- Add asset transfer functionality
- Create admin dashboard for contract management
- Add event listeners for real-time updates
- Implement pagination for asset lists
- Upgrade frontend to use Ethers.js instead of Web3.js
- Add deployment scripts using Hardhat
- Implement gas optimization analysis tools

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add your license here]

## Resources

- [Ethereum Documentation](https://ethereum.org/en/developers/docs/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [BlockGeeks RBAC Tutorial](https://blockgeeks.com/introduction-to-solidity-acl-and-events-part-2/)

## Support

For issues and questions, please open an issue on GitHub.

---

**Note**: This is a proof-of-concept application intended for educational purposes and demonstration. Conduct thorough security audits before using in production environments.
