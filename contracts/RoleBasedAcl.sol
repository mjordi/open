// SPDX-License-Identifier: MIT
//https://blockgeeks.com/introduction-to-solidity-acl-and-events-part-2/
//https://gist.github.com/hiddentao/06a3eee75fb433192563890a5d605240
//https://github.com/jpmcruz/RBAC-SC
//https://github.com/eugenp/tutorials/tree/master/ethereum/src/main/java/com/baeldung/web3j

pragma solidity ^0.8.20;

/// @title Role-Based Access Control System
/// @notice Implements role-based access control with superadmin privileges
/// @dev The contract creator has automatic superadmin privileges
contract RoleBasedAcl {

    /// @notice The address of the contract creator (has permanent superadmin privileges)
    address public creator;

    /// @dev Mapping from address to role to assignment status
    mapping(address => mapping(string => bool)) private roles;

    /// @notice Emitted when a role is assigned or unassigned
    event RoleChange(address indexed _client, string indexed _role);

    /// @notice Creates the contract and sets creator as superadmin
    constructor() {
        creator = msg.sender;
    }

    /// @notice Assigns a role to an address
    /// @dev Only superadmins can assign roles
    /// @param entity The address to assign the role to
    /// @param role The role to assign
    function assignRole(address entity, string calldata role) external hasRole('superadmin') {
        require(entity != address(0), "Invalid address");
        require(bytes(role).length > 0, "Role cannot be empty");
        roles[entity][role] = true;
        emit RoleChange(entity, role);
    }

    /// @notice Removes a role from an address
    /// @dev Only superadmins can unassign roles
    /// @param entity The address to remove the role from
    /// @param role The role to remove
    function unassignRole(address entity, string calldata role) external hasRole('superadmin') {
        require(entity != address(0), "Invalid address");
        require(bytes(role).length > 0, "Role cannot be empty");
        roles[entity][role] = false;
        emit RoleChange(entity, role);
    }

    /// @notice Checks if an address has a specific role
    /// @param entity The address to check
    /// @param role The role to check for
    /// @return bool True if the address has the role
    function isAssignedRole(address entity, string calldata role) external view returns (bool) {
        return roles[entity][role];
    }

    /// @notice Modifier to restrict function access to addresses with a specific role
    /// @dev The contract creator always passes this check regardless of role
    /// @param role The required role
    modifier hasRole(string memory role) {
        if (!roles[msg.sender][role] && msg.sender != creator) {
            revert("Unauthorized: Missing required role");
        }
        _;
    }
}
