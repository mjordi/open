var smartContractAbi = [
	{
		"constant": true,
		"inputs": [
			{
				"name": "assetKey",
				"type": "string"
			},
			{
				"name": "authorizationRow",
				"type": "uint256"
			}
		],
		"name": "getAssetAuthorizationAtIndex",
		"outputs": [
			{
				"name": "authorizationKey",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "assetKey",
				"type": "string"
			},
			{
				"name": "authorizationKey",
				"type": "address"
			}
		],
		"name": "removeAuthorization",
		"outputs": [
			{
				"name": "success",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "assetKey",
				"type": "string"
			},
			{
				"name": "authorizationKey",
				"type": "address"
			},
			{
				"name": "authorizationRole",
				"type": "string"
			}
		],
		"name": "addAuthorization",
		"outputs": [
			{
				"name": "success",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "assetKey",
				"type": "string"
			},
			{
				"name": "authorizationKey",
				"type": "address"
			}
		],
		"name": "getAssetAuthorization",
		"outputs": [
			{
				"name": "authorizationRole",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "assetKey",
				"type": "string"
			}
		],
		"name": "getAccess",
		"outputs": [
			{
				"name": "success",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getAssetCount",
		"outputs": [
			{
				"name": "assetCount",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "assetKey",
				"type": "string"
			}
		],
		"name": "getAssetAuthorizationCount",
		"outputs": [
			{
				"name": "authorizationCount",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "assetKey",
				"type": "string"
			},
			{
				"name": "assetDescription",
				"type": "string"
			}
		],
		"name": "newAsset",
		"outputs": [
			{
				"name": "success",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "row",
				"type": "uint256"
			}
		],
		"name": "getAssetAtIndex",
		"outputs": [
			{
				"name": "assetkey",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "assetKey",
				"type": "string"
			}
		],
		"name": "getAsset",
		"outputs": [
			{
				"name": "assetOwner",
				"type": "address"
			},
			{
				"name": "assetDescription",
				"type": "string"
			},
			{
				"name": "initialized",
				"type": "bool"
			},
			{
				"name": "authorizationCount",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "account",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "assetKey",
				"type": "string"
			},
			{
				"indexed": false,
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
				"indexed": false,
				"name": "account",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "assetKey",
				"type": "string"
			},
			{
				"indexed": false,
				"name": "message",
				"type": "string"
			}
		],
		"name": "RejectCreate",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "account",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "assetKey",
				"type": "string"
			},
			{
				"indexed": false,
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
				"indexed": false,
				"name": "account",
				"type": "address"
			},
			{
				"indexed": false,
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
				"indexed": false,
				"name": "account",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "assetKey",
				"type": "string"
			}
		],
		"name": "AccessLog",
		"type": "event"
	}
]