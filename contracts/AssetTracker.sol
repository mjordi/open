// SPDX-License-Identifier: MIT
// https://blog.codecentric.de/en/2018/01/implementing-smart-contracts/
// Demo: https://asset-tracker.codecentric.de/

pragma solidity ^0.8.20;

contract AssetTracker {
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

    function createAsset(string memory name, string memory description, string memory uuid, string memory manufacturer) public {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(uuid).length > 0, "UUID cannot be empty");
        require(bytes(manufacturer).length > 0, "Manufacturer cannot be empty");

        if(assetStore[uuid].initialized) {
            emit RejectCreate(msg.sender, uuid, "Asset with this UUID already exists.");
            return;
        }

        assetStore[uuid] = Asset(name, description, manufacturer, true);
        walletStore[msg.sender][uuid] = true;
        emit AssetCreate(msg.sender, uuid, manufacturer);
    }

    function transferAsset(address to, string memory uuid) public {
        require(to != address(0), "Invalid recipient address");
        require(bytes(uuid).length > 0, "UUID cannot be empty");

        if(!assetStore[uuid].initialized) {
            emit RejectTransfer(msg.sender, to, uuid, "No asset with this UUID exists");
            return;
        }

        if(!walletStore[msg.sender][uuid]) {
            emit RejectTransfer(msg.sender, to, uuid, "Sender does not own this asset.");
            return;
        }

        walletStore[msg.sender][uuid] = false;
        walletStore[to][uuid] = true;
        emit AssetTransfer(msg.sender, to, uuid);
    }

    function getAssetByUUID(string memory uuid) public view returns (string memory, string memory, string memory) {
        return (assetStore[uuid].name, assetStore[uuid].description, assetStore[uuid].manufacturer);
    }

    function isOwnerOf(address owner, string memory uuid) public view returns (bool) {
        if(walletStore[owner][uuid]) {
            return true;
        }

        return false;
    }
}
