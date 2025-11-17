const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AccessManagement", function () {
  let accessManagement;
  let owner;
  let admin;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [owner, admin, user1, user2, user3] = await ethers.getSigners();
    const AccessManagement = await ethers.getContractFactory("AccessManagement");
    accessManagement = await AccessManagement.deploy();
  });

  describe("Asset Creation", function () {
    it("Should create a new asset successfully", async function () {
      const assetKey = "ASSET-001";
      const assetDescription = "Test Asset";

      await expect(accessManagement.newAsset(assetKey, assetDescription))
        .to.emit(accessManagement, "AssetCreate")
        .withArgs(owner.address, assetKey, assetDescription);

      const asset = await accessManagement.getAsset(assetKey);
      expect(asset.assetOwner).to.equal(owner.address);
      expect(asset.assetDescription).to.equal(assetDescription);
      expect(asset.initialized).to.equal(true);
      expect(asset.authorizationCount).to.equal(0);
    });

    it("Should reject duplicate asset creation", async function () {
      const assetKey = "ASSET-002";
      const assetDescription = "Test Asset";

      await accessManagement.newAsset(assetKey, assetDescription);

      await expect(accessManagement.newAsset(assetKey, "Different Description"))
        .to.emit(accessManagement, "RejectCreate")
        .withArgs(owner.address, assetKey, "Asset with this Serial already exists.");
    });

    it("Should allow multiple assets with different keys", async function () {
      await accessManagement.newAsset("ASSET-003", "Asset 3");
      await accessManagement.newAsset("ASSET-004", "Asset 4");
      await accessManagement.newAsset("ASSET-005", "Asset 5");

      const count = await accessManagement.getAssetCount();
      expect(count).to.equal(3);
    });

    it("Should reject empty asset key", async function () {
      await expect(
        accessManagement.newAsset("", "Empty Key Asset")
      ).to.be.revertedWith("Asset key cannot be empty");
    });

    it("Should reject empty asset description", async function () {
      const assetKey = "ASSET-006";
      await expect(
        accessManagement.newAsset(assetKey, "")
      ).to.be.revertedWith("Description cannot be empty");
    });
  });

  describe("Asset Retrieval", function () {
    beforeEach(async function () {
      await accessManagement.newAsset("ASSET-100", "Retrieval Test Asset");
    });

    it("Should retrieve existing asset correctly", async function () {
      const asset = await accessManagement.getAsset("ASSET-100");
      expect(asset.assetOwner).to.equal(owner.address);
      expect(asset.assetDescription).to.equal("Retrieval Test Asset");
      expect(asset.initialized).to.equal(true);
    });

    it("Should return empty data for non-existent asset", async function () {
      const asset = await accessManagement.getAsset("NON-EXISTENT");
      expect(asset.assetOwner).to.equal(ethers.ZeroAddress);
      expect(asset.assetDescription).to.equal("");
      expect(asset.initialized).to.equal(false);
      expect(asset.authorizationCount).to.equal(0);
    });

    it("Should get asset count correctly", async function () {
      await accessManagement.newAsset("ASSET-101", "Asset 101");
      await accessManagement.newAsset("ASSET-102", "Asset 102");

      const count = await accessManagement.getAssetCount();
      expect(count).to.equal(3);
    });

    it("Should get asset at index correctly", async function () {
      const assetKey = await accessManagement.getAssetAtIndex(0);
      expect(assetKey).to.equal("ASSET-100");
    });
  });

  describe("Authorization Management", function () {
    const assetKey = "ASSET-200";

    beforeEach(async function () {
      await accessManagement.newAsset(assetKey, "Authorization Test Asset");
    });

    it("Should allow owner to add authorization", async function () {
      await expect(accessManagement.addAuthorization(assetKey, user1.address, "admin"))
        .to.emit(accessManagement, "AuthorizationCreate")
        .withArgs(user1.address, assetKey, "admin");

      const role = await accessManagement.getAssetAuthorization(assetKey, user1.address);
      expect(role).to.equal("admin");
    });

    it("Should allow admin to add authorization", async function () {
      await accessManagement.addAuthorization(assetKey, admin.address, "admin");

      await expect(accessManagement.connect(admin).addAuthorization(assetKey, user1.address, "permanent"))
        .to.emit(accessManagement, "AuthorizationCreate")
        .withArgs(user1.address, assetKey, "permanent");
    });

    it("Should reject non-owner/non-admin from adding authorization", async function () {
      await expect(
        accessManagement.connect(user1).addAuthorization(assetKey, user2.address, "admin")
      ).to.be.revertedWith("Only the owner or admins can add authorizations.");
    });

    it("Should allow owner to remove authorization", async function () {
      await accessManagement.addAuthorization(assetKey, user1.address, "admin");

      await expect(accessManagement.removeAuthorization(assetKey, user1.address))
        .to.emit(accessManagement, "AuthorizationRemove")
        .withArgs(user1.address, assetKey);

      const role = await accessManagement.getAssetAuthorization(assetKey, user1.address);
      expect(role).to.equal("");
    });

    it("Should allow admin to remove authorization", async function () {
      await accessManagement.addAuthorization(assetKey, admin.address, "admin");
      await accessManagement.addAuthorization(assetKey, user1.address, "permanent");

      await expect(accessManagement.connect(admin).removeAuthorization(assetKey, user1.address))
        .to.emit(accessManagement, "AuthorizationRemove")
        .withArgs(user1.address, assetKey);
    });

    it("Should reject non-owner/non-admin from removing authorization", async function () {
      await accessManagement.addAuthorization(assetKey, user1.address, "permanent");

      await expect(
        accessManagement.connect(user2).removeAuthorization(assetKey, user1.address)
      ).to.be.revertedWith("Only the owner or admins can remove authorizations.");
    });

    it("Should handle multiple authorization roles", async function () {
      await accessManagement.addAuthorization(assetKey, user1.address, "admin");
      await accessManagement.addAuthorization(assetKey, user2.address, "permanent");
      await accessManagement.addAuthorization(assetKey, user3.address, "temporary");

      expect(await accessManagement.getAssetAuthorization(assetKey, user1.address)).to.equal("admin");
      expect(await accessManagement.getAssetAuthorization(assetKey, user2.address)).to.equal("permanent");
      expect(await accessManagement.getAssetAuthorization(assetKey, user3.address)).to.equal("temporary");
    });

    it("Should get authorization count correctly", async function () {
      await accessManagement.addAuthorization(assetKey, user1.address, "admin");
      await accessManagement.addAuthorization(assetKey, user2.address, "permanent");

      const count = await accessManagement.getAssetAuthorizationCount(assetKey);
      expect(count).to.equal(2);
    });

    it("Should get authorization at index correctly", async function () {
      await accessManagement.addAuthorization(assetKey, user1.address, "admin");
      await accessManagement.addAuthorization(assetKey, user2.address, "permanent");

      const auth0 = await accessManagement.getAssetAuthorizationAtIndex(assetKey, 0);
      const auth1 = await accessManagement.getAssetAuthorizationAtIndex(assetKey, 1);

      expect(auth0).to.equal(user1.address);
      expect(auth1).to.equal(user2.address);
    });

    it("Should allow re-authorization after removal", async function () {
      await accessManagement.addAuthorization(assetKey, user1.address, "admin");
      await accessManagement.removeAuthorization(assetKey, user1.address);
      await accessManagement.addAuthorization(assetKey, user1.address, "permanent");

      const role = await accessManagement.getAssetAuthorization(assetKey, user1.address);
      expect(role).to.equal("permanent");
    });
  });

  describe("Access Control", function () {
    const assetKey = "ASSET-300";

    beforeEach(async function () {
      await accessManagement.newAsset(assetKey, "Access Control Test Asset");
    });

    it("Should grant access to owner", async function () {
      await expect(accessManagement.getAccess(assetKey))
        .to.emit(accessManagement, "AccessLog")
        .withArgs(owner.address, assetKey, true);
    });

    it("Should grant access to authorized user", async function () {
      await accessManagement.addAuthorization(assetKey, user1.address, "permanent");

      await expect(accessManagement.connect(user1).getAccess(assetKey))
        .to.emit(accessManagement, "AccessLog")
        .withArgs(user1.address, assetKey, true);
    });

    it("Should deny access to unauthorized user", async function () {
      await expect(accessManagement.connect(user1).getAccess(assetKey))
        .to.emit(accessManagement, "AccessLog")
        .withArgs(user1.address, assetKey, false);
    });

    it("Should deny access after authorization removal", async function () {
      await accessManagement.addAuthorization(assetKey, user1.address, "permanent");
      await accessManagement.removeAuthorization(assetKey, user1.address);

      await expect(accessManagement.connect(user1).getAccess(assetKey))
        .to.emit(accessManagement, "AccessLog")
        .withArgs(user1.address, assetKey, false);
    });

    it("Should grant access to admin", async function () {
      await accessManagement.addAuthorization(assetKey, admin.address, "admin");

      await expect(accessManagement.connect(admin).getAccess(assetKey))
        .to.emit(accessManagement, "AccessLog")
        .withArgs(admin.address, assetKey, true);
    });

    it("Should deny access for non-existent asset", async function () {
      await expect(accessManagement.connect(user1).getAccess("NON-EXISTENT"))
        .to.emit(accessManagement, "AccessLog")
        .withArgs(user1.address, "NON-EXISTENT", false);
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle long asset keys", async function () {
      const longKey = "A".repeat(100);
      await accessManagement.newAsset(longKey, "Long Key Asset");
      const asset = await accessManagement.getAsset(longKey);
      expect(asset.initialized).to.equal(true);
    });

    it("Should handle long descriptions", async function () {
      const longDesc = "Description ".repeat(50);
      await accessManagement.newAsset("ASSET-400", longDesc);
      const asset = await accessManagement.getAsset("ASSET-400");
      expect(asset.assetDescription).to.equal(longDesc);
    });

    it("Should handle special characters in asset key", async function () {
      const specialKey = "ASSET-!@#$%^&*()_+-=[]{}|;:',.<>?";
      await accessManagement.newAsset(specialKey, "Special Chars");
      const asset = await accessManagement.getAsset(specialKey);
      expect(asset.initialized).to.equal(true);
    });

    it("Should handle multiple assets from different owners", async function () {
      await accessManagement.connect(owner).newAsset("OWNER-ASSET", "Owner's Asset");
      await accessManagement.connect(user1).newAsset("USER1-ASSET", "User1's Asset");
      await accessManagement.connect(user2).newAsset("USER2-ASSET", "User2's Asset");

      const asset1 = await accessManagement.getAsset("OWNER-ASSET");
      const asset2 = await accessManagement.getAsset("USER1-ASSET");
      const asset3 = await accessManagement.getAsset("USER2-ASSET");

      expect(asset1.assetOwner).to.equal(owner.address);
      expect(asset2.assetOwner).to.equal(user1.address);
      expect(asset3.assetOwner).to.equal(user2.address);
    });

    it("Should maintain separate authorization lists per asset", async function () {
      await accessManagement.newAsset("ASSET-500", "Asset 500");
      await accessManagement.newAsset("ASSET-501", "Asset 501");

      await accessManagement.addAuthorization("ASSET-500", user1.address, "admin");
      await accessManagement.addAuthorization("ASSET-501", user2.address, "admin");

      const role1 = await accessManagement.getAssetAuthorization("ASSET-500", user1.address);
      const role2 = await accessManagement.getAssetAuthorization("ASSET-501", user2.address);
      const role3 = await accessManagement.getAssetAuthorization("ASSET-500", user2.address);

      expect(role1).to.equal("admin");
      expect(role2).to.equal("admin");
      expect(role3).to.equal("");
    });
  });

  describe("Complete Workflow", function () {
    it("Should support a complete asset lifecycle", async function () {
      const assetKey = "WORKFLOW-ASSET";

      // Create asset
      await accessManagement.newAsset(assetKey, "Workflow Asset");

      // Owner grants admin access to admin
      await accessManagement.addAuthorization(assetKey, admin.address, "admin");

      // Admin grants access to user1
      await accessManagement.connect(admin).addAuthorization(assetKey, user1.address, "permanent");

      // Admin grants access to user2
      await accessManagement.connect(admin).addAuthorization(assetKey, user2.address, "temporary");

      // Verify all can access (using staticCall to get return value without executing)
      const ownerAccess = await accessManagement.getAccess.staticCall(assetKey);
      const adminAccess = await accessManagement.connect(admin).getAccess.staticCall(assetKey);
      const user1Access = await accessManagement.connect(user1).getAccess.staticCall(assetKey);
      const user2Access = await accessManagement.connect(user2).getAccess.staticCall(assetKey);

      expect(ownerAccess).to.equal(true);
      expect(adminAccess).to.equal(true);
      expect(user1Access).to.equal(true);
      expect(user2Access).to.equal(true);

      // Admin removes user2
      await accessManagement.connect(admin).removeAuthorization(assetKey, user2.address);

      // Verify user2 no longer has access
      const user2AccessAfter = await accessManagement.connect(user2).getAccess.staticCall(assetKey);
      expect(user2AccessAfter).to.equal(false);

      // Owner can still remove admin
      await accessManagement.removeAuthorization(assetKey, admin.address);
      const adminAccessAfter = await accessManagement.connect(admin).getAccess.staticCall(assetKey);
      expect(adminAccessAfter).to.equal(false);
    });
  });
});
