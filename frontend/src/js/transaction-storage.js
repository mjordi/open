/**
 * Transaction Storage Module
 * Manages persistent transaction history using localStorage
 */

const STORAGE_KEY = 'access_management_tx_history';
const MAX_TRANSACTIONS = 100; // Maximum number of transactions to store

/**
 * Transaction status enum
 */
export const TxStatus = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed'
};

/**
 * Transaction type enum
 */
export const TxType = {
    DEPLOY: 'deploy',
    ADD_ASSET: 'add_asset',
    GRANT_ACCESS: 'grant_access',
    REVOKE_ACCESS: 'revoke_access',
    ACCESS_REQUEST: 'access_request',
    CHECK_ROLE: 'check_role',
    OTHER: 'other'
};

/**
 * Get all transactions from storage
 * @returns {Array} Array of transaction objects
 */
export function getAllTransactions() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error reading transaction history:', error);
        return [];
    }
}

/**
 * Save a transaction to storage
 * @param {Object} transaction - Transaction object
 * @returns {boolean} Success status
 */
export function saveTransaction(transaction) {
    try {
        const transactions = getAllTransactions();

        // Add timestamp if not present
        if (!transaction.timestamp) {
            transaction.timestamp = Date.now();
        }

        // Add to beginning of array (most recent first)
        transactions.unshift(transaction);

        // Limit storage size
        const limitedTransactions = transactions.slice(0, MAX_TRANSACTIONS);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedTransactions));
        return true;
    } catch (error) {
        console.error('Error saving transaction:', error);
        return false;
    }
}

/**
 * Update an existing transaction
 * @param {string} txHash - Transaction hash
 * @param {Object} updates - Properties to update
 * @returns {boolean} Success status
 */
export function updateTransaction(txHash, updates) {
    try {
        const transactions = getAllTransactions();
        const index = transactions.findIndex(tx => tx.hash === txHash);

        if (index === -1) {
            return false;
        }

        // Merge updates
        transactions[index] = {
            ...transactions[index],
            ...updates,
            updatedAt: Date.now()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        return true;
    } catch (error) {
        console.error('Error updating transaction:', error);
        return false;
    }
}

/**
 * Get a transaction by hash
 * @param {string} txHash - Transaction hash
 * @returns {Object|null} Transaction object or null if not found
 */
export function getTransaction(txHash) {
    const transactions = getAllTransactions();
    return transactions.find(tx => tx.hash === txHash) || null;
}

/**
 * Delete a transaction
 * @param {string} txHash - Transaction hash
 * @returns {boolean} Success status
 */
export function deleteTransaction(txHash) {
    try {
        const transactions = getAllTransactions();
        const filtered = transactions.filter(tx => tx.hash !== txHash);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return false;
    }
}

/**
 * Clear all transactions
 * @returns {boolean} Success status
 */
export function clearAllTransactions() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing transactions:', error);
        return false;
    }
}

/**
 * Get transactions filtered by status
 * @param {string} status - Transaction status
 * @returns {Array} Filtered transactions
 */
export function getTransactionsByStatus(status) {
    const transactions = getAllTransactions();
    return transactions.filter(tx => tx.status === status);
}

/**
 * Get transactions filtered by type
 * @param {string} type - Transaction type
 * @returns {Array} Filtered transactions
 */
export function getTransactionsByType(type) {
    const transactions = getAllTransactions();
    return transactions.filter(tx => tx.type === type);
}

/**
 * Get transactions for a specific contract address
 * @param {string} contractAddress - Contract address
 * @returns {Array} Filtered transactions
 */
export function getTransactionsByContract(contractAddress) {
    const transactions = getAllTransactions();
    return transactions.filter(tx =>
        tx.contractAddress &&
        tx.contractAddress.toLowerCase() === contractAddress.toLowerCase()
    );
}

/**
 * Get transactions from/to a specific address
 * @param {string} address - User address
 * @returns {Array} Filtered transactions
 */
export function getTransactionsByAddress(address) {
    const transactions = getAllTransactions();
    const lowerAddress = address.toLowerCase();
    return transactions.filter(tx =>
        (tx.from && tx.from.toLowerCase() === lowerAddress) ||
        (tx.to && tx.to.toLowerCase() === lowerAddress)
    );
}

/**
 * Get transaction count
 * @returns {number} Total number of stored transactions
 */
export function getTransactionCount() {
    return getAllTransactions().length;
}

/**
 * Create a new transaction object
 * @param {Object} params - Transaction parameters
 * @returns {Object} Transaction object
 */
export function createTransaction({
    hash,
    type,
    status = TxStatus.PENDING,
    from,
    to,
    contractAddress,
    blockNumber,
    chainId,
    description,
    metadata = {}
}) {
    return {
        hash,
        type,
        status,
        from,
        to,
        contractAddress,
        blockNumber,
        chainId,
        description,
        metadata,
        timestamp: Date.now(),
        updatedAt: Date.now()
    };
}

/**
 * Export transactions as JSON
 * @returns {string} JSON string of all transactions
 */
export function exportTransactions() {
    const transactions = getAllTransactions();
    return JSON.stringify(transactions, null, 2);
}

/**
 * Import transactions from JSON
 * @param {string} jsonData - JSON string of transactions
 * @returns {boolean} Success status
 */
export function importTransactions(jsonData) {
    try {
        const transactions = JSON.parse(jsonData);
        if (!Array.isArray(transactions)) {
            throw new Error('Invalid transaction data format');
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        return true;
    } catch (error) {
        console.error('Error importing transactions:', error);
        return false;
    }
}
