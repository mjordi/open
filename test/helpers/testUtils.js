import hre from 'hardhat';

/**
 * Test utilities for smart contract testing
 */
class TestUtils {
  /**
   * Deploy all contracts and return instances
   */
  static async deployAllContracts() {
    const { ethers } = await hre.network.connect();
    const [owner, ...addrs] = await ethers.getSigners();

    const AssetTracker = await ethers.getContractFactory('AssetTracker');
    const RoleBasedAcl = await ethers.getContractFactory('RoleBasedAcl');
    const AccessManagement = await ethers.getContractFactory('AccessManagement');

    const assetTracker = await AssetTracker.deploy();
    const roleBasedAcl = await RoleBasedAcl.deploy();
    const accessManagement = await AccessManagement.deploy();

    await assetTracker.waitForDeployment();
    await roleBasedAcl.waitForDeployment();
    await accessManagement.waitForDeployment();

    return {
      assetTracker,
      roleBasedAcl,
      accessManagement,
      owner,
      addrs,
    };
  }

  /**
   * Create a test asset with default values
   */
  static async createTestAsset(contract, signer, overrides = {}) {
    const defaults = {
      name: 'Test Asset',
      description: 'Test Description',
      uuid: `test-uuid-${Date.now()}`,
      manufacturer: 'Test Manufacturer',
    };

    const params = { ...defaults, ...overrides };

    const tx = await contract
      .connect(signer)
      .createAsset(params.name, params.description, params.uuid, params.manufacturer);

    await tx.wait();
    return params;
  }

  /**
   * Create a test access management asset
   */
  static async createAccessAsset(contract, signer, overrides = {}) {
    const defaults = {
      assetKey: `access-asset-${Date.now()}`,
      description: 'Test Access Asset',
    };

    const params = { ...defaults, ...overrides };

    const tx = await contract.connect(signer).newAsset(params.assetKey, params.description);

    await tx.wait();
    return params;
  }

  /**
   * Setup role hierarchy for testing
   */
  static async setupRoleHierarchy(roleContract, creator, users) {
    const roles = {
      superadmin: users[0],
      admin: users[1],
      manager: users[2],
      user: users[3],
    };

    // Creator assigns superadmin
    if (roles.superadmin) {
      await roleContract.connect(creator).assignRole(roles.superadmin.address, 'superadmin');
    }

    // Superadmin assigns admin
    if (roles.superadmin && roles.admin) {
      await roleContract.connect(roles.superadmin).assignRole(roles.admin.address, 'admin');
    }

    // Admin assigns manager
    if (roles.superadmin && roles.manager) {
      await roleContract.connect(roles.superadmin).assignRole(roles.manager.address, 'manager');
    }

    // Admin assigns user
    if (roles.superadmin && roles.user) {
      await roleContract.connect(roles.superadmin).assignRole(roles.user.address, 'user');
    }

    return roles;
  }

  /**
   * Generate multiple test assets
   */
  static generateAssetBatch(count, prefix = 'batch-asset') {
    const assets = [];
    for (let i = 0; i < count; i++) {
      assets.push({
        name: `${prefix} ${i + 1}`,
        description: `Description for ${prefix} ${i + 1}`,
        uuid: `${prefix}-uuid-${i + 1}`,
        manufacturer: `Manufacturer ${i + 1}`,
      });
    }
    return assets;
  }

  /**
   * Wait for transaction and return receipt
   */
  static async waitForTransaction(txPromise) {
    const tx = await txPromise;
    return await tx.wait();
  }

  /**
   * Get gas used from transaction receipt
   */
  static getGasUsed(receipt) {
    return receipt.gasUsed.toString();
  }

  /**
   * Advance time in hardhat network
   */
  static async advanceTime(seconds) {
    await hre.ethers.provider.send('evm_increaseTime', [seconds]);
    await hre.ethers.provider.send('evm_mine');
  }

