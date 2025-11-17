import { expect } from "chai";
import hre from "hardhat";

describe("AccessManagement - New Features", function () {
    let accessManagement;
    let owner, user1, user2, user3;
    let ethers;

    before(async function () {
        const network = await hre.network.connect();
        ethers = network.ethers;
    });

    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();
        const AccessManagement = await ethers.getContractFactory("AccessManagement");
        accessManagement = await AccessManagement.deploy();
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
});
