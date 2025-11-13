# AGENTS Instructions

This repository contains Solidity smart contracts and Hardhat-based tests.
These instructions apply to the entire repository.

## ⚠️ CRITICAL: Pre-Commit Validation

**BEFORE closing any task or marking work as complete, you MUST validate that ALL CI pipeline checks pass locally.**

Run this validation checklist in order:

### 1. Lint and Format Check

```bash
# Install dependencies (required for Hardhat 3.x)
npm ci --legacy-peer-deps

# Compile contracts
npm run compile

# Run Solidity linting
npm run lint:sol

# Run JavaScript linting
npm run lint:js

# Check code formatting
npm run format:check
```

**All commands must complete without errors or warnings.**

### 2. Test Suite

```bash
# Compile contracts (if not already done)
npm run compile

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration
```

**All tests must pass.**

### 3. Security Analysis

```bash
# Run npm audit (must pass with --audit-level moderate)
npm audit --audit-level moderate
```

**No moderate or higher severity vulnerabilities allowed.**

Note: Slither analysis is currently disabled due to Hardhat 3.x ESM incompatibility.

### 4. Pre-Commit Checklist

Before committing ANY changes, verify:

- ✅ `npm run compile` completes without errors
- ✅ `npm run lint:sol` shows 0 warnings
- ✅ `npm run lint:js` shows 0 warnings
- ✅ `npm run format:check` passes (all files formatted)
- ✅ `npm run test:unit` passes (all unit tests green)
- ✅ `npm run test:integration` passes (all integration tests green)
- ✅ `npm audit --audit-level moderate` passes (no vulnerabilities)

**DO NOT commit or close tasks if ANY of the above checks fail.**

## Requirements

### Node.js Version

- **REQUIRED**: Node.js 22.10.0 or later
- **Will NOT work** with Node.js 18 or 20
- Hardhat 3.x requires this version

```bash
node --version  # Must show v22.10.0 or higher
```

### Installation

Always use the `--legacy-peer-deps` flag:

```bash
npm install --legacy-peer-deps
```

This is required because `@nomicfoundation/hardhat-chai-matchers` has peer dependencies for Hardhat 2.x but works correctly with Hardhat 3.x.

## Code Style

- Format code with Prettier before committing: `npm run format`.
  - JavaScript uses 2-space indentation, single quotes, and semicolons.
  - Solidity uses 4-space indentation and double quotes.
- Run linters and fix any issues:
  - `npm run lint:js` for JavaScript.
  - `npm run lint:sol` for Solidity.

### Solidity Naming Conventions

- Immutable variables: Use `SCREAMING_SNAKE_CASE` (e.g., `_CREATOR`)
- Private variables: Prefix with underscore (e.g., `_roles`)
- Function parameters: Use `calldata` instead of `memory` where possible (gas optimization)

## Testing

- Run the test suite with `npm test` and ensure it passes.
- For unit tests only: `npm run test:unit`
- For integration tests only: `npm run test:integration`
- For comprehensive checks run `npm run validate` (compiles, lints, tests, audits).

### Test Requirements

- All tests must use Hardhat with Mocha test runner
- Chai matchers are available via `@nomicfoundation/hardhat-chai-matchers`
- Use `.to.emit()`, `.withArgs()`, `.to.be.reverted` for contract testing
- All tests must be written in ESM format (use `import` not `require`)

## Project Structure

- Solidity contracts live in `contracts/`.
- Tests live in `test/` and use Hardhat with Mocha/Chai.
- Deployment and utility scripts are in `scripts/`.
- Configuration: `hardhat.config.js` (ESM format)

## ESM (ECMAScript Modules)

This project uses ESM (not CommonJS):

- Use `import` and `export`, not `require()` and `module.exports`
- Files use `.js` extension with `"type": "module"` in package.json
- For `__dirname` and `__filename`, use:
  ```javascript
  import { fileURLToPath } from "url";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  ```

## CI/CD Pipeline Jobs

The CI pipeline consists of these jobs (in `.github/workflows/ci.yml`):

1. **lint** - Linting and formatting checks
2. **test** - Unit and integration tests
3. **security** - Security analysis (npm audit, Slither)
4. **quality-gate** - Aggregates all checks

All jobs must pass before merging.

## Git Workflow

1. Create feature branch from `master`
2. Make changes
3. **Run full validation checklist** (see above)
4. Commit with descriptive message
5. Push and create PR
6. Ensure all CI checks pass
7. Only then request review

## Common Commands

```bash
# Development
npm run compile          # Compile Solidity contracts
npm test                 # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only

# Quality Checks
npm run lint             # Lint Solidity contracts
npm run lint:sol         # Lint Solidity (allows failures)
npm run lint:js          # Lint JavaScript (allows failures)
npm run format           # Format all code with Prettier
npm run format:check     # Check formatting without modifying

# Security
npm audit                # Check for vulnerabilities
npm run audit            # Run with moderate level

# Validation
npm run validate         # Run all checks (compile, lint, test, audit)
```

## Troubleshooting

### "Cannot determine a test runner"

- Ensure `@nomicfoundation/hardhat-mocha` is installed
- Check that plugin is imported in `hardhat.config.js`

### "Package subpath not exported"

- Some plugins don't support Hardhat 3.x yet
- Use only plugins listed in `package.json`
- See `MIGRATION_NOTES.md` for compatibility status

### Peer Dependency Warnings

- These are expected and can be ignored
- Always use `npm install --legacy-peer-deps`
- `hardhat-chai-matchers` works despite peer dependency mismatch

## Additional Resources

- See `MIGRATION_NOTES.md` for Hardhat 3.x migration details
- See `PR_DESCRIPTION.md` for comprehensive change documentation
- CI pipeline: `.github/workflows/ci.yml`

---

**REMEMBER: Always run the full validation checklist before committing or closing any task!**
