# Development Guidelines

This document outlines the development practices and requirements for the OPEN blockchain access management system.

## Environment Requirements

### Node.js Version

**Required**: Node.js 24.0.0 or higher

- Hardhat 3 requires Node.js version 24.0.0 or higher (even-numbered LTS versions only)
- Node.js 18 reached end-of-life in April 2025 and is no longer supported
- Install Node.js from [https://nodejs.org](https://nodejs.org)
- Verify your version: `node --version` (should be v24.0.0 or higher)
- For version management, use [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  nvm install 24
  nvm use 24
  ```

**Why even-numbered versions only?**
- Node.js follows a release schedule where even-numbered versions (20, 22, 24, etc.) are Long-Term Support (LTS) releases
- Odd-numbered versions (19, 21, 23, etc.) are not LTS and have shorter support lifecycles
- Hardhat only supports LTS versions to ensure stability

## Testing Requirements

### ⚠️ CRITICAL: Verify All Changes Before Completion

**All code changes MUST be verified with tests before marking a task as complete.**

### Current Testing Status

The project has comprehensive automated testing across all contracts.

Run all tests with: `npm test`

### Verification Methods

All changes must be verified through:

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

### Automated Testing

The project includes comprehensive automated testing for both smart contracts and frontend:

#### Running Tests
```bash
# Run smart contract tests
npm test

# Run frontend tests
npm run test:frontend

# Run all tests (contracts + frontend)
npm run test:all

# Run frontend tests in watch mode
npm run test:frontend:watch
```

#### Test Coverage

**Smart Contracts:**
- **AccessManagement**: Asset creation, authorization, access control, edge cases
- **AssetTracker**: Asset creation, transfers, ownership verification
- **RoleBasedAcl**: Role assignment, unassignment, access control

**Frontend JavaScript:**
- **Transaction Storage**: localStorage operations, filtering, import/export (35 tests)
- **Network Configuration**: Explorer configs, chain support (9 tests)
- **Explorer Utilities**: URL generation, truncation helpers (15 tests)

#### Test Structure Examples

**Contract Tests:**
```javascript
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

**Frontend Tests:**
```javascript
import { describe, it, expect } from 'vitest';
import { truncateAddress } from '../../frontend/src/js/explorer-utils.js';

describe('Explorer Utilities', () => {
  it('should truncate Ethereum addresses', () => {
    const address = '0x1234567890123456789012345678901234567890';
    const truncated = truncateAddress(address);
    expect(truncated).toBe('0x1234...7890');
  });
});
```

See `test/frontend/README.md` for frontend testing documentation.

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

## Dependency Security Overrides

Every dependency in this project is a devDependency, but advisories still
surface through `npm audit` and Dependabot. When a vulnerable package is a
**transitive** dependency — nothing in `package.json` requires it directly — the
fix goes in the `overrides` block of `package.json`.

### Why overrides and not `npm audit fix`

`npm audit fix` rewrites `package-lock.json` only. If the parent package's
declared range still admits the vulnerable version (for example `minimatch`
requiring `brace-expansion@^2.0.2`), the next lockfile regeneration can quietly
resolve back to it. An entry in `overrides` is recorded in `package.json` and
survives that, so the pin is the durable fix and the lockfile bump alone is not.

### Current overrides

| Override | Pinned to | Reason |
| :--- | :--- | :--- |
| `brace-expansion@2` | `^2.1.4` | GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895 (high) — unbounded expansion DoS; reached via `minimatch` |
| `brace-expansion@5` | `^5.0.9` | Same advisories, 5.x line; reached via `glob` → `minimatch` |
| `diff` | `^8.0.3` | Security pin inherited from "Fix vulnerable dependencies" (#126) |
| `glob` | `>=11.1.0` | Build-compatibility pin, not an advisory (see #126-era Vercel build fixes) |
| `js-yaml` | `^4.3.1` | GHSA-5p4m-2wfm-xmqj (high); reached via `mocha` |
| `postcss` | `^8.5.18` | GHSA-r28c-9q8g-f849 (high); reached via `vitest` → `vite` |
| `serialize-javascript` | `^7.0.5` | Security pin inherited from "Fix vulnerable dependencies" (#126) |
| `undici@<6.28.0` | `^6.28.0` | CVE-2026-15157, CVE-2026-16728, CVE-2026-16729 (moderate); reached via `@nomicfoundation/hardhat-utils` |

### Version-scoped keys

Two entries above use the `name@range` form rather than a bare package name.
This is deliberate and must be preserved:

- **`undici@<6.28.0`** — the tree contains two copies of `undici`: 6.x under
  `@nomicfoundation/hardhat-utils` (vulnerable) and 8.x under `jsdom` (already
  unaffected). A bare `"undici": "^6.28.0"` would force `jsdom` down to a major
  version it does not support. Scoping the key to `<6.28.0` rewrites only the
  vulnerable edge.
- **`brace-expansion@2` / `brace-expansion@5`** — two major lines coexist in the
  tree and are patched independently. A single bare override would collapse one
  onto the other.

### Maintaining these pins

- **Verify a pin actually holds** by regenerating a lockfile from scratch, not
  just by reading the current one:
  ```bash
  mkdir /tmp/regen && cp package.json /tmp/regen/
  cd /tmp/regen && npm install --package-lock-only && npm audit
  ```
  A pin that only exists in the committed lockfile will show its vulnerable
  version here.
- **After changing overrides**, run the full suite (`npm run test:all`) and
  `npm run build`. Overrides move transitive versions under tooling, so build
  and test breakage is the expected failure mode.
- **Removing an override** is safe once every dependent's declared range no
  longer admits a vulnerable version — usually after the parent package
  publishes a release that requires the patched version itself. Check with
  `npm ls <package>` before dropping an entry, then re-run the from-scratch
  regeneration above to confirm `npm audit` stays clean. When in doubt, leave
  the pin: a stale override costs little, a rolled-back one reintroduces a
  known advisory.

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
- ROLES.md - System roles and permissions
- This file (DEVELOPMENT.md) - Development practices

## Getting Help

- Review IMPROVEMENTS.md for known issues
- Check README.md for setup instructions
- Review blockchain explorer for transaction details
- Check browser console for detailed error messages

---

**Remember**: Always verify your changes work correctly before completing a task. Quality over speed!
