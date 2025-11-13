import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = hre;
import TestUtils from './helpers/testUtils.js';

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

      const tx = await assetTrackerOptimized.createAsset(name, description, uuid, manufacturer);
      const event = await TestUtils.expectEvent(tx, assetTrackerOptimized, 'AssetCreated');

      // Verify event arguments
      expect(event.args[0]).to.equal(owner.address);
      expect(event.args[1]).to.equal(uuid);
      expect(event.args[2]).to.equal(name);
      expect(event.args[3]).to.equal(manufacturer);
      expect(typeof event.args[4]).to.equal('bigint'); // timestamp

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

      await TestUtils.expectRevertWithCustomError(
        assetTrackerOptimized.createAsset(name, description, uuid, manufacturer),
        assetTrackerOptimized,
        'AssetAlreadyExists'
      );
    });

    it('Should handle empty strings in creation', async function () {
      const uuid = 'empty-string-uuid';
      await TestUtils.expectRevertWithCustomError(
        assetTrackerOptimized.createAsset('', '', uuid, ''),
        assetTrackerOptimized,
        'EmptyString'
      );
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
      const tx = await assetTrackerOptimized.transferAsset(addr1.address, testAsset.uuid);
      const event = await TestUtils.expectEvent(tx, assetTrackerOptimized, 'AssetTransferred');

      // Verify event arguments
      expect(event.args[0]).to.equal(owner.address);
      expect(event.args[1]).to.equal(addr1.address);
      expect(event.args[2]).to.equal(testAsset.uuid);
      expect(typeof event.args[3]).to.equal('bigint'); // timestamp

      expect(await assetTrackerOptimized.isOwnerOf(owner.address, testAsset.uuid)).to.be.false;
      expect(await assetTrackerOptimized.isOwnerOf(addr1.address, testAsset.uuid)).to.be.true;

      expect(await assetTrackerOptimized.getAssetCount(owner.address)).to.equal(0);
      expect(await assetTrackerOptimized.getAssetCount(addr1.address)).to.equal(1);
    });

    it('Should reject transfer of non-existent asset', async function () {
      const nonExistentUuid = 'non-existent-uuid';
      await TestUtils.expectRevertWithCustomError(
        assetTrackerOptimized.transferAsset(addr1.address, nonExistentUuid),
        assetTrackerOptimized,
        'AssetNotFound'
      );
    });

    it('Should reject transfer by non-owner', async function () {
      await TestUtils.expectRevertWithCustomError(
        assetTrackerOptimized.connect(addr1).transferAsset(addr2.address, testAsset.uuid),
        assetTrackerOptimized,
        'NotAssetOwner'
      );
    });
  });
});
