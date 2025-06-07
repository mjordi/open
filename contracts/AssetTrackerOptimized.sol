// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AssetTracker Optimized
 * @dev Optimized version of asset tracking with improved gas efficiency and security
 * @author Optimized Smart Contract Team
 */
contract AssetTrackerOptimized {
    // Custom errors for gas efficiency
    error AssetAlreadyExists(string uuid);
    error AssetNotFound(string uuid);
    error NotAssetOwner(address caller, string uuid);
    error InvalidAddress(address addr);
    error EmptyString(string param);

    // Events
    event AssetCreated(
        address indexed owner,
        string indexed uuid,
        string name,
        string manufacturer,
        uint256 timestamp
    );
    
    event AssetTransferred(
        address indexed from,
        address indexed to,
        string indexed uuid,
        uint256 timestamp
    );

    // Struct optimization: pack variables efficiently
    struct Asset {
        address owner;          // 20 bytes
        uint96 timestamp;       // 12 bytes - fits in same slot as address
        string name;
        string description;
        string manufacturer;
    }

    // State variables
    mapping(string => Asset) private _assets;
    mapping(address => mapping(string => bool)) private _ownerAssets;
    mapping(address => uint256) private _assetCounts;
    
    // Total asset count for statistics
    uint256 private _totalAssets;

    // Modifiers
    modifier validAddress(address addr) {
        if (addr == address(0)) {
            revert InvalidAddress(addr);
        }
        _;
    }

    modifier nonEmptyString(string memory str) {
        if (bytes(str).length == 0) {
            revert EmptyString(str);
        }
        _;
    }

    modifier assetExists(string memory uuid) {
        if (_assets[uuid].owner == address(0)) {
            revert AssetNotFound(uuid);
        }
        _;
    }

    modifier onlyAssetOwner(string memory uuid) {
        if (_assets[uuid].owner != msg.sender) {
            revert NotAssetOwner(msg.sender, uuid);
        }
        _;
    }

    /**
     * @dev Creates a new asset
     * @param name Asset name
     * @param description Asset description
     * @param uuid Unique identifier for the asset
     * @param manufacturer Asset manufacturer
     */
    function createAsset(
        string calldata name,
        string calldata description,
        string calldata uuid,
        string calldata manufacturer
    ) external nonEmptyString(name) nonEmptyString(uuid) nonEmptyString(manufacturer) {
        // Check if asset already exists
        if (_assets[uuid].owner != address(0)) {
            revert AssetAlreadyExists(uuid);
        }

        // Create asset with optimized storage
        /* solhint-disable not-rely-on-time */
        _assets[uuid] = Asset({
            owner: msg.sender,
            timestamp: uint96(block.timestamp),
            name: name,
            description: description,
            manufacturer: manufacturer
        });

        // Update ownership tracking
        _ownerAssets[msg.sender][uuid] = true;
        _assetCounts[msg.sender]++;
        _totalAssets++;

        emit AssetCreated(msg.sender, uuid, name, manufacturer, block.timestamp);
        /* solhint-enable not-rely-on-time */
    }

    /**
     * @dev Transfers asset ownership
     * @param to New owner address
     * @param uuid Asset UUID
     */
    function transferAsset(address to, string calldata uuid)
        external
        validAddress(to)
        assetExists(uuid)
        onlyAssetOwner(uuid)
    {
        address from = msg.sender;
        
        // Update ownership
        /* solhint-disable not-rely-on-time */
        _assets[uuid].owner = to;
        _assets[uuid].timestamp = uint96(block.timestamp);
        
        // Update tracking mappings
        _ownerAssets[from][uuid] = false;
        _ownerAssets[to][uuid] = true;
        
        // Update counters
        _assetCounts[from]--;
        _assetCounts[to]++;

        emit AssetTransferred(from, to, uuid, block.timestamp);
        /* solhint-enable not-rely-on-time */
    }

    /**
     * @dev Gets asset information by UUID
     * @param uuid Asset UUID
     * @return owner Asset owner address
     * @return name Asset name
     * @return description Asset description
     * @return manufacturer Asset manufacturer
     * @return timestamp Creation timestamp
     */
    function getAsset(string calldata uuid)
        external
        view
        assetExists(uuid)
        returns (
            address owner,
            string memory name,
            string memory description,
            string memory manufacturer,
            uint256 timestamp
        )
    {
        Asset storage asset = _assets[uuid];
        return (
            asset.owner,
            asset.name,
            asset.description,
            asset.manufacturer,
            asset.timestamp
        );
    }

    /**
     * @dev Checks if an address owns a specific asset
     * @param owner Address to check
     * @param uuid Asset UUID
     * @return True if owner owns the asset
     */
    function isOwnerOf(address owner, string calldata uuid)
        external
        view
        returns (bool)
    {
        return _ownerAssets[owner][uuid];
    }

    /**
     * @dev Gets the number of assets owned by an address
     * @param owner Address to check
     * @return Number of assets owned
     */
    function getAssetCount(address owner) external view returns (uint256) {
        return _assetCounts[owner];
    }

    /**
     * @dev Gets total number of assets in the system
     * @return Total asset count
     */
    function getTotalAssetCount() external view returns (uint256) {
        return _totalAssets;
    }

    /**
     * @dev Checks if an asset exists
     * @param uuid Asset UUID
     * @return exists Boolean indicating if the asset exists.
     */
    // slither-disable-next-line block-timestamp
    // This is a false positive. The check is for existence, not a time-based comparison.
    function checkAssetExists(string calldata uuid) external view returns (bool exists) {
        return _assets[uuid].owner != address(0);
    }

    /**
     * @dev Gets asset owner
     * @param uuid Asset UUID
     * @return Owner address
     */
    function getAssetOwner(string calldata uuid)
        external
        view
        assetExists(uuid)
        returns (address)
    {
        return _assets[uuid].owner;
    }

    /**
     * @dev Emergency function to pause transfers (can be extended with access control)
     */
    function getContractInfo()
        external
        pure
        returns (string memory name, string memory version)
    {
        return ("AssetTrackerOptimized", "2.0.0");
    }
} 