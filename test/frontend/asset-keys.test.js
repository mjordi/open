/**
 * Tests for the asset key registry
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { ethers } from 'ethers';
import { rememberAssetKey, formatAssetKey, clearAssetKeys } from '../../frontend/src/js/asset-keys.js';

/**
 * Build the Indexed object ethers.js passes to listeners for `string indexed`
 * parameters, which carries the hash instead of the plaintext value.
 */
function indexed(assetKey) {
    const iface = new ethers.Interface([
        'event AccessLog(address indexed account, string indexed assetKey, bool accessGranted)'
    ]);
    const log = iface.encodeEventLog('AccessLog', [ethers.ZeroAddress, assetKey, true]);
    return iface.parseLog(log).args[1];
}

describe('Asset Key Registry', () => {
    beforeAll(() => {
        // index.html loads ethers.js as a UMD global
        globalThis.ethers = ethers;
    });

    beforeEach(() => {
        clearAssetKeys();
    });

    describe('formatAssetKey', () => {
        it('should return plaintext keys unchanged', () => {
            expect(formatAssetKey('office-front-door')).toBe('office-front-door');
        });

        it('should resolve a remembered key from its hash', () => {
            rememberAssetKey('office-front-door');

            expect(formatAssetKey(indexed('office-front-door'))).toBe('office-front-door');
        });

        it('should never render an Indexed object as [object Object]', () => {
            expect(formatAssetKey(indexed('never-seen'))).not.toContain('[object Object]');
        });

        it('should fall back to a shortened hash for unknown assets', () => {
            const hash = ethers.id('never-seen');

            expect(formatAssetKey(indexed('never-seen'))).toBe(`${hash.slice(0, 10)}…`);
        });

        it('should distinguish between different asset keys', () => {
            rememberAssetKey('front-door');
            rememberAssetKey('back-door');

            expect(formatAssetKey(indexed('front-door'))).toBe('front-door');
            expect(formatAssetKey(indexed('back-door'))).toBe('back-door');
        });

        it('should handle keys with unicode and special characters', () => {
            const assetKey = 'Tür-🚪-#1';
            rememberAssetKey(assetKey);

            expect(formatAssetKey(indexed(assetKey))).toBe(assetKey);
        });

        it('should return a placeholder for missing or malformed values', () => {
            expect(formatAssetKey(undefined)).toBe('unknown asset');
            expect(formatAssetKey(null)).toBe('unknown asset');
            expect(formatAssetKey({})).toBe('unknown asset');
        });
    });

    describe('rememberAssetKey', () => {
        it('should ignore empty and non-string keys', () => {
            expect(() => {
                rememberAssetKey('');
                rememberAssetKey(undefined);
                rememberAssetKey(42);
            }).not.toThrow();

            expect(formatAssetKey(indexed(''))).toBe(`${ethers.id('').slice(0, 10)}…`);
        });
    });

    describe('clearAssetKeys', () => {
        it('should forget keys from a previously connected contract', () => {
            rememberAssetKey('front-door');
            expect(formatAssetKey(indexed('front-door'))).toBe('front-door');

            clearAssetKeys();

            expect(formatAssetKey(indexed('front-door'))).toBe(`${ethers.id('front-door').slice(0, 10)}…`);
        });
    });
});
