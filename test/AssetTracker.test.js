import { expect } from "chai";
import hre from "hardhat";

describe("AssetTracker", function () {
  let assetTracker;
  let owner;
  let user1;
  let user2;
  let user3;
  let ethers;

  before(async function () {
    const network = await hre.network.connect();
    ethers = network.ethers;
  });

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    const AssetTracker = await ethers.getContractFactory("AssetTracker");
    assetTracker = await AssetTracker.deploy();
  });

  describe("Asset Creation", function () {
    it("Should create a new asset successfully", async function () {
      const name = "Laptop";
      const description = "Dell XPS 15";
      const uuid = "UUID-001";
      const manufacturer = "Dell Inc.";

      await expect(assetTracker.createAsset(name, description, uuid, manufacturer))
        .to.emit(assetTracker, "AssetCreate")
        .withArgs(owner.address, uuid, manufacturer);

      const asset = await assetTracker.getAssetByUUID(uuid);
      expect(asset[0]).to.equal(name);
      expect(asset[1]).to.equal(description);
      expect(asset[2]).to.equal(manufacturer);

      const isOwner = await assetTracker.isOwnerOf(owner.address, uuid);
      expect(isOwner).to.equal(true);
    });

    it("Should reject duplicate asset creation", async function () {
      const uuid = "UUID-002";

      await assetTracker.createAsset("Asset 1", "Description 1", uuid, "Manufacturer 1");

      await expect(assetTracker.createAsset("Asset 2", "Description 2", uuid, "Manufacturer 2"))
        .to.emit(assetTracker, "RejectCreate")
        .withArgs(owner.address, uuid, "Asset with this UUID already exists.");
    });

    it("Should allow multiple assets with different UUIDs", async function () {
      await assetTracker.createAsset("Asset 1", "Desc 1", "UUID-003", "Man 1");
      await assetTracker.createAsset("Asset 2", "Desc 2", "UUID-004", "Man 2");
      await assetTracker.createAsset("Asset 3", "Desc 3", "UUID-005", "Man 3");

      const asset1 = await assetTracker.getAssetByUUID("UUID-003");
      const asset2 = await assetTracker.getAssetByUUID("UUID-004");
      const asset3 = await assetTracker.getAssetByUUID("UUID-005");

      expect(asset1[0]).to.equal("Asset 1");
      expect(asset2[0]).to.equal("Asset 2");
      expect(asset3[0]).to.equal("Asset 3");
    });

    it("Should reject empty fields", async function () {
      const uuid = "UUID-006";

      // Test empty name
      await expect(
        assetTracker.createAsset("", "Description", uuid, "Manufacturer")
      ).to.be.revertedWith("Name cannot be empty");

      // Test empty description
      await expect(
        assetTracker.createAsset("Name", "", uuid, "Manufacturer")
      ).to.be.revertedWith("Description cannot be empty");

      // Test empty UUID
      await expect(
        assetTracker.createAsset("Name", "Description", "", "Manufacturer")
      ).to.be.revertedWith("UUID cannot be empty");

      // Test empty manufacturer
      await expect(
        assetTracker.createAsset("Name", "Description", uuid, "")
      ).to.be.revertedWith("Manufacturer cannot be empty");
    });

    it("Should handle special characters in fields", async function () {
      const uuid = "UUID-!@#$%";
      const name = "Asset with special chars: !@#$%^&*()";
      await assetTracker.createAsset(name, "Description", uuid, "Manufacturer");

      const asset = await assetTracker.getAssetByUUID(uuid);
      expect(asset[0]).to.equal(name);
    });

    it("Should allow different users to create assets", async function () {
      await assetTracker.connect(owner).createAsset("Owner Asset", "Desc", "UUID-007", "Man");
      await assetTracker.connect(user1).createAsset("User1 Asset", "Desc", "UUID-008", "Man");
      await assetTracker.connect(user2).createAsset("User2 Asset", "Desc", "UUID-009", "Man");

      expect(await assetTracker.isOwnerOf(owner.address, "UUID-007")).to.equal(true);
      expect(await assetTracker.isOwnerOf(user1.address, "UUID-008")).to.equal(true);
      expect(await assetTracker.isOwnerOf(user2.address, "UUID-009")).to.equal(true);
    });
  });

  describe("Asset Transfer", function () {
    const uuid = "UUID-100";

    beforeEach(async function () {
      await assetTracker.connect(owner).createAsset("Transfer Test Asset", "Description", uuid, "Manufacturer");
    });

    it("Should transfer asset successfully", async function () {
      await expect(assetTracker.connect(owner).transferAsset(user1.address, uuid))
        .to.emit(assetTracker, "AssetTransfer")
        .withArgs(owner.address, user1.address, uuid);

      expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.equal(false);
      expect(await assetTracker.isOwnerOf(user1.address, uuid)).to.equal(true);
    });

    it("Should reject transfer of non-existent asset", async function () {
      const nonExistentUUID = "NON-EXISTENT";

      await expect(assetTracker.connect(owner).transferAsset(user1.address, nonExistentUUID))
        .to.emit(assetTracker, "RejectTransfer")
        .withArgs(owner.address, user1.address, nonExistentUUID, "No asset with this UUID exists");
    });

    it("Should reject transfer by non-owner", async function () {
      await expect(assetTracker.connect(user1).transferAsset(user2.address, uuid))
        .to.emit(assetTracker, "RejectTransfer")
        .withArgs(user1.address, user2.address, uuid, "Sender does not own this asset.");
    });

    it("Should allow subsequent transfers", async function () {
      await assetTracker.connect(owner).transferAsset(user1.address, uuid);
      await assetTracker.connect(user1).transferAsset(user2.address, uuid);
      await assetTracker.connect(user2).transferAsset(user3.address, uuid);

      expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.equal(false);
      expect(await assetTracker.isOwnerOf(user1.address, uuid)).to.equal(false);
      expect(await assetTracker.isOwnerOf(user2.address, uuid)).to.equal(false);
      expect(await assetTracker.isOwnerOf(user3.address, uuid)).to.equal(true);
    });

    it("Should reject transfer back to original owner without ownership", async function () {
      await assetTracker.connect(owner).transferAsset(user1.address, uuid);

      await expect(assetTracker.connect(owner).transferAsset(user2.address, uuid))
        .to.emit(assetTracker, "RejectTransfer")
        .withArgs(owner.address, user2.address, uuid, "Sender does not own this asset.");
    });

    it("Should allow transfer to self", async function () {
      await expect(assetTracker.connect(owner).transferAsset(owner.address, uuid))
        .to.emit(assetTracker, "AssetTransfer")
        .withArgs(owner.address, owner.address, uuid);

      expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.equal(true);
    });

    it("Should maintain asset data after transfer", async function () {
      const assetBefore = await assetTracker.getAssetByUUID(uuid);

      await assetTracker.connect(owner).transferAsset(user1.address, uuid);

      const assetAfter = await assetTracker.getAssetByUUID(uuid);

      expect(assetAfter[0]).to.equal(assetBefore[0]);
      expect(assetAfter[1]).to.equal(assetBefore[1]);
      expect(assetAfter[2]).to.equal(assetBefore[2]);
    });
  });

  describe("Asset Retrieval", function () {
    it("Should retrieve asset information correctly", async function () {
      const name = "Smartphone";
      const description = "iPhone 14 Pro";
      const uuid = "UUID-200";
      const manufacturer = "Apple Inc.";

      await assetTracker.createAsset(name, description, uuid, manufacturer);

      const asset = await assetTracker.getAssetByUUID(uuid);
      expect(asset[0]).to.equal(name);
      expect(asset[1]).to.equal(description);
      expect(asset[2]).to.equal(manufacturer);
    });

    it("Should return empty data for non-existent asset", async function () {
      const asset = await assetTracker.getAssetByUUID("NON-EXISTENT");
      expect(asset[0]).to.equal("");
      expect(asset[1]).to.equal("");
      expect(asset[2]).to.equal("");
    });

    it("Should retrieve data after multiple transfers", async function () {
      const name = "Tablet";
      const description = "iPad Pro";
      const uuid = "UUID-201";
      const manufacturer = "Apple Inc.";

      await assetTracker.createAsset(name, description, uuid, manufacturer);
      await assetTracker.transferAsset(user1.address, uuid);
      await assetTracker.connect(user1).transferAsset(user2.address, uuid);

      const asset = await assetTracker.getAssetByUUID(uuid);
      expect(asset[0]).to.equal(name);
      expect(asset[1]).to.equal(description);
      expect(asset[2]).to.equal(manufacturer);
    });
  });

  describe("Ownership Verification", function () {
    const uuid = "UUID-300";

    beforeEach(async function () {
      await assetTracker.connect(owner).createAsset("Ownership Test", "Description", uuid, "Manufacturer");
    });

    it("Should correctly identify asset owner", async function () {
      expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.equal(true);
      expect(await assetTracker.isOwnerOf(user1.address, uuid)).to.equal(false);
    });

    it("Should update ownership after transfer", async function () {
      await assetTracker.transferAsset(user1.address, uuid);

      expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.equal(false);
      expect(await assetTracker.isOwnerOf(user1.address, uuid)).to.equal(true);
    });

    it("Should return false for non-existent asset", async function () {
      expect(await assetTracker.isOwnerOf(owner.address, "NON-EXISTENT")).to.equal(false);
    });

    it("Should handle multiple assets per owner", async function () {
      await assetTracker.createAsset("Asset 2", "Desc", "UUID-301", "Man");
      await assetTracker.createAsset("Asset 3", "Desc", "UUID-302", "Man");

      expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.equal(true);
      expect(await assetTracker.isOwnerOf(owner.address, "UUID-301")).to.equal(true);
      expect(await assetTracker.isOwnerOf(owner.address, "UUID-302")).to.equal(true);
    });
  });

  describe("Complete Workflow", function () {
    it("Should support a complete asset lifecycle", async function () {
      const uuid = "WORKFLOW-UUID";

      // Create asset
      await assetTracker.connect(owner).createAsset("Workflow Asset", "Test Description", uuid, "Test Manufacturer");

      // Verify creation
      expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.equal(true);
      const asset1 = await assetTracker.getAssetByUUID(uuid);
      expect(asset1[0]).to.equal("Workflow Asset");

      // Transfer to user1
      await assetTracker.connect(owner).transferAsset(user1.address, uuid);
      expect(await assetTracker.isOwnerOf(user1.address, uuid)).to.equal(true);

      // Transfer to user2
      await assetTracker.connect(user1).transferAsset(user2.address, uuid);
      expect(await assetTracker.isOwnerOf(user2.address, uuid)).to.equal(true);

      // Transfer back to owner
      await assetTracker.connect(user2).transferAsset(owner.address, uuid);
      expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.equal(true);

      // Verify asset data unchanged
      const asset2 = await assetTracker.getAssetByUUID(uuid);
      expect(asset2[0]).to.equal("Workflow Asset");
      expect(asset2[1]).to.equal("Test Description");
      expect(asset2[2]).to.equal("Test Manufacturer");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very long strings", async function () {
      const longString = "A".repeat(1000);
      const uuid = "UUID-400";

      await assetTracker.createAsset(longString, longString, uuid, longString);

      const asset = await assetTracker.getAssetByUUID(uuid);
      expect(asset[0]).to.equal(longString);
      expect(asset[1]).to.equal(longString);
      expect(asset[2]).to.equal(longString);
    });

    it("Should handle unicode characters", async function () {
      const uuid = "UUID-401";
      const name = "资产 🚀 Активы";

      await assetTracker.createAsset(name, "Description", uuid, "Manufacturer");

      const asset = await assetTracker.getAssetByUUID(uuid);
      expect(asset[0]).to.equal(name);
    });

    it("Should maintain separate ownership for multiple assets", async function () {
      await assetTracker.connect(owner).createAsset("Asset 1", "Desc", "UUID-500", "Man");
      await assetTracker.connect(user1).createAsset("Asset 2", "Desc", "UUID-501", "Man");

      await assetTracker.connect(owner).transferAsset(user2.address, "UUID-500");

      expect(await assetTracker.isOwnerOf(user2.address, "UUID-500")).to.equal(true);
      expect(await assetTracker.isOwnerOf(user1.address, "UUID-501")).to.equal(true);
      expect(await assetTracker.isOwnerOf(owner.address, "UUID-500")).to.equal(false);
      expect(await assetTracker.isOwnerOf(owner.address, "UUID-501")).to.equal(false);
    });
  });
});
