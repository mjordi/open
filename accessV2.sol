 pragma solidity ^0.4.10;

    contract AccessManagement {
    
    struct Authorization
    {
        string role; 
        //uint voteCount; // number of accumulated votes
        // add more non-key fields as needed
    }

    struct Asset
    {
        string description;
        string[] authorizationList;
        mapping(string => Authorization) authorizationStructs;
        bool initialized;    
    }

    mapping(string => Asset) assetStructs; // random access by question key
    string[] assetList; // list of question keys so we can enumerate them
    
    event AssetCreate(address account, string assetKey, string assetDescription);
    event RejectCreate(address account, string assetKey, string message);
    //event AssetTransfer(address from, address to, string uuid);
    //event RejectTransfer(address from, address to, string uuid, string message);

    function newAsset(string assetKey, string assetDescription)
    {
        // checking for duplicates
        if(assetStructs[assetKey].initialized) {
            RejectCreate(msg.sender, assetKey, "Asset with this Serial already exists.");
            return;
        }
 
        //assetStructs[assetKey] = Asset(name, description, manufacturer, true);
        //walletStore[msg.sender][uuid] = true;

        assetStructs[assetKey].description = assetDescription;
        assetStructs[assetKey].initialized = true;
        assetList.push(assetKey);
        AssetCreate(msg.sender, assetKey, assetDescription);
    }

    function getAsset(string assetKey) public constant returns(string wording, uint authorizationCount)
    {
        return(assetStructs[assetKey].description, assetStructs[assetKey].authorizationList.length);
    }

    function addAuthorization(string assetKey, string authorizationKey, string authorizationRole)
        // onlyOwner
        returns(bool success)
    {
        assetStructs[assetKey].authorizationList.push(authorizationKey);
        assetStructs[assetKey].authorizationStructs[authorizationKey].role = authorizationRole;
        // answer vote will init to 0 without our help
        return true;
    }

    function getAssetAuthorization(string assetKey, string authorizationKey)
        public
        constant
        returns(string authorizationRole)
        //returns(string authorizationRole, uint authorizationVoteCount)
    {
        return(
            /* assetStructs[assetKey].authorizationStructs[authorizationKey].role,
            assetStructs[assetKey].authorizationStructs[authorizationKey].voteCount); */
            assetStructs[assetKey].authorizationStructs[authorizationKey].role);
    }

    function getAssetCount()
        public
        constant
        returns(uint assetCount)
    {
        return assetList.length;
    }

    function getAssetAtIndex(uint row)
        public
        constant
        returns(string assetkey)
    {
        return assetList[row];
    }

    function getAssetAuthorizationCount(string assetKey)
        public
        constant
        returns(uint authorizationCount)
    {
        return(assetStructs[assetKey].authorizationList.length);
    }

    function getAssetAuthorizationAtIndex(string assetKey, uint authorizationRow)
        public
        constant
        returns(string authorizationKey)
    {
        return(assetStructs[assetKey].authorizationList[authorizationRow]);
    }  
}