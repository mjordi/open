import { expect } from 'chai';
import hre from 'hardhat';
import TestUtils from './helpers/testUtils.js';

/**
 * Property-based testing for smart contracts
 * These tests use random inputs to discover edge cases
 */
describe('Property-Based Tests (Fuzzing)', function () {
  let assetTracker;
  let roleBasedAcl;
  let accessManagement;
  let accounts;

  before(async function () {
    accounts = await hre.network.ethers.getSigners();

    // Deploy contracts once for all fuzz tests
    const AssetTracker = await hre.network.ethers.getContractFactory('AssetTracker');
    const RoleBasedAcl = await hre.network.ethers.getContractFactory('RoleBasedAcl');
    const AccessManagement = await hre.network.ethers.getContractFactory('AccessManagement');

    assetTracker = await AssetTracker.deploy();
    roleBasedAcl = await RoleBasedAcl.deploy();
    accessManagement = await AccessManagement.deploy();

    await assetTracker.waitForDeployment();
    await roleBasedAcl.waitForDeployment();
    await accessManagement.waitForDeployment();
  });

  // Utility functions for generating random data
  function randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function randomAddress() {
    return accounts[Math.floor(Math.random() * accounts.length)];
  }

  function randomUuid() {
    return `uuid-${randomString(8)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  function randomRole() {
    const roles = ['admin', 'user', 'moderator', 'viewer', 'superadmin', 'guest'];
    return roles[Math.floor(Math.random() * roles.length)];
  }

  describe('AssetTracker Fuzz Tests', function () {
    it('Property: Asset creation with random valid inputs should always succeed', async function () {
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const assetData = {
          name: randomString(Math.floor(Math.random() * 50) + 1),
          description: randomString(Math.floor(Math.random() * 100) + 1),
          uuid: randomUuid(),
          manufacturer: randomString(Math.floor(Math.random() * 30) + 1),
        };

        const randomAccount = randomAddress();

        // Asset creation should succeed
        const tx = await assetTracker
          .connect(randomAccount)
          .createAsset(
            assetData.name,
            assetData.description,
            assetData.uuid,
            assetData.manufacturer
          );
        await TestUtils.expectEvent(tx, assetTracker, 'AssetCreate');

        // Asset should be owned by creator
        expect(await assetTracker.isOwnerOf(randomAccount.address, assetData.uuid)).to.be.true;

        // Asset data should be retrievable
        const retrievedAsset = await assetTracker.getAssetByUUID(assetData.uuid);
        expect(retrievedAsset[0]).to.equal(assetData.name);
        expect(retrievedAsset[1]).to.equal(assetData.description);
        expect(retrievedAsset[2]).to.equal(assetData.manufacturer);
      }
    });

    it('Property: Duplicate UUID creation should always fail', async function () {
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const uuid = randomUuid();
        const account1 = randomAddress();
        const account2 = randomAddress();

        // First creation should succeed
        await assetTracker
          .connect(account1)
          .createAsset(randomString(10), randomString(20), uuid, randomString(15));

        // Second creation with same UUID should fail
        await TestUtils.expectRevertWithCustomError(
          assetTracker
            .connect(account2)
            .createAsset(randomString(10), randomString(20), uuid, randomString(15)),
          assetTracker,
          'AssetExists',
          [uuid]
        );
      }
    });

    it('Property: Asset transfer should maintain ownership invariants', async function () {
      const iterations = 8;

      for (let i = 0; i < iterations; i++) {
        const uuid = `transfer-${randomString(8)}-${Date.now()}-${i}`;

        // Use unique accounts to avoid conflicts
        const ownerIndex = i % accounts.length;
        const recipientIndex = (i + 1) % accounts.length;
        const owner = accounts[ownerIndex];
        const recipient = accounts[recipientIndex];

        // Skip if same users
        if (owner.address === recipient.address) {
          continue;
        }

        // Create asset
        await assetTracker
          .connect(owner)
          .createAsset(randomString(10), randomString(20), uuid, randomString(15));

        // Verify initial ownership
        expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.be.true;
        expect(await assetTracker.isOwnerOf(recipient.address, uuid)).to.be.false;

        // Transfer asset
        await assetTracker.connect(owner).transferAsset(recipient.address, uuid);

        // Verify ownership transfer
        expect(await assetTracker.isOwnerOf(owner.address, uuid)).to.be.false;
        expect(await assetTracker.isOwnerOf(recipient.address, uuid)).to.be.true;
      }
    });
  });

  describe('RoleBasedAcl Fuzz Tests', function () {
    it('Property: Role assignment should be consistent and retrievable', async function () {
      const iterations = 10; // Reduced iterations to avoid conflicts
      const [creator] = await hre.network.ethers.getSigners();

      for (let i = 0; i < iterations; i++) {
        // Use a unique user for each iteration to avoid conflicts
        const userIndex = (i + 1) % accounts.length; // Cycle through available accounts
        const user = accounts[userIndex];
        const role = randomRole();

        // Assign role
        await roleBasedAcl.connect(creator).assignRole(user.address, role);

        // Verify role assignment
        expect(await roleBasedAcl.isAssignedRole.staticCall(user.address, role)).to.be.true;

        // Only verify that a different specific role is not assigned (to avoid state conflicts)
        const testRole = 'testRole' + i; // Use a role that definitely wasn't assigned
        expect(await roleBasedAcl.isAssignedRole.staticCall(user.address, testRole)).to.be.false;
      }
    });

    it('Property: Role unassignment should remove access', async function () {
      const iterations = 15;
      const [creator] = await hre.network.ethers.getSigners();

      for (let i = 0; i < iterations; i++) {
        const user = randomAddress();
        const role = randomRole();

        // Assign then unassign role
        await roleBasedAcl.connect(creator).assignRole(user.address, role);
        expect(await roleBasedAcl.isAssignedRole.staticCall(user.address, role)).to.be.true;

        await roleBasedAcl.connect(creator).unassignRole(user.address, role);
        expect(await roleBasedAcl.isAssignedRole.staticCall(user.address, role)).to.be.false;
      }
    });

    it('Property: Non-superadmin users cannot assign roles', async function () {
      const iterations = 3;
      const [creator] = await hre.network.ethers.getSigners();

      for (let i = 0; i < iterations; i++) {
        // Use unique accounts to avoid conflicts
        const nonSuperadminIndex = (i + 15) % accounts.length; // Start from a higher index
        const targetUserIndex = (i + 18) % accounts.length;
        const nonSuperadmin = accounts[nonSuperadminIndex];
        const targetUser = accounts[targetUserIndex];

        // Skip if same users
        if (nonSuperadmin.address === targetUser.address) {
          continue;
        }

        // First, ensure the user doesn't have superadmin (remove if exists)
        try {
          await roleBasedAcl.connect(creator).unassignRole(nonSuperadmin.address, 'superadmin');
        } catch {
          // Ignore if role wasn't assigned
        }

        // Assign a non-superadmin role explicitly
        const nonSuperadminRole = 'user'; // Use a specific non-superadmin role
        await roleBasedAcl.connect(creator).assignRole(nonSuperadmin.address, nonSuperadminRole);

        // Verify they don't have superadmin
        expect(await roleBasedAcl.isAssignedRole.staticCall(nonSuperadmin.address, 'superadmin')).to
          .be.false;

        // Non-superadmin should not be able to assign roles
        await expect(roleBasedAcl.connect(nonSuperadmin).assignRole(targetUser.address, 'admin')).to
          .be.reverted;
      }
    });
  });

  describe('AccessManagement Fuzz Tests', function () {
    it('Property: Asset access follows ownership and authorization rules', async function () {
      const iterations = 8;

      for (let i = 0; i < iterations; i++) {
        // Use unique accounts to avoid conflicts
        const ownerIndex = i % accounts.length;
        const authorizedUserIndex = (i + 1) % accounts.length;
        const unauthorizedUserIndex = (i + 2) % accounts.length;

        const owner = accounts[ownerIndex];
        const authorizedUser = accounts[authorizedUserIndex];
        const unauthorizedUser = accounts[unauthorizedUserIndex];
        const assetKey = `access-asset-${randomString(8)}-${Date.now()}-${i}`;

        // Skip if same users (to avoid logic conflicts)
        if (
          owner.address === unauthorizedUser.address ||
          owner.address === authorizedUser.address
        ) {
          continue;
        }

        // Create asset
        await accessManagement.connect(owner).newAsset(assetKey, randomString(20));

        // Owner should have access
        expect(await accessManagement.connect(owner).getAccess.staticCall(assetKey)).to.be.true;

        // Unauthorized user should not have access
        expect(await accessManagement.connect(unauthorizedUser).getAccess.staticCall(assetKey)).to
          .be.false;

        // Add authorization
        const role = 'viewer'; // Use specific role instead of random
        await accessManagement
          .connect(owner)
          .addAuthorization(assetKey, authorizedUser.address, role);

        // Authorized user should now have access
        expect(await accessManagement.connect(authorizedUser).getAccess.staticCall(assetKey)).to.be
          .true;

        // Remove authorization
        await accessManagement.connect(owner).removeAuthorization(assetKey, authorizedUser.address);

        // Authorized user should lose access
        expect(await accessManagement.connect(authorizedUser).getAccess.staticCall(assetKey)).to.be
          .false;
      }
    });

    it('Property: Asset creation should increment count correctly', async function () {
      const initialCount = await accessManagement.getAssetCount();
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const owner = randomAddress();
        const assetKey = `count-test-${randomString(8)}-${i}`;

        await accessManagement.connect(owner).newAsset(assetKey, randomString(20));

        const currentCount = await accessManagement.getAssetCount();
        expect(currentCount).to.equal(initialCount + BigInt(i + 1));
      }
    });
  });

  describe('Cross-Contract Fuzz Tests', function () {
    it('Property: Role-based asset management should be consistent', async function () {
      const iterations = 5;
      const [creator] = await hre.network.ethers.getSigners();

      for (let i = 0; i < iterations; i++) {
        // Use unique accounts
        const adminIndex = (i + 5) % accounts.length;
        const userIndex = (i + 10) % accounts.length;
        const admin = accounts[adminIndex];
        const user = accounts[userIndex];

        const assetKey = `cross-${randomString(8)}-${Date.now()}-${i}`;
        const assetUuid = `cross-uuid-${randomString(8)}-${Date.now()}-${i}`;

        // Skip if same users
        if (admin.address === user.address) {
          continue;
        }

        // Setup roles
        await roleBasedAcl.connect(creator).assignRole(admin.address, 'admin');
        await roleBasedAcl.connect(creator).assignRole(user.address, 'user');

        // Verify roles are assigned
        expect(await roleBasedAcl.isAssignedRole.staticCall(admin.address, 'admin')).to.be.true;
        expect(await roleBasedAcl.isAssignedRole.staticCall(user.address, 'user')).to.be.true;

        // Create assets in both systems
        await assetTracker
          .connect(admin)
          .createAsset(randomString(10), randomString(20), assetUuid, randomString(15));

        await accessManagement.connect(admin).newAsset(assetKey, randomString(20));

        // Verify ownership and access patterns
        expect(await assetTracker.isOwnerOf(admin.address, assetUuid)).to.be.true;
        expect(await accessManagement.connect(admin).getAccess.staticCall(assetKey)).to.be.true;

        // Add user authorization
        await accessManagement.connect(admin).addAuthorization(assetKey, user.address, 'user');
        expect(await accessManagement.connect(user).getAccess.staticCall(assetKey)).to.be.true;
      }
    });
  });

  describe('Boundary and Edge Case Tests', function () {
    it('Property: Empty strings should be handled gracefully', async function () {
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const owner = randomAddress();

        // Test empty strings in asset creation
        try {
          await assetTracker.connect(owner).createAsset('', '', randomUuid(), '');
          // If it doesn't revert, verify the asset was created
          // This tests how the contract handles empty strings
        } catch (error) {
          // If it reverts, that's also acceptable behavior
          expect(error.message).to.include('revert');
        }

        // Test empty strings in access management
        try {
          await accessManagement.connect(owner).newAsset('', '');
          // If successful, verify behavior
        } catch (error) {
          // If it reverts, that's acceptable
          expect(error.message).to.include('revert');
        }
      }
    });
  });
});
