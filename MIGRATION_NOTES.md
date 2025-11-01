# Dependency Update Migration Notes

This document describes the changes made to upgrade dependencies to their latest versions.

## ⚠️ IMPORTANT: Node.js Version Requirement

**Hardhat 3.x requires Node.js 22.10.0 or later (even major versions only: 22, 24, etc.)**

The project will not work with Node.js 18 or 20. You must upgrade to Node.js 22.10.0 or later.

- **Minimum version**: Node.js 22.10.0
- **Recommended**: Latest LTS version of Node.js 22.x
- **Reason**: Hardhat 3.x uses modern JavaScript features like `Array.prototype.toReversed()` that are only available in Node.js 20+, and specifically requires even major versions (22, 24, etc.)

## Upgraded Dependencies

### Major Version Upgrades

1. **Hardhat**: `2.26.2` → `3.0.10`
   - **Breaking Change**: Requires ESM (ECMAScript Modules) instead of CommonJS
   - **Breaking Change**: Network configuration now requires explicit `type` field

2. **@nomicfoundation/hardhat-ethers**: `3.0.9` → `4.0.2`
   - Compatible with Hardhat 3.x

3. **@nomicfoundation/hardhat-verify**: `2.1.1` → `3.0.4`
   - Compatible with Hardhat 3.x

4. **@nomicfoundation/hardhat-ignition**: `0.15.13` → `3.0.3`
   - Compatible with Hardhat 3.x

5. **@nomicfoundation/hardhat-ignition-ethers**: `0.15.14` → `3.0.3`
   - Compatible with Hardhat 3.x

6. **@nomicfoundation/ignition-core**: `0.15.12` → `3.0.3`
   - Compatible with Hardhat 3.x

7. **Chai**: `4.5.0` → `6.2.0`
   - Compatible with ESM projects

8. **ESLint**: `9.34.0` → `9.39.0`
   - Minor version update

## Code Changes Required

### 1. ESM Migration

All JavaScript files were converted from CommonJS to ESM format:

#### package.json

- Added `"type": "module"` to enable ESM

#### Import/Export Syntax

- Changed `require()` to `import`
- Changed `module.exports` to `export default` or `export { ... }`
- Updated `require.main === module` to `import.meta.url === \`file://\${process.argv[1]}\``

#### Example Changes

**Before (CommonJS):**

```javascript
const { ethers } = require("hardhat");
module.exports = { main };
```

**After (ESM):**

```javascript
import { ethers } from "hardhat";
export { main };
```

### 2. Hardhat Configuration

#### hardhat.config.js

- Converted to ESM syntax
- Added `type` field to all network configurations
- Networks now require: `type: 'http'` or `type: 'edr-simulated'`
- Updated RPC URL defaults (empty strings not allowed)

**Example:**

```javascript
networks: {
  hardhat: {
    type: 'edr-simulated',  // Added
    // ... other config
  },
  sepolia: {
    type: 'http',  // Added
    url: process.env.SEPOLIA_URL || 'https://ethereum-sepolia.publicnode.com',
    // ... other config
  }
}
```

#### **dirname and **filename in ESM

For scripts that use `__dirname` or `__filename`, added:

```javascript
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### 3. ESLint Configuration

Updated `eslint.config.js`:

- Changed `module.exports` to `export default`
- Updated `sourceType` from `'commonjs'` to `'module'`
- Updated `ecmaVersion` to `2022`
- Removed CommonJS-specific globals (`require`, `module`, `__dirname`)

### 4. Removed hardhat-toolbox

`@nomicfoundation/hardhat-toolbox` was removed as it doesn't yet support Hardhat 3.x. Instead, individual plugins are imported directly.

## Plugin Compatibility Notes

### Working with --legacy-peer-deps

- `@nomicfoundation/hardhat-chai-matchers@^2.1.2` - Despite requiring `hardhat@^2.26.0` in peer dependencies, this plugin **works correctly** with Hardhat 3.x when installed using `--legacy-peer-deps`. Test matchers like `.to.emit()`, `.withArgs()`, and `.to.be.reverted` function properly.
- `@nomicfoundation/hardhat-mocha@^3.0.5` - Official Hardhat 3.x test runner plugin. Required for tests to run.

### Temporarily Disabled Plugins

The following plugins are temporarily disabled due to Hardhat 3.x compatibility issues (they access internal Hardhat modules that are not exported):

- `@nomicfoundation/hardhat-network-helpers` - requires `hardhat/common` export
- `@typechain/hardhat` - requires `hardhat/common/bigInt` export
- `hardhat-gas-reporter` - requires `hardhat/common/bigInt` export
- `solidity-coverage` - requires `hardhat/common` export
- `hardhat-contract-sizer` - compatibility unknown

These will be re-enabled once updated versions are released.

## Files Modified

### Configuration Files

- `package.json` - Updated dependencies and added `"type": "module"`
- `hardhat.config.js` - Converted to ESM, updated network config
- `eslint.config.js` - Converted to ESM

### Test Files

- `test/AssetTracker.test.js` - Converted to ESM
- `test/RoleBasedAcl.test.js` - Converted to ESM
- `test/AccessManagement.test.js` - Converted to ESM
- `test/AssetTrackerOptimized.test.js` - Converted to ESM
- `test/PropertyBasedTests.js` - Converted to ESM
- `test/sample-test.js` - Converted to ESM
- `test/helpers/testUtils.js` - Converted to ESM

### Scripts

- `scripts/deploy.js` - Converted to ESM
- `scripts/performance-analysis.js` - Converted to ESM

## Installation

### Prerequisites

1. **Upgrade Node.js to version 22.10.0 or later**:

   ```bash
   node --version  # Should show v22.10.0 or higher
   ```

2. **Install dependencies** with legacy peer deps flag:
   ```bash
   npm install --legacy-peer-deps
   ```

The `--legacy-peer-deps` flag is required because some packages haven't updated their peer dependency declarations for Hardhat 3.x yet.

## Security Improvements

All updated dependencies include important security fixes as flagged by Dependabot.

## Next Steps

1. Monitor for updates to the disabled plugins that add Hardhat 3.x support
2. Re-enable plugins once compatible versions are available
3. Test all functionality thoroughly after compilation succeeds
