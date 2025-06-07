# OPEN - Smart Contract Suite

A production-ready smart contract suite featuring asset tracking, role-based access control, and comprehensive access management with enterprise-grade testing, security analysis, and performance optimization.

## Smart Contracts

- **`AccessManagement` (`aaas.sol`)**: Manages asset authorization and access control, with support for bulk operations.
- **`AssetTracker`**: Handles asset creation, ownership, and transfers. An optimized version (`AssetTrackerOptimized.sol`) is available for reduced gas costs.
- **`RoleBasedAcl`**: Implements hierarchical role-based access control for managing permissions.

## Getting Started

### Prerequisites

- Node.js (>=16.0.0)
- npm (>=8.0.0)
- Git

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

## Available Scripts

### Core Commands

- `npm run compile`: Compiles the smart contracts.
- `npm run deploy`: Deploys contracts to a specified network (e.g., `npm run deploy -- --network sepolia`).
- `npm run node`: Starts a local Hardhat Network node.

### Testing & Coverage

- `npm test`: Runs all unit tests.
- `npm run test:gas`: Runs tests and reports gas usage.
- `npm run coverage`: Generates a test coverage report.

### Code Quality & Formatting

- `npm run lint`: Lints both Solidity and JavaScript files.
- `npm run format`: Formats the codebase using Prettier.

### Auditing & Analysis

- `npm run audit`: Audits project dependencies for security vulnerabilities.
- `npm run size`: Displays the size of the compiled contracts.

### Validation

- `npm run validate`: Runs a comprehensive suite of checks, including compilation, linting, and testing.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
