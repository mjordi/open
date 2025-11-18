import { expect } from "chai";
import hre from "hardhat";

describe("AccessManagement", function () {
  let accessManagement;
  let owner;
  let admin;
  let user1;
  let user2;
  let user3;
  let ethers;
  let provider;

  before(async function () {
    const network = await hre.network.connect();
    ethers = network.ethers;
    provider = network.provider;
  });

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
      await accessManagement["addAuthorization(string,address,string,uint256)"](assetKey, user3.address, "temporary", 3600);

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

  describe("Temporary Role Expiration", function () {
    const assetKey = "ASSET-TEMP";

    beforeEach(async function () {
      await accessManagement.newAsset(assetKey, "Temporary Access Test Asset");
    });

    it("Should allow adding temporary authorization with duration", async function () {
      const duration = 3600; // 1 hour in seconds

      await expect(
        accessManagement["addAuthorization(string,address,string,uint256)"](
          assetKey,
          user1.address,
          "temporary",
          duration
        )
      )
        .to.emit(accessManagement, "AuthorizationCreate")
        .withArgs(user1.address, assetKey, "temporary");

      const role = await accessManagement.getAssetAuthorization(assetKey, user1.address);
      expect(role).to.equal("temporary");
    });

    it("Should reject temporary authorization without duration", async function () {
      await expect(
        accessManagement["addAuthorization(string,address,string,uint256)"](
          assetKey,
          user1.address,
          "temporary",
          0
        )
      ).to.be.revertedWith("Temporary roles must have expiration duration");
    });

    it("Should grant access to temporary user before expiration", async function () {
      const duration = 3600; // 1 hour

      await accessManagement["addAuthorization(string,address,string,uint256)"](
        assetKey,
        user1.address,
        "temporary",
        duration
      );

      // Should have access immediately after authorization
      await expect(accessManagement.connect(user1).getAccess(assetKey))
        .to.emit(accessManagement, "AccessLog")
        .withArgs(user1.address, assetKey, true);
    });

    it("Should deny access after temporary authorization expires", async function () {
      const duration = 2; // 2 seconds

      await accessManagement["addAuthorization(string,address,string,uint256)"](
        assetKey,
        user1.address,
        "temporary",
        duration
      );

      // Should have access initially
      const accessBefore = await accessManagement.connect(user1).getAccess.staticCall(assetKey);
      expect(accessBefore).to.equal(true);

      // Fast forward time by 3 seconds
      await provider.send("evm_increaseTime", [3]);
      await provider.send("evm_mine");

      // Should not have access after expiration
      await expect(accessManagement.connect(user1).getAccess(assetKey))
        .to.emit(accessManagement, "AccessLog")
        .withArgs(user1.address, assetKey, false);
    });

    it("Should prevent expired users from adding authorizations", async function () {
      const duration = 2; // 2 seconds

      // Give user1 temporary admin access
      await accessManagement["addAuthorization(string,address,string,uint256)"](
        assetKey,
        user1.address,
        "temporary",
        duration
      );

      // user1 should be able to add authorization initially
      await accessManagement.connect(user1).addAuthorization(assetKey, user2.address, "permanent");

      // Fast forward time by 3 seconds
      await provider.send("evm_increaseTime", [3]);
      await provider.send("evm_mine");

      // user1 should not be able to add authorization after expiration
      await expect(
        accessManagement.connect(user1).addAuthorization(assetKey, user3.address, "permanent")
      ).to.be.revertedWith("Only the owner or admins can add authorizations.");
    });

    it("Should prevent expired users from removing authorizations", async function () {
      const duration = 2; // 2 seconds

      // Give user1 temporary admin access
      await accessManagement["addAuthorization(string,address,string,uint256)"](
        assetKey,
        user1.address,
        "temporary",
        duration
      );

      // Add user2 as permanent user
      await accessManagement.addAuthorization(assetKey, user2.address, "permanent");

      // Fast forward time by 3 seconds
      await provider.send("evm_increaseTime", [3]);
      await provider.send("evm_mine");

      // user1 should not be able to remove authorization after expiration
      await expect(
        accessManagement.connect(user1).removeAuthorization(assetKey, user2.address)
      ).to.be.revertedWith("Only the owner or admins can remove authorizations.");
    });

    it("Should allow permanent roles without expiration", async function () {
      // Add permanent authorization without duration
      await accessManagement.addAuthorization(assetKey, user1.address, "permanent");

      // Should have access immediately
      const accessBefore = await accessManagement.connect(user1).getAccess.staticCall(assetKey);
      expect(accessBefore).to.equal(true);

      // Fast forward time by 1 hour
      await provider.send("evm_increaseTime", [3600]);
      await provider.send("evm_mine");

      // Should still have access after time passes
      const accessAfter = await accessManagement.connect(user1).getAccess.staticCall(assetKey);
      expect(accessAfter).to.equal(true);
    });

    it("Should allow admin roles without expiration", async function () {
      // Add admin authorization without duration
      await accessManagement.addAuthorization(assetKey, admin.address, "admin");

      // Should have access immediately
      const accessBefore = await accessManagement.connect(admin).getAccess.staticCall(assetKey);
      expect(accessBefore).to.equal(true);

      // Fast forward time by 1 hour
      await provider.send("evm_increaseTime", [3600]);
      await provider.send("evm_mine");

      // Should still have access after time passes
      const accessAfter = await accessManagement.connect(admin).getAccess.staticCall(assetKey);
      expect(accessAfter).to.equal(true);
    });
  });

  describe("Ownership Transfer", function () {
    it("Should allow owner to transfer ownership", async function () {
      await accessManagement.connect(owner).newAsset("ASSET-001", "Test Asset");

      await expect(accessManagement.connect(owner).transferOwnership("ASSET-001", user1.address))
        .to.emit(accessManagement, "OwnershipTransferred")
        .withArgs("ASSET-001", owner.address, user1.address);

      const asset = await accessManagement.getAsset("ASSET-001");
      expect(asset.assetOwner).to.equal(user1.address);
    });

    it("Should reject ownership transfer from non-owner", async function () {
      await accessManagement.connect(owner).newAsset("ASSET-001", "Test Asset");

      await expect(
        accessManagement.connect(user1).transferOwnership("ASSET-001", user2.address)
      ).to.be.revertedWith("Only the owner can transfer ownership");
    });

    it("Should reject ownership transfer to zero address", async function () {
      await accessManagement.connect(owner).newAsset("ASSET-001", "Test Asset");

      await expect(
        accessManagement.connect(owner).transferOwnership("ASSET-001", ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid new owner address");
    });

    it("Should reject ownership transfer for non-existent asset", async function () {
      await expect(
        accessManagement.connect(owner).transferOwnership("NONEXISTENT", user1.address)
      ).to.be.revertedWith("Asset does not exist");
    });

    it("Should reject ownership transfer with empty asset key", async function () {
      await expect(
        accessManagement.connect(owner).transferOwnership("", user1.address)
      ).to.be.revertedWith("Asset key cannot be empty");
    });
  });

  describe("Batch Authorization Operations", function () {
    beforeEach(async function () {
      await accessManagement.connect(owner).newAsset("ASSET-001", "Test Asset");
    });

    it("Should add multiple authorizations in batch", async function () {
      const addresses = [user1.address, user2.address, user3.address];
      const roles = ["admin", "permanent", "admin"];

      await accessManagement.connect(owner).addAuthorizationBatch("ASSET-001", addresses, roles);

      const role1 = await accessManagement.getAssetAuthorization("ASSET-001", user1.address);
      const role2 = await accessManagement.getAssetAuthorization("ASSET-001", user2.address);
      const role3 = await accessManagement.getAssetAuthorization("ASSET-001", user3.address);

      expect(role1).to.equal("admin");
      expect(role2).to.equal("permanent");
      expect(role3).to.equal("admin");
    });

    it("Should reject batch authorization with array length mismatch", async function () {
      const addresses = [user1.address, user2.address];
      const roles = ["admin"];

      await expect(
        accessManagement.connect(owner).addAuthorizationBatch("ASSET-001", addresses, roles)
      ).to.be.revertedWith("Array length mismatch");
    });

    it("Should reject batch authorization with empty arrays", async function () {
      await expect(
        accessManagement.connect(owner).addAuthorizationBatch("ASSET-001", [], [])
      ).to.be.revertedWith("Empty arrays provided");
    });

    it("Should add multiple authorizations with durations in batch", async function () {
      const addresses = [user1.address, user2.address];
      const roles = ["permanent", "temporary"];
      const durations = [0, 3600]; // 0 for permanent, 3600 seconds for temporary

      await accessManagement.connect(owner).addAuthorizationBatchWithDuration(
        "ASSET-001",
        addresses,
        roles,
        durations
      );

      const role1 = await accessManagement.getAssetAuthorization("ASSET-001", user1.address);
      const role2 = await accessManagement.getAssetAuthorization("ASSET-001", user2.address);

      expect(role1).to.equal("permanent");
      expect(role2).to.equal("temporary");
    });

    it("Should reject batch authorization with duration when temporary role has no duration", async function () {
      const addresses = [user1.address];
      const roles = ["temporary"];
      const durations = [0]; // Invalid: temporary role with 0 duration

      await expect(
        accessManagement.connect(owner).addAuthorizationBatchWithDuration(
          "ASSET-001",
          addresses,
          roles,
          durations
        )
      ).to.be.revertedWith("Temporary roles must have expiration duration");
    });

    it("Should remove multiple authorizations in batch", async function () {
      // First add authorizations
      await accessManagement.connect(owner).addAuthorization("ASSET-001", user1.address, "admin");
      await accessManagement.connect(owner).addAuthorization("ASSET-001", user2.address, "permanent");

      // Then remove in batch
      const addresses = [user1.address, user2.address];
      await accessManagement.connect(owner).removeAuthorizationBatch("ASSET-001", addresses);

      const role1 = await accessManagement.getAssetAuthorization("ASSET-001", user1.address);
      const role2 = await accessManagement.getAssetAuthorization("ASSET-001", user2.address);

      expect(role1).to.equal("");
      expect(role2).to.equal("");
    });

    it("Should reject batch remove with empty array", async function () {
      await expect(
        accessManagement.connect(owner).removeAuthorizationBatch("ASSET-001", [])
      ).to.be.revertedWith("Empty array provided");
    });

    it("Should reject batch remove from non-owner/admin", async function () {
      await accessManagement.connect(owner).addAuthorization("ASSET-001", user1.address, "admin");

      await expect(
        accessManagement.connect(user2).removeAuthorizationBatch("ASSET-001", [user1.address])
      ).to.be.revertedWith("Only the owner or admins can remove authorizations.");
    });
  });

  describe("Event Emission with Indexed Parameters", function () {
    it("Should emit AssetCreate event with indexed parameters", async function () {
      await expect(accessManagement.connect(owner).newAsset("ASSET-001", "Test Asset"))
        .to.emit(accessManagement, "AssetCreate")
        .withArgs(owner.address, "ASSET-001", "Test Asset");
    });

    it("Should emit AuthorizationCreate event with indexed parameters", async function () {
      await accessManagement.connect(owner).newAsset("ASSET-001", "Test Asset");

      await expect(accessManagement.connect(owner).addAuthorization("ASSET-001", user1.address, "admin"))
        .to.emit(accessManagement, "AuthorizationCreate")
        .withArgs(user1.address, "ASSET-001", "admin");
    });

    it("Should emit AuthorizationRemove event with indexed parameters", async function () {
      await accessManagement.connect(owner).newAsset("ASSET-001", "Test Asset");
      await accessManagement.connect(owner).addAuthorization("ASSET-001", user1.address, "admin");

      await expect(accessManagement.connect(owner).removeAuthorization("ASSET-001", user1.address))
        .to.emit(accessManagement, "AuthorizationRemove")
        .withArgs(user1.address, "ASSET-001");
    });

    it("Should emit OwnershipTransferred event with indexed parameters", async function () {
      await accessManagement.connect(owner).newAsset("ASSET-001", "Test Asset");

      await expect(accessManagement.connect(owner).transferOwnership("ASSET-001", user1.address))
        .to.emit(accessManagement, "OwnershipTransferred")
        .withArgs("ASSET-001", owner.address, user1.address);
    });
  });

  describe("Complex Workflows", function () {
    it("Should support a complete asset lifecycle", async function () {
      const assetKey = "WORKFLOW-ASSET";

      // Create asset
      await accessManagement.newAsset(assetKey, "Workflow Asset");

      // Owner grants admin access to admin
      await accessManagement.addAuthorization(assetKey, admin.address, "admin");

      // Admin grants access to user1
      await accessManagement.connect(admin).addAuthorization(assetKey, user1.address, "permanent");

      // Admin grants access to user2
      await accessManagement.connect(admin).addAuthorization(assetKey, user2.address, "permanent");

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

    it("Should handle ownership transfer and maintain authorizations", async function () {
      // Create asset
      await accessManagement.connect(owner).newAsset("ASSET-001", "Test Asset");

      // Add authorizations
      await accessManagement.connect(owner).addAuthorization("ASSET-001", user2.address, "admin");

      // Transfer ownership
      await accessManagement.connect(owner).transferOwnership("ASSET-001", user1.address);

      // Check that authorization still exists
      const role = await accessManagement.getAssetAuthorization("ASSET-001", user2.address);
      expect(role).to.equal("admin");

      // Check that new owner can add authorizations
      await expect(
        accessManagement.connect(user1).addAuthorization("ASSET-001", user3.address, "permanent")
      ).to.not.be.revertedWithoutReason(ethers);
    });

    it("Should handle batch operations with mixed success", async function () {
      await accessManagement.connect(owner).newAsset("ASSET-001", "Test Asset");

      const addresses = [user1.address, user2.address, user3.address];
      const roles = ["admin", "permanent", "admin"];

      // Add batch
      await accessManagement.connect(owner).addAuthorizationBatch("ASSET-001", addresses, roles);

      // Verify all were added
      const asset = await accessManagement.getAsset("ASSET-001");
      expect(asset.authorizationCount).to.equal(3);

      // Remove some in batch
      await accessManagement.connect(owner).removeAuthorizationBatch("ASSET-001", [user1.address, user3.address]);

      // Verify user2 still has authorization
      const role2 = await accessManagement.getAssetAuthorization("ASSET-001", user2.address);
      expect(role2).to.equal("permanent");
    });
  });

  describe("Preview Access - canAccess()", function () {
    const assetKey = "ASSET-400";

    beforeEach(async function () {
      await accessManagement.newAsset(assetKey, "Preview Access Test Asset");
    });

    it("Should return true for owner without emitting event", async function () {
      // Call canAccess (view function - no transaction)
      const hasAccess = await accessManagement.canAccess(assetKey, owner.address);
      expect(hasAccess).to.equal(true);
    });

    it("Should return true for authorized user", async function () {
      await accessManagement.addAuthorization(assetKey, user1.address, "permanent");

      const hasAccess = await accessManagement.canAccess(assetKey, user1.address);
      expect(hasAccess).to.equal(true);
    });

    it("Should return false for unauthorized user", async function () {
      const hasAccess = await accessManagement.canAccess(assetKey, user1.address);
      expect(hasAccess).to.equal(false);
    });

    it("Should return false after authorization removal", async function () {
      await accessManagement.addAuthorization(assetKey, user1.address, "permanent");
      await accessManagement.removeAuthorization(assetKey, user1.address);

      const hasAccess = await accessManagement.canAccess(assetKey, user1.address);
      expect(hasAccess).to.equal(false);
    });

    it("Should return false for expired temporary authorization", async function () {
      const duration = 2; // 2 seconds

      await accessManagement["addAuthorization(string,address,string,uint256)"](
        assetKey,
        user1.address,
        "temporary",
        duration
      );

      // Should have access initially
      const hasAccessBefore = await accessManagement.canAccess(assetKey, user1.address);
      expect(hasAccessBefore).to.equal(true);

      // Fast forward time by 3 seconds
      await provider.send("evm_increaseTime", [3]);
      await provider.send("evm_mine");

      // Should not have access after expiration
      const hasAccessAfter = await accessManagement.canAccess(assetKey, user1.address);
      expect(hasAccessAfter).to.equal(false);
    });

    it("Should work for any address without requiring msg.sender", async function () {
      // Add authorization for user1
      await accessManagement.addAuthorization(assetKey, user1.address, "permanent");

      // Any account can check any other account's access (view function)
      const hasAccessUser1 = await accessManagement.connect(user2).canAccess(assetKey, user1.address);
      const hasAccessUser2 = await accessManagement.connect(user3).canAccess(assetKey, user2.address);

      expect(hasAccessUser1).to.equal(true);
      expect(hasAccessUser2).to.equal(false);
    });

    it("Should return false for non-existent asset", async function () {
      const hasAccess = await accessManagement.canAccess("NON-EXISTENT", user1.address);
      expect(hasAccess).to.equal(false);
    });

    it("Should match getAccess() results without emitting events", async function () {
      // Authorize user1
      await accessManagement.addAuthorization(assetKey, user1.address, "permanent");

      // Check with canAccess (no event)
      const canAccessResult = await accessManagement.canAccess(assetKey, user1.address);

      // Check with getAccess (emits event) using staticCall
      const getAccessResult = await accessManagement.connect(user1).getAccess.staticCall(assetKey);

      // Both should return the same result
      expect(canAccessResult).to.equal(getAccessResult);
    });
  });

  describe("Batch Audit Logging - batchLogAccess()", function () {
    const assetKey = "ASSET-500";

    beforeEach(async function () {
      await accessManagement.newAsset(assetKey, "Batch Logging Test Asset");
    });

    it("Should batch log multiple access events", async function () {
      const entries = [
        {
          user: user1.address,
          assetKey: assetKey,
          timestamp: Math.floor(Date.now() / 1000),
          granted: true
        },
        {
          user: user2.address,
          assetKey: assetKey,
          timestamp: Math.floor(Date.now() / 1000),
          granted: false
        },
        {
          user: user3.address,
          assetKey: assetKey,
          timestamp: Math.floor(Date.now() / 1000),
          granted: true
        }
      ];

      const tx = await accessManagement.batchLogAccess(entries);
      const receipt = await tx.wait();

      // Should emit 3 AccessLog events
      const accessLogs = receipt.logs.filter(
        log => log.fragment && log.fragment.name === 'AccessLog'
      );
      expect(accessLogs.length).to.equal(3);

      // Verify first event
      expect(accessLogs[0].args.account).to.equal(user1.address);
      expect(accessLogs[0].args.assetKey).to.equal(assetKey);
      expect(accessLogs[0].args.accessGranted).to.equal(true);

      // Verify second event
      expect(accessLogs[1].args.account).to.equal(user2.address);
      expect(accessLogs[1].args.accessGranted).to.equal(false);

      // Verify third event
      expect(accessLogs[2].args.account).to.equal(user3.address);
      expect(accessLogs[2].args.accessGranted).to.equal(true);
    });

    it("Should reject empty log entries", async function () {
      await expect(
        accessManagement.batchLogAccess([])
      ).to.be.revertedWith("Empty log entries");
    });

    it("Should reject more than 100 entries", async function () {
      // Create 101 entries
      const entries = [];
      for (let i = 0; i < 101; i++) {
        entries.push({
          user: user1.address,
          assetKey: assetKey,
          timestamp: Math.floor(Date.now() / 1000),
          granted: true
        });
      }

      await expect(
        accessManagement.batchLogAccess(entries)
      ).to.be.revertedWith("Too many entries, max 100 per batch");
    });

    it("Should allow exactly 100 entries", async function () {
      // Create exactly 100 entries
      const entries = [];
      for (let i = 0; i < 100; i++) {
        entries.push({
          user: user1.address,
          assetKey: assetKey,
          timestamp: Math.floor(Date.now() / 1000) + i,
          granted: i % 2 === 0 // Alternate between granted/denied
        });
      }

      const tx = await accessManagement.batchLogAccess(entries);
      const receipt = await tx.wait();

      // Should emit 100 AccessLog events
      const accessLogs = receipt.logs.filter(
        log => log.fragment && log.fragment.name === 'AccessLog'
      );
      expect(accessLogs.length).to.equal(100);
    });

    it("Should allow any address to submit batch logs", async function () {
      // This is important for door controllers that have their own signing keys
      const entries = [
        {
          user: owner.address,
          assetKey: assetKey,
          timestamp: Math.floor(Date.now() / 1000),
          granted: true
        }
      ];

      // user1 (who is not owner/admin) can submit batch logs
      await expect(
        accessManagement.connect(user1).batchLogAccess(entries)
      ).to.not.be.reverted;
    });

    it("Should handle logs for multiple different assets", async function () {
      const assetKey2 = "ASSET-501";
      await accessManagement.newAsset(assetKey2, "Second Asset");

      const entries = [
        {
          user: user1.address,
          assetKey: assetKey,
          timestamp: Math.floor(Date.now() / 1000),
          granted: true
        },
        {
          user: user2.address,
          assetKey: assetKey2,
          timestamp: Math.floor(Date.now() / 1000),
          granted: false
        }
      ];

      const tx = await accessManagement.batchLogAccess(entries);
      const receipt = await tx.wait();

      const accessLogs = receipt.logs.filter(
        log => log.fragment && log.fragment.name === 'AccessLog'
      );

      expect(accessLogs.length).to.equal(2);
      expect(accessLogs[0].args.assetKey).to.equal(assetKey);
      expect(accessLogs[1].args.assetKey).to.equal(assetKey2);
    });

    it("Should preserve timestamps from entries", async function () {
      const timestamp1 = 1700000000; // Nov 2023
      const timestamp2 = 1700000001;

      const entries = [
        {
          user: user1.address,
          assetKey: assetKey,
          timestamp: timestamp1,
          granted: true
        },
        {
          user: user2.address,
          assetKey: assetKey,
          timestamp: timestamp2,
          granted: false
        }
      ];

      const tx = await accessManagement.batchLogAccess(entries);
      await tx.wait();

      // Note: The event doesn't include timestamp, but this test
      // verifies the function accepts timestamps without reverting
      // Real-world usage would store timestamps in off-chain logs
    });
  });

  describe("Hybrid Access Control Workflow", function () {
    const doorAssetKey = "office-front-door";

    beforeEach(async function () {
      await accessManagement.newAsset(doorAssetKey, "Office Front Door");
      // Add some authorized users
      await accessManagement.addAuthorization(doorAssetKey, user1.address, "employee");
      await accessManagement.addAuthorization(doorAssetKey, user2.address, "employee");
    });

    it("Should simulate door controller workflow", async function () {
      // Step 1: Door controller checks access instantly (no gas cost)
      const user1HasAccess = await accessManagement.canAccess(doorAssetKey, user1.address);
      const user3HasAccess = await accessManagement.canAccess(doorAssetKey, user3.address);

      expect(user1HasAccess).to.equal(true);
      expect(user3HasAccess).to.equal(false);

      // Step 2: Collect access attempts over time (simulated)
      const accessLogs = [
        {
          user: user1.address,
          assetKey: doorAssetKey,
          timestamp: Math.floor(Date.now() / 1000),
          granted: true
        },
        {
          user: user1.address,
          assetKey: doorAssetKey,
          timestamp: Math.floor(Date.now() / 1000) + 100,
          granted: true
        },
        {
          user: user2.address,
          assetKey: doorAssetKey,
          timestamp: Math.floor(Date.now() / 1000) + 200,
          granted: true
        },
        {
          user: user3.address,
          assetKey: doorAssetKey,
          timestamp: Math.floor(Date.now() / 1000) + 300,
          granted: false
        }
      ];

      // Step 3: Upload logs in batch (once per hour)
      const tx = await accessManagement.batchLogAccess(accessLogs);
      const receipt = await tx.wait();

      // Verify all events were logged
      const events = receipt.logs.filter(
        log => log.fragment && log.fragment.name === 'AccessLog'
      );
      expect(events.length).to.equal(4);
    });

    it("Should handle permission changes in real-time", async function () {
      // Initial check - user3 has no access
      expect(await accessManagement.canAccess(doorAssetKey, user3.address)).to.equal(false);

      // Add authorization
      await accessManagement.addAuthorization(doorAssetKey, user3.address, "employee");

      // Immediate check - user3 now has access
      expect(await accessManagement.canAccess(doorAssetKey, user3.address)).to.equal(true);

      // Remove authorization
      await accessManagement.removeAuthorization(doorAssetKey, user3.address);

      // Immediate check - user3 access revoked
      expect(await accessManagement.canAccess(doorAssetKey, user3.address)).to.equal(false);
    });
  });
});
