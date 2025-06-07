# Testing Documentation

This document provides comprehensive information about the testing setup for the smart contract project.

## Testing Framework

The project uses **Hardhat** as the primary testing framework with the following key components:

- **Hardhat**: Ethereum development environment
- **Chai**: Assertion library for JavaScript
- **Ethers.js**: Ethereum library for interacting with contracts
- **Hardhat Toolbox**: Collection of commonly used Hardhat plugins

## Test Structure

### Test Files Organization

```
test/
├── AssetTracker.test.js       # Unit tests for AssetTracker contract
├── RoleBasedAcl.test.js       # Unit tests for RoleBasedAcl contract
├── AccessManagement.test.js   # Unit tests for AccessManagement contract
├── sample-test.js             # Integration tests across all contracts
└── helpers/
    └── testUtils.js           # Common testing utilities
```

### Contracts Being Tested

1. **AssetTracker.sol** - Asset creation, transfer, and ownership tracking
2. **RoleBasedAcl.sol** - Role-based access control system
3. **AccessManagement.sol** - Comprehensive access management with authorizations

## Available Test Scripts

### Basic Testing

```bash
# Run all tests
npm test

# Compile contracts first
npm run compile

# Clean compiled artifacts
npm run clean
```

### Advanced Testing Options

```bash
# Run tests with gas reporting
npm run test:gas

# Run tests with coverage report
npm run test:coverage

# Run only integration tests
npm run test:integration

# Run only unit tests (individual contracts)
npm run test:unit

# Start local Hardhat node
npm run node
```

### Watch Mode (if supported)

```bash
# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch
```

## Test Categories

### Unit Tests

Each contract has comprehensive unit tests covering:

#### AssetTracker Contract

- ✅ Asset creation with duplicate prevention
- ✅ Asset transfer between addresses
- ✅ Ownership verification
- ✅ Asset information retrieval
- ✅ Event emission verification
- ✅ Error handling for invalid operations

#### RoleBasedAcl Contract

- ✅ Role assignment and removal
- ✅ Permission verification
- ✅ Creator privileges
- ✅ Superadmin role functionality
- ✅ Access control enforcement
- ✅ Role hierarchy management

#### AccessManagement Contract

- ✅ Asset creation and management
- ✅ Authorization system (add/remove)
- ✅ Access control verification
- ✅ Owner and admin permissions
- ✅ Asset listing and counting
- ✅ Complex authorization scenarios

### Integration Tests

The integration tests (`sample-test.js`) verify:

- ✅ Cross-contract functionality
- ✅ Role-based asset management workflows
- ✅ Error handling consistency
- ✅ Performance with bulk operations
- ✅ Complex multi-contract scenarios

## Test Utilities

The `testUtils.js` helper provides:

### Contract Deployment

```javascript
const { assetTracker, roleBasedAcl, accessManagement, owner, addrs } =
  await TestUtils.deployAllContracts();
```

### Asset Creation Helpers

```javascript
// Create test asset in AssetTracker
const asset = await TestUtils.createTestAsset(assetTracker, owner, {
  name: 'Custom Name',
  uuid: 'custom-uuid',
});

// Create access management asset
const accessAsset = await TestUtils.createAccessAsset(accessManagement, owner, {
  assetKey: 'custom-key',
});
```

### Role Management

```javascript
const roles = await TestUtils.setupRoleHierarchy(roleBasedAcl, creator, users);
```

### Batch Operations

```javascript
const assets = TestUtils.generateAssetBatch(10, 'test-batch');
```

### Gas Analysis

```javascript
const gasCost = await TestUtils.estimateGasCost(transactionPromise);
const gasUsed = TestUtils.getGasUsed(receipt);
```

## Running Specific Tests

### By File

```bash
npx hardhat test test/AssetTracker.test.js
npx hardhat test test/RoleBasedAcl.test.js
npx hardhat test test/AccessManagement.test.js
```

### By Test Pattern

```bash
npx hardhat test --grep "Asset Creation"
npx hardhat test --grep "Role Assignment"
npx hardhat test --grep "Authorization"
```

## Coverage Reporting

Generate coverage reports to see test coverage:

```bash
npm run test:coverage
```

This will create a `coverage/` directory with detailed HTML reports showing:

- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

## Gas Reporting

Monitor gas usage for optimization:

```bash
npm run test:gas
```

This provides detailed gas usage statistics for each function call.

## Configuration

### Hardhat Configuration

The project is configured to support multiple Solidity versions:

- Solidity 0.4.24 (for older contracts)
- Solidity 0.8.20 (for newer contracts)

### Test Environment

- **Network**: Hardhat local network
- **Accounts**: 20 test accounts available
- **Gas**: Unlimited for testing
- **Optimization**: Enabled for both compiler versions

## Best Practices

### Writing Tests

1. **Use descriptive test names**: Clearly describe what each test verifies
2. **Group related tests**: Use `describe` blocks to organize tests logically
3. **Setup and teardown**: Use `beforeEach` for consistent test setup
4. **Test edge cases**: Include tests for error conditions and boundary cases
5. **Verify events**: Always test that expected events are emitted
6. **Gas awareness**: Monitor gas usage for optimization opportunities

### Test Data

1. **Use unique identifiers**: Generate unique UUIDs/keys to avoid conflicts
2. **Realistic data**: Use realistic asset names, descriptions, etc.
3. **Test boundaries**: Test with empty strings, long strings, edge values
4. **Multiple scenarios**: Test with different user roles and permissions

### Debugging

1. **Console logging**: Use `console.log` in tests for debugging
2. **Transaction receipts**: Examine transaction receipts for detailed information
3. **Error messages**: Use specific error message assertions
4. **Gas analysis**: Use gas reporting to identify expensive operations

## Continuous Integration

The test suite is designed to be run in CI/CD environments:

- All tests should pass with exit code 0
- Tests are deterministic and don't rely on external state
- Coverage reports can be generated automatically
- Gas reports help monitor contract efficiency

## Common Issues and Solutions

### Solidity Version Conflicts

- **Issue**: Contract compilation fails
- **Solution**: Check that contract pragma matches hardhat.config.js compilers

### Test Timeouts

- **Issue**: Tests hang or timeout
- **Solution**: Ensure all async operations use proper await/promises

### Gas Limit Errors

- **Issue**: Transactions fail with out-of-gas errors
- **Solution**: Check contract logic for infinite loops or expensive operations

### Event Assertion Failures

- **Issue**: Event tests fail unexpectedly
- **Solution**: Verify event names and parameter types match contract definitions

## Future Enhancements

Potential improvements to the testing setup:

1. **Fuzz Testing**: Add property-based testing for edge case discovery
2. **Fork Testing**: Test against mainnet state using Hardhat forking
3. **Performance Benchmarking**: Automated gas usage benchmarking
4. **Security Testing**: Integration with security analysis tools
5. **Frontend Testing**: Add tests for the web interface components

---

For questions or issues with the testing setup, please refer to the [Hardhat documentation](https://hardhat.org/docs) or create an issue in the project repository.
