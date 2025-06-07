const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AccessManagement', function () {
  let accessManagement;
  let owner;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    const AccessManagement = await ethers.getContractFactory('AccessManagement');
    [owner, user1, user2, user3] = await ethers.getSigners();

    accessManagement = await AccessManagement.deploy();
    await accessManagement.waitForDeployment();
  });

  describe('Asset Creation', function () {
    it('Should create a new asset successfully', async function () {
      const assetKey = 'asset-001';
      const assetDescription = 'Test Asset Description';

      await expect(accessManagement.newAsset(assetKey, assetDescription))
        .to.emit(accessManagement, 'AssetCreated')
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

      await accessManagement.newAsset(assetKey, assetDescription);

      await expect(
        accessManagement.newAsset(assetKey, assetDescription)
      ).to.be.revertedWithCustomError(accessManagement, 'AssetAlreadyExists');
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

    beforeEach(async function () {
      await accessManagement.newAsset(testAssetKey, 'Test Asset');
    });

    it('Should allow owner to add authorization', async function () {
      const authRole = 'admin';

      await expect(accessManagement.addAuthorization(testAssetKey, user1.address, authRole))
        .to.emit(accessManagement, 'AuthorizationAdded')
        .withArgs(owner.address, user1.address, testAssetKey, authRole);

      const role = await accessManagement.getAssetAuthorization(testAssetKey, user1.address);
      expect(role).to.equal(authRole);

      const asset = await accessManagement.getAsset(testAssetKey);
      expect(asset.authorizationCount).to.equal(1);
    });

    it('Should allow authorized admins to add authorization', async function () {
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');

      await expect(
        accessManagement.connect(user1).addAuthorization(testAssetKey, user2.address, 'user')
      )
        .to.emit(accessManagement, 'AuthorizationAdded')
        .withArgs(user1.address, user2.address, testAssetKey, 'user');

      const role = await accessManagement.getAssetAuthorization(testAssetKey, user2.address);
      expect(role).to.equal('user');
    });

    it('Should reject authorization from unauthorized users', async function () {
      await expect(
        accessManagement.connect(user1).addAuthorization(testAssetKey, user2.address, 'admin')
      ).to.be.revertedWithCustomError(accessManagement, 'NotOwnerOrAdmin');
    });

    it('Should allow owner to remove authorization', async function () {
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');

      await expect(accessManagement.removeAuthorization(testAssetKey, user1.address))
        .to.emit(accessManagement, 'AuthorizationRemoved')
        .withArgs(owner.address, user1.address, testAssetKey);

      const role = await accessManagement.getAssetAuthorization(testAssetKey, user1.address);
      expect(role).to.equal('');
    });

    it('Should allow authorized admins to remove authorization', async function () {
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');
      await accessManagement.connect(user1).addAuthorization(testAssetKey, user2.address, 'user');

      await expect(accessManagement.connect(user1).removeAuthorization(testAssetKey, user2.address))
        .to.emit(accessManagement, 'AuthorizationRemoved')
        .withArgs(user1.address, user2.address, testAssetKey);

      const role = await accessManagement.getAssetAuthorization(testAssetKey, user2.address);
      expect(role).to.equal('');
    });

    it('Should reject authorization removal from unauthorized users', async function () {
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');

      await expect(
        accessManagement.connect(user2).removeAuthorization(testAssetKey, user1.address)
      ).to.be.revertedWithCustomError(accessManagement, 'NotOwnerOrAdmin');
    });

    it('Should handle authorization listing', async function () {
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');
      await accessManagement.addAuthorization(testAssetKey, user2.address, 'user');
      await accessManagement.addAuthorization(testAssetKey, user3.address, 'viewer');

      const authCount = await accessManagement.getAssetAuthorizationCount(testAssetKey);
      expect(authCount).to.equal(3);

      const authList = [];
      for (let i = 0; i < authCount; i++) {
        authList.push(await accessManagement.getAssetAuthorizationAtIndex(testAssetKey, i));
      }
      expect(authList).to.have.members([user1.address, user2.address, user3.address]);
    });
  });

  describe('Access Control', function () {
    const testAssetKey = 'access-test-asset';

    beforeEach(async function () {
      await accessManagement.newAsset(testAssetKey, 'Access Test Asset');
      await accessManagement.addAuthorization(testAssetKey, user1.address, 'admin');
    });

    it('Should grant access to asset owner', async function () {
      await expect(accessManagement.getAccess(testAssetKey))
        .to.emit(accessManagement, 'AccessAttempt')
        .withArgs(owner.address, testAssetKey, true);
      expect(await accessManagement.getAccess.staticCall(testAssetKey)).to.be.true;
    });

    it('Should grant access to authorized users', async function () {
      await expect(accessManagement.connect(user1).getAccess(testAssetKey))
        .to.emit(accessManagement, 'AccessAttempt')
        .withArgs(user1.address, testAssetKey, true);
      expect(await accessManagement.connect(user1).getAccess.staticCall(testAssetKey)).to.be.true;
    });

    it('Should deny access to unauthorized users', async function () {
      await expect(accessManagement.connect(user2).getAccess(testAssetKey))
        .to.emit(accessManagement, 'AccessAttempt')
        .withArgs(user2.address, testAssetKey, false);
      expect(await accessManagement.connect(user2).getAccess.staticCall(testAssetKey)).to.be.false;
    });

    it('Should deny access after authorization removal', async function () {
      await accessManagement.removeAuthorization(testAssetKey, user1.address);
      await expect(accessManagement.connect(user1).getAccess(testAssetKey))
        .to.emit(accessManagement, 'AccessAttempt')
        .withArgs(user1.address, testAssetKey, false);
      expect(await accessManagement.connect(user1).getAccess.staticCall(testAssetKey)).to.be.false;
    });

    it('Should handle access for non-existent assets', async function () {
      const nonExistentKey = 'non-existent-asset';
      await expect(accessManagement.getAccess(nonExistentKey))
        .to.emit(accessManagement, 'AccessAttempt')
        .withArgs(owner.address, nonExistentKey, false);
      expect(await accessManagement.getAccess.staticCall(nonExistentKey)).to.be.false;
    });
  });

  describe('Asset Queries', function () {
    const assetKey = 'query-asset';

    beforeEach(async function () {
      await accessManagement.newAsset(assetKey, 'Query Asset');
      await accessManagement.addAuthorization(assetKey, user1.address, 'viewer');
    });

    it('Should return correct data for existing assets', async function () {
      const asset = await accessManagement.getAsset(assetKey);
      expect(asset.assetOwner).to.equal(owner.address);
      expect(asset.assetDescription).to.equal('Query Asset');
      expect(asset.initialized).to.be.true;
      expect(asset.authorizationCount).to.equal(1);
    });

    it('Should return empty data for non-existent assets', async function () {
      const asset = await accessManagement.getAsset('non-existent');
      expect(asset.assetOwner).to.equal(ethers.ZeroAddress);
      expect(asset.assetDescription).to.equal('');
      expect(asset.initialized).to.be.false;
      expect(asset.authorizationCount).to.equal(0);
    });

    it('Should return correct authorization for authorized users', async function () {
      const role = await accessManagement.getAssetAuthorization(assetKey, user1.address);
      expect(role).to.equal('viewer');
    });

    it('Should return empty authorization for non-existent or unauthorized users', async function () {
      const role1 = await accessManagement.getAssetAuthorization(assetKey, user2.address);
      const role2 = await accessManagement.getAssetAuthorization('non-existent', user1.address);
      expect(role1).to.equal('');
      expect(role2).to.equal('');
    });
  });

  describe('Complex Scenarios', function () {
    it('Should handle multiple assets with different owners and authorizations', async function () {
      // Setup asset 1 (owned by user1)
      const asset1Key = 'complex-asset-1';
      await accessManagement.connect(user1).newAsset(asset1Key, 'Asset 1');
      await accessManagement.connect(user1).addAuthorization(asset1Key, user2.address, 'editor');

      // Setup asset 2 (owned by user2)
      const asset2Key = 'complex-asset-2';
      await accessManagement.connect(user2).newAsset(asset2Key, 'Asset 2');
      await accessManagement.connect(user2).addAuthorization(asset2Key, user1.address, 'viewer');

      // Assertions for asset 1
      expect(await accessManagement.connect(user1).getAccess.staticCall(asset1Key)).to.be.true;
      expect(await accessManagement.connect(user2).getAccess.staticCall(asset1Key)).to.be.true;
      expect(await accessManagement.connect(user3).getAccess.staticCall(asset1Key)).to.be.false;

      // Assertions for asset 2
      expect(await accessManagement.connect(user1).getAccess.staticCall(asset2Key)).to.be.true;
      expect(await accessManagement.connect(user2).getAccess.staticCall(asset2Key)).to.be.true;
      expect(await accessManagement.connect(user3).getAccess.staticCall(asset2Key)).to.be.false;
    });

    it('Should handle authorization cascading', async function () {
      const assetKey = 'cascade-asset';
      await accessManagement.newAsset(assetKey, 'Cascade Asset');
      await accessManagement.addAuthorization(assetKey, user1.address, 'admin');
      await accessManagement.connect(user1).addAuthorization(assetKey, user2.address, 'user');

      // user2, being an authorized user, CAN add user3
      await expect(
        accessManagement.connect(user2).addAuthorization(assetKey, user3.address, 'viewer')
      ).to.not.be.reverted;

      // user1 removes user2's access
      await accessManagement.connect(user1).removeAuthorization(assetKey, user2.address);
      expect(await accessManagement.connect(user2).getAccess.staticCall(assetKey)).to.be.false;
    });
  });
});
