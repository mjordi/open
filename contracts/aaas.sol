// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AccessManagement {

    struct Authorization {
        string role;
        bool active;
        uint index;
    }

    struct Asset {
        address owner;
        string description;
        address[] authorizationList;
        mapping(address => Authorization) authorizationStructs;
        bool initialized;
    }

    mapping(string => Asset) assetStructs;
    string[] assetList;

    event AssetCreate(address account, string assetKey, string assetDescription);
    event RejectCreate(address account, string assetKey, string message);
    event AuthorizationCreate(address account, string assetKey, string authorizationRole);
    event AuthorizationRemove(address account, string assetKey);
    event AccessLog(address account, string assetKey, bool accessGranted);


    function newAsset(string memory assetKey, string memory assetDescription) public returns(bool success) {
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

    function getAsset(string memory assetKey) public view returns(address assetOwner, string memory assetDescription, bool initialized, uint authorizationCount) {
        return(assetStructs[assetKey].owner, assetStructs[assetKey].description, assetStructs[assetKey].initialized, assetStructs[assetKey].authorizationList.length);
    }

    function addAuthorization(string memory assetKey, address authorizationKey, string memory authorizationRole) public returns(bool success) {
        require(assetStructs[assetKey].owner == msg.sender || assetStructs[assetKey].authorizationStructs[msg.sender].active, "Only the owner or admins can add authorizations.");
        assetStructs[assetKey].authorizationList.push(authorizationKey);
        assetStructs[assetKey].authorizationStructs[authorizationKey].role = authorizationRole;
        assetStructs[assetKey].authorizationStructs[authorizationKey].active = true;
        emit AuthorizationCreate(authorizationKey, assetKey, authorizationRole);
        return true;
    }

    function removeAuthorization(string memory assetKey, address authorizationKey) public returns(bool success) {
        require(assetStructs[assetKey].owner == msg.sender || assetStructs[assetKey].authorizationStructs[msg.sender].active, "Only the owner or admins can remove authorizations.");
        assetStructs[assetKey].authorizationStructs[authorizationKey].role =  '';
        assetStructs[assetKey].authorizationStructs[authorizationKey].active =  false;
        emit AuthorizationRemove(authorizationKey, assetKey);
        return true;
    }

    function getAssetAuthorization(string memory assetKey, address authorizationKey) public view returns(string memory authorizationRole) {
        return assetStructs[assetKey].authorizationStructs[authorizationKey].role;
    }

    function getAssetCount() public view returns(uint assetCount) {
        return assetList.length;
    }

    function getAssetAtIndex(uint row) public view returns(string memory assetkey) {
        return assetList[row];
    }

    function getAssetAuthorizationCount(string memory assetKey) public view returns(uint authorizationCount) {
        return assetStructs[assetKey].authorizationList.length;
    }

    function getAssetAuthorizationAtIndex(string memory assetKey, uint authorizationRow) public view returns(address authorizationKey) {
        return assetStructs[assetKey].authorizationList[authorizationRow];
    }

    function getAccess(string memory assetKey) public returns (bool success) {
        if (assetStructs[assetKey].owner == msg.sender || assetStructs[assetKey].authorizationStructs[msg.sender].active){
            emit AccessLog(msg.sender, assetKey, true);
            return true;
        } else {
            emit AccessLog(msg.sender, assetKey, false);
            return false;
        }
    }
}
