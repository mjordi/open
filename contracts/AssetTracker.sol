// SPDX-License-Identifier: UNLICENSED
// https://blog.codecentric.de/en/2018/01/implementing-smart-contracts/
// Demo: https://asset-tracker.codecentric.de/

pragma solidity ^0.8.24;

/// @title AssetTracker
/// @author Your Name
/// @notice A simple contract for tracking assets.
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

    /// @notice Emitted when a new asset is created.
    /// @param account The address of the asset owner.
    /// @param uuid The unique identifier for the asset.
    /// @param manufacturer The manufacturer of the asset.
    event AssetCreate(
        address indexed account,
        string indexed uuid,
        string manufacturer
    );

    /// @notice Emitted when an asset is transferred.
    /// @param from The address of the previous owner.
    /// @param to The address of the new owner.
    /// @param uuid The unique identifier for the asset.
    event AssetTransfer(
        address indexed from,
        address indexed to,
        string indexed uuid
    );

    // Modifiers
    modifier nonEmptyString(string calldata str) {
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

    modifier assetExists(string calldata uuid) {
        if (!_assetStore[uuid].initialized) {
            revert AssetNotFound(uuid);
        }
        _;
    }

    modifier onlyAssetOwner(string calldata uuid) {
        if (!_walletStore[msg.sender][uuid]) {
            revert NotAssetOwner(msg.sender, uuid);
        }
        _;
    }

    /// @notice Creates a new asset.
    /// @param name The name of the asset.
    /// @param description A description of the asset.
    /// @param uuid The unique identifier for the asset.
    /// @param manufacturer The manufacturer of the asset.
    function createAsset(
        string calldata name,
        string calldata description,
        string calldata uuid,
        string calldata manufacturer
    )
        external
        nonEmptyString(name)
        nonEmptyString(uuid)
        nonEmptyString(manufacturer)
    {
        if (_assetStore[uuid].initialized) {
            revert AssetExists(uuid);
        }
        _assetStore[uuid] = Asset(name, description, manufacturer, true);
        _walletStore[msg.sender][uuid] = true;
        emit AssetCreate(msg.sender, uuid, manufacturer);
    }

    /// @notice Transfers an asset to a new owner.
    /// @param to The address of the new owner.
    /// @param uuid The unique identifier for the asset.
    function transferAsset(address to, string calldata uuid)
        external
        validAddress(to)
        assetExists(uuid)
        onlyAssetOwner(uuid)
    {
        _walletStore[msg.sender][uuid] = false;
        _walletStore[to][uuid] = true;
        emit AssetTransfer(msg.sender, to, uuid);
    }

    /// @notice Retrieves information about an asset by its UUID.
    /// @param uuid The unique identifier for the asset.
    /// @return name The name of the asset.
    /// @return description The description of the asset.
    /// @return manufacturer The manufacturer of the asset.
    function getAssetByUUID(string calldata uuid)
        external
        view
        nonEmptyString(uuid)
        returns (
            string memory name,
            string memory description,
            string memory manufacturer
        )
    {
        return (
            _assetStore[uuid].name,
            _assetStore[uuid].description,
            _assetStore[uuid].manufacturer
        );
    }

    /// @notice Checks if a given address is the owner of an asset.
    /// @param owner The address to check.
    /// @param uuid The unique identifier for the asset.
    /// @return isOwner A boolean indicating whether the address is the owner.
    function isOwnerOf(address owner, string calldata uuid)
        external
        view
        validAddress(owner)
        nonEmptyString(uuid)
        returns (bool isOwner)
    {
        return _walletStore[owner][uuid];
    }
}
