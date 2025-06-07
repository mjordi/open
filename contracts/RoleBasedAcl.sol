//https://blockgeeks.com/introduction-to-solidity-acl-and-events-part-2/
//https://gist.github.com/hiddentao/06a3eee75fb433192563890a5d605240
//https://github.com/jpmcruz/RBAC-SC
//https://github.com/eugenp/tutorials/tree/master/ethereum/src/main/java/com/baeldung/web3j

pragma solidity ^0.4.10;

contract RoleBasedAcl {
  
  address creator;
  
  mapping(address => string) roles;
 
  event RoleChange(address _client, string _role);

  constructor() {
    creator = msg.sender;
  }
  
  function assignRole(address entity, string role) public hasRole('superadmin') {
    roles[entity] = role;
    emit RoleChange(entity, role);
  }
  
  function unassignRole(address entity, string role) public hasRole('superadmin') {
    roles[entity] = '';
    emit RoleChange(entity, role);
  }
  
  function isAssignedRole(address entity, string role) public view returns (bool) {
    return keccak256(abi.encodePacked(roles[entity])) == keccak256(abi.encodePacked(role));
  }
  
  modifier hasRole(string role) {
    if (keccak256(abi.encodePacked(roles[msg.sender])) != keccak256(abi.encodePacked(role)) && msg.sender != creator) {
      revert("Unauthorized");
    }
    _;
  }
}