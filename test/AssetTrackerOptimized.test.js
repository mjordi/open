const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AssetTrackerOptimized', function () {
  let assetTrackerOptimized;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    const AssetTrackerOptimized = await ethers.getContractFactory('AssetTrackerOptimized');
    [owner, addr1, addr2] = await ethers.getSigners();
    assetTrackerOptimized = await AssetTrackerOptimized.deploy();
    await assetTrackerOptimized.waitForDeployment();
  });

  describe('Asset Creation', function () {
    it('Should create a new asset successfully', async function () {
      const name = 'Test Asset';
      const description = 'A test asset for unit testing';
      const uuid = 'test-uuid-123';
      const manufacturer = 'Test Manufacturer';

      await expect(assetTrackerOptimized.createAsset(name, description, uuid, manufacturer))
        .to.emit(assetTrackerOptimized, 'AssetCreated')
        .withArgs(owner.address, uuid, name, manufacturer, (value) => {
          expect(typeof value).to.equal('bigint');
          return true;
        });

      const asset = await assetTrackerOptimized.getAsset(uuid);
      expect(asset.owner).to.equal(owner.address);
      expect(asset.name).to.equal(name);
      expect(asset.description).to.equal(description);
      expect(asset.manufacturer).to.equal(manufacturer);

      expect(await assetTrackerOptimized.isOwnerOf(owner.address, uuid)).to.be.true;

      expect(await assetTrackerOptimized.getAssetCount(owner.address)).to.equal(1);
    });

    it('Should reject creation of duplicate assets', async function () {
      const name = 'Test Asset';
      const description = 'A test asset for unit testing';
      const uuid = 'duplicate-uuid';
      const manufacturer = 'Test Manufacturer';

      await assetTrackerOptimized.createAsset(name, description, uuid, manufacturer);

      await expect(
        assetTrackerOptimized.createAsset(name, description, uuid, manufacturer)
      ).to.be.revertedWithCustomError(assetTrackerOptimized, 'AssetAlreadyExists');
    });

    it('Should handle empty strings in creation', async function () {
      const uuid = 'empty-string-uuid';
      await expect(
        assetTrackerOptimized.createAsset('', '', uuid, '')
      ).to.be.revertedWithCustomError(assetTrackerOptimized, 'EmptyString');
    });
  });

  describe('Asset Transfer', function () {
    const testAsset = {
      name: 'Transfer Test Asset',
      description: 'Asset for testing transfers',
      uuid: 'transfer-uuid',
      manufacturer: 'Transfer Manufacturer',
    };

    beforeEach(async function () {
      await assetTrackerOptimized.createAsset(
        testAsset.name,
        testAsset.description,
        testAsset.uuid,
        testAsset.manufacturer
      );
    });

    it('Should transfer asset successfully', async function () {
      await expect(assetTrackerOptimized.transferAsset(addr1.address, testAsset.uuid))
        .to.emit(assetTrackerOptimized, 'AssetTransferred')
        .withArgs(owner.address, addr1.address, testAsset.uuid, (value) => {
          expect(typeof value).to.equal('bigint');
          return true;
        });

      expect(await assetTrackerOptimized.isOwnerOf(owner.address, testAsset.uuid)).to.be.false;
      expect(await assetTrackerOptimized.isOwnerOf(addr1.address, testAsset.uuid)).to.be.true;

      expect(await assetTrackerOptimized.getAssetCount(owner.address)).to.equal(0);
      expect(await assetTrackerOptimized.getAssetCount(addr1.address)).to.equal(1);
    });

    it('Should reject transfer of non-existent asset', async function () {
      const nonExistentUuid = 'non-existent-uuid';
      await expect(
        assetTrackerOptimized.transferAsset(addr1.address, nonExistentUuid)
      ).to.be.revertedWithCustomError(assetTrackerOptimized, 'AssetNotFound');
    });

    it('Should reject transfer by non-owner', async function () {
      await expect(
        assetTrackerOptimized.connect(addr1).transferAsset(addr2.address, testAsset.uuid)
      ).to.be.revertedWithCustomError(assetTrackerOptimized, 'NotAssetOwner');
    });
  });
});
