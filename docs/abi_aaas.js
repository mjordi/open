const smartContractAbi = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'caller',
        type: 'address',
      },
    ],
    name: 'Unauthorized',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'client',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'string',
        name: 'role',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'assigned',
        type: 'bool',
      },
    ],
    name: 'RoleChange',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'entity',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'role',
        type: 'string',
      },
    ],
    name: 'assignRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'entity',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'role',
        type: 'string',
      },
    ],
    name: 'isAssignedRole',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'entity',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'role',
        type: 'string',
      },
    ],
    name: 'unassignRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
