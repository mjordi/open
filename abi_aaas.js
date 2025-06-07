var smartContractAbi = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
    ],
    name: 'AssetAlreadyExists',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'caller',
        type: 'address',
      },
    ],
    name: 'NotOwnerOrAdmin',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'accessGranted',
        type: 'bool',
      },
    ],
    name: 'AccessAttempt',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
    ],
    name: 'AssetCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'message',
        type: 'string',
      },
    ],
    name: 'AssetCreationRejected',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'authorizer',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'authorized',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'role',
        type: 'string',
      },
    ],
    name: 'AuthorizationAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'authorizer',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'authorized',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
    ],
    name: 'AuthorizationRemoved',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'authorizationKey',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'authorizationRole',
        type: 'string',
      },
    ],
    name: 'addAuthorization',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
    ],
    name: 'getAccess',
    outputs: [
      {
        internalType: 'bool',
        name: 'success',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
    ],
    name: 'getAsset',
    outputs: [
      {
        internalType: 'address',
        name: 'assetOwner',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'assetDescription',
        type: 'string',
      },
      {
        internalType: 'bool',
        name: 'initialized',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'authorizationCount',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'row',
        type: 'uint256',
      },
    ],
    name: 'getAssetAtIndex',
    outputs: [
      {
        internalType: 'string',
        name: 'assetkey',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'authorizationKey',
        type: 'address',
      },
    ],
    name: 'getAssetAuthorization',
    outputs: [
      {
        internalType: 'string',
        name: 'authorizationRole',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'authorizationRow',
        type: 'uint256',
      },
    ],
    name: 'getAssetAuthorizationAtIndex',
    outputs: [
      {
        internalType: 'address',
        name: 'authorizationKey',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
    ],
    name: 'getAssetAuthorizationCount',
    outputs: [
      {
        internalType: 'uint256',
        name: 'authorizationCount',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAssetCount',
    outputs: [
      {
        internalType: 'uint256',
        name: 'assetCount',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'assetDescription',
        type: 'string',
      },
    ],
    name: 'newAsset',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'assetKey',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'authorizationKey',
        type: 'address',
      },
    ],
    name: 'removeAuthorization',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
