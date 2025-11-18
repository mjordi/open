/**
 * Auto-generated from compiled contract
 * Contract: AccessManagement
 * DO NOT EDIT MANUALLY - Run 'npm run generate' to regenerate
 */

const contractABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "authorizationKey",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "authorizationRole",
        "type": "string"
      }
    ],
    "name": "addAuthorization",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "authorizationKey",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "authorizationRole",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      }
    ],
    "name": "addAuthorization",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "internalType": "address[]",
        "name": "authorizationKeys",
        "type": "address[]"
      },
      {
        "internalType": "string[]",
        "name": "authorizationRoles",
        "type": "string[]"
      }
    ],
    "name": "addAuthorizationBatch",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "internalType": "address[]",
        "name": "authorizationKeys",
        "type": "address[]"
      },
      {
        "internalType": "string[]",
        "name": "authorizationRoles",
        "type": "string[]"
      },
      {
        "internalType": "uint256[]",
        "name": "durations",
        "type": "uint256[]"
      }
    ],
    "name": "addAuthorizationBatchWithDuration",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      }
    ],
    "name": "getAccess",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      }
    ],
    "name": "getAsset",
    "outputs": [
      {
        "internalType": "address",
        "name": "assetOwner",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "assetDescription",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "initialized",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "authorizationCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "row",
        "type": "uint256"
      }
    ],
    "name": "getAssetAtIndex",
    "outputs": [
      {
        "internalType": "string",
        "name": "assetkey",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "authorizationKey",
        "type": "address"
      }
    ],
    "name": "getAssetAuthorization",
    "outputs": [
      {
        "internalType": "string",
        "name": "authorizationRole",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "authorizationRow",
        "type": "uint256"
      }
    ],
    "name": "getAssetAuthorizationAtIndex",
    "outputs": [
      {
        "internalType": "address",
        "name": "authorizationKey",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      }
    ],
    "name": "getAssetAuthorizationCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "authorizationCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAssetCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "assetCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "assetDescription",
        "type": "string"
      }
    ],
    "name": "newAsset",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "authorizationKey",
        "type": "address"
      }
    ],
    "name": "removeAuthorization",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "internalType": "address[]",
        "name": "authorizationKeys",
        "type": "address[]"
      }
    ],
    "name": "removeAuthorizationBatch",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "accessGranted",
        "type": "bool"
      }
    ],
    "name": "AccessLog",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      }
    ],
    "name": "AuthorizationRemove",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "authorizationRole",
        "type": "string"
      }
    ],
    "name": "AuthorizationCreate",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "assetDescription",
        "type": "string"
      }
    ],
    "name": "AssetCreate",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "assetKey",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "message",
        "type": "string"
      }
    ],
    "name": "RejectCreate",
    "type": "event"
  }
];

// Legacy variable name for backward compatibility
const smartContractAbi = contractABI;
