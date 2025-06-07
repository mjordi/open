const { ethers } = require('hardhat');

/**
 * Test utilities for smart contract testing
 */
class TestUtils {
  /**
   * Deploy all contracts and return instances
   */
  static async deployAllContracts() {
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
    await ethers.provider.send('evm_increaseTime', [seconds]);
    await ethers.provider.send('evm_mine');
  }

  /**
   * Get current block timestamp
   */
  static async getCurrentTimestamp() {
    const block = await ethers.provider.getBlock('latest');
    return block.timestamp;
  }

  /**
   * Assert event emission with proper error handling
   */
  static async expectEvent(txPromise, contract, eventName, args = []) {
    const tx = await txPromise;
    const receipt = await tx.wait();

    const event = receipt.events?.find((e) => e.event === eventName);
    if (!event) {
      throw new Error(`Event ${eventName} not found in transaction`);
    }

    if (args.length > 0) {
      for (let i = 0; i < args.length; i++) {
        if (event.args[i] !== args[i]) {
          throw new Error(
            `Event argument ${i} mismatch: expected ${args[i]}, got ${event.args[i]}`
          );
        }
      }
    }

    return event;
  }

  /**
   * Calculate approximate gas cost in ETH
   */
  static async estimateGasCost(txPromise, gasPrice = null) {
    const tx = await txPromise;
    const receipt = await tx.wait();

    if (!gasPrice) {
      gasPrice = await ethers.provider.getGasPrice();
    }

    const gasCost = receipt.gasUsed.mul(gasPrice);
    return ethers.utils.formatEther(gasCost);
  }

  /**
   * Generate random address for testing
   */
  static generateRandomAddress() {
    return ethers.Wallet.createRandom().address;
  }

  /**
   * Convert string to bytes32 for Solidity
   */
  static stringToBytes32(str) {
    return ethers.utils.formatBytes32String(str);
  }

  /**
   * Convert bytes32 to string
   */
  static bytes32ToString(bytes32) {
    return ethers.utils.parseBytes32String(bytes32);
  }
}

module.exports = TestUtils;
