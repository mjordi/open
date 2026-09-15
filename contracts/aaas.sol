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
    /// @dev Used by authorized reporters (e.g. IoT devices) to submit multiple access logs
    ///      in one transaction. Every field is self-reported by the caller and is therefore
    ///      only as trustworthy as the reporter recorded in the emitted event.
    struct AccessLogEntry {
        address user;          // User who attempted access
        string assetKey;       // Asset that was accessed
        uint256 timestamp;     // When the access occurred, as reported (Unix timestamp)
        bool granted;          // Whether the reporter granted access
    }

    mapping(string => Asset) assetStructs;  // Mapping from asset key to Asset
    string[] assetList;  // List of all asset keys

    /// @notice Maximum number of entries accepted by a single batchLogAccess() call
    uint256 private constant MAX_LOG_BATCH_SIZE = 100;

    /// @notice Emitted when a new asset is created
    event AssetCreate(address indexed account, string indexed assetKey, string assetDescription);

    /// @notice Emitted when asset creation is rejected (e.g., duplicate key)
    event RejectCreate(address indexed account, string indexed assetKey, string message);

    /// @notice Emitted when an authorization is added to an asset
    event AuthorizationCreate(address indexed account, string indexed assetKey, string authorizationRole);

    /// @notice Emitted when an authorization is removed from an asset
    event AuthorizationRemove(address indexed account, string indexed assetKey);

    /// @notice Emitted when someone attempts to access an asset through this contract
    event AccessLog(address indexed account, string indexed assetKey, bool accessGranted);

    /// @notice Emitted when an authorized reporter records an access decision that was made off-chain
    /// @dev Deliberately distinct from AccessLog: the decision was not verified by this contract,
    ///      so consumers must weigh it against the `reporter` that submitted it
    /// @param reporter The account that submitted the log entry (the asset owner or an authorized address)
    /// @param account The user the reporter says attempted access
    /// @param assetKey The asset the reporter says was accessed
    /// @param accessGranted Whether the reporter granted access
    /// @param occurredAt Reporter-supplied Unix timestamp of the access attempt
    event AccessLogReported(
        address indexed reporter,
        address indexed account,
        string indexed assetKey,
        bool accessGranted,
        uint256 occurredAt
    );

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
        _addAuthorizationInternal(assetKey, authorizationKey, authorizationRole, duration);
        return true;
    }

    /// @notice Removes authorization from an asset
    /// @dev Only owner or authorized admins can remove authorizations
    /// @param assetKey The unique identifier of the asset
    /// @param authorizationKey The address to remove authorization from
    /// @return success True if authorization was removed successfully
    function removeAuthorization(string calldata assetKey, address authorizationKey) external returns(bool success) {
        require(assetStructs[assetKey].owner == msg.sender || isAuthorized(assetKey, msg.sender), "Only the owner or admins can remove authorizations.");

        _removeAuthorizationInternal(assetKey, authorizationKey);
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
    /// @return bool True if the asset exists and user is its owner or has a valid, non-expired authorization
    function canAccess(string calldata assetKey, address user)
        external view returns(bool) {
        if (!assetStructs[assetKey].initialized) return false;
        return assetStructs[assetKey].owner == user || isAuthorized(assetKey, user);
    }

    /// @notice Returns the full authorization record for an address, including its expiration
    /// @dev Lets off-chain caches (e.g. door controllers) drop entries that expire between syncs;
    ///      addresses stay in the authorization list until explicitly removed, so `active` and
    ///      `expiresAt` must both be honoured before treating a listed address as authorized
    /// @param assetKey The unique identifier of the asset
    /// @param authorizationKey The address to look up
    /// @return authorizationRole The role assigned to the address ('' if none)
    /// @return active Whether the authorization is currently active (ignores expiration)
    /// @return expiresAt Unix timestamp at which the authorization expires, 0 if it never expires
    function getAuthorizationDetails(string calldata assetKey, address authorizationKey)
        external view returns(string memory authorizationRole, bool active, uint256 expiresAt) {
        Authorization storage auth = assetStructs[assetKey].authorizationStructs[authorizationKey];
        return (auth.role, auth.active, auth.expiresAt);
    }

    /// @notice Batch report access decisions that were made off-chain, in a single transaction
    /// @dev Much cheaper than one transaction per access; intended for devices (e.g. door
    ///      controllers) that validate against a cached permission set and upload logs periodically
    /// @dev Only the asset owner or an address authorized on that asset may report for it, so every
    ///      entry can be traced back to an accountable reporter. Entries are still self-reported:
    ///      they are emitted as AccessLogReported, never as AccessLog, so they can never be mistaken
    ///      for an access decision this contract verified itself
    /// @param entries Array of access log entries to record, at most MAX_LOG_BATCH_SIZE
    /// @return success True if all logs were recorded successfully
    function batchLogAccess(AccessLogEntry[] calldata entries)
        external returns(bool success) {
        uint256 entryCount = entries.length;
        require(entryCount > 0, "Empty log entries");
        require(entryCount <= MAX_LOG_BATCH_SIZE, "Too many entries, max 100 per batch");

        for (uint i = 0; i < entryCount; i++) {
            AccessLogEntry calldata entry = entries[i];
            require(entry.user != address(0), "Invalid user address");
            require(entry.timestamp > 0, "Log timestamp cannot be zero");
            require(assetStructs[entry.assetKey].initialized, "Asset does not exist");
            require(
                assetStructs[entry.assetKey].owner == msg.sender || isAuthorized(entry.assetKey, msg.sender),
                "Only the owner or authorized reporters can log access"
            );

            emit AccessLogReported(msg.sender, entry.user, entry.assetKey, entry.granted, entry.timestamp);
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
            _removeAuthorizationInternal(assetKey, authorizationKeys[i]);
        }

        return true;
    }

    /// @notice Internal helper for adding authorizations (used by batch operations)
    /// @dev Prevents code duplication in batch functions
    /// @param assetKey The unique identifier of the asset
    /// @param authorizationKey The address to authorize
    /// @param authorizationRole The role to assign
    /// @param duration Duration in seconds (0 for permanent access)
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

        // Only push if not already in the list, and remember where it landed so
        // removal can find it without scanning the whole list
        if (!assetStructs[assetKey].authorizationStructs[authorizationKey].active) {
            assetStructs[assetKey].authorizationStructs[authorizationKey].index = assetStructs[assetKey].authorizationList.length;
            assetStructs[assetKey].authorizationList.push(authorizationKey);
        }

        assetStructs[assetKey].authorizationStructs[authorizationKey].role = authorizationRole;
        assetStructs[assetKey].authorizationStructs[authorizationKey].active = true;
        assetStructs[assetKey].authorizationStructs[authorizationKey].expiresAt = expiresAt;
        emit AuthorizationCreate(authorizationKey, assetKey, authorizationRole);
    }

    /// @notice Internal helper for removing authorizations (used by the single and batch paths)
    /// @dev Keeps authorizationList in sync with the authorization records: a stale entry would
    ///      still be returned by getAssetAuthorizationAtIndex() and read as authorized by
    ///      integrations that cache the list
    /// @param assetKey The unique identifier of the asset
    /// @param authorizationKey The address to remove authorization from
    function _removeAuthorizationInternal(string calldata assetKey, address authorizationKey) internal {
        Authorization storage auth = assetStructs[assetKey].authorizationStructs[authorizationKey];

        // Only touch the list for an address that is actually on it; `index` is
        // meaningless for an address that was never authorized
        if (auth.active) {
            address[] storage authList = assetStructs[assetKey].authorizationList;
            uint removedIndex = auth.index;
            address lastAuthorization = authList[authList.length - 1];

            // Move the last entry into the freed slot and keep its index correct
            authList[removedIndex] = lastAuthorization;
            assetStructs[assetKey].authorizationStructs[lastAuthorization].index = removedIndex;
            authList.pop();
        }

        auth.role = '';
        auth.active = false;
        auth.expiresAt = 0;
        auth.index = 0;

        emit AuthorizationRemove(authorizationKey, assetKey);
    }
}
