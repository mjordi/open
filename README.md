# OPEN - Smart Contract Suite

A production-ready smart contract suite featuring asset tracking, role-based access control, and comprehensive access management with enterprise-grade testing, security analysis, and performance optimization.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (>= 16.0.0)
- [npm](https://www.npmjs.com/) (>= 8.0.0)
- [Git](https://git-scm.com/)

### Installation

1.  Clone the repository:

    ```sh
    git clone https://github.com/your-username/open.git
    cd open
    ```

2.  Install dependencies:
    ```sh
    npm install
    ```

## Usage

This project uses `npm` scripts for common tasks. See `package.json` for a full list of available scripts.

### Core Scripts

- `npm run compile`: Compiles the smart contracts.
- `npm test`: Runs the full test suite.
- `npm run deploy`: Deploys the contracts (see `package.json` for network-specific deployment).
- `npm run lint`: Lints both Solidity and JavaScript files.
- `npm run validate`: Runs a comprehensive validation suite including compilation, linting, and testing.

## Smart Contracts

The core contracts of this project include:

- `AssetTracker.sol`: The original asset management and ownership tracking contract (Solidity `^0.4.24`).
- `AssetTrackerOptimized.sol`: A gas-optimized version of `AssetTracker` using modern Solidity features (`^0.8.24`).
- `RoleBasedAcl.sol`: Hierarchical role-based access control (Solidity `^0.4.24`).
- `aaas.sol` (AccessManagement): A contract for comprehensive asset access and authorization, upgraded to Solidity `^0.8.24`.

## Security

The project is configured with security analysis tools:

- `npm run audit`: Runs `npm audit` to check for vulnerabilities in dependencies.
- **Slither** and **Mythril** can be used for deeper static analysis.
