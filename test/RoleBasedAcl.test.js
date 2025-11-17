const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RoleBasedAcl", function () {
  let roleBasedAcl;
  let creator;
  let superadmin;
  let admin;
  let user1;
  let user2;

  beforeEach(async function () {
    [creator, superadmin, admin, user1, user2] = await ethers.getSigners();
    const RoleBasedAcl = await ethers.getContractFactory("RoleBasedAcl");
    roleBasedAcl = await RoleBasedAcl.deploy();
  });

  describe("Contract Initialization", function () {
    it("Should set the creator correctly", async function () {
      // Creator should be able to assign roles without having superadmin role
      await expect(roleBasedAcl.assignRole(superadmin.address, "superadmin"))
        .to.emit(roleBasedAcl, "RoleChange")
        .withArgs(superadmin.address, "superadmin");

      const hasSuperadmin = await roleBasedAcl.isAssignedRole(superadmin.address, "superadmin");
      expect(hasSuperadmin).to.equal(true);
    });

    it("Should allow creator to act as implicit superadmin", async function () {
      await roleBasedAcl.assignRole(user1.address, "admin");
      const hasAdmin = await roleBasedAcl.isAssignedRole(user1.address, "admin");
      expect(hasAdmin).to.equal(true);
    });
  });

  describe("Role Assignment", function () {
    beforeEach(async function () {
      await roleBasedAcl.assignRole(superadmin.address, "superadmin");
    });

    it("Should allow creator to assign roles", async function () {
      await expect(roleBasedAcl.assignRole(user1.address, "admin"))
        .to.emit(roleBasedAcl, "RoleChange")
        .withArgs(user1.address, "admin");

      const hasRole = await roleBasedAcl.isAssignedRole(user1.address, "admin");
      expect(hasRole).to.equal(true);
    });

    it("Should allow superadmin to assign roles", async function () {
      await expect(roleBasedAcl.connect(superadmin).assignRole(user1.address, "admin"))
        .to.emit(roleBasedAcl, "RoleChange")
        .withArgs(user1.address, "admin");

      const hasRole = await roleBasedAcl.isAssignedRole(user1.address, "admin");
      expect(hasRole).to.equal(true);
    });

    it("Should reject role assignment by non-superadmin", async function () {
      await expect(
        roleBasedAcl.connect(user1).assignRole(user2.address, "admin")
      ).to.be.reverted;
    });

    it("Should allow assigning multiple roles to same address", async function () {
      await roleBasedAcl.assignRole(user1.address, "admin");
      await roleBasedAcl.assignRole(user1.address, "moderator");
      await roleBasedAcl.assignRole(user1.address, "editor");

      expect(await roleBasedAcl.isAssignedRole(user1.address, "admin")).to.equal(true);
      expect(await roleBasedAcl.isAssignedRole(user1.address, "moderator")).to.equal(true);
      expect(await roleBasedAcl.isAssignedRole(user1.address, "editor")).to.equal(true);
    });

    it("Should allow assigning same role to multiple addresses", async function () {
      await roleBasedAcl.assignRole(user1.address, "admin");
      await roleBasedAcl.assignRole(user2.address, "admin");

      expect(await roleBasedAcl.isAssignedRole(user1.address, "admin")).to.equal(true);
      expect(await roleBasedAcl.isAssignedRole(user2.address, "admin")).to.equal(true);
    });

    it("Should reject empty role string", async function () {
      await expect(
        roleBasedAcl.assignRole(user1.address, "")
      ).to.be.revertedWith("Role cannot be empty");
    });

    it("Should handle role strings with special characters", async function () {
      await roleBasedAcl.assignRole(user1.address, "super-admin-2024!");
      const hasRole = await roleBasedAcl.isAssignedRole(user1.address, "super-admin-2024!");
      expect(hasRole).to.equal(true);
    });

    it("Should allow reassigning already assigned role", async function () {
      await roleBasedAcl.assignRole(user1.address, "admin");
      await roleBasedAcl.assignRole(user1.address, "admin");

      const hasRole = await roleBasedAcl.isAssignedRole(user1.address, "admin");
      expect(hasRole).to.equal(true);
    });
  });

  describe("Role Unassignment", function () {
    beforeEach(async function () {
      await roleBasedAcl.assignRole(superadmin.address, "superadmin");
      await roleBasedAcl.assignRole(user1.address, "admin");
    });

    it("Should allow creator to unassign roles", async function () {
      await expect(roleBasedAcl.unassignRole(user1.address, "admin"))
        .to.emit(roleBasedAcl, "RoleChange")
        .withArgs(user1.address, "admin");

      const hasRole = await roleBasedAcl.isAssignedRole(user1.address, "admin");
      expect(hasRole).to.equal(false);
    });

    it("Should allow superadmin to unassign roles", async function () {
      await expect(roleBasedAcl.connect(superadmin).unassignRole(user1.address, "admin"))
        .to.emit(roleBasedAcl, "RoleChange")
        .withArgs(user1.address, "admin");

      const hasRole = await roleBasedAcl.isAssignedRole(user1.address, "admin");
      expect(hasRole).to.equal(false);
    });

    it("Should reject role unassignment by non-superadmin", async function () {
      await expect(
        roleBasedAcl.connect(user2).unassignRole(user1.address, "admin")
      ).to.be.reverted;
    });

    it("Should allow unassigning non-existent role", async function () {
      await roleBasedAcl.unassignRole(user1.address, "non-existent-role");
      const hasRole = await roleBasedAcl.isAssignedRole(user1.address, "non-existent-role");
      expect(hasRole).to.equal(false);
    });

    it("Should allow reassigning after unassignment", async function () {
      await roleBasedAcl.unassignRole(user1.address, "admin");
      expect(await roleBasedAcl.isAssignedRole(user1.address, "admin")).to.equal(false);

      await roleBasedAcl.assignRole(user1.address, "admin");
      expect(await roleBasedAcl.isAssignedRole(user1.address, "admin")).to.equal(true);
    });

    it("Should only unassign specific role, not all roles", async function () {
      await roleBasedAcl.assignRole(user1.address, "moderator");
      await roleBasedAcl.assignRole(user1.address, "editor");

      await roleBasedAcl.unassignRole(user1.address, "admin");

      expect(await roleBasedAcl.isAssignedRole(user1.address, "admin")).to.equal(false);
      expect(await roleBasedAcl.isAssignedRole(user1.address, "moderator")).to.equal(true);
      expect(await roleBasedAcl.isAssignedRole(user1.address, "editor")).to.equal(true);
    });
  });

  describe("Role Checking", function () {
    beforeEach(async function () {
      await roleBasedAcl.assignRole(user1.address, "admin");
      await roleBasedAcl.assignRole(user1.address, "moderator");
    });

    it("Should correctly identify assigned roles", async function () {
      expect(await roleBasedAcl.isAssignedRole(user1.address, "admin")).to.equal(true);
      expect(await roleBasedAcl.isAssignedRole(user1.address, "moderator")).to.equal(true);
    });

    it("Should return false for unassigned roles", async function () {
      expect(await roleBasedAcl.isAssignedRole(user1.address, "editor")).to.equal(false);
      expect(await roleBasedAcl.isAssignedRole(user2.address, "admin")).to.equal(false);
    });

    it("Should return false for non-existent address", async function () {
      const randomAddress = "0x0000000000000000000000000000000000000123";
      expect(await roleBasedAcl.isAssignedRole(randomAddress, "admin")).to.equal(false);
    });

    it("Should return false for non-existent role", async function () {
      expect(await roleBasedAcl.isAssignedRole(user1.address, "non-existent")).to.equal(false);
    });

    it("Should update role check after unassignment", async function () {
      expect(await roleBasedAcl.isAssignedRole(user1.address, "admin")).to.equal(true);

      await roleBasedAcl.unassignRole(user1.address, "admin");

      expect(await roleBasedAcl.isAssignedRole(user1.address, "admin")).to.equal(false);
    });
  });

  describe("Superadmin Workflow", function () {
    it("Should allow creating multiple superadmins", async function () {
      await roleBasedAcl.assignRole(user1.address, "superadmin");
      await roleBasedAcl.assignRole(user2.address, "superadmin");

      await roleBasedAcl.connect(user1).assignRole(admin.address, "admin");
      await roleBasedAcl.connect(user2).assignRole(admin.address, "moderator");

      expect(await roleBasedAcl.isAssignedRole(admin.address, "admin")).to.equal(true);
      expect(await roleBasedAcl.isAssignedRole(admin.address, "moderator")).to.equal(true);
    });

    it("Should allow superadmin to assign superadmin role to others", async function () {
      await roleBasedAcl.assignRole(user1.address, "superadmin");
      await roleBasedAcl.connect(user1).assignRole(user2.address, "superadmin");

      expect(await roleBasedAcl.isAssignedRole(user2.address, "superadmin")).to.equal(true);
    });

    it("Should allow superadmin to unassign their own superadmin role", async function () {
      await roleBasedAcl.assignRole(user1.address, "superadmin");
      await roleBasedAcl.connect(user1).unassignRole(user1.address, "superadmin");

      expect(await roleBasedAcl.isAssignedRole(user1.address, "superadmin")).to.equal(false);
    });

    it("Should prevent access after superadmin role is removed", async function () {
      await roleBasedAcl.assignRole(user1.address, "superadmin");
      await roleBasedAcl.unassignRole(user1.address, "superadmin");

      await expect(
        roleBasedAcl.connect(user1).assignRole(user2.address, "admin")
      ).to.be.reverted;
    });
  });

  describe("Complete Workflow", function () {
    it("Should support a complete role management lifecycle", async function () {
      // Creator assigns initial superadmin
      await roleBasedAcl.assignRole(superadmin.address, "superadmin");
      expect(await roleBasedAcl.isAssignedRole(superadmin.address, "superadmin")).to.equal(true);

      // Superadmin assigns admin role
      await roleBasedAcl.connect(superadmin).assignRole(admin.address, "admin");
      expect(await roleBasedAcl.isAssignedRole(admin.address, "admin")).to.equal(true);

      // Superadmin assigns multiple roles to user1
      await roleBasedAcl.connect(superadmin).assignRole(user1.address, "moderator");
      await roleBasedAcl.connect(superadmin).assignRole(user1.address, "editor");

      expect(await roleBasedAcl.isAssignedRole(user1.address, "moderator")).to.equal(true);
      expect(await roleBasedAcl.isAssignedRole(user1.address, "editor")).to.equal(true);

      // Superadmin removes one role from user1
      await roleBasedAcl.connect(superadmin).unassignRole(user1.address, "moderator");
      expect(await roleBasedAcl.isAssignedRole(user1.address, "moderator")).to.equal(false);
      expect(await roleBasedAcl.isAssignedRole(user1.address, "editor")).to.equal(true);

      // Creator can still perform all operations
      await roleBasedAcl.assignRole(user2.address, "viewer");
      expect(await roleBasedAcl.isAssignedRole(user2.address, "viewer")).to.equal(true);
    });

    it("Should handle role hierarchy scenario", async function () {
      // Create role hierarchy: superadmin -> admin -> moderator -> viewer
      await roleBasedAcl.assignRole(user1.address, "superadmin");
      await roleBasedAcl.connect(user1).assignRole(user2.address, "admin");

      expect(await roleBasedAcl.isAssignedRole(user1.address, "superadmin")).to.equal(true);
      expect(await roleBasedAcl.isAssignedRole(user2.address, "admin")).to.equal(true);

      // Only superadmin can assign/unassign (admin cannot)
      await expect(
        roleBasedAcl.connect(user2).assignRole(admin.address, "moderator")
      ).to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should reject zero address", async function () {
      const zeroAddress = ethers.ZeroAddress;
      await expect(
        roleBasedAcl.assignRole(zeroAddress, "admin")
      ).to.be.revertedWith("Invalid address");
    });

    it("Should handle very long role names", async function () {
      const longRole = "a".repeat(1000);
      await roleBasedAcl.assignRole(user1.address, longRole);
      expect(await roleBasedAcl.isAssignedRole(user1.address, longRole)).to.equal(true);
    });

    it("Should handle unicode role names", async function () {
      const unicodeRole = "管理员-🔐-admin";
      await roleBasedAcl.assignRole(user1.address, unicodeRole);
      expect(await roleBasedAcl.isAssignedRole(user1.address, unicodeRole)).to.equal(true);
    });

    it("Should distinguish between similar role names", async function () {
      await roleBasedAcl.assignRole(user1.address, "admin");
      await roleBasedAcl.assignRole(user1.address, "Admin");
      await roleBasedAcl.assignRole(user1.address, "ADMIN");

      expect(await roleBasedAcl.isAssignedRole(user1.address, "admin")).to.equal(true);
      expect(await roleBasedAcl.isAssignedRole(user1.address, "Admin")).to.equal(true);
      expect(await roleBasedAcl.isAssignedRole(user1.address, "ADMIN")).to.equal(true);
    });

    it("Should handle rapid assignment and unassignment", async function () {
      for (let i = 0; i < 10; i++) {
        await roleBasedAcl.assignRole(user1.address, "admin");
        await roleBasedAcl.unassignRole(user1.address, "admin");
      }

      expect(await roleBasedAcl.isAssignedRole(user1.address, "admin")).to.equal(false);
    });
  });
});
