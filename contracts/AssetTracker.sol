// SPDX-License-Identifier: UNLICENSED
// https://blog.codecentric.de/en/2018/01/implementing-smart-contracts/
// Demo: https://asset-tracker.codecentric.de/

pragma solidity ^0.8.24;

contract AssetTracker {
    // Custom errors
    error EmptyString(string param);
    error InvalidAddress(address addr);
    error AssetExists(string uuid);
    error AssetNotFound(string uuid);
    error NotAssetOwner(address caller, string uuid);

    struct Asset {
        string name;
        string description;
        string manufacturer;
        bool initialized;
    }

    mapping(string => Asset) private _assetStore;
    mapping(address => mapping(string => bool)) private _walletStore;

    event AssetCreate(address account, string uuid, string manufacturer);
    event AssetTransfer(address from, address to, string uuid);

    // Modifiers
    modifier nonEmptyString(string memory str) {
        if (bytes(str).length == 0) {
            revert EmptyString(str);
        }
        _;
    }

    modifier validAddress(address addr) {
        if (addr == address(0)) {
            revert InvalidAddress(addr);
        }
        _;
    }

    modifier assetExists(string memory uuid) {
        if (!_assetStore[uuid].initialized) {
            revert AssetNotFound(uuid);
        }
        _;
    }

    modifier onlyAssetOwner(string memory uuid) {
        if (!_walletStore[msg.sender][uuid]) {
            revert NotAssetOwner(msg.sender, uuid);
        }
        _;
    }

    function createAsset(
        string memory name,
        string memory description,
        string memory uuid,
        string memory manufacturer
    ) external nonEmptyString(name) nonEmptyString(uuid) nonEmptyString(manufacturer) {
        if (_assetStore[uuid].initialized) {
            revert AssetExists(uuid);
        }
        _assetStore[uuid] = Asset(name, description, manufacturer, true);
        _walletStore[msg.sender][uuid] = true;
        emit AssetCreate(msg.sender, uuid, manufacturer);
    }

    function transferAsset(address to, string memory uuid)
        external
        validAddress(to)
        assetExists(uuid)
        onlyAssetOwner(uuid)
    {
        _walletStore[msg.sender][uuid] = false;
        _walletStore[to][uuid] = true;
        emit AssetTransfer(msg.sender, to, uuid);
    }

    function getAssetByUUID(string memory uuid)
        external
        view
        nonEmptyString(uuid)
        returns (string memory, string memory, string memory)
    {
        return (
            _assetStore[uuid].name,
            _assetStore[uuid].description,
            _assetStore[uuid].manufacturer
        );
    }

    function isOwnerOf(address owner, string memory uuid)
        external
        view
        validAddress(owner)
        nonEmptyString(uuid)
        returns (bool)
    {
        return _walletStore[owner][uuid];
    }
}
