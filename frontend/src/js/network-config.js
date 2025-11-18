/**
 * Network Configuration Module
 * Provides explorer URLs and network-specific settings
 */

export const NETWORK_EXPLORERS = {
    // Mainnet
    1: {
        name: 'Ethereum Mainnet',
        explorer: 'https://etherscan.io',
        currency: 'ETH'
    },
    // Testnets
    11155111: {
        name: 'Sepolia',
        explorer: 'https://sepolia.etherscan.io',
        currency: 'SepoliaETH'
    },
    5: {
        name: 'Goerli',
        explorer: 'https://goerli.etherscan.io',
        currency: 'GoerliETH'
    },
    17000: {
        name: 'Holesky',
        explorer: 'https://holesky.etherscan.io',
        currency: 'HoleskyETH'
    },
    // Layer 2s
    10: {
        name: 'Optimism',
        explorer: 'https://optimistic.etherscan.io',
        currency: 'ETH'
    },
    42161: {
        name: 'Arbitrum One',
        explorer: 'https://arbiscan.io',
        currency: 'ETH'
    },
    137: {
        name: 'Polygon',
        explorer: 'https://polygonscan.com',
        currency: 'MATIC'
    },
    8453: {
        name: 'Base',
        explorer: 'https://basescan.org',
        currency: 'ETH'
    },
    // Local development
    31337: {
        name: 'Hardhat',
        explorer: null,
        currency: 'ETH'
    },
    1337: {
        name: 'Ganache',
        explorer: null,
        currency: 'ETH'
    }
};

/**
 * Get explorer configuration for a chain ID
 * @param {number} chainId - The chain ID
 * @returns {Object|null} Explorer configuration or null if not found
 */
export function getExplorerConfig(chainId) {
    return NETWORK_EXPLORERS[chainId] || null;
}

/**
 * Check if a network has a block explorer
 * @param {number} chainId - The chain ID
 * @returns {boolean} True if explorer exists
 */
export function hasExplorer(chainId) {
    const config = getExplorerConfig(chainId);
    return config && config.explorer !== null;
}

/**
 * Get the base URL for a network's explorer
 * @param {number} chainId - The chain ID
 * @returns {string|null} Explorer URL or null if not available
 */
export function getExplorerBaseUrl(chainId) {
    const config = getExplorerConfig(chainId);
    return config ? config.explorer : null;
}

/**
 * Get the network currency symbol
 * @param {number} chainId - The chain ID
 * @returns {string} Currency symbol (defaults to 'ETH')
 */
export function getNetworkCurrency(chainId) {
    const config = getExplorerConfig(chainId);
    return config ? config.currency : 'ETH';
}
