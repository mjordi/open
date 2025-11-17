// SPDX-License-Identifier: MIT
// https://blog.codecentric.de/en/2018/01/implementing-smart-contracts/
// Demo: https://asset-tracker.codecentric.de/

pragma solidity ^0.8.20;

/// @title Asset Tracker for Manufacturing and Supply Chain
/// @notice Manages asset creation and transfer in a supply chain context
/// @dev Implements ownership tracking via wallet mappings
contract AssetTracker {
    /// @notice Asset structure for supply chain items
    /// @dev Stores asset metadata and initialization status
    struct Asset {
        string name;           // Asset name
        string description;    // Asset description
        string manufacturer;   // Manufacturer identifier
        bool initialized;      // Whether this asset exists
    }

    mapping(string => Asset) private assetStore;  // UUID to Asset mapping
    mapping(address => mapping(string => bool)) private walletStore;  // Owner to UUID to ownership status

    /// @notice Emitted when an asset is successfully created
    event AssetCreate(address indexed account, string indexed uuid, string manufacturer);

    /// @notice Emitted when asset creation is rejected
    event RejectCreate(address indexed account, string indexed uuid, string message);

    /// @notice Emitted when an asset is transferred
    event AssetTransfer(address indexed from, address indexed to, string indexed uuid);

    /// @notice Emitted when asset transfer is rejected
    event RejectTransfer(address indexed from, address indexed to, string indexed uuid, string message);

    /// @notice Creates a new asset in the system
    /// @dev UUID must be unique, all fields are required
    /// @param name Name of the asset
    /// @param description Description of the asset
    /// @param uuid Unique identifier for the asset
    /// @param manufacturer Manufacturer identifier
    function createAsset(string calldata name, string calldata description, string calldata uuid, string calldata manufacturer) external {
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

    /// @notice Transfers an asset to another address
    /// @dev Caller must be the current owner of the asset
    /// @param to Recipient address
    /// @param uuid Unique identifier of the asset to transfer
    function transferAsset(address to, string calldata uuid) external {
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

    /// @notice Retrieves asset information by UUID
    /// @param uuid Unique identifier of the asset
    /// @return name The asset name
    /// @return description The asset description
    /// @return manufacturer The manufacturer identifier
    function getAssetByUUID(string calldata uuid) external view returns (string memory name, string memory description, string memory manufacturer) {
        return (assetStore[uuid].name, assetStore[uuid].description, assetStore[uuid].manufacturer);
    }

    /// @notice Checks if an address owns a specific asset
    /// @param owner Address to check ownership for
    /// @param uuid Unique identifier of the asset
    /// @return bool True if the address owns the asset
    function isOwnerOf(address owner, string calldata uuid) external view returns (bool) {
        if(walletStore[owner][uuid]) {
            return true;
        }

        return false;
    }
}
