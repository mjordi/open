pragma solidity ^0.4.10;

contract AssetTracker {
    
    address creator;

struct Asset {
    string name;
    string description;
    string manufacturer;
    bool initialized;    
}

struct Authorization {
    string role;
        string duration;

}

mapping(string => Asset) private assetStore;
mapping(address => mapping(string => bool)) private walletStore;
mapping(string => mapping(string => bool)) private authorizationStore;

event AssetCreate(address account, string uuid, string manufacturer);
event RejectCreate(address account, string uuid, string message);
event AssetTransfer(address from, address to, string uuid);
event RejectTransfer(address from, address to, string uuid, string message);

function createAsset(string name, string description, string uuid, string manufacturer) {
 
    if(assetStore[uuid].initialized) {
        RejectCreate(msg.sender, uuid, "Asset with this UUID already exists.");
        return;
      }
 
      assetStore[uuid] = Asset(name, description, manufacturer, true);
      walletStore[msg.sender][uuid] = true;
      AssetCreate(msg.sender, uuid, manufacturer);
}

function transferAsset(address to, string uuid) {
    if(!assetStore[uuid].initialized) {
        RejectTransfer(msg.sender, to, uuid, "No asset with this UUID exists");
        return;
    }
    if(!walletStore[msg.sender][uuid]) {
        RejectTransfer(msg.sender, to, uuid, "Sender does not own this asset.");
        return;
    }
    walletStore[msg.sender][uuid] = false;
    walletStore[to][uuid] = true;
    AssetTransfer(msg.sender, to, uuid);
}

function getAssetByUUID(string uuid) constant returns (string, string, string) {
    return (assetStore[uuid].name, assetStore[uuid].description, assetStore[uuid].manufacturer);
}
function isOwnerOf(address owner, string uuid) constant returns (bool) {
    if(walletStore[owner][uuid]) {
        return true;
    }
    return false;
}

  function assignRole (address entity, string role) hasRole('superadmin') {
    authorizationStore[entity][role] = true;

    //authorizationStore[uuid][entity][role] = true;
    //assetStore[uuid][access][role] = true;
    //assetStore[uuid].access.push(anAddress);
  }
  
  function isAssignedRole (address entity, string role) returns (bool) {
    return authorizationStore[entity][role];
  }
  
  modifier hasRole (string role) {
    if (!authorizationStore[msg.sender][role] && msg.sender != creator) {
      throw;
    }
    _;
  }
}