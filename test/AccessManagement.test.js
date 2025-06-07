const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AccessManagement', function () {
  let accessManagement;
  let owner;
  let user1;
  let user2;
  let user3;
  let addrs;

  beforeEach(async function () {
    const AccessManagement = await ethers.getContractFactory('AccessManagement');
    [owner, user1, user2, user3, ...addrs] = await ethers.getSigners();

    accessManagement = await AccessManagement.deploy();
    await accessManagement.waitForDeployment();
  });

  describe('Asset Creation', function () {
    it('Should create a new asset successfully', async function () {
      const assetKey = 'asset-001';
      const assetDescription = 'Test Asset Description';

      await expect(accessManagement.newAsset(assetKey, assetDescription))
        .to.emit(accessManagement, 'AssetCreate')
        .withArgs(owner.address, assetKey, assetDescription);

      const asset = await accessManagement.getAsset(assetKey);
      expect(asset.assetOwner).to.equal(owner.address);
      expect(asset.assetDescription).to.equal(assetDescription);
      expect(asset.initialized).to.be.true;
      expect(asset.authorizationCount).to.equal(0);
    });

    it('Should reject creation of duplicate assets', async function () {
      const assetKey = 'duplicate-asset';
      const assetDescription = 'Duplicate Asset';

      // Create first asset
      await accessManagement.newAsset(assetKey, assetDescription);

      // Try to create duplicate
      await expect(accessManagement.newAsset(assetKey, assetDescription))
        .to.emit(accessManagement, 'RejectCreate')
        .withArgs(owner.address, assetKey, 'Asset with this Serial already exists.');

      // Verify the transaction returned false
      const result = await accessManagement.newAsset.staticCall(assetKey, assetDescription);
      expect(result).to.be.false;
    });

    it('Should allow different users to create assets', async function () {
      const asset1Key = 'user1-asset';
      const asset2Key = 'user2-asset';

      await accessManagement.connect(user1).newAsset(asset1Key, 'User 1 Asset');
      await accessManagement.connect(user2).newAsset(asset2Key, 'User 2 Asset');

      const asset1 = await accessManagement.getAsset(asset1Key);
      const asset2 = await accessManagement.getAsset(asset2Key);

      expect(asset1.assetOwner).to.equal(user1.address);
      expect(asset2.assetOwner).to.equal(user2.address);
    });

    it('Should track asset count correctly', async function () {
      expect(await accessManagement.getAssetCount()).to.equal(0);

      await accessManagement.newAsset('asset1', 'Asset 1');
      expect(await accessManagement.getAssetCount()).to.equal(1);

      await accessManagement.newAsset('asset2', 'Asset 2');
      expect(await accessManagement.getAssetCount()).to.equal(2);
    });

    it('Should provide asset listing functionality', async function () {
      const assets = ['asset1', 'asset2', 'asset3'];

      for (let i = 0; i < assets.length; i++) {
        await accessManagement.newAsset(assets[i], `Description ${i + 1}`);
      }

      for (let i = 0; i < assets.length; i++) {
        const assetKey = await accessManagement.getAssetAtIndex(i);
        expect(assets).to.include(assetKey);
      }
    });
  });

  describe('Authorization Management', function () {
    const testAssetKey = 'test-asset';
    const testAssetDescription = 'Test Asset for Authorization';

    beforeEach(async function () {
      // Create a test asset before each authorization test
      await accessManagement.newAsset(testAssetKey, testAssetDescription);
    });

    it('Should allow owner to add authorization', async function () {
      const authRole = 'admin';

      await expect(accessManagement.addAuthorization(testAssetKey, user1.address, authRole))
        .to.emit(accessManagement, 'AuthorizationCreate')
        .withArgs(user1.address, testAssetKey, authRole);

      const role = await accessManagement.getAssetAuthorization(testAssetKey, user1.address);
      expect(role).to.equal(authRole);

      const asset = await accessManagement.getAsset(testAssetKey);
      expect(asset.authorizationCount).to.equal(1);
    });

    it('Should allow authorized admins to add authorization', async function () {
      // First, owner adds user1 as admin
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');

      // Now user1 should be able to add authorization for user2
      await expect(
        accessManagement.connect(user1).addAuthorization(testAssetKey, user2.address, 'user')
      )
        .to.emit(accessManagement, 'AuthorizationCreate')
        .withArgs(user2.address, testAssetKey, 'user');

      const role = await accessManagement.getAssetAuthorization(testAssetKey, user2.address);
      expect(role).to.equal('user');
    });

    it('Should reject authorization from unauthorized users', async function () {
      // user1 has no permissions on the asset
      await expect(
        accessManagement.connect(user1).addAuthorization(testAssetKey, user2.address, 'admin')
      ).to.be.revertedWith('Only the owner or admins can add authorizations.');
    });

    it('Should allow owner to remove authorization', async function () {
      // Add authorization first
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');

      // Remove authorization
      await expect(accessManagement.removeAuthorization(testAssetKey, user1.address))
        .to.emit(accessManagement, 'AuthorizationRemove')
        .withArgs(user1.address, testAssetKey);

      const role = await accessManagement.getAssetAuthorization(testAssetKey, user1.address);
      expect(role).to.equal('');
    });

    it('Should allow authorized admins to remove authorization', async function () {
      // Setup: owner adds user1 as admin, user1 adds user2 as user
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');
      await accessManagement.connect(user1).addAuthorization(testAssetKey, user2.address, 'user');

      // user1 should be able to remove user2's authorization
      await expect(accessManagement.connect(user1).removeAuthorization(testAssetKey, user2.address))
        .to.emit(accessManagement, 'AuthorizationRemove')
        .withArgs(user2.address, testAssetKey);

      const role = await accessManagement.getAssetAuthorization(testAssetKey, user2.address);
      expect(role).to.equal('');
    });

    it('Should reject authorization removal from unauthorized users', async function () {
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');

      // user2 has no permissions
      await expect(
        accessManagement.connect(user2).removeAuthorization(testAssetKey, user1.address)
      ).to.be.revertedWith('Only the owner or admins can remove authorizations.');
    });

    it('Should handle authorization listing', async function () {
      // Add multiple authorizations
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');
      await accessManagement.addAuthorization(testAssetKey, user2.address, 'user');
      await accessManagement.addAuthorization(testAssetKey, user3.address, 'viewer');

      const authCount = await accessManagement.getAssetAuthorizationCount(testAssetKey);
      expect(authCount).to.equal(3);

      // Check that all addresses are in the authorization list
      const addresses = [];
      for (let i = 0; i < authCount; i++) {
        const addr = await accessManagement.getAssetAuthorizationAtIndex(testAssetKey, i);
        addresses.push(addr);
      }

      expect(addresses).to.include(user1.address);
      expect(addresses).to.include(user2.address);
      expect(addresses).to.include(user3.address);
    });
  });

  describe('Access Control', function () {
    const testAssetKey = 'access-test-asset';

    beforeEach(async function () {
      await accessManagement.newAsset(testAssetKey, 'Access Test Asset');
    });

    it('Should grant access to asset owner', async function () {
      await expect(accessManagement.getAccess(testAssetKey))
        .to.emit(accessManagement, 'AccessLog')
        .withArgs(owner.address, testAssetKey, true);

      const hasAccess = await accessManagement.getAccess.staticCall(testAssetKey);
      expect(hasAccess).to.be.true;
    });

    it('Should grant access to authorized users', async function () {
      // Add authorization for user1
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');

      await expect(accessManagement.connect(user1).getAccess(testAssetKey))
        .to.emit(accessManagement, 'AccessLog')
        .withArgs(user1.address, testAssetKey, true);

      const hasAccess = await accessManagement.connect(user1).getAccess.staticCall(testAssetKey);
      expect(hasAccess).to.be.true;
    });

    it('Should deny access to unauthorized users', async function () {
      await expect(accessManagement.connect(user1).getAccess(testAssetKey))
        .to.emit(accessManagement, 'AccessLog')
        .withArgs(user1.address, testAssetKey, false);

      const hasAccess = await accessManagement.connect(user1).getAccess.staticCall(testAssetKey);
      expect(hasAccess).to.be.false;
    });

    it('Should deny access after authorization removal', async function () {
      // Add then remove authorization
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');
      await accessManagement.removeAuthorization(testAssetKey, user1.address);

      await expect(accessManagement.connect(user1).getAccess(testAssetKey))
        .to.emit(accessManagement, 'AccessLog')
        .withArgs(user1.address, testAssetKey, false);

      const hasAccess = await accessManagement.connect(user1).getAccess.staticCall(testAssetKey);
      expect(hasAccess).to.be.false;
    });

    it('Should handle access for non-existent assets', async function () {
      const nonExistentAsset = 'non-existent-asset';

      await expect(accessManagement.getAccess(nonExistentAsset))
        .to.emit(accessManagement, 'AccessLog')
        .withArgs(owner.address, nonExistentAsset, false);

      const hasAccess = await accessManagement.getAccess.staticCall(nonExistentAsset);
      expect(hasAccess).to.be.false;
    });
  });

  describe('Asset Queries', function () {
    it('Should return correct data for existing assets', async function () {
      const assetKey = 'test-query-asset';
      const description = 'Test Query Description';

      await accessManagement.newAsset(assetKey, description);
      await accessManagement.addAuthorization(assetKey, user1.address, 'admin');

      const asset = await accessManagement.getAsset(assetKey);
      expect(asset.assetOwner).to.equal(owner.address);
      expect(asset.assetDescription).to.equal(description);
      expect(asset.initialized).to.be.true;
      expect(asset.authorizationCount).to.equal(1);
    });

    it('Should return empty data for non-existent assets', async function () {
      const nonExistentAsset = 'non-existent';
      const asset = await accessManagement.getAsset(nonExistentAsset);

      expect(asset.assetOwner).to.equal('0x0000000000000000000000000000000000000000');
      expect(asset.assetDescription).to.equal('');
      expect(asset.initialized).to.be.false;
      expect(asset.authorizationCount).to.equal(0);
    });

    it('Should return empty authorization for non-existent or unauthorized users', async function () {
      const assetKey = 'test-asset';
      await accessManagement.newAsset(assetKey, 'Test');

      const role = await accessManagement.getAssetAuthorization(assetKey, user1.address);
      expect(role).to.equal('');
    });
  });

  describe('Complex Scenarios', function () {
    it('Should handle multiple assets with different owners and authorizations', async function () {
      // Create assets with different owners
      await accessManagement.connect(owner).newAsset('owner-asset', 'Owner Asset');
      await accessManagement.connect(user1).newAsset('user1-asset', 'User1 Asset');

      // Add cross-authorizations
      await accessManagement.connect(owner).addAuthorization('owner-asset', user1.address, 'admin');
      await accessManagement
        .connect(user1)
        .addAuthorization('user1-asset', owner.address, 'viewer');

      // Test access patterns
      expect(await accessManagement.connect(owner).getAccess.staticCall('owner-asset')).to.be.true;
      expect(await accessManagement.connect(user1).getAccess.staticCall('owner-asset')).to.be.true;
      expect(await accessManagement.connect(owner).getAccess.staticCall('user1-asset')).to.be.true;
      expect(await accessManagement.connect(user1).getAccess.staticCall('user1-asset')).to.be.true;
      expect(await accessManagement.connect(user2).getAccess.staticCall('owner-asset')).to.be.false;
      expect(await accessManagement.connect(user2).getAccess.staticCall('user1-asset')).to.be.false;
    });

    it('Should handle authorization cascading', async function () {
      const assetKey = 'cascade-asset';
      await accessManagement.newAsset(assetKey, 'Cascade Test');

      // Owner -> Admin1 -> Admin2 -> User
      await accessManagement.addAuthorization(assetKey, user1.address, 'admin');
      await accessManagement.connect(user1).addAuthorization(assetKey, user2.address, 'admin');
      await accessManagement.connect(user2).addAuthorization(assetKey, user3.address, 'user');

      // All should have access
      expect(await accessManagement.getAccess.staticCall(assetKey)).to.be.true;
      expect(await accessManagement.connect(user1).getAccess.staticCall(assetKey)).to.be.true;
      expect(await accessManagement.connect(user2).getAccess.staticCall(assetKey)).to.be.true;
      expect(await accessManagement.connect(user3).getAccess.staticCall(assetKey)).to.be.true;
    });
  });
});