  /**
   * Get current block timestamp
   */
  static async getCurrentTimestamp() {
    const block = await hre.ethers.provider.getBlock('latest');
    return block.timestamp;
  }

  /**
   * Assert event emission with proper error handling (ethers v6 compatible)
   * Works without hardhat-chai-matchers
   */
  static async expectEvent(tx, contract, eventName, expectedArgs = []) {
    const receipt = await tx.wait();

    // Parse logs to find the event
    const eventFragment = contract.interface.getEvent(eventName);
    const eventTopic = eventFragment.topicHash;

    const log = receipt.logs.find((log) => log.topics[0] === eventTopic);

    if (!log) {
      throw new Error(`Event ${eventName} not found in transaction`);
    }

    const parsedLog = contract.interface.parseLog(log);

    if (expectedArgs.length > 0) {
      for (let i = 0; i < expectedArgs.length; i++) {
        if (parsedLog.args[i] !== expectedArgs[i]) {
          throw new Error(
            `Event argument ${i} mismatch: expected ${expectedArgs[i]}, got ${parsedLog.args[i]}`
          );
        }
      }
    }

    return parsedLog;
  }

  /**
   * Expect a transaction to revert (generic)
   * Works without hardhat-chai-matchers
   */
  static async expectRevert(txPromise) {
    let reverted = false;

    try {
      const tx = await txPromise;
      await tx.wait();
    } catch (error) {
      reverted = true;
    }

    if (!reverted) {
      throw new Error('Expected transaction to revert, but it succeeded');
    }
  }

  /**
   * Expect a transaction to revert with a custom error
   * Works without hardhat-chai-matchers
   */
  static async expectRevertWithCustomError(txPromise, contract, errorName, expectedArgs = []) {
    let revertError = null;

    try {
      const tx = await txPromise;
      await tx.wait();
    } catch (error) {
      revertError = error;
    }

    if (!revertError) {
      throw new Error('Expected transaction to revert, but it succeeded');
    }

    // Check if the error matches the custom error
    const errorFragment = contract.interface.getError(errorName);
    if (!errorFragment) {
      throw new Error(`Custom error ${errorName} not found in contract interface`);
    }

    // Check error data contains the custom error selector
    const errorSelector = errorFragment.selector;

    if (!revertError.data || !revertError.data.startsWith(errorSelector)) {
      throw new Error(`Expected custom error ${errorName}, but got: ${revertError.message}`);
    }

    // If expectedArgs provided, decode and verify
    if (expectedArgs.length > 0) {
      try {
        const decodedError = contract.interface.parseError(revertError.data);
        for (let i = 0; i < expectedArgs.length; i++) {
          if (decodedError.args[i] !== expectedArgs[i]) {
            throw new Error(
              `Error argument ${i} mismatch: expected ${expectedArgs[i]}, got ${decodedError.args[i]}`
            );
          }
        }
      } catch (decodeError) {
        throw new Error(`Failed to decode error arguments: ${decodeError.message}`);
      }
    }

    return revertError;
  }

  /**
   * Calculate approximate gas cost in ETH
   */
  static async estimateGasCost(txPromise, gasPrice = null) {
    const tx = await txPromise;
    const receipt = await tx.wait();

    if (!gasPrice) {
      gasPrice = await hre.ethers.provider.getGasPrice();
    }

    const gasCost = receipt.gasUsed.mul(gasPrice);
    return hre.ethers.utils.formatEther(gasCost);
  }

  /**
   * Generate random address for testing
   */
  static generateRandomAddress() {
    return hre.ethers.Wallet.createRandom().address;
  }

  /**
   * Convert string to bytes32 for Solidity
   */
  static stringToBytes32(str) {
    return hre.ethers.utils.formatBytes32String(str);
  }

  /**
   * Convert bytes32 to string
   */
  static bytes32ToString(bytes32) {
    return hre.ethers.utils.parseBytes32String(bytes32);
  }
}

export default TestUtils;
