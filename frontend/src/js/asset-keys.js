/**
 * Asset Key Registry
 *
 * `assetKey` is declared `string indexed` in the contract, so logs only carry
 * keccak256(assetKey) and ethers.js hands listeners an Indexed object instead of
 * the string. Interpolating that object into a message renders "[object Object]",
 * so event handlers resolve the hash back to a key seen earlier in the session.
 */

// keccak256(assetKey) -> assetKey
const assetKeysByHash = new Map();

/**
 * Hash an asset key the same way the EVM does for indexed string parameters
 * @param {string} assetKey - Plaintext asset key
 * @returns {string|null} keccak256 hash, or null if ethers.js is unavailable
 */
function hashAssetKey(assetKey) {
    // ethers.js is loaded as a UMD global by index.html
    const lib = globalThis.ethers;
    if (!lib || typeof lib.id !== 'function') return null;
    return lib.id(assetKey);
}

/**
 * Remember an asset key so events carrying only its hash can be shown by name
 * @param {string} assetKey - Plaintext asset key
 */
export function rememberAssetKey(assetKey) {
    if (typeof assetKey !== 'string' || assetKey.length === 0) return;

    const hash = hashAssetKey(assetKey);
    if (hash) assetKeysByHash.set(hash, assetKey);
}

/**
 * Resolve an asset key coming from a contract event for display
 * @param {string|{hash: string}} assetKey - Plaintext key, or the Indexed object ethers passes for indexed strings
 * @returns {string} The plaintext key when known, otherwise a shortened hash
 */
export function formatAssetKey(assetKey) {
    if (typeof assetKey === 'string') return assetKey;

    const hash = assetKey?.hash;
    if (typeof hash !== 'string' || hash.length === 0) return 'unknown asset';

    return assetKeysByHash.get(hash) ?? `${hash.slice(0, 10)}…`;
}

/**
 * Forget every remembered key, e.g. when connecting to a different contract
 */
export function clearAssetKeys() {
    assetKeysByHash.clear();
}
