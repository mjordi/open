# Frontend Testing

This directory contains tests for the frontend JavaScript modules using [Vitest](https://vitest.dev/).

## Running Tests

```bash
# Run all frontend tests once
npm run test:frontend

# Run tests in watch mode (re-runs on file changes)
npm run test:frontend:watch

# Run tests with coverage report
npm run test:frontend:coverage

# Run tests with UI interface
npm run test:frontend:ui

# Run both smart contract and frontend tests
npm run test:all
```

## Test Structure

- **transaction-storage.test.js** - Tests for localStorage-based transaction management
- **network-config.test.js** - Tests for blockchain network configuration
- **explorer-utils.test.js** - Tests for block explorer URL utilities
- **setup.js** - Test environment setup (mocks localStorage)

## Coverage

Current test coverage includes:
- Transaction storage operations (CRUD, filtering, import/export)
- Network configuration lookups
- Explorer URL generation and formatting utilities
- Address and hash truncation helpers

## Adding New Tests

1. Create a new `*.test.js` file in this directory
2. Import the module you want to test
3. Write tests using Vitest's `describe`, `it`, and `expect` APIs
4. Run `npm run test:frontend:watch` during development

Example:
```javascript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../frontend/src/js/my-module.js';

describe('My Module', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expectedValue);
  });
});
```
