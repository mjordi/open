// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AssetAlreadyExists, NotOwnerOrAdmin } from "./CustomErrors.sol";

contract AccessManagement {
    struct Authorization {
        string role;
        bool active;
    }

    struct Asset {
        address owner;
        string description;
        address[] authorizationList;
        mapping(address => Authorization) authorizationStructs;
        bool initialized;
    }

    mapping(string => Asset) private _assetStructs;
    string[] private _assetList;

    event AssetCreated(
        address indexed owner,
        string indexed assetKey,
        string description
    );
    event AssetCreationRejected(
        address indexed account,
        string indexed assetKey,
        string message
    );
    event AuthorizationAdded(
        address indexed authorizer,
        address indexed authorized,
        string indexed assetKey,
        string role
    );
    event AuthorizationRemoved(
        address indexed authorizer,
        address indexed authorized,
        string indexed assetKey
    );
    event AccessAttempt(
        address indexed account,
        string indexed assetKey,
        bool accessGranted
    );

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
        _assetStructs[assetKey].authorizationList.push(authorizationKey);
        _assetStructs[assetKey].authorizationStructs[authorizationKey]
            .role = authorizationRole;
        _assetStructs[assetKey].authorizationStructs[authorizationKey]
            .active = true;
        emit AuthorizationAdded(
            msg.sender,
            authorizationKey,
            assetKey,
            authorizationRole
        );
    }

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
        _assetStructs[assetKey]
            .authorizationStructs[authorizationKey]
            .role = "";
        _assetStructs[assetKey]
            .authorizationStructs[authorizationKey]
            .active = false;
        emit AuthorizationRemoved(msg.sender, authorizationKey, assetKey);
    }

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

    function getAssetCount() public view returns (uint256 assetCount) {
        return _assetList.length;
    }

    function getAssetAtIndex(uint256 row) public view returns (string memory assetkey) {
        return _assetList[row];
    }

    function getAssetAuthorizationCount(string memory assetKey)
        public
        view
        returns (uint256 authorizationCount)
    {
        return (_assetStructs[assetKey].authorizationList.length);
    }

    function getAssetAuthorizationAtIndex(
        string memory assetKey,
        uint256 authorizationRow
    ) public view returns (address authorizationKey) {
        return (_assetStructs[assetKey].authorizationList[authorizationRow]);
    }

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