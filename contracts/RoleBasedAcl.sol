// SPDX-License-Identifier: UNLICENSED
//https://blockgeeks.com/introduction-to-solidity-acl-and-events-part-2/
//https://gist.github.com/hiddentao/06a3eee75fb433192563890a5d605240
//https://github.com/jpmcruz/RBAC-SC
//https://github.com/eugenp/tutorials/tree/master/ethereum/src/main/java/com/baeldung/web3j

pragma solidity ^0.8.24;

import { Unauthorized } from "./CustomErrors.sol";

/// @title RoleBasedAcl
/// @author Your Name
/// @notice A simple role-based access control contract.
contract RoleBasedAcl {
    address private immutable _CREATOR;

    mapping(address => mapping(string => bool)) private _roles;

    /// @notice Emitted when a role is assigned or unassigned.
    /// @param client The address whose role was changed.
    /// @param role The role that was changed.
    /// @param assigned A boolean indicating whether the role was assigned or unassigned.
    event RoleChange(
        address indexed client,
        string indexed role,
        bool indexed assigned
    );

    /// @notice Sets the contract creator and assigns the "superadmin" role.
    constructor() {
        _CREATOR = msg.sender;
        _roles[msg.sender]["superadmin"] = true;
    }

    modifier hasRole(string memory role) {
        if (!_roles[msg.sender][role] && msg.sender != _CREATOR) {
            revert Unauthorized(msg.sender);
        }
        _;
    }

    /// @notice Assigns a role to an address.
    /// @param entity The address to assign the role to.
    /// @param role The role to assign.
    function assignRole(address entity, string memory role)
        external
        hasRole("superadmin")
    {
        _roles[entity][role] = true;
        emit RoleChange(entity, role, true);
    }

    /// @notice Unassigns a role from an address.
    /// @param entity The address to unassign the role from.
    /// @param role The role to unassign.
    function unassignRole(address entity, string memory role)
        external
        hasRole("superadmin")
    {
        _roles[entity][role] = false;
        emit RoleChange(entity, role, false);
    }

    /// @notice Checks if an address has a specific role.
    /// @param entity The address to check.
    /// @param role The role to check for.
    /// @return isAssigned A boolean indicating whether the address has the role.
    function isAssignedRole(address entity, string memory role)
        external
        view
        returns (bool isAssigned)
    {
        return _roles[entity][role];
    }
}