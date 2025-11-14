import { expect } from 'chai';
import hre from 'hardhat';
import TestUtils from './helpers/testUtils.js';

describe('Contract Integration Tests', function () {
  let assetTracker;
  let roleBasedAcl;
  let accessManagement;
  let owner;
  let admin;
  let user1;
  let user2;

  beforeEach(async function () {
    // Connect to network and get ethers
    const { ethers } = await hre.network.connect();

    [owner, admin, user1, user2] = await ethers.getSigners();

    // Deploy all contracts
    const AssetTracker = await ethers.getContractFactory('AssetTracker');
    const RoleBasedAcl = await ethers.getContractFactory('RoleBasedAcl');
    const AccessManagement = await ethers.getContractFactory('AccessManagement');

    assetTracker = await AssetTracker.deploy();
    roleBasedAcl = await RoleBasedAcl.deploy();
    accessManagement = await AccessManagement.deploy();

    await assetTracker.waitForDeployment();
    await roleBasedAcl.waitForDeployment();
    await accessManagement.waitForDeployment();
  });

  describe('Cross-Contract Functionality', function () {
    it('Should demonstrate complete asset management workflow', async function () {
      // 1. Setup roles in RoleBasedAcl
      await roleBasedAcl.assignRole(admin.address, 'admin');
      expect(await roleBasedAcl.isAssignedRole.staticCall(admin.address, 'admin')).to.be.true;

      // 2. Create assets in AssetTracker
      const assetUuid = 'integration-test-asset';
      await assetTracker.createAsset(
        'Integration Asset',
        'Test asset for integration',
        assetUuid,
        'Test Manufacturer'
      );
      expect(await assetTracker.isOwnerOf(owner.address, assetUuid)).to.be.true;

      // 3. Create corresponding asset in AccessManagement
      const accessAssetKey = 'access-integration-asset';
      await accessManagement.newAsset(accessAssetKey, 'Access management integration test');

      const asset = await accessManagement.getAsset(accessAssetKey);
      expect(asset.assetOwner).to.equal(owner.address);
    });

    it('Should handle asset transfers and access management together', async function () {
      // Create asset in AssetTracker
      const assetUuid = 'transfer-test-asset';
      await assetTracker.createAsset(
        'Transfer Test',
        'Asset for transfer testing',
        assetUuid,
        'Test Mfg'
      );

      // Create corresponding access-managed asset
      const accessKey = 'transfer-access-asset';
      await accessManagement.newAsset(accessKey, 'Transfer access test');

      // Transfer asset ownership
      await assetTracker.transferAsset(user1.address, assetUuid);
      expect(await assetTracker.isOwnerOf(user1.address, assetUuid)).to.be.true;
      expect(await assetTracker.isOwnerOf(owner.address, assetUuid)).to.be.false;

      // Verify access patterns
      expect(await accessManagement.getAccess.staticCall(accessKey)).to.be.true; // Owner still has access
      expect(await accessManagement.connect(user1).getAccess.staticCall(accessKey)).to.be.false; // user1 doesn't have access yet

      // Grant access to user1
      await accessManagement.addAuthorization(accessKey, user1.address, 'user');
      expect(await accessManagement.connect(user1).getAccess.staticCall(accessKey)).to.be.true;
    });

    it('Should demonstrate role-based asset management', async function () {
      // Setup role hierarchy
      await roleBasedAcl.assignRole(admin.address, 'superadmin');
      await roleBasedAcl.connect(admin).assignRole(user1.address, 'manager');
      await roleBasedAcl.connect(admin).assignRole(user2.address, 'user');

      // Verify role hierarchy
      expect(await roleBasedAcl.isAssignedRole.staticCall(admin.address, 'superadmin')).to.be.true;
      expect(await roleBasedAcl.isAssignedRole.staticCall(user1.address, 'manager')).to.be.true;
      expect(await roleBasedAcl.isAssignedRole.staticCall(user2.address, 'user')).to.be.true;

      // Create assets with different access levels
      await accessManagement.newAsset('public-asset', 'Public access asset');
      await accessManagement.newAsset('manager-asset', 'Manager access asset');
      await accessManagement.newAsset('admin-asset', 'Admin access asset');

      // Set up access authorizations based on roles
      await accessManagement.addAuthorization('public-asset', user1.address, 'manager');
      await accessManagement.addAuthorization('public-asset', user2.address, 'user');
      await accessManagement.addAuthorization('manager-asset', user1.address, 'manager');
      await accessManagement.addAuthorization('admin-asset', admin.address, 'admin');

      // Test access patterns match roles
      expect(await accessManagement.connect(user2).getAccess.staticCall('public-asset')).to.be.true;
      expect(await accessManagement.connect(user1).getAccess.staticCall('manager-asset')).to.be
        .true;
      expect(await accessManagement.connect(admin).getAccess.staticCall('admin-asset')).to.be.true;

      // Test restricted access
      expect(await accessManagement.connect(user2).getAccess.staticCall('manager-asset')).to.be
        .false;
      expect(await accessManagement.connect(user2).getAccess.staticCall('admin-asset')).to.be.false;
    });
  });

  describe('Error Handling Integration', function () {
    it('Should handle consistent error states across contracts', async function () {
      // Test non-existent asset scenarios
      expect(await assetTracker.isOwnerOf(user1.address, 'non-existent')).to.be.false;
      expect(await accessManagement.connect(user1).getAccess.staticCall('non-existent')).to.be
        .false;

      // Test unauthorized access attempts
      await TestUtils.expectRevert(roleBasedAcl.connect(user1).assignRole(user2.address, 'admin'));

      const testAsset = 'error-test-asset';
      await accessManagement.newAsset(testAsset, 'Error testing');

      await TestUtils.expectRevertWithCustomError(
        accessManagement.connect(user1).addAuthorization(testAsset, user2.address, 'admin'),
        accessManagement,
        'NotOwnerOrAdmin'
      );
    });
  });

  describe('Performance and Gas Optimization', function () {
    it('Should handle bulk operations efficiently', async function () {
      const assetCount = 5;
      const assets = [];

      // Create multiple assets
      for (let i = 0; i < assetCount; i++) {
        const assetKey = `bulk-asset-${i}`;
        assets.push(assetKey);
        await accessManagement.newAsset(assetKey, `Bulk asset ${i}`);
      }

      // Verify all assets were created
      expect(Number(await accessManagement.getAssetCount())).to.be.at.least(assetCount);

      // Add multiple authorizations
      for (let i = 0; i < assetCount; i++) {
        await accessManagement.addAuthorization(assets[i], user1.address, 'user');
        expect(await accessManagement.connect(user1).getAccess.staticCall(assets[i])).to.be.true;
      }
    });
  });
});
