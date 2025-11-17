# Development Guidelines

This document outlines the development practices and requirements for the OPEN blockchain access management system.

## Testing Requirements

### ⚠️ CRITICAL: Verify All Changes Before Completion

**All code changes MUST be verified with tests before marking a task as complete.**

### Current Testing Status

**Note**: As documented in [IMPROVEMENTS.md Issue #22](IMPROVEMENTS.md#22-no-unit-tests), this project currently lacks automated unit tests. This is a known limitation that should be addressed.

### Verification Methods

Until automated tests are implemented, all changes must be verified through:

#### 1. Manual Testing Checklist

Before completing any task, verify the following:

- [ ] **MetaMask Integration**: Test with MetaMask wallet in browser
- [ ] **Contract Deployment**: Verify smart contract can be deployed
- [ ] **Asset Creation**: Test creating new assets
- [ ] **Authorization Management**: Test adding/removing authorizations
- [ ] **Access Verification**: Test access checking functionality
- [ ] **Error Handling**: Verify error messages display correctly
- [ ] **Console Logs**: Check browser console for errors
- [ ] **Event Watchers**: Confirm events are logged properly
- [ ] **No Regressions**: Verify existing functionality still works

#### 2. Browser Testing Requirements

Test in the following environments:
- Chrome/Brave with MetaMask extension
- Firefox with MetaMask extension
- Edge with MetaMask extension

#### 3. Code Quality Checks

Before committing:
- [ ] No console errors in browser DevTools
- [ ] No JavaScript syntax errors
- [ ] No broken references or undefined variables
- [ ] Proper error handling implemented
- [ ] Code follows existing patterns and conventions

### Future: Automated Testing

When implementing automated tests (see IMPROVEMENTS.md #22), the following should be included:

#### Smart Contract Tests
```javascript
// Example test structure with Hardhat
describe("AccessManagement", function() {
    it("Should create a new asset", async function() {
        const [owner] = await ethers.getSigners();
        const AccessManagement = await ethers.getContractFactory("AccessManagement");
        const contract = await AccessManagement.deploy();

        await contract.newAsset("ASSET001", "Test Asset");
        const asset = await contract.getAsset("ASSET001");

        expect(asset.assetOwner).to.equal(owner.address);
        expect(asset.assetDescription).to.equal("Test Asset");
    });
});
```

#### Frontend Tests
- Unit tests for JavaScript functions
- Integration tests for Web3 interactions
- End-to-end tests for user workflows

## Development Workflow

### Making Changes

1. **Create Feature Branch**: Work on feature branches following naming convention
2. **Make Changes**: Implement your changes following code standards
3. **Verify Changes**: Complete the testing checklist above
4. **Commit**: Write clear, descriptive commit messages
5. **Push**: Push to remote branch
6. **Create PR**: Submit pull request with description of changes

### Commit Message Format

```
<type>: <short description>

<detailed description>

Fixes: #<issue-number>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Code Review Requirements

All pull requests require:
- Description of changes and why they were made
- Verification that testing checklist was completed
- No breaking changes (or clearly documented if unavoidable)
- Updated documentation if applicable

## High-Priority Issues

When fixing issues from IMPROVEMENTS.md marked as "High Priority":
1. Verify the fix resolves the specific issue
2. Test all related functionality
3. Check for side effects or regressions
4. Update IMPROVEMENTS.md to mark as resolved
5. Document any breaking changes

## Common Issues and Solutions

### MetaMask Connection Issues
- Ensure MetaMask is installed and unlocked
- Check you're on the correct network
- Verify account has sufficient ETH for gas

### Contract Interaction Failures
- Check contract ABI matches deployed contract
- Verify contract address is correct
- Ensure sufficient gas limit
- Check transaction isn't being rejected by contract logic

### Event Watcher Memory Leaks
- ⚠️ Always set up event watchers ONCE at initialization
- Never create new watchers on each form submission
- Use `.stopWatching()` or `.unwatch()` when cleaning up

### Web3.js Version Compatibility
- Use modern async/await patterns
- Avoid deprecated callback-style APIs
- Use `web3.utils` instead of deprecated top-level functions
- Test with latest MetaMask version

## Gas Optimization

When making contract changes:
- Estimate gas before transactions
- Add 10-20% buffer to gas estimates
- Test with different gas prices
- Document expected gas costs

## Security Checklist

Before deploying changes:
- [ ] No private keys or sensitive data in code
- [ ] Input validation for all user inputs
- [ ] Proper error handling that doesn't expose internals
- [ ] No XSS vulnerabilities
- [ ] No SQL injection risks (if applicable)
- [ ] Contract addresses verified before deployment

## Documentation Requirements

Update documentation when:
- Adding new features
- Changing existing behavior
- Fixing bugs that affect usage
- Deprecating functionality
- Updating dependencies

Files to consider:
- README.md - User-facing documentation
- IMPROVEMENTS.md - Known issues and future work
- AGENTS.md - System roles and permissions
- This file (DEVELOPMENT.md) - Development practices

## Getting Help

- Review IMPROVEMENTS.md for known issues
- Check README.md for setup instructions
- Review blockchain explorer for transaction details
- Check browser console for detailed error messages

---

**Remember**: Always verify your changes work correctly before completing a task. Quality over speed!
