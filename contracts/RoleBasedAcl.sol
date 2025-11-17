// SPDX-License-Identifier: MIT
//https://blockgeeks.com/introduction-to-solidity-acl-and-events-part-2/
//https://gist.github.com/hiddentao/06a3eee75fb433192563890a5d605240
//https://github.com/jpmcruz/RBAC-SC
//https://github.com/eugenp/tutorials/tree/master/ethereum/src/main/java/com/baeldung/web3j

pragma solidity ^0.8.20;

contract RoleBasedAcl {

    address creator;

    mapping(address => mapping(string => bool)) roles;

    event RoleChange(address _client, string _role);

    constructor() {
        creator = msg.sender;
    }

    function assignRole(address entity, string memory role) public hasRole('superadmin') {
        roles[entity][role] = true;
        emit RoleChange(entity, role);
    }

    function unassignRole(address entity, string memory role) public hasRole('superadmin') {
        roles[entity][role] = false;
        emit RoleChange(entity, role);
    }

    function isAssignedRole(address entity, string memory role) public view returns (bool) {
        return roles[entity][role];
    }

    modifier hasRole(string memory role) {
        if (!roles[msg.sender][role] && msg.sender != creator) {
            revert("Unauthorized: Missing required role");
        }
        _;
    }
}
