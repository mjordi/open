//https://blockgeeks.com/introduction-to-solidity-acl-and-events-part-2/
//https://gist.github.com/hiddentao/06a3eee75fb433192563890a5d605240
//https://github.com/jpmcruz/RBAC-SC
//https://github.com/eugenp/tutorials/tree/master/ethereum/src/main/java/com/baeldung/web3j

pragma solidity ^0.4.10;

contract RoleBasedAcl {
  
  address creator;
  
  mapping(address => mapping(string => bool)) roles;
 
  event RoleChange(address _client, string _role);

  function RoleBasedAcl () {
    creator = msg.sender;
  }
  
  function assignRole (address entity, string role) hasRole('superadmin') {
    require(entity != address(0), "Invalid address");
    require(bytes(role).length > 0, "Role cannot be empty");
    roles[entity][role] = true;
    RoleChange(entity, role);
  }
  
  function unassignRole (address entity, string role) hasRole('superadmin') {
    require(entity != address(0), "Invalid address");
    require(bytes(role).length > 0, "Role cannot be empty");
    roles[entity][role] = false;
    RoleChange(entity, role);
  }
  
  function isAssignedRole (address entity, string role) returns (bool) {
    return roles[entity][role];
  }
  
  modifier hasRole (string role) {
    require(roles[msg.sender][role] || msg.sender == creator, "Unauthorized: missing required role");
    _;
  }
}