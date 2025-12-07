# AGENTS.md - AI Assistant Instructions

This file provides context and instructions to help AI coding agents work on the OPEN project.

## Context7 Integration

Always use context7 when I need code generation, setup or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.

## Project Overview

OPEN is a blockchain-based access management system implementing role-based access control for digital assets using Ethereum smart contracts.

### Technology Stack
- **Smart Contracts**: Solidity ^0.8.20
- **Development Framework**: Hardhat
- **Blockchain Interaction**: Web3.js
- **Frontend**: Vanilla JavaScript (no framework)
- **Node Version**: >=24.0.0

## Build and Setup

### Initial Setup
```bash
# Install dependencies
npm install

# Compile smart contracts
npx hardhat compile

# Generate frontend artifacts from compiled contracts
npm run generate

# Build frontend
npm run build
```

### Development Commands
```bash
# Start local Hardhat node
npx hardhat node

# Deploy contracts locally
npx hardhat run scripts/deploy.js --network localhost

# Run tests
npx hardhat test

# Clean build artifacts
npx hardhat clean
```

## Testing Protocol

**CRITICAL**: All changes to smart contracts or core functionality MUST be verified with tests before completing any task.

### Required Testing Steps
1. Run full test suite: `npx hardhat test`
2. Verify all 87 tests pass (100% success rate)
3. Update tests when adding new functionality
4. Add tests for any new input validation

### Test Organization
- `test/AccessManagement.test.js` - 32 tests for access control contract
- `test/AssetTracker.test.js` - 22 tests for asset tracking
- `test/RoleBasedAcl.test.js` - 33 tests for role-based ACL

**NEVER mark a task complete without running and passing all tests.**

## Code Conventions

### Smart Contract Guidelines
- Use explicit visibility modifiers (public, external, internal, private)
- Include NatSpec comments for all functions (@notice, @dev, @param, @return)
- Validate all inputs (non-empty strings, non-zero addresses)
- Emit events for all state changes
- Use meaningful variable names (no single letters except loop counters)

### Frontend Guidelines
- Use ES6 modules (import/export)
- Avoid jQuery or heavy frameworks - use vanilla JavaScript
- Store blockchain data in localStorage when appropriate
- Handle MetaMask connection errors gracefully
- Provide user feedback for all blockchain transactions

### File Structure
```
/contracts          - Solidity smart contracts
/scripts            - Deployment and utility scripts
/test               - Hardhat test files
/frontend           - Frontend application
  /src              - JavaScript source files
    /generated      - Auto-generated contract artifacts (ABI, bytecode)
  /styles           - CSS files
  index.html        - Main application page
/docs               - Project documentation
```

## Development Environment Tips

### Contract Development
- Artifacts are gitignored - run `npm run generate` after cloning
- Use `npx hardhat compile --force` to force recompilation
- Frontend artifacts are auto-generated from contract ABIs
- Local blockchain starts at http://localhost:8545

### Frontend Development
- Open `frontend/index.html` directly in browser for local testing
- MetaMask should connect to localhost:8545 for local development
- Contract addresses are displayed in deployment output
- Check browser console for Web3 connection issues

### Common Issues
- **Artifacts missing**: Run `npm run generate`
- **Tests failing**: Ensure you're using Node >= 24.0.0
- **MetaMask not connecting**: Check network is localhost:8545, Chain ID 31337
- **Contract not found**: Redeploy contracts after restarting Hardhat node

## Deployment and Security

### Vercel Deployment
- Contracts directory must NOT be in .vercelignore (needed for compilation)
- Scripts directory must NOT be in .vercelignore (needed for artifact generation)
- Build command: `npm run build` (compiles contracts and generates artifacts)
- Output directory: `frontend/dist`
- Install command: `npm install`
- Framework preset: Other (no framework)
- Dev command: `npm run serve` (local development only, NOT for deployment)
- All settings are defined in `vercel.json` and should match Project Settings
- **IMPORTANT**: Production deployments should NOT have overrides - they should use settings from `vercel.json`

### Security Considerations
- **Private Keys**: Never commit .env files or private keys
- **Input Validation**: All contract functions validate inputs
- **Access Control**: Owner/admin checks on all privileged functions
- **Gas Optimization**: Use batch operations for multiple authorizations
- **Immutability**: Contracts cannot be upgraded after deployment

### Environment Variables
Create `.env` file (never commit):
```
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_key_here
ETHERSCAN_API_KEY=your_etherscan_key_here
```

## Documentation Requirements

**CRITICAL**: Update documentation when making changes.

### Files to Update
- `README.md` - Installation, usage, features, configuration
- `docs/DEVELOPMENT.md` - Development setup, build process, dependencies
- `docs/ROLES.md` - Smart contract roles and permissions
- `docs/TESTING.md` - Test procedures and coverage
- `docs/IMPROVEMENTS.md` - Known issues and future enhancements

### Documentation Checklist
- [ ] Update version numbers if applicable
- [ ] Add/update code examples
- [ ] Update configuration examples
- [ ] Verify cross-references between docs
- [ ] Check for outdated information
- [ ] Update table of contents if needed

**A task is NOT complete until documentation is updated.**

## Key Project Conventions

### Contract Naming
- Main contract: `AccessManagement` in `contracts/aaas.sol`
- Asset tracking: `AssetTracker` in `contracts/AssetTracker.sol`
- Role-based ACL: `RoleBasedAcl` in `contracts/RoleBasedAcl.sol`

### Role Types
- `"admin"` - Can manage access control
- `"permanent"` - Permanent access without expiration
- `"temporary"` - Time-limited access with duration parameter

### Event Naming
- All events use PascalCase
- Critical events: AssetCreate, AuthorizationCreate, AuthorizationRemove, AccessLog, OwnershipTransferred

### Gas Optimization
- Use batch operations when possible (`addAuthorizationBatch`, `removeAuthorizationBatch`)
- Batch operations save gas vs. multiple individual calls

## Critical Paths and Workflows

### Adding New Contract Function
1. Add function to contract with NatSpec comments
2. Add input validation
3. Emit appropriate event
4. Write comprehensive tests
5. Run full test suite
6. Update docs/ROLES.md with new capability
7. Regenerate frontend artifacts if ABI changes

### Fixing Contract Bug
1. Write failing test that demonstrates the bug
2. Fix the contract code
3. Verify test now passes
4. Run full test suite
5. Update documentation
6. Commit with descriptive message

### Frontend Changes
1. Make changes to frontend JavaScript/HTML/CSS
2. Test in browser with local Hardhat node
3. Test MetaMask integration
4. Test on different networks if applicable
5. Update README.md if user-facing changes
6. Test Vercel build locally if possible

## Quick Reference

### Essential Commands
```bash
npm install              # Install dependencies
npx hardhat compile      # Compile contracts
npm run generate         # Generate frontend artifacts
npm run build            # Full build (compile + generate + frontend)
npx hardhat test         # Run all tests
npx hardhat node         # Start local blockchain
```

### Important File Paths
- Contract artifacts: `artifacts/contracts/aaas.sol/AccessManagement.json`
- Frontend artifacts: `frontend/src/generated/abi.js`, `frontend/src/generated/bytecode.js`
- Test files: `test/*.test.js`
- Deployment script: `scripts/deploy.js`
- Artifact generation: `scripts/generate-frontend-artifacts.js`

### Network Configuration
- Local: http://localhost:8545 (Chain ID: 31337)
- Sepolia testnet: Configured in hardhat.config.js
- Other networks: Add to hardhat.config.js as needed
