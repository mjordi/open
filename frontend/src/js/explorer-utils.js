/**
 * Explorer Utilities Module
 * Functions for generating block explorer links
 */

import { getExplorerBaseUrl, hasExplorer } from './network-config.js';

/**
 * Validate that a URL is safe (starts with http or https)
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is safe
 */
function isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Generate a transaction explorer URL
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - Chain ID
 * @returns {string|null} Explorer URL or null if not available
 */
export function getTxExplorerUrl(txHash, chainId) {
    const baseUrl = getExplorerBaseUrl(chainId);
    if (!baseUrl) return null;
    return `${baseUrl}/tx/${txHash}`;
}

/**
 * Generate an address explorer URL
 * @param {string} address - Ethereum address
 * @param {number} chainId - Chain ID
 * @returns {string|null} Explorer URL or null if not available
 */
export function getAddressExplorerUrl(address, chainId) {
    const baseUrl = getExplorerBaseUrl(chainId);
    if (!baseUrl) return null;
    return `${baseUrl}/address/${address}`;
}

/**
 * Generate a block explorer URL
 * @param {number} blockNumber - Block number
 * @param {number} chainId - Chain ID
 * @returns {string|null} Explorer URL or null if not available
 */
export function getBlockExplorerUrl(blockNumber, chainId) {
    const baseUrl = getExplorerBaseUrl(chainId);
    if (!baseUrl) return null;
    return `${baseUrl}/block/${blockNumber}`;
}

/**
 * Generate a token explorer URL
 * @param {string} tokenAddress - Token contract address
 * @param {number} chainId - Chain ID
 * @returns {string|null} Explorer URL or null if not available
 */
export function getTokenExplorerUrl(tokenAddress, chainId) {
    const baseUrl = getExplorerBaseUrl(chainId);
    if (!baseUrl) return null;
    return `${baseUrl}/token/${tokenAddress}`;
}

/**
 * Create a clickable explorer link HTML
 * @param {string} url - The explorer URL
 * @param {string} text - Link text
 * @param {string} icon - Optional Bootstrap icon class
 * @returns {string} HTML string for the link
 */
export function createExplorerLink(url, text, icon = 'box-arrow-up-right') {
    if (!url || !isValidUrl(url)) return text;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="explorer-link">
        ${text} <i class="bi bi-${icon}"></i>
    </a>`;
}

/**
 * Create a transaction hash link with truncated display
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - Chain ID
 * @param {boolean} truncate - Whether to truncate the hash display
 * @returns {string} HTML string for the transaction link
 */
export function createTxHashLink(txHash, chainId, truncate = true) {
    const url = getTxExplorerUrl(txHash, chainId);
    const displayHash = truncate ? truncateHash(txHash) : txHash;

    if (!url || !isValidUrl(url)) {
        return `<code class="tx-hash">${displayHash}</code>`;
    }

    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="explorer-link tx-link" title="${txHash}">
        <code>${displayHash}</code> <i class="bi bi-box-arrow-up-right"></i>
    </a>`;
}

/**
 * Create an address link with truncated display
 * @param {string} address - Ethereum address
 * @param {number} chainId - Chain ID
 * @param {boolean} truncate - Whether to truncate the address display
 * @returns {string} HTML string for the address link
 */
export function createAddressLink(address, chainId, truncate = true) {
    const url = getAddressExplorerUrl(address, chainId);
    const displayAddress = truncate ? truncateAddress(address) : address;

    if (!url || !isValidUrl(url)) {
        return `<code class="address">${displayAddress}</code>`;
    }

    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="explorer-link address-link" title="${address}">
        <code>${displayAddress}</code> <i class="bi bi-box-arrow-up-right"></i>
    </a>`;
}

/**
 * Truncate a transaction hash for display
 * @param {string} hash - Transaction hash
 * @param {number} startChars - Number of characters to show at start
 * @param {number} endChars - Number of characters to show at end
 * @returns {string} Truncated hash
 */
export function truncateHash(hash, startChars = 10, endChars = 8) {
    if (!hash || hash.length <= startChars + endChars) return hash;
    return `${hash.substring(0, startChars)}...${hash.substring(hash.length - endChars)}`;
}

/**
 * Truncate an Ethereum address for display
 * @param {string} address - Ethereum address
 * @param {number} startChars - Number of characters to show at start
 * @param {number} endChars - Number of characters to show at end
 * @returns {string} Truncated address
 */
export function truncateAddress(address, startChars = 6, endChars = 4) {
    if (!address || address.length <= startChars + endChars) return address;
    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Format block number with commas
 * @param {number} blockNumber - Block number
 * @returns {string} Formatted block number
 */
export function formatBlockNumber(blockNumber) {
    return blockNumber.toLocaleString();
}

/**
 * Check if explorer is available for chain
 * @param {number} chainId - Chain ID
 * @returns {boolean} True if explorer is available
 */
export function isExplorerAvailable(chainId) {
    return hasExplorer(chainId);
}
