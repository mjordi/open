# Pull Request: Upgrade to Hardhat 3.x and Update Dependencies

## Summary

This PR addresses **5 Dependabot security alerts** (#57, #63, #64, #65, #66) by upgrading dependencies to their latest versions and migrating the project to ESM (ECMAScript Modules) as required by Hardhat 3.x.

## 🔄 Dependency Updates

### Major Upgrades
- ✅ hardhat: `2.26.2` → `3.0.10` (#64)
- ✅ @nomicfoundation/hardhat-ethers: `3.0.9` → `4.0.2` (#66)
- ✅ @nomicfoundation/hardhat-verify: `2.1.1` → `3.0.4` (#65)
- ✅ @nomicfoundation/hardhat-ignition: `0.15.13` → `3.0.3`
- ✅ @nomicfoundation/hardhat-ignition-ethers: `0.15.14` → `3.0.3`
- ✅ @nomicfoundation/ignition-core: `0.15.12` → `3.0.3`
- ✅ chai: `4.5.0` → `6.2.0` (#57)
- ✅ eslint: `9.34.0` → `9.39.0` (#63)

### Removed
- ❌ @nomicfoundation/hardhat-toolbox - Not yet compatible with Hardhat 3.x (individual plugins imported directly)

## 🔧 Breaking Changes & Migrations

### ESM Migration (Required by Hardhat 3.x)
Hardhat 3.x requires ECMAScript Modules (ESM) instead of CommonJS:

- ✅ Added `"type": "module"` to package.json
- ✅ Converted all `require()` to `import` statements
- ✅ Converted all `module.exports` to `export` statements
- ✅ Updated hardhat.config.js to ESM syntax
- ✅ Migrated all test files to ESM
- ✅ Migrated all scripts (deploy.js, performance-analysis.js) to ESM
- ✅ Updated eslint.config.js for ESM
- ✅ Added `__dirname` and `__filename` polyfills where needed

### Hardhat 3.x Configuration Updates
- ✅ Added explicit `type` field to all network configurations
- ✅ Networks now specify `type: 'http'` or `type: 'edr-simulated'`
- ✅ Updated RPC URL defaults (empty strings no longer allowed)

## ⚠️ Temporarily Disabled Features

The following plugins are **temporarily disabled** due to Hardhat 3.x compatibility issues:

- `@nomicfoundation/hardhat-chai-matchers` - requires `hardhat-ethers@^3.1.0` and `hardhat@^2.26.0`
- `@nomicfoundation/hardhat-network-helpers` - requires `hardhat/common` export
- `@typechain/hardhat` - requires `hardhat/common/bigInt` export
- `hardhat-gas-reporter` - requires `hardhat/common/bigInt` export
- `solidity-coverage` - requires `hardhat/common` export
- `hardhat-contract-sizer` - compatibility unknown

**These will be re-enabled** when compatible versions are released by their maintainers.

**Note on Testing:** Tests currently use standard Chai assertions. Once `hardhat-chai-matchers` is updated for Hardhat 3.x, test assertions should be updated to use hardhat-specific matchers like `.to.be.revertedWithCustomError()`, `.to.emit()`, etc.

## 🔒 Security Improvements

All updated dependencies include important security fixes as flagged by Dependabot.

## 📦 Installation

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is required because some packages haven't updated their peer dependency declarations for Hardhat 3.x yet.

## 📚 Documentation

See [MIGRATION_NOTES.md](./MIGRATION_NOTES.md) for a detailed migration guide and complete list of changes.

## ✅ Testing

The ESM migration has been validated:
- ✅ ESLint runs successfully with the new configuration
- ✅ All import/export syntax is correct
- ⚠️ Compilation and tests require network access to download Solidity compilers (blocked in current environment)

## 🎯 Related Issues

Closes #57, Closes #63, Closes #64, Closes #65, Closes #66

## 🚀 Next Steps

1. Review the changes in this PR
2. Test compilation and running tests in an environment with network access
3. Monitor for updates to the disabled plugins
4. Re-enable plugins when compatible versions become available

---

## How to Create This PR

You can create the PR using the GitHub web interface:

1. Visit: https://github.com/mjordi/open/pull/new/claude/fix-dependency-updates-011CUgjo1L7fQXmUK7BZzfx1
2. Set base branch to: `master`
3. Set title to: `chore: upgrade to Hardhat 3.x and update dependencies with ESM migration`
4. Copy the content above (excluding this "How to Create This PR" section) into the PR description
5. Click "Create pull request"
