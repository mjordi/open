/**
 * Tests for Transaction Storage Module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TxStatus,
  TxType,
  getAllTransactions,
  saveTransaction,
  updateTransaction,
  getTransaction,
  deleteTransaction,
  clearAllTransactions,
  getTransactionsByStatus,
  getTransactionsByType,
  getTransactionsByContract,
  getTransactionsByAddress,
  getTransactionCount,
  createTransaction,
  exportTransactions,
  importTransactions
} from '../../frontend/src/js/transaction-storage.js';

describe('Transaction Storage Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearAllTransactions();
  });

  describe('TxStatus and TxType enums', () => {
    it('should have correct TxStatus values', () => {
      expect(TxStatus.PENDING).toBe('pending');
      expect(TxStatus.CONFIRMED).toBe('confirmed');
      expect(TxStatus.FAILED).toBe('failed');
    });

    it('should have correct TxType values', () => {
      expect(TxType.DEPLOY).toBe('deploy');
      expect(TxType.ADD_ASSET).toBe('add_asset');
      expect(TxType.GRANT_ACCESS).toBe('grant_access');
      expect(TxType.REVOKE_ACCESS).toBe('revoke_access');
      expect(TxType.ACCESS_REQUEST).toBe('access_request');
      expect(TxType.CHECK_ROLE).toBe('check_role');
      expect(TxType.OTHER).toBe('other');
    });
  });

  describe('getAllTransactions', () => {
    it('should return empty array when no transactions exist', () => {
      const transactions = getAllTransactions();
      expect(transactions).toEqual([]);
      expect(Array.isArray(transactions)).toBe(true);
    });

    it('should return all stored transactions', () => {
      const tx1 = createTransaction({
        hash: '0x123',
        type: TxType.DEPLOY,
        from: '0xabc'
      });
      const tx2 = createTransaction({
        hash: '0x456',
        type: TxType.ADD_ASSET,
        from: '0xdef'
      });

      saveTransaction(tx1);
      saveTransaction(tx2);

      const transactions = getAllTransactions();
      expect(transactions).toHaveLength(2);
      expect(transactions[0].hash).toBe('0x456'); // Most recent first
      expect(transactions[1].hash).toBe('0x123');
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('access_management_tx_history', 'invalid json');
      const transactions = getAllTransactions();
      expect(transactions).toEqual([]);
    });
  });

  describe('saveTransaction', () => {
    it('should save a transaction successfully', () => {
      const tx = createTransaction({
        hash: '0x123',
        type: TxType.DEPLOY,
        from: '0xabc'
      });

      const result = saveTransaction(tx);
      expect(result).toBe(true);

      const stored = getAllTransactions();
      expect(stored).toHaveLength(1);
      expect(stored[0].hash).toBe('0x123');
    });

    it('should add timestamp if not present', () => {
      const tx = {
        hash: '0x123',
        type: TxType.DEPLOY,
        from: '0xabc'
      };

      saveTransaction(tx);
      const stored = getAllTransactions();
      expect(stored[0].timestamp).toBeDefined();
      expect(typeof stored[0].timestamp).toBe('number');
    });

    it('should add new transactions at the beginning (most recent first)', () => {
      const tx1 = createTransaction({ hash: '0x111', type: TxType.DEPLOY, from: '0x1' });
      const tx2 = createTransaction({ hash: '0x222', type: TxType.DEPLOY, from: '0x2' });
      const tx3 = createTransaction({ hash: '0x333', type: TxType.DEPLOY, from: '0x3' });

      saveTransaction(tx1);
      saveTransaction(tx2);
      saveTransaction(tx3);

      const stored = getAllTransactions();
      expect(stored[0].hash).toBe('0x333');
      expect(stored[1].hash).toBe('0x222');
      expect(stored[2].hash).toBe('0x111');
    });

    it('should limit storage to MAX_TRANSACTIONS (100)', () => {
      // Add 105 transactions
      for (let i = 0; i < 105; i++) {
        const tx = createTransaction({
          hash: `0x${i}`,
          type: TxType.DEPLOY,
          from: '0xabc'
        });
        saveTransaction(tx);
      }

      const stored = getAllTransactions();
      expect(stored).toHaveLength(100);
      expect(stored[0].hash).toBe('0x104'); // Most recent
      expect(stored[99].hash).toBe('0x5'); // Oldest kept
    });
  });

  describe('updateTransaction', () => {
    it('should update an existing transaction', () => {
      const tx = createTransaction({
        hash: '0x123',
        type: TxType.DEPLOY,
        status: TxStatus.PENDING,
        from: '0xabc'
      });

      saveTransaction(tx);
      const result = updateTransaction('0x123', {
        status: TxStatus.CONFIRMED,
        blockNumber: 12345
      });

      expect(result).toBe(true);

      const updated = getTransaction('0x123');
      expect(updated.status).toBe(TxStatus.CONFIRMED);
      expect(updated.blockNumber).toBe(12345);
      expect(updated.updatedAt).toBeDefined();
    });

    it('should return false for non-existent transaction', () => {
      const result = updateTransaction('0xnonexistent', { status: TxStatus.CONFIRMED });
      expect(result).toBe(false);
    });

    it('should preserve existing fields when updating', () => {
      const tx = createTransaction({
        hash: '0x123',
        type: TxType.DEPLOY,
        from: '0xabc',
        description: 'Original description'
      });

      saveTransaction(tx);
      updateTransaction('0x123', { status: TxStatus.CONFIRMED });

      const updated = getTransaction('0x123');
      expect(updated.description).toBe('Original description');
      expect(updated.from).toBe('0xabc');
    });
  });

  describe('getTransaction', () => {
    it('should retrieve a transaction by hash', () => {
      const tx = createTransaction({
        hash: '0x123',
        type: TxType.DEPLOY,
        from: '0xabc'
      });

      saveTransaction(tx);
      const retrieved = getTransaction('0x123');

      expect(retrieved).not.toBeNull();
      expect(retrieved.hash).toBe('0x123');
    });

    it('should return null for non-existent transaction', () => {
      const retrieved = getTransaction('0xnonexistent');
      expect(retrieved).toBeNull();
    });
  });

  describe('deleteTransaction', () => {
    it('should delete a transaction by hash', () => {
      const tx = createTransaction({
        hash: '0x123',
        type: TxType.DEPLOY,
        from: '0xabc'
      });

      saveTransaction(tx);
      expect(getTransactionCount()).toBe(1);

      const result = deleteTransaction('0x123');
      expect(result).toBe(true);
      expect(getTransactionCount()).toBe(0);
    });

    it('should not affect other transactions when deleting one', () => {
      const tx1 = createTransaction({ hash: '0x111', type: TxType.DEPLOY, from: '0x1' });
      const tx2 = createTransaction({ hash: '0x222', type: TxType.ADD_ASSET, from: '0x2' });

      saveTransaction(tx1);
      saveTransaction(tx2);

      deleteTransaction('0x111');

      expect(getTransactionCount()).toBe(1);
      expect(getTransaction('0x222')).not.toBeNull();
      expect(getTransaction('0x111')).toBeNull();
    });
  });

  describe('clearAllTransactions', () => {
    it('should remove all transactions', () => {
      const tx1 = createTransaction({ hash: '0x111', type: TxType.DEPLOY, from: '0x1' });
      const tx2 = createTransaction({ hash: '0x222', type: TxType.ADD_ASSET, from: '0x2' });

      saveTransaction(tx1);
      saveTransaction(tx2);
      expect(getTransactionCount()).toBe(2);

      const result = clearAllTransactions();
      expect(result).toBe(true);
      expect(getTransactionCount()).toBe(0);
    });
  });

  describe('getTransactionsByStatus', () => {
    beforeEach(() => {
      const tx1 = createTransaction({
        hash: '0x111',
        type: TxType.DEPLOY,
        status: TxStatus.PENDING,
        from: '0x1'
      });
      const tx2 = createTransaction({
        hash: '0x222',
        type: TxType.ADD_ASSET,
        status: TxStatus.CONFIRMED,
        from: '0x2'
      });
      const tx3 = createTransaction({
        hash: '0x333',
        type: TxType.GRANT_ACCESS,
        status: TxStatus.PENDING,
        from: '0x3'
      });

      saveTransaction(tx1);
      saveTransaction(tx2);
      saveTransaction(tx3);
    });

    it('should filter transactions by status', () => {
      const pending = getTransactionsByStatus(TxStatus.PENDING);
      expect(pending).toHaveLength(2);
      expect(pending.every(tx => tx.status === TxStatus.PENDING)).toBe(true);

      const confirmed = getTransactionsByStatus(TxStatus.CONFIRMED);
      expect(confirmed).toHaveLength(1);
      expect(confirmed[0].hash).toBe('0x222');
    });

    it('should return empty array if no matches', () => {
      const failed = getTransactionsByStatus(TxStatus.FAILED);
      expect(failed).toEqual([]);
    });
  });

  describe('getTransactionsByType', () => {
    beforeEach(() => {
      const tx1 = createTransaction({ hash: '0x111', type: TxType.DEPLOY, from: '0x1' });
      const tx2 = createTransaction({ hash: '0x222', type: TxType.ADD_ASSET, from: '0x2' });
      const tx3 = createTransaction({ hash: '0x333', type: TxType.DEPLOY, from: '0x3' });

      saveTransaction(tx1);
      saveTransaction(tx2);
      saveTransaction(tx3);
    });

    it('should filter transactions by type', () => {
      const deploys = getTransactionsByType(TxType.DEPLOY);
      expect(deploys).toHaveLength(2);
      expect(deploys.every(tx => tx.type === TxType.DEPLOY)).toBe(true);

      const addAssets = getTransactionsByType(TxType.ADD_ASSET);
      expect(addAssets).toHaveLength(1);
      expect(addAssets[0].hash).toBe('0x222');
    });
  });

  describe('getTransactionsByContract', () => {
    beforeEach(() => {
      const tx1 = createTransaction({
        hash: '0x111',
        type: TxType.ADD_ASSET,
        contractAddress: '0xContract1',
        from: '0x1'
      });
      const tx2 = createTransaction({
        hash: '0x222',
        type: TxType.GRANT_ACCESS,
        contractAddress: '0xContract2',
        from: '0x2'
      });
      const tx3 = createTransaction({
        hash: '0x333',
        type: TxType.REVOKE_ACCESS,
        contractAddress: '0xContract1',
        from: '0x3'
      });

      saveTransaction(tx1);
      saveTransaction(tx2);
      saveTransaction(tx3);
    });

    it('should filter transactions by contract address', () => {
      const contract1Txs = getTransactionsByContract('0xContract1');
      expect(contract1Txs).toHaveLength(2);
      expect(contract1Txs.every(tx =>
        tx.contractAddress.toLowerCase() === '0xcontract1'
      )).toBe(true);
    });

    it('should be case-insensitive', () => {
      const txs = getTransactionsByContract('0xCONTRACT1');
      expect(txs).toHaveLength(2);
    });
  });

  describe('getTransactionsByAddress', () => {
    beforeEach(() => {
      const tx1 = createTransaction({
        hash: '0x111',
        type: TxType.DEPLOY,
        from: '0xAddress1',
        to: '0xAddress2'
      });
      const tx2 = createTransaction({
        hash: '0x222',
        type: TxType.ADD_ASSET,
        from: '0xAddress3',
        to: '0xAddress1'
      });
      const tx3 = createTransaction({
        hash: '0x333',
        type: TxType.GRANT_ACCESS,
        from: '0xAddress2',
        to: '0xAddress3'
      });

      saveTransaction(tx1);
      saveTransaction(tx2);
      saveTransaction(tx3);
    });

    it('should find transactions where address is sender', () => {
      const txs = getTransactionsByAddress('0xAddress1');
      expect(txs).toHaveLength(2);
    });

    it('should find transactions where address is recipient', () => {
      const txs = getTransactionsByAddress('0xAddress2');
      expect(txs).toHaveLength(2);
    });

    it('should be case-insensitive', () => {
      const txs = getTransactionsByAddress('0xADDRESS1');
      expect(txs).toHaveLength(2);
    });
  });

  describe('getTransactionCount', () => {
    it('should return 0 for empty storage', () => {
      expect(getTransactionCount()).toBe(0);
    });

    it('should return correct count', () => {
      const tx1 = createTransaction({ hash: '0x111', type: TxType.DEPLOY, from: '0x1' });
      const tx2 = createTransaction({ hash: '0x222', type: TxType.ADD_ASSET, from: '0x2' });

      saveTransaction(tx1);
      expect(getTransactionCount()).toBe(1);

      saveTransaction(tx2);
      expect(getTransactionCount()).toBe(2);
    });
  });

  describe('createTransaction', () => {
    it('should create a transaction with all fields', () => {
      const tx = createTransaction({
        hash: '0x123',
        type: TxType.DEPLOY,
        status: TxStatus.PENDING,
        from: '0xabc',
        to: '0xdef',
        contractAddress: '0xcontract',
        blockNumber: 12345,
        chainId: 1,
        description: 'Test transaction',
        metadata: { key: 'value' }
      });

      expect(tx.hash).toBe('0x123');
      expect(tx.type).toBe(TxType.DEPLOY);
      expect(tx.status).toBe(TxStatus.PENDING);
      expect(tx.from).toBe('0xabc');
      expect(tx.to).toBe('0xdef');
      expect(tx.contractAddress).toBe('0xcontract');
      expect(tx.blockNumber).toBe(12345);
      expect(tx.chainId).toBe(1);
      expect(tx.description).toBe('Test transaction');
      expect(tx.metadata).toEqual({ key: 'value' });
      expect(tx.timestamp).toBeDefined();
      expect(tx.updatedAt).toBeDefined();
    });

    it('should use default values for optional fields', () => {
      const tx = createTransaction({
        hash: '0x123',
        type: TxType.DEPLOY,
        from: '0xabc'
      });

      expect(tx.status).toBe(TxStatus.PENDING);
      expect(tx.metadata).toEqual({});
    });
  });

  describe('exportTransactions', () => {
    it('should export transactions as JSON string', () => {
      const tx1 = createTransaction({ hash: '0x111', type: TxType.DEPLOY, from: '0x1' });
      const tx2 = createTransaction({ hash: '0x222', type: TxType.ADD_ASSET, from: '0x2' });

      saveTransaction(tx1);
      saveTransaction(tx2);

      const exported = exportTransactions();
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });

    it('should export empty array when no transactions', () => {
      const exported = exportTransactions();
      const parsed = JSON.parse(exported);
      expect(parsed).toEqual([]);
    });
  });

  describe('importTransactions', () => {
    it('should import transactions from JSON string', () => {
      const transactions = [
        createTransaction({ hash: '0x111', type: TxType.DEPLOY, from: '0x1' }),
        createTransaction({ hash: '0x222', type: TxType.ADD_ASSET, from: '0x2' })
      ];

      const jsonData = JSON.stringify(transactions);
      const result = importTransactions(jsonData);

      expect(result).toBe(true);
      expect(getTransactionCount()).toBe(2);
    });

    it('should return false for invalid JSON', () => {
      const result = importTransactions('invalid json');
      expect(result).toBe(false);
    });

    it('should return false for non-array data', () => {
      const result = importTransactions('{"not": "an array"}');
      expect(result).toBe(false);
    });

    it('should replace existing transactions', () => {
      const tx1 = createTransaction({ hash: '0xold', type: TxType.DEPLOY, from: '0x1' });
      saveTransaction(tx1);

      const newTransactions = [
        createTransaction({ hash: '0xnew', type: TxType.ADD_ASSET, from: '0x2' })
      ];

      importTransactions(JSON.stringify(newTransactions));

      expect(getTransactionCount()).toBe(1);
      expect(getTransaction('0xnew')).not.toBeNull();
      expect(getTransaction('0xold')).toBeNull();
    });
  });
});
