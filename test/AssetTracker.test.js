import { expect } from 'chai';
import hre from 'hardhat';
import TestUtils from './helpers/testUtils.js';

describe('AssetTracker', function () {
  let assetTracker;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Connect to network and get ethers
    const { ethers } = await hre.network.connect();

    // Get the ContractFactory and Signers here.
    const AssetTracker = await ethers.getContractFactory('AssetTracker');
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy a new AssetTracker contract for each test
    assetTracker = await AssetTracker.deploy();
    await assetTracker.waitForDeployment();
  });

  describe('Asset Creation', function () {
    it('Should create a new asset successfully', async function () {
      const name = 'Test Asset';
      const description = 'A test asset for unit testing';
      const uuid = 'test-uuid-123';
      const manufacturer = 'Test Manufacturer';

      const tx = await assetTracker.createAsset(name, description, uuid, manufacturer);
      await TestUtils.expectEvent(tx, assetTracker, 'AssetCreate', [
        owner.address,
        uuid,
        manufacturer,
      ]);

      // Verify asset was created correctly
      const asset = await assetTracker.getAssetByUUID(uuid);
      expect(asset[0]).to.equal(name);
      expect(asset[1]).to.equal(description);
      expect(asset[2]).to.equal(manufacturer);

      // Verify ownership
      expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.be.true;
    });

    it('Should reject creation of duplicate assets', async function () {
      const name = 'Test Asset';
      const description = 'A test asset for unit testing';
      const uuid = 'duplicate-uuid';
      const manufacturer = 'Test Manufacturer';

      // Create first asset
      await assetTracker.createAsset(name, description, uuid, manufacturer);

      // Try to create duplicate - should revert with custom error
      await TestUtils.expectRevertWithCustomError(
        assetTracker.createAsset(name, description, uuid, manufacturer),
        assetTracker,
        'AssetExists',
        [uuid]
      );
    });

    it('Should allow multiple different assets', async function () {
      const asset1 = {
        name: 'Asset 1',
        description: 'First asset',
        uuid: 'uuid-1',
        manufacturer: 'Manufacturer 1',
      };

      const asset2 = {
        name: 'Asset 2',
        description: 'Second asset',
        uuid: 'uuid-2',
        manufacturer: 'Manufacturer 2',
      };

      await assetTracker.createAsset(
        asset1.name,
        asset1.description,
        asset1.uuid,
        asset1.manufacturer
      );
      await assetTracker.createAsset(
        asset2.name,
        asset2.description,
        asset2.uuid,
        asset2.manufacturer
      );

      // Verify both assets exist
      expect(await assetTracker.isOwnerOf(owner.address, asset1.uuid)).to.be.true;
      expect(await assetTracker.isOwnerOf(owner.address, asset2.uuid)).to.be.true;
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
      // Create an asset before each transfer test
      await assetTracker.createAsset(
        testAsset.name,
        testAsset.description,
        testAsset.uuid,
        testAsset.manufacturer
      );
    });

    it('Should transfer asset successfully', async function () {
      const tx = await assetTracker.transferAsset(addr1.address, testAsset.uuid);
      await TestUtils.expectEvent(tx, assetTracker, 'AssetTransfer', [
        owner.address,
        addr1.address,
        testAsset.uuid,
      ]);

      // Verify ownership changed
      expect(await assetTracker.isOwnerOf(owner.address, testAsset.uuid)).to.be.false;
      expect(await assetTracker.isOwnerOf(addr1.address, testAsset.uuid)).to.be.true;
    });

    it('Should reject transfer of non-existent asset', async function () {
      const nonExistentUuid = 'non-existent-uuid';

      await TestUtils.expectRevertWithCustomError(
        assetTracker.transferAsset(addr1.address, nonExistentUuid),
        assetTracker,
        'AssetNotFound',
        [nonExistentUuid]
      );
    });

    it('Should reject transfer by non-owner', async function () {
      // Try to transfer from addr1 (who doesn't own the asset)
      await TestUtils.expectRevertWithCustomError(
        assetTracker.connect(addr1).transferAsset(addr2.address, testAsset.uuid),
        assetTracker,
        'NotAssetOwner',
        [addr1.address, testAsset.uuid]
      );
    });

    it('Should reject transfer to zero address', async function () {
      await TestUtils.expectRevertWithCustomError(
        assetTracker.transferAsset(hre.ethers.ZeroAddress, testAsset.uuid),
        assetTracker,
        'InvalidAddress',
        [hre.ethers.ZeroAddress]
      );
    });

    it('Should allow chained transfers', async function () {
      // Transfer from owner to addr1
      await assetTracker.transferAsset(addr1.address, testAsset.uuid);

      // Transfer from addr1 to addr2
      await assetTracker.connect(addr1).transferAsset(addr2.address, testAsset.uuid);

      // Verify final ownership
      expect(await assetTracker.isOwnerOf(owner.address, testAsset.uuid)).to.be.false;
      expect(await assetTracker.isOwnerOf(addr1.address, testAsset.uuid)).to.be.false;
      expect(await assetTracker.isOwnerOf(addr2.address, testAsset.uuid)).to.be.true;
    });
  });

  describe('Asset Queries', function () {
    it('Should return empty data for non-existent asset', async function () {
      const nonExistentUuid = 'non-existent';
      const asset = await assetTracker.getAssetByUUID(nonExistentUuid);

      expect(asset[0]).to.equal(''); // name
      expect(asset[1]).to.equal(''); // description
      expect(asset[2]).to.equal(''); // manufacturer
    });

    it('Should reject ownership checks for zero address', async function () {
      await TestUtils.expectRevertWithCustomError(
        assetTracker.isOwnerOf(hre.ethers.ZeroAddress, 'some-uuid'),
        assetTracker,
        'InvalidAddress',
        [hre.ethers.ZeroAddress]
      );
    });

    it('Should return false for non-ownership queries', async function () {
      const uuid = 'test-ownership';

      // Before creating asset
      expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.be.false;
      expect(await assetTracker.isOwnerOf(addr1.address, uuid)).to.be.false;

      // Create asset
      await assetTracker.createAsset('Test', 'Test', uuid, 'Test');

      // After creating asset
      expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.be.true;
      expect(await assetTracker.isOwnerOf(addr1.address, uuid)).to.be.false;
    });
  });
});
