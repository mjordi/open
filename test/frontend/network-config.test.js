/**
 * Tests for Network Configuration Module
 */

import { describe, it, expect } from 'vitest';
import {
  NETWORK_EXPLORERS,
  getExplorerConfig,
  hasExplorer,
  getExplorerBaseUrl,
  getNetworkCurrency
} from '../../frontend/src/js/network-config.js';

describe('Network Configuration Module', () => {
  describe('getExplorerConfig', () => {
    it('should return config for known networks', () => {
      const mainnetConfig = getExplorerConfig(1);
      expect(mainnetConfig).toBeDefined();
      expect(mainnetConfig.name).toBe('Ethereum Mainnet');
      expect(mainnetConfig.explorer).toBe('https://etherscan.io');

      const sepoliaConfig = getExplorerConfig(11155111);
      expect(sepoliaConfig).toBeDefined();
      expect(sepoliaConfig.name).toBe('Sepolia');
    });

    it('should return null for unknown networks', () => {
      const config = getExplorerConfig(99999);
      expect(config).toBeNull();
    });
  });

  describe('hasExplorer', () => {
    it('should return true for networks with explorers', () => {
      expect(hasExplorer(1)).toBe(true); // Mainnet
      expect(hasExplorer(11155111)).toBe(true); // Sepolia
      expect(hasExplorer(137)).toBe(true); // Polygon
    });

    it('should return false for local networks', () => {
      expect(hasExplorer(31337)).toBe(false); // Hardhat
      expect(hasExplorer(1337)).toBe(false); // Ganache
    });

    it('should return false for unknown networks', () => {
      expect(hasExplorer(99999)).toBeFalsy();
    });
  });

  describe('getExplorerBaseUrl', () => {
    it('should return correct URLs for networks', () => {
      expect(getExplorerBaseUrl(1)).toBe('https://etherscan.io');
      expect(getExplorerBaseUrl(11155111)).toBe('https://sepolia.etherscan.io');
      expect(getExplorerBaseUrl(137)).toBe('https://polygonscan.com');
    });

    it('should return null for networks without explorers', () => {
      expect(getExplorerBaseUrl(31337)).toBeNull();
      expect(getExplorerBaseUrl(99999)).toBeNull();
    });
  });

  describe('getNetworkCurrency', () => {
    it('should return correct currency symbols', () => {
      expect(getNetworkCurrency(1)).toBe('ETH');
      expect(getNetworkCurrency(137)).toBe('MATIC');
      expect(getNetworkCurrency(11155111)).toBe('SepoliaETH');
    });

    it('should return ETH as default for unknown networks', () => {
      expect(getNetworkCurrency(99999)).toBe('ETH');
    });
  });
});
