//https://blockgeeks.com/introduction-to-solidity-acl-and-events-part-2/
//https://gist.github.com/hiddentao/06a3eee75fb433192563890a5d605240
//https://github.com/jpmcruz/RBAC-SC
//https://github.com/eugenp/tutorials/tree/master/ethereum/src/main/java/com/baeldung/web3j

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Unauthorized } from "./CustomErrors.sol";

contract RoleBasedAcl {
  
  address private _creator;
  
  mapping(address => mapping(string => bool)) private _roles;
 
  event RoleChange(address indexed client, string indexed role, bool assigned);

  constructor() public {
    _creator = msg.sender;
    _roles[msg.sender]["superadmin"] = true;
  }
  
  modifier hasRole(string memory role) {
    if (!_roles[msg.sender][role] && msg.sender != _creator) {
      revert Unauthorized(msg.sender);
    }
    _;
  }

  function assignRole(address entity, string memory role)
    external
    hasRole("superadmin")
  {
    _roles[entity][role] = true;
    emit RoleChange(entity, role, true);
  }
  
  function unassignRole(address entity, string memory role)
    external
    hasRole("superadmin")
  {
    _roles[entity][role] = false;
    emit RoleChange(entity, role, false);
  }
  
  function isAssignedRole(address entity, string memory role)
    external
    view
    returns (bool)
  {
    return _roles[entity][role];
  }
}