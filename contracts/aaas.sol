// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Access Management System for Digital Assets
/// @notice Manages asset creation, ownership, and role-based access control
/// @dev Implements time-based temporary access and batch operations for efficiency
contract AccessManagement {

    /// @notice Authorization structure for access control
    /// @dev Stores role, active status, expiration timestamp, and array index
    struct Authorization {
        string role;           // Role name (e.g., "admin", "permanent", "temporary")
        bool active;           // Whether this authorization is currently active
        uint256 expiresAt;     // Unix timestamp for expiration, 0 for permanent access
        uint index;            // Index in the authorization list array
    }

    /// @notice Asset structure representing a digital asset
    /// @dev Contains owner, description, and authorization mappings
    struct Asset {
        address owner;         // Owner address with full control
        string description;    // Human-readable asset description
        address[] authorizationList;  // List of all authorized addresses
        mapping(address => Authorization) authorizationStructs;  // Authorization details per address
        bool initialized;      // Whether this asset has been created
    }

    /// @notice Access log entry for batch audit logging
    /// @dev Used by IoT devices to submit multiple access logs in one transaction
    struct AccessLogEntry {
        address user;          // User who attempted access
        string assetKey;       // Asset that was accessed
        uint256 timestamp;     // When the access occurred (Unix timestamp)
        bool granted;          // Whether access was granted
    }

    mapping(string => Asset) assetStructs;  // Mapping from asset key to Asset
    string[] assetList;  // List of all asset keys

    /// @notice Emitted when a new asset is created
    event AssetCreate(address indexed account, string indexed assetKey, string assetDescription);

    /// @notice Emitted when asset creation is rejected (e.g., duplicate key)
    event RejectCreate(address indexed account, string indexed assetKey, string message);

    /// @notice Emitted when an authorization is added to an asset
    event AuthorizationCreate(address indexed account, string indexed assetKey, string authorizationRole);

    /// @notice Emitted when an authorization is removed from an asset
    event AuthorizationRemove(address indexed account, string indexed assetKey);

    /// @notice Emitted when someone attempts to access an asset
    event AccessLog(address indexed account, string indexed assetKey, bool accessGranted);

    /// @notice Emitted when asset ownership is transferred
    event OwnershipTransferred(string indexed assetKey, address indexed oldOwner, address indexed newOwner);


    /// @notice Creates a new asset with a unique key
    /// @dev Asset key must be unique and not already exist
    /// @param assetKey Unique identifier for the asset
    /// @param assetDescription Human-readable description of the asset
    /// @return success True if asset was created successfully
    function newAsset(string calldata assetKey, string calldata assetDescription) external returns(bool success) {
        require(bytes(assetKey).length > 0, "Asset key cannot be empty");
        require(bytes(assetDescription).length > 0, "Description cannot be empty");
        if(assetStructs[assetKey].initialized) {
            emit RejectCreate(msg.sender, assetKey, "Asset with this Serial already exists.");
            return false;
        }
        assetStructs[assetKey].owner = msg.sender;
        assetStructs[assetKey].description = assetDescription;
        assetStructs[assetKey].initialized = true;
        assetList.push(assetKey);
        emit AssetCreate(msg.sender, assetKey, assetDescription);
        return true;
    }

    /// @notice Retrieves asset information
    /// @param assetKey The unique identifier of the asset
    /// @return assetOwner The address of the asset owner
    /// @return assetDescription The description of the asset
    /// @return initialized Whether the asset exists
    /// @return authorizationCount Number of authorized users
    function getAsset(string calldata assetKey) external view returns(address assetOwner, string memory assetDescription, bool initialized, uint authorizationCount) {
        return(assetStructs[assetKey].owner, assetStructs[assetKey].description, assetStructs[assetKey].initialized, assetStructs[assetKey].authorizationList.length);
    }

    /// @notice Adds authorization without expiration (permanent access)
    /// @dev Calls the overloaded function with duration = 0
    /// @param assetKey The unique identifier of the asset
    /// @param authorizationKey The address to authorize
    /// @param authorizationRole The role to assign (e.g., "admin", "permanent", "temporary")
    /// @return success True if authorization was added successfully
    function addAuthorization(string calldata assetKey, address authorizationKey, string calldata authorizationRole) external returns(bool success) {
        return addAuthorization(assetKey, authorizationKey, authorizationRole, 0);
    }

    /// @notice Adds authorization with optional expiration
    /// @dev For "temporary" roles, duration must be greater than 0
    /// @param assetKey The unique identifier of the asset
    /// @param authorizationKey The address to authorize
    /// @param authorizationRole The role to assign
    /// @param duration Duration in seconds (0 for permanent access)
    /// @return success True if authorization was added successfully
    function addAuthorization(string calldata assetKey, address authorizationKey, string calldata authorizationRole, uint256 duration) public returns(bool success) {
        require(authorizationKey != address(0), "Invalid address");
        require(bytes(authorizationRole).length > 0, "Role cannot be empty");
        require(assetStructs[assetKey].initialized, "Asset does not exist");
        require(assetStructs[assetKey].owner == msg.sender || isAuthorized(assetKey, msg.sender), "Only the owner or admins can add authorizations.");

        // Calculate expiration time
        uint256 expiresAt = 0;
        if (keccak256(abi.encodePacked(authorizationRole)) == keccak256(abi.encodePacked("temporary"))) {
            require(duration > 0, "Temporary roles must have expiration duration");
            expiresAt = block.timestamp + duration;
        }

        // Only push if not already in the list
        if (!assetStructs[assetKey].authorizationStructs[authorizationKey].active) {
            assetStructs[assetKey].authorizationList.push(authorizationKey);
        }

        assetStructs[assetKey].authorizationStructs[authorizationKey].role = authorizationRole;
        assetStructs[assetKey].authorizationStructs[authorizationKey].active = true;
        assetStructs[assetKey].authorizationStructs[authorizationKey].expiresAt = expiresAt;
        emit AuthorizationCreate(authorizationKey, assetKey, authorizationRole);
        return true;
    }

    /// @notice Removes authorization from an asset
    /// @dev Only owner or authorized admins can remove authorizations
    /// @param assetKey The unique identifier of the asset
    /// @param authorizationKey The address to remove authorization from
    /// @return success True if authorization was removed successfully
    function removeAuthorization(string calldata assetKey, address authorizationKey) external returns(bool success) {
        require(assetStructs[assetKey].owner == msg.sender || isAuthorized(assetKey, msg.sender), "Only the owner or admins can remove authorizations.");

        // Mark as inactive
        assetStructs[assetKey].authorizationStructs[authorizationKey].role =  '';
        assetStructs[assetKey].authorizationStructs[authorizationKey].active =  false;

        // Remove from authorizationList array
        address[] storage authList = assetStructs[assetKey].authorizationList;
        for (uint i = 0; i < authList.length; i++) {
            if (authList[i] == authorizationKey) {
                // Replace with last element and pop
                authList[i] = authList[authList.length - 1];
                authList.pop();
                break;
            }
        }

        emit AuthorizationRemove(authorizationKey, assetKey);
        return true;
    }

    /// @notice Gets the authorization role for a specific address on an asset
    /// @param assetKey The unique identifier of the asset
    /// @param authorizationKey The address to check
    /// @return authorizationRole The role assigned to the address
    function getAssetAuthorization(string calldata assetKey, address authorizationKey) external view returns(string memory authorizationRole) {
        return assetStructs[assetKey].authorizationStructs[authorizationKey].role;
    }

    /// @notice Returns the total number of assets
    /// @return assetCount The number of assets in the system
    function getAssetCount() external view returns(uint assetCount) {
        return assetList.length;
    }

    /// @notice Gets the asset key at a specific index
    /// @param row The index in the asset list
    /// @return assetkey The asset key at the specified index
    function getAssetAtIndex(uint row) external view returns(string memory assetkey) {
        require(row < assetList.length, "Index out of bounds");
        return assetList[row];
    }

    /// @notice Returns the number of authorizations for an asset
    /// @param assetKey The unique identifier of the asset
    /// @return authorizationCount The number of authorized addresses
    function getAssetAuthorizationCount(string calldata assetKey) external view returns(uint authorizationCount) {
        return assetStructs[assetKey].authorizationList.length;
    }

    /// @notice Gets the authorized address at a specific index for an asset
    /// @param assetKey The unique identifier of the asset
    /// @param authorizationRow The index in the authorization list
    /// @return authorizationKey The address at the specified index
    function getAssetAuthorizationAtIndex(string calldata assetKey, uint authorizationRow) external view returns(address authorizationKey) {
        require(authorizationRow < assetStructs[assetKey].authorizationList.length, "Index out of bounds");
        return assetStructs[assetKey].authorizationList[authorizationRow];
    }

    /// @notice Internal helper to check if a user is authorized and not expired
    /// @dev Checks both active status and expiration timestamp
    /// @param assetKey The unique identifier of the asset
    /// @param user The address to check
    /// @return bool True if user is authorized and not expired
    function isAuthorized(string calldata assetKey, address user) internal view returns(bool) {
        Authorization memory auth = assetStructs[assetKey].authorizationStructs[user];
        if (!auth.active) return false;
        if (auth.expiresAt > 0 && auth.expiresAt < block.timestamp) return false;
        return true;
    }

    /// @notice Attempts to access an asset and logs the result
    /// @dev Emits AccessLog event with the result
    /// @param assetKey The unique identifier of the asset
    /// @return success True if access was granted
    function getAccess(string calldata assetKey) external returns (bool success) {
        if (assetStructs[assetKey].owner == msg.sender || isAuthorized(assetKey, msg.sender)){
            emit AccessLog(msg.sender, assetKey, true);
            return true;
        } else {
            emit AccessLog(msg.sender, assetKey, false);
            return false;
        }
    }

    /// @notice Checks if a user can access an asset without creating an audit trail
    /// @dev View function - free to call off-chain, ideal for IoT devices and UI state management
    /// @dev Does NOT emit events or modify state, making it gas-free when called off-chain
    /// @param assetKey The unique identifier of the asset
    /// @param user The address to check
    /// @return bool True if user is owner or has valid non-expired authorization
    function canAccess(string calldata assetKey, address user)
        external view returns(bool) {
        return assetStructs[assetKey].owner == user || isAuthorized(assetKey, user);
    }

    /// @notice Batch log multiple access events in a single transaction
    /// @dev More gas-efficient than calling getAccess() multiple times
    /// @dev Intended for IoT devices (e.g., door controllers) to periodically upload access logs
    /// @dev Caller is responsible for ensuring log integrity and accuracy
    /// @param entries Array of access log entries to record
    /// @return success True if all logs were recorded successfully
    function batchLogAccess(AccessLogEntry[] calldata entries)
        external returns(bool success) {
        require(entries.length > 0, "Empty log entries");
        require(entries.length <= 100, "Too many entries, max 100 per batch");

        for (uint i = 0; i < entries.length; i++) {
            emit AccessLog(entries[i].user, entries[i].assetKey, entries[i].granted);
        }

        return true;
    }

    /// @notice Transfers ownership of an asset to a new owner
    /// @dev Only the current owner can transfer ownership
    /// @param assetKey The unique identifier of the asset
    /// @param newOwner The address of the new owner
    /// @return success True if ownership was transferred successfully
    function transferOwnership(string calldata assetKey, address newOwner) external returns(bool success) {
        require(bytes(assetKey).length > 0, "Asset key cannot be empty");
        require(newOwner != address(0), "Invalid new owner address");
        require(assetStructs[assetKey].initialized, "Asset does not exist");
        require(assetStructs[assetKey].owner == msg.sender, "Only the owner can transfer ownership");

        address oldOwner = assetStructs[assetKey].owner;
        assetStructs[assetKey].owner = newOwner;

        emit OwnershipTransferred(assetKey, oldOwner, newOwner);
        return true;
    }

    /// @notice Adds multiple authorizations in a single transaction
    /// @dev More gas-efficient than calling addAuthorization multiple times
    /// @param assetKey The unique identifier of the asset
    /// @param authorizationKeys Array of addresses to authorize
    /// @param authorizationRoles Array of roles corresponding to the addresses
    /// @return success True if all authorizations were added successfully
    function addAuthorizationBatch(
        string calldata assetKey,
        address[] calldata authorizationKeys,
        string[] calldata authorizationRoles
    ) external returns(bool success) {
        require(authorizationKeys.length == authorizationRoles.length, "Array length mismatch");
        require(authorizationKeys.length > 0, "Empty arrays provided");

        for (uint i = 0; i < authorizationKeys.length; i++) {
            _addAuthorizationInternal(assetKey, authorizationKeys[i], authorizationRoles[i], 0);
        }

        return true;
    }

    /// @notice Adds multiple authorizations with expiration durations in a single transaction
    /// @dev More gas-efficient for adding multiple temporary authorizations
    /// @param assetKey The unique identifier of the asset
    /// @param authorizationKeys Array of addresses to authorize
    /// @param authorizationRoles Array of roles corresponding to the addresses
    /// @param durations Array of durations in seconds (0 for permanent)
    /// @return success True if all authorizations were added successfully
    function addAuthorizationBatchWithDuration(
        string calldata assetKey,
        address[] calldata authorizationKeys,
        string[] calldata authorizationRoles,
        uint256[] calldata durations
    ) external returns(bool success) {
        require(authorizationKeys.length == authorizationRoles.length, "Keys and roles length mismatch");
        require(authorizationKeys.length == durations.length, "Keys and durations length mismatch");
        require(authorizationKeys.length > 0, "Empty arrays provided");

        for (uint i = 0; i < authorizationKeys.length; i++) {
            _addAuthorizationInternal(assetKey, authorizationKeys[i], authorizationRoles[i], durations[i]);
        }

        return true;
    }

    /// @notice Removes multiple authorizations in a single transaction
    /// @dev More gas-efficient than calling removeAuthorization multiple times
    /// @param assetKey The unique identifier of the asset
    /// @param authorizationKeys Array of addresses to remove authorization from
    /// @return success True if all authorizations were removed successfully
    function removeAuthorizationBatch(
        string calldata assetKey,
        address[] calldata authorizationKeys
    ) external returns(bool success) {
        require(authorizationKeys.length > 0, "Empty array provided");
        require(assetStructs[assetKey].owner == msg.sender || isAuthorized(assetKey, msg.sender), "Only the owner or admins can remove authorizations.");

        for (uint i = 0; i < authorizationKeys.length; i++) {
            assetStructs[assetKey].authorizationStructs[authorizationKeys[i]].role = '';
            assetStructs[assetKey].authorizationStructs[authorizationKeys[i]].active = false;
            emit AuthorizationRemove(authorizationKeys[i], assetKey);
        }

        return true;
    }

    /// @notice Internal helper for adding authorizations (used by batch operations)
    /// @dev Prevents code duplication in batch functions
    function _addAuthorizationInternal(
        string calldata assetKey,
        address authorizationKey,
        string calldata authorizationRole,
        uint256 duration
    ) internal {
        require(authorizationKey != address(0), "Invalid address");
        require(bytes(authorizationRole).length > 0, "Role cannot be empty");
        require(assetStructs[assetKey].initialized, "Asset does not exist");
        require(assetStructs[assetKey].owner == msg.sender || isAuthorized(assetKey, msg.sender), "Only the owner or admins can add authorizations.");

        // Calculate expiration time
        uint256 expiresAt = 0;
        if (keccak256(abi.encodePacked(authorizationRole)) == keccak256(abi.encodePacked("temporary"))) {
            require(duration > 0, "Temporary roles must have expiration duration");
            expiresAt = block.timestamp + duration;
        }

        // Only push if not already in the list
        if (!assetStructs[assetKey].authorizationStructs[authorizationKey].active) {
            assetStructs[assetKey].authorizationList.push(authorizationKey);
        }

        assetStructs[assetKey].authorizationStructs[authorizationKey].role = authorizationRole;
        assetStructs[assetKey].authorizationStructs[authorizationKey].active = true;
        assetStructs[assetKey].authorizationStructs[authorizationKey].expiresAt = expiresAt;
        emit AuthorizationCreate(authorizationKey, assetKey, authorizationRole);
    }
}
