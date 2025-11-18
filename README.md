# OPEN - Blockchain Access Management System

A decentralized access management system built on Ethereum that provides tamper-proof, blockchain-based authorization control for digital assets.

## Description / Overview

OPEN is a proof-of-concept application demonstrating how blockchain technology can manage access control in a decentralized manner. Instead of relying on centralized databases, OPEN uses Ethereum smart contracts to create, track, and verify access permissions for digital assets. Perfect for developers learning about blockchain-based access control or building decentralized authorization systems.

## Demo

Live demo: **https://mjordi.github.io/open**

## Installation

**Prerequisites:**
- Node.js 22.10.0 or higher ([Download](https://nodejs.org))
- [MetaMask](https://metamask.io) browser extension
- Testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com) (for testing)

**Setup:**

```bash
# Clone the repository
git clone <repository-url>
cd open

# Install dependencies
npm install

# Build the project (compiles contracts + generates frontend)
npm run build

# Run tests (87 comprehensive tests)
npm test

# Serve the frontend locally
npm run serve
```

Navigate to `http://localhost:8000` and connect your MetaMask wallet.

## Usage

**Available Commands:**
```bash
npm run compile    # Compile smart contracts
npm run generate   # Generate frontend artifacts (ABI/bytecode)
npm run build      # Full build (compile + generate + build frontend)
npm test           # Run all 87 tests
npm run serve      # Serve frontend on port 8000
npm run clean      # Clean build artifacts
```

**Basic Workflow:**
1. **Deploy Contract** - Deploy AccessManagement contract via the UI
2. **Create Asset** - Add a new digital asset with serial number and description
3. **Grant Access** - Authorize Ethereum addresses with roles (admin/permanent/temporary)
4. **Verify Access** - Check permissions for any address
5. **Revoke Access** - Remove authorization when needed

All actions are executed through MetaMask transactions on the blockchain.

## Features

- **Decentralized Asset Management** - Create and track digital assets on the blockchain
- **Role-Based Access Control** - Assign admin, permanent, or temporary authorization roles
- **Permission Management** - Grant and revoke access permissions to Ethereum addresses
- **Access Verification** - Verify permissions in a tamper-proof, transparent manner
- **Immutable Audit Trail** - All access attempts and changes logged on-chain
- **MetaMask Integration** - Seamless wallet connection for transaction signing
- **Comprehensive Testing** - 87 tests covering all contract functionality

## Project Structure

```
/
├── contracts/              # Smart contracts (Solidity 0.8.20)
│   ├── aaas.sol           # Main AccessManagement contract
│   ├── AssetTracker.sol   # Asset tracking with UUID system
│   └── RoleBasedAcl.sol   # Role-based access control
├── test/                   # Comprehensive test suites (87 tests)
│   ├── AccessManagement.test.js
│   ├── AssetTracker.test.js
│   └── RoleBasedAcl.test.js
├── frontend/
│   ├── public/            # Static assets
│   │   └── index.html     # Web interface
│   └── src/
│       ├── js/app.js      # Main application logic
│       ├── css/styles.css # Styling
│       └── generated/     # Auto-generated from contracts
├── scripts/               # Build and deployment scripts
│   ├── generate-frontend-artifacts.js
│   └── build-frontend.js
├── docs/                  # Documentation
├── .github/workflows/     # GitHub Actions CI/CD
└── hardhat.config.js      # Hardhat configuration
```

## Tech Stack / Built With

**Smart Contracts:**
- Solidity 0.8.20
- Hardhat 3 (development & testing environment)
- Ethereum blockchain

**Frontend:**
- Web3.js (Ethereum interaction)
- Bootstrap 4.1.3 (UI framework)
- jQuery 3.2.1

**Testing:**
- Hardhat + Chai + Ethers.js v6
- 87 comprehensive tests across 3 contracts

## License

MIT License - see [LICENSE](LICENSE) file for details

This project is licensed under the MIT License, allowing you to freely use, modify, and distribute this software for any purpose, including commercial applications, with proper attribution.

---

**Note:** This is a proof-of-concept for educational purposes. Conduct thorough security audits before production use.

For detailed development information, see [DEVELOPMENT.md](docs/DEVELOPMENT.md) | For testing notes, see [TESTING.md](docs/TESTING.md)
