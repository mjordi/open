import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use happy-dom for DOM testing (lighter and faster than jsdom)
    environment: 'happy-dom',

    // Enable global test APIs (describe, it, expect, etc.)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'test/**',
        'frontend/dist/**',
        'frontend/src/generated/**',
        'scripts/**',
        '*.config.js'
      ]
    },

    // Test file patterns
    include: ['frontend/**/*.test.js', 'test/frontend/**/*.test.js'],

    // Setup files
    setupFiles: ['./test/frontend/setup.js']
  }
});
