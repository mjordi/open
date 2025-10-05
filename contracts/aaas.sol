// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { AssetAlreadyExists, NotOwnerOrAdmin } from "./CustomErrors.sol";

/// @title AccessManagement
/// @author Your Name
/// @notice Manages asset creation, ownership, and access control.
contract AccessManagement {
    struct Authorization {
        string role;
        bool active;
    }

    struct Asset {
        address owner;
        bool initialized;
        string description;
        address[] authorizationList;
        mapping(address => Authorization) authorizationStructs;
        mapping(address => uint256) authorizationIndex;
    }

    mapping(string => Asset) private _assetStructs;
    string[] private _assetList;

    /// @notice Emitted when a new asset is created.
    /// @param owner The address of the asset owner.
    /// @param assetKey The unique identifier for the asset.
    /// @param description A description of the asset.
    event AssetCreated(
        address indexed owner,
        string indexed assetKey,
        string description
    );

    /// @notice Emitted when asset creation is rejected.
    /// @param account The address that attempted to create the asset.
    /// @param assetKey The asset key that was rejected.
    /// @param message A message explaining the reason for rejection.
    event AssetCreationRejected(
        address indexed account,
        string indexed assetKey,
        string message
    );

    /// @notice Emitted when an authorization is added to an asset.
    /// @param authorizer The address that granted the authorization.
    /// @param authorized The address that received the authorization.
    /// @param assetKey The asset to which the authorization was added.
    /// @param role The role assigned to the authorized address.
    event AuthorizationAdded(
        address indexed authorizer,
        address indexed authorized,
        string indexed assetKey,
        string role
    );

    /// @notice Emitted when an authorization is removed from an asset.
    /// @param authorizer The address that removed the authorization.
    /// @param authorized The address whose authorization was removed.
    /// @param assetKey The asset from which the authorization was removed.
    event AuthorizationRemoved(
        address indexed authorizer,
        address indexed authorized,
        string indexed assetKey
    );

    /// @notice Emitted when an attempt is made to access an asset.
    /// @param account The address that attempted to access the asset.
    /// @param assetKey The asset that was accessed.
    /// @param accessGranted A boolean indicating whether access was granted.
    event AccessAttempt(
        address indexed account,
        string indexed assetKey,
        bool indexed accessGranted
    );

    /// @notice Creates a new asset.
    /// @param assetKey The unique identifier for the new asset.
    /// @param assetDescription A description of the new asset.
    function newAsset(string memory assetKey, string memory assetDescription)
        public
    {
        if (_assetStructs[assetKey].initialized) {
            revert AssetAlreadyExists(assetKey);
        }
        _assetStructs[assetKey].owner = msg.sender;
        _assetStructs[assetKey].description = assetDescription;
        _assetStructs[assetKey].initialized = true;
        _assetList.push(assetKey);
        emit AssetCreated(msg.sender, assetKey, assetDescription);
    }

    /// @notice Retrieves information about an asset.
    /// @param assetKey The key of the asset to retrieve.
    /// @return assetOwner The owner of the asset.
    /// @return assetDescription The description of the asset.
    /// @return initialized A boolean indicating if the asset is initialized.
    /// @return authorizationCount The number of authorizations for the asset.
    function getAsset(string memory assetKey)
        public
        view
        returns (
            address assetOwner,
            string memory assetDescription,
            bool initialized,
            uint256 authorizationCount
        )
    {
        return (
            _assetStructs[assetKey].owner,
            _assetStructs[assetKey].description,
            _assetStructs[assetKey].initialized,
            _assetStructs[assetKey].authorizationList.length
        );
    }

    /// @notice Adds an authorization to an asset.
    /// @param assetKey The key of the asset.
    /// @param authorizationKey The address to be authorized.
    /// @param authorizationRole The role to be assigned.
    function addAuthorization(
        string memory assetKey,
        address authorizationKey,
        string memory authorizationRole
    ) public {
        if (
            _assetStructs[assetKey].owner != msg.sender &&
            !_assetStructs[assetKey].authorizationStructs[msg.sender].active
        ) {
            revert NotOwnerOrAdmin(msg.sender);
        }
        Asset storage asset = _assetStructs[assetKey];
        asset.authorizationIndex[authorizationKey] = asset.authorizationList.length;
        asset.authorizationList.push(authorizationKey);
        asset.authorizationStructs[authorizationKey].role = authorizationRole;
        asset.authorizationStructs[authorizationKey].active = true;
        emit AuthorizationAdded(
            msg.sender,
            authorizationKey,
            assetKey,
            authorizationRole
        );
    }

    /// @notice Removes an authorization from an asset.
    /// @param assetKey The key of the asset.
    /// @param authorizationKey The address to be de-authorized.
    function removeAuthorization(
        string memory assetKey,
        address authorizationKey
    ) public {
        if (
            _assetStructs[assetKey].owner != msg.sender &&
            !_assetStructs[assetKey].authorizationStructs[msg.sender].active
        ) {
            revert NotOwnerOrAdmin(msg.sender);
        }
        Asset storage asset = _assetStructs[assetKey];
        uint256 index = asset.authorizationIndex[authorizationKey];
        uint256 lastIndex = asset.authorizationList.length - 1;
        address lastAddress = asset.authorizationList[lastIndex];
        asset.authorizationList[index] = lastAddress;
        asset.authorizationIndex[lastAddress] = index;
        asset.authorizationList.pop();
        delete asset.authorizationIndex[authorizationKey];
        asset.authorizationStructs[authorizationKey].role = "";
        asset.authorizationStructs[authorizationKey].active = false;
        emit AuthorizationRemoved(msg.sender, authorizationKey, assetKey);
    }

    /// @notice Retrieves the authorization role for a given address and asset.
    /// @param assetKey The key of the asset.
    /// @param authorizationKey The address to check.
    /// @return authorizationRole The role of the address for the asset.
    function getAssetAuthorization(
        string memory assetKey,
        address authorizationKey
    ) public view returns (string memory authorizationRole) {
        return (
            _assetStructs[assetKey]
                .authorizationStructs[authorizationKey]
                .role
        );
    }

    /// @notice Gets the total number of assets.
    /// @return assetCount The total number of assets.
    function getAssetCount() public view returns (uint256 assetCount) {
        return _assetList.length;
    }

    /// @notice Retrieves an asset key by its index in the asset list.
    /// @param row The index of the asset.
    /// @return assetkey The key of the asset at the given index.
    function getAssetAtIndex(uint256 row) public view returns (string memory assetkey) {
        return _assetList[row];
    }

    /// @notice Gets the number of authorizations for an asset.
    /// @param assetKey The key of the asset.
    /// @return authorizationCount The number of authorizations for the asset.
    function getAssetAuthorizationCount(string memory assetKey)
        public
        view
        returns (uint256 authorizationCount)
    {
        return (_assetStructs[assetKey].authorizationList.length);
    }

    /// @notice Retrieves an authorized address by its index.
    /// @param assetKey The key of the asset.
    /// @param authorizationRow The index of the authorization.
    /// @return authorizationKey The address at the given index.
    function getAssetAuthorizationAtIndex(
        string memory assetKey,
        uint256 authorizationRow
    ) public view returns (address authorizationKey) {
        Asset storage asset = _assetStructs[assetKey];
        return asset.authorizationList[authorizationRow];
    }

    /// @notice Checks if the sender has access to a given asset.
    /// @param assetKey The key of the asset to check.
    /// @return success A boolean indicating whether access is granted.
    function getAccess(string memory assetKey) public returns (bool success) {
        if (
            _assetStructs[assetKey].owner == msg.sender ||
            _assetStructs[assetKey].authorizationStructs[msg.sender].active
        ) {
            emit AccessAttempt(msg.sender, assetKey, true);
            return true;
        } else {
            emit AccessAttempt(msg.sender, assetKey, false);
            return false;
        }
    }
}