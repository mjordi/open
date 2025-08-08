# AGENTS Instructions

This repository contains Solidity smart contracts and Hardhat-based tests.
These instructions apply to the entire repository.

## Code Style
- Format code with Prettier before committing: `npm run format`.
  - JavaScript uses 2-space indentation, single quotes, and semicolons.
  - Solidity uses 4-space indentation and double quotes.
- Run linters and fix any issues:
  - `npm run lint:js` for JavaScript (may emit a config warning).
  - `npm run lint:sol` for Solidity (will install solhint if missing).

## Testing
- Run the test suite with `npm test` and ensure it passes.
- For comprehensive checks run `npm run validate` (compiles, lints, tests, audits).

## Project Structure
- Solidity contracts live in `contracts/`.
- Tests live in `test/` and use Hardhat with Mocha/Chai.
- Deployment and utility scripts are in `scripts/`.

Follow these instructions when modifying or adding files within this repository.
