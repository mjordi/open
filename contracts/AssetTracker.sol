// SPDX-License-Identifier: UNLICENSED
// https://blog.codecentric.de/en/2018/01/implementing-smart-contracts/
// Demo: https://asset-tracker.codecentric.de/

pragma solidity ^0.8.24;

contract AssetTracker {
    struct Asset {
        string name;
        string description;
        string manufacturer;
        bool initialized;
    }

    mapping(string => Asset) private _assetStore;
    mapping(address => mapping(string => bool)) private _walletStore;

    event AssetCreate(address account, string uuid, string manufacturer);
    event RejectCreate(address account, string uuid, string message);
    event AssetTransfer(address from, address to, string uuid);
    event RejectTransfer(address from, address to, string uuid, string message);

    function createAsset(
        string memory name,
        string memory description,
        string memory uuid,
        string memory manufacturer
    ) external {
        if (_assetStore[uuid].initialized) {
            emit RejectCreate(msg.sender, uuid, "Asset with this UUID already exists.");
            return;
        }
        _assetStore[uuid] = Asset(name, description, manufacturer, true);
        _walletStore[msg.sender][uuid] = true;
        emit AssetCreate(msg.sender, uuid, manufacturer);
    }

    function transferAsset(address to, string memory uuid) external {
        if (!_assetStore[uuid].initialized) {
            emit RejectTransfer(msg.sender, to, uuid, "No asset with this UUID exists");
            return;
        }
        if (!_walletStore[msg.sender][uuid]) {
            emit RejectTransfer(msg.sender, to, uuid, "Sender does not own this asset.");
            return;
        }
        _walletStore[msg.sender][uuid] = false;
        _walletStore[to][uuid] = true;
        emit AssetTransfer(msg.sender, to, uuid);
    }

    function getAssetByUUID(string memory uuid) external view returns (string memory, string memory, string memory) {
        return (
            _assetStore[uuid].name,
            _assetStore[uuid].description,
            _assetStore[uuid].manufacturer
        );
    }

    function isOwnerOf(address owner, string memory uuid) external view returns (bool) {
        return _walletStore[owner][uuid];
    }
}
