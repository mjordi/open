/**
 * Tests for Explorer Utilities Module
 */

import { describe, it, expect } from 'vitest';
import {
  getTxExplorerUrl,
  getAddressExplorerUrl,
  getBlockExplorerUrl,
  getTokenExplorerUrl,
  truncateHash,
  truncateAddress,
  formatBlockNumber,
  isExplorerAvailable
} from '../../frontend/src/js/explorer-utils.js';

describe('Explorer Utilities Module', () => {
  describe('URL generation', () => {
    it('should generate transaction URLs', () => {
      const url = getTxExplorerUrl('0x123abc', 1);
      expect(url).toBe('https://etherscan.io/tx/0x123abc');
    });

    it('should generate address URLs', () => {
      const url = getAddressExplorerUrl('0xabc123', 1);
      expect(url).toBe('https://etherscan.io/address/0xabc123');
    });

    it('should generate block URLs', () => {
      const url = getBlockExplorerUrl(12345, 1);
      expect(url).toBe('https://etherscan.io/block/12345');
    });

    it('should generate token URLs', () => {
      const url = getTokenExplorerUrl('0xtoken123', 1);
      expect(url).toBe('https://etherscan.io/token/0xtoken123');
    });

    it('should return null for networks without explorers', () => {
      expect(getTxExplorerUrl('0x123', 31337)).toBeNull();
      expect(getAddressExplorerUrl('0xabc', 31337)).toBeNull();
      expect(getBlockExplorerUrl(123, 31337)).toBeNull();
    });
  });

  describe('truncateHash', () => {
    it('should truncate long hashes', () => {
      const hash = '0x1234567890abcdef1234567890abcdef';
      const truncated = truncateHash(hash);
      expect(truncated).toBe('0x12345678...90abcdef');
    });

    it('should not truncate short hashes', () => {
      const hash = '0x123';
      const truncated = truncateHash(hash);
      expect(truncated).toBe('0x123');
    });

    it('should handle custom truncation lengths', () => {
      const hash = '0x1234567890abcdef1234567890abcdef';
      const truncated = truncateHash(hash, 6, 4);
      expect(truncated).toBe('0x1234...cdef');
    });

    it('should handle null/undefined', () => {
      expect(truncateHash(null)).toBe(null);
      expect(truncateHash(undefined)).toBe(undefined);
    });
  });

  describe('truncateAddress', () => {
    it('should truncate Ethereum addresses', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const truncated = truncateAddress(address);
      expect(truncated).toBe('0x1234...7890');
    });

    it('should not truncate short addresses', () => {
      const address = '0x123';
      const truncated = truncateAddress(address);
      expect(truncated).toBe('0x123');
    });

    it('should handle custom truncation lengths', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const truncated = truncateAddress(address, 8, 6);
      expect(truncated).toBe('0x123456...567890');
    });
  });

  describe('formatBlockNumber', () => {
    it('should format block numbers with commas', () => {
      expect(formatBlockNumber(1234567)).toBe('1,234,567');
      expect(formatBlockNumber(1000)).toBe('1,000');
      expect(formatBlockNumber(999)).toBe('999');
    });
  });

  describe('isExplorerAvailable', () => {
    it('should return true for networks with explorers', () => {
      expect(isExplorerAvailable(1)).toBe(true);
      expect(isExplorerAvailable(11155111)).toBe(true);
    });

    it('should return false for local networks', () => {
      expect(isExplorerAvailable(31337)).toBe(false);
      expect(isExplorerAvailable(1337)).toBe(false);
    });
  });
});
