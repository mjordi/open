/**
 * Vitest setup file for frontend tests
 * This file runs before all tests
 */

// Mock localStorage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

// happy-dom's window.localStorage is a getter-only accessor, so a plain
// assignment throws ("Cannot set property localStorage ... which has only
// a getter"). vi.stubGlobal defines the property directly instead of going
// through the accessor, which works regardless of the environment's own
// localStorage implementation.
vi.stubGlobal('localStorage', new LocalStorageMock());

// Mock console methods to reduce test noise (optional)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Restore console methods after each test
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});
