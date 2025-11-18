# Testing Guide

This document outlines the testing strategy and procedures for the OPEN blockchain access management system.

## Overview

The project includes comprehensive automated testing for all smart contracts using Hardhat, Chai, and Ethers.js.

## Test Suite Overview

| Contract | Coverage |
|----------|----------|
| AccessManagement | Asset creation, authorization management, access control, edge cases |
| AssetTracker | Asset creation, transfers, ownership verification, edge cases |
| RoleBasedAcl | Role assignment, unassignment, access control, modifiers |

## Running Tests

### Run All Tests
```bash
npm test
```

Or directly with Hardhat:
```bash
npx hardhat test
```

### Expected Output
```
  AccessManagement
    ✓ Should create a new asset successfully
    ✓ Should allow owner to add authorization
    ✓ Should grant access to authorized user
    ...

  AssetTraker
    ✓ Should create a new asset successfully
    ✓ Should transfer asset successfully
    ...

  RoleBasedAcl
    ✓ Should allow creator to assign roles
    ✓ Should correctly identify assigned roles
    ...

  XX passing (Xs)
```

## Test Coverage by Contract

### AccessManagement Tests

**Asset Creation**:
- Creates new assets successfully
- Rejects duplicate asset creation
- Validates empty asset keys and descriptions
- Handles special characters and Unicode

**Authorization Management**:
- Adds authorizations with different roles (admin, permanent, temporary)
- Prevents unauthorized users from adding authorizations
- Removes authorizations correctly
- Prevents duplicate entries in authorization list
- Validates zero addresses

**Access Control**:
- Grants access to authorized users
- Denies access to unauthorized users
- Verifies role assignment
- Validates owner permissions

**Event Emission**:
- AssetCreate events
- AuthorizationCreate events
- AuthorizationRemove events
- AccessLog events

### AssetTracker Tests

**Asset Creation**:
- Creates assets with UUID system
- Validates all required fields
- Handles empty strings and special characters
- Emits AssetCreate events

**Asset Transfer**:
- Transfers assets to valid addresses
- Prevents transfers to zero address
- Prevents unauthorized transfers
- Updates ownership correctly
- Emits AssetTransfer events

**Ownership Verification**:
- Correctly identifies asset owners
- Returns false for non-owners
- Handles non-existent assets

### RoleBasedAcl Tests

**Role Assignment**:
- Creator can assign roles
- Assigns multiple roles to same entity
- Validates addresses and role names
- Emits RoleChange events

**Role Unassignment**:
- Creator can unassign roles
- Handles non-existent role unassignment
- Emits RoleChange events

**Access Control**:
- Correctly identifies assigned roles
- Returns false for unassigned roles
- hasRole modifier works correctly
- Prevents unauthorized role changes

## Testing Best Practices

### Before Committing Code

1. **Run All Tests**: Always run `npm test` before committing
2. **Verify All Tests Pass**: Ensure all tests pass successfully
3. **Check for Warnings**: Review console output for deprecation warnings
4. **Update Tests**: Add tests for new functionality

### Writing New Tests

```javascript
describe("Feature Name", function() {
    let contract;
    let owner, addr1, addr2;

    beforeEach(async function() {
        [owner, addr1, addr2] = await ethers.getSigners();
        const ContractFactory = await ethers.getContractFactory("ContractName");
        contract = await ContractFactory.deploy();
    });

    it("Should perform expected behavior", async function() {
        // Arrange
        const input = "test-value";

        // Act
        await contract.someFunction(input);

        // Assert
        const result = await contract.getSomeValue();
        expect(result).to.equal(input);
    });

    it("Should reject invalid input", async function() {
        await expect(
            contract.someFunction("")
        ).to.be.revertedWith("Error message");
    });
});
```

### Test Categories

All tests should cover:
- ✅ **Happy Path**: Valid inputs produce expected results
- ✅ **Error Handling**: Invalid inputs are rejected with proper error messages
- ✅ **Edge Cases**: Empty strings, zero addresses, special characters, Unicode
- ✅ **Event Emission**: All events are emitted with correct parameters
- ✅ **Access Control**: Unauthorized users are properly rejected
- ✅ **State Changes**: Contract state is updated correctly

## Manual Testing (Frontend)

While smart contracts have comprehensive automated tests, the frontend requires manual testing with MetaMask.

### Prerequisites
1. MetaMask browser extension installed
2. Test wallet with testnet ETH
3. Local server running (`npm run serve`)

### Manual Test Checklist

#### MetaMask Connection
- [ ] Page loads without errors
- [ ] MetaMask connection prompt appears
- [ ] Account address displays after connection
- [ ] Balance is shown in console

#### Contract Deployment
- [ ] Deploy button works
- [ ] Gas estimation appears
- [ ] Transaction confirms in MetaMask
- [ ] Contract address displayed

#### Asset Management
- [ ] Create asset form submits successfully
- [ ] Asset creation events are logged
- [ ] Duplicate asset creation is rejected

#### Authorization Management
- [ ] Add authorization form works
- [ ] Authorization events are logged
- [ ] Check role returns correct result
- [ ] Remove authorization works

#### Error Handling
- [ ] Invalid inputs show error messages
- [ ] Failed transactions display alerts
- [ ] Console shows detailed error info

### Browser Compatibility

Tested and working with:
- ✅ Chrome + MetaMask
- ✅ Firefox + MetaMask
- ✅ Brave + MetaMask
- ✅ Edge + MetaMask

## Continuous Integration

GitHub Actions automatically runs all tests on:
- Every push to main branch
- Every pull request
- Manual workflow dispatch

See `.github/workflows/deploy-pages.yml` for CI configuration.

## Debugging Failed Tests

### Common Issues

**Hardhat Not Installed**:
```bash
npm install
```

**Tests Failing After Contract Changes**:
1. Review contract modifications
2. Update affected tests
3. Ensure input validation is properly tested

**Gas Estimation Errors**:
- Check for infinite loops
- Verify state changes are valid
- Review require statements

### Verbose Output

Run tests with stack traces for debugging:
```bash
npx hardhat test --show-stack-traces
```

## Test Maintenance

### When to Update Tests

Update tests when:
- Adding new contract functions
- Modifying existing function behavior
- Changing input validation rules
- Adding or removing events
- Updating error messages

### Test Organization

- Keep tests organized by contract
- Group related tests in `describe` blocks
- Use clear, descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

## Future Enhancements

Potential testing improvements:
- [ ] Add code coverage reporting
- [ ] Implement frontend unit tests
- [ ] Add E2E tests with Cypress/Playwright
- [ ] Gas cost optimization tests
- [ ] Performance benchmarking
- [ ] Integration tests with actual test networks

## Resources

- [Hardhat Testing Documentation](https://hardhat.org/tutorial/testing-contracts)
- [Chai Assertion Library](https://www.chaijs.com/)
- [Ethers.js Documentation](https://docs.ethers.org/)

---

**Remember**: Tests are the safety net that prevents bugs from reaching production. Always run tests before committing!
