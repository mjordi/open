 pragma solidity ^0.4.24;

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

    
    function newAsset(string assetKey, string assetDescription) public returns(bool success) {
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
    
    function getAsset(string assetKey) public constant returns(address assetOwner, string assetDescription, bool initialized, uint authorizationCount) {
        return(assetStructs[assetKey].owner, assetStructs[assetKey].description, assetStructs[assetKey].initialized, assetStructs[assetKey].authorizationList.length);
    }
    
    function addAuthorization(string assetKey, address authorizationKey, string authorizationRole) public returns(bool success) {
        // keccak256(assetStructs[assetKey].authorizationStructs[authorizationKey].role) == keccak256("admin") -> does not work
        require(assetStructs[assetKey].owner == msg.sender || assetStructs[assetKey].authorizationStructs[msg.sender].active, "Only the owner or admins can add authorizations.");
        // push only unique "authorizationKey" to authorizationList[]
        assetStructs[assetKey].authorizationList.push(authorizationKey);
        assetStructs[assetKey].authorizationStructs[authorizationKey].role = authorizationRole;
        assetStructs[assetKey].authorizationStructs[authorizationKey].active = true;
        emit AuthorizationCreate(authorizationKey, assetKey, authorizationRole);
        return true;
    }
   
    function removeAuthorization(string assetKey, address authorizationKey) public returns(bool success) {
        // keccak256(assetStructs[assetKey].authorizationStructs[authorizationKey].role) == keccak256("admin") -> does not work
        require(assetStructs[assetKey].owner == msg.sender || assetStructs[assetKey].authorizationStructs[msg.sender].active, "Only the owner or admins can remove authorizations.");
        assetStructs[assetKey].authorizationStructs[authorizationKey].role =  '';
        assetStructs[assetKey].authorizationStructs[authorizationKey].active =  false;
        emit AuthorizationRemove(authorizationKey, assetKey);

        return true;
    }

    function getAssetAuthorization(string assetKey, address authorizationKey) public constant returns(string authorizationRole) {
        return(
            assetStructs[assetKey].authorizationStructs[authorizationKey].role);
    }

    function getAssetCount() public constant returns(uint assetCount) {
        return assetList.length;
    }

    function getAssetAtIndex(uint row) public constant returns(string assetkey) {
        return assetList[row];
    }

    function getAssetAuthorizationCount(string assetKey) public constant returns(uint authorizationCount) {
        return(assetStructs[assetKey].authorizationList.length);
    }

    function getAssetAuthorizationAtIndex(string assetKey, uint authorizationRow) public constant returns(address authorizationKey) {
        return(assetStructs[assetKey].authorizationList[authorizationRow]);
    }
    
    function getAccess (string assetKey) public returns (bool success) {
        if (assetStructs[assetKey].owner == msg.sender || assetStructs[assetKey].authorizationStructs[msg.sender].active){
            emit AccessLog(msg.sender, assetKey, true);
            return true;
        } else {
            emit AccessLog(msg.sender, assetKey, false);
            return false;  
        }
    }
    /*
    function compareStrings (string a, string b) view returns (bool){
       return keccak256(a) == keccak256(b);
    }*/
}