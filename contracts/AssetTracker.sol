// https://blog.codecentric.de/en/2018/01/implementing-smart-contracts/
// Demo: https://asset-tracker.codecentric.de/

pragma solidity ^0.4.10;

contract AssetTracker  {
struct Asset {
    string name;
    string description;
    string manufacturer;
    bool initialized;    
}

    mapping(string => Asset) private assetStore;
mapping(address => mapping(string => bool)) private walletStore;

event AssetCreate(address account, string uuid, string manufacturer);
event RejectCreate(address account, string uuid, string message);
event AssetTransfer(address from, address to, string uuid);
event RejectTransfer(address from, address to, string uuid, string message);

function createAsset(string name, string description, string uuid, string manufacturer) public {
  if (assetStore[uuid].initialized) {
    emit RejectCreate(msg.sender, uuid, "Asset with this UUID already exists.");
    return;
  }
  assetStore[uuid] = Asset(name, description, manufacturer, true);
  walletStore[msg.sender][uuid] = true;
  emit AssetCreate(msg.sender, uuid, manufacturer);
}

function transferAsset(address to, string uuid) public {
  if (!assetStore[uuid].initialized) {
    emit RejectTransfer(msg.sender, to, uuid, "No asset with this UUID exists");
    return;
  }
  if (!walletStore[msg.sender][uuid]) {
    emit RejectTransfer(msg.sender, to, uuid, "Sender does not own this asset.");
    return;
  }
  walletStore[msg.sender][uuid] = false;
  walletStore[to][uuid] = true;
  emit AssetTransfer(msg.sender, to, uuid);
}

function getAssetByUUID(string uuid) public view returns (string, string, string) {
  return (assetStore[uuid].name, assetStore[uuid].description, assetStore[uuid].manufacturer);
}

function isOwnerOf(address owner, string uuid) public view returns (bool) {
  return walletStore[owner][uuid];
}

}
