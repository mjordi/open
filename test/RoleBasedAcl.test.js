const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('RoleBasedAcl', function () {
  let roleBasedAcl;
  let creator;
  let user1;
  let user2;
  let user3;
  let addrs;

  beforeEach(async function () {
    const RoleBasedAcl = await ethers.getContractFactory('RoleBasedAcl');
    [creator, user1, user2, user3, ...addrs] = await ethers.getSigners();

    roleBasedAcl = await RoleBasedAcl.deploy();
    await roleBasedAcl.waitForDeployment();
  });

  describe('Contract Deployment', function () {
    it('Should set the creator correctly', async function () {
      // Creator should have implicit superadmin access
      // We can test this by trying to assign a role (only superadmins can do this)
      await expect(roleBasedAcl.assignRole(user1.address, 'admin'))
        .to.emit(roleBasedAcl, 'RoleChange')
        .withArgs(user1.address, 'admin');
    });

    it('Should not allow non-creators to assign roles initially', async function () {
      // Non-creator should not be able to assign roles without superadmin role
      await expect(
        roleBasedAcl.connect(user1).assignRole(user2.address, 'admin')
      ).to.be.reverted;
    });
  });

  describe('Role Assignment', function () {
    it('Should allow creator to assign roles', async function () {
      await expect(roleBasedAcl.assignRole(user1.address, 'admin'))
        .to.emit(roleBasedAcl, 'RoleChange')
        .withArgs(user1.address, 'admin');

      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user1.address, 'admin')
      ).to.be.true;
    });

    it('Should allow creator to assign superadmin role', async function () {
      await expect(roleBasedAcl.assignRole(user1.address, 'superadmin'))
        .to.emit(roleBasedAcl, 'RoleChange')
        .withArgs(user1.address, 'superadmin');

      expect(
        await roleBasedAcl.isAssignedRole.staticCall(
          user1.address,
          'superadmin'
        )
      ).to.be.true;
    });

    it('Should allow superadmin to assign roles to others', async function () {
      // First, creator assigns superadmin to user1
      await roleBasedAcl.assignRole(user1.address, 'superadmin');

      // Now user1 (superadmin) should be able to assign roles
      await expect(
        roleBasedAcl.connect(user1).assignRole(user2.address, 'moderator')
      )
        .to.emit(roleBasedAcl, 'RoleChange')
        .withArgs(user2.address, 'moderator');

      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user2.address, 'moderator')
      ).to.be.true;
    });

    it('Should allow assigning multiple roles to same user', async function () {
      await roleBasedAcl.assignRole(user1.address, 'admin');
      await roleBasedAcl.assignRole(user1.address, 'moderator');

      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user1.address, 'admin')
      ).to.be.true;
      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user1.address, 'moderator')
      ).to.be.true;
    });

    it('Should prevent non-superadmin from assigning roles', async function () {
      // Assign admin role to user1 (not superadmin)
      await roleBasedAcl.assignRole(user1.address, 'admin');

      // user1 should not be able to assign roles (only superadmins can)
      await expect(
        roleBasedAcl.connect(user1).assignRole(user2.address, 'user')
      ).to.be.reverted;
    });
  });

  describe('Role Removal', function () {
    beforeEach(async function () {
      // Setup: assign some roles before each test
      await roleBasedAcl.assignRole(user1.address, 'admin');
      await roleBasedAcl.assignRole(user2.address, 'moderator');
    });

    it('Should allow creator to unassign roles', async function () {
      await expect(roleBasedAcl.unassignRole(user1.address, 'admin'))
        .to.emit(roleBasedAcl, 'RoleChange')
        .withArgs(user1.address, 'admin');

      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user1.address, 'admin')
      ).to.be.false;
    });

    it('Should allow superadmin to unassign roles', async function () {
      // Make user1 a superadmin
      await roleBasedAcl.assignRole(user1.address, 'superadmin');

      // user1 should be able to unassign user2's role
      await expect(
        roleBasedAcl.connect(user1).unassignRole(user2.address, 'moderator')
      )
        .to.emit(roleBasedAcl, 'RoleChange')
        .withArgs(user2.address, 'moderator');

      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user2.address, 'moderator')
      ).to.be.false;
    });

    it('Should prevent non-superadmin from unassigning roles', async function () {
      // user1 has admin but not superadmin role
      await expect(
        roleBasedAcl.connect(user1).unassignRole(user2.address, 'moderator')
      ).to.be.reverted;
    });

    it('Should handle unassigning non-existent roles gracefully', async function () {
      // Try to unassign a role that user1 doesn't have
      await expect(roleBasedAcl.unassignRole(user1.address, 'nonexistent'))
        .to.emit(roleBasedAcl, 'RoleChange')
        .withArgs(user1.address, 'nonexistent');

      expect(
        await roleBasedAcl.isAssignedRole.staticCall(
          user1.address,
          'nonexistent'
        )
      ).to.be.false;
    });
  });

  describe('Role Checking', function () {
    beforeEach(async function () {
      await roleBasedAcl.assignRole(user1.address, 'admin');
      await roleBasedAcl.assignRole(user1.address, 'moderator');
      await roleBasedAcl.assignRole(user2.address, 'user');
    });

    it('Should correctly identify assigned roles', async function () {
      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user1.address, 'admin')
      ).to.be.true;
      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user1.address, 'moderator')
      ).to.be.true;
      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user2.address, 'user')
      ).to.be.true;
    });

    it('Should return false for non-assigned roles', async function () {
      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user1.address, 'user')
      ).to.be.false;
      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user2.address, 'admin')
      ).to.be.false;
      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user3.address, 'admin')
      ).to.be.false;
    });

    it('Should return false for empty/non-existent addresses', async function () {
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      expect(await roleBasedAcl.isAssignedRole.staticCall(zeroAddress, 'admin'))
        .to.be.false;
    });
  });

  describe('Access Control Edge Cases', function () {
    it('Should handle role reassignment correctly', async function () {
      // Assign role
      await roleBasedAcl.assignRole(user1.address, 'admin');
      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user1.address, 'admin')
      ).to.be.true;

      // Unassign role
      await roleBasedAcl.unassignRole(user1.address, 'admin');
      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user1.address, 'admin')
      ).to.be.false;

      // Reassign role
      await roleBasedAcl.assignRole(user1.address, 'admin');
      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user1.address, 'admin')
      ).to.be.true;
    });

    it('Should maintain creator privileges even after role changes', async function () {
      // Creator should always be able to assign/unassign roles regardless of explicit roles
      await roleBasedAcl.assignRole(user1.address, 'admin');
      await roleBasedAcl.unassignRole(user1.address, 'admin');

      // Creator should still be able to assign new roles
      await expect(roleBasedAcl.assignRole(user2.address, 'moderator'))
        .to.emit(roleBasedAcl, 'RoleChange')
        .withArgs(user2.address, 'moderator');
    });

    it('Should handle multiple superadmins correctly', async function () {
      // Assign superadmin to multiple users
      await roleBasedAcl.assignRole(user1.address, 'superadmin');
      await roleBasedAcl.assignRole(user2.address, 'superadmin');

      // Both should be able to assign roles
      await expect(
        roleBasedAcl.connect(user1).assignRole(user3.address, 'admin')
      ).to.emit(roleBasedAcl, 'RoleChange');

      await expect(
        roleBasedAcl.connect(user2).assignRole(user3.address, 'moderator')
      ).to.emit(roleBasedAcl, 'RoleChange');

      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user3.address, 'admin')
      ).to.be.true;
      expect(
        await roleBasedAcl.isAssignedRole.staticCall(user3.address, 'moderator')
      ).to.be.true;
    });
  });
});
