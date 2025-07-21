export const CONTRACT_ADDRESS = '0xE235A5C0DbF47ba76db3912c80267F9B43B8d1a8' as const;

export const CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'AlreadyPauser',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ContractPaused',
    type: 'error',
  },
  {
    inputs: [],
    name: 'CoordinateArraysMismatch',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidLocationIndex',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidRoute',
    type: 'error',
  },
  {
    inputs: [],
    name: 'LocationAlreadyCompleted',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NoLocationsProvided',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotAuthorized',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotPauser',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotYourRoute',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PriorityArrayMismatch',
    type: 'error',
  },
  {
    inputs: [],
    name: 'RouteAlreadyProcessed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'RouteNotProcessed',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'pauser',
        type: 'address',
      },
    ],
    name: 'ContractPausedToggled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint32',
        name: 'routeId',
        type: 'uint32',
      },
      {
        indexed: false,
        internalType: 'uint8',
        name: 'locationIndex',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'DeliveryCompleted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'pauser',
        type: 'address',
      },
    ],
    name: 'PauserAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'pauser',
        type: 'address',
      },
    ],
    name: 'PauserRemoved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint32',
        name: 'routeId',
        type: 'uint32',
      },
      {
        indexed: false,
        internalType: 'uint32',
        name: 'decryptedDistance',
        type: 'uint32',
      },
      {
        indexed: false,
        internalType: 'uint8',
        name: 'decryptedTime',
        type: 'uint8',
      },
    ],
    name: 'RouteFinalized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint32',
        name: 'routeId',
        type: 'uint32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'RouteOptimized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint32',
        name: 'routeId',
        type: 'uint32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint32',
        name: 'locationCount',
        type: 'uint32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'RouteRequested',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_pauser',
        type: 'address',
      },
    ],
    name: 'addPauser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint32',
        name: 'routeId',
        type: 'uint32',
      },
    ],
    name: 'finalizeRoute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint32',
        name: 'routeId',
        type: 'uint32',
      },
    ],
    name: 'getRouteRequest',
    outputs: [
      {
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        internalType: 'uint32',
        name: 'locationCount',
        type: 'uint32',
      },
      {
        internalType: 'bool',
        name: 'processed',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
    ],
    name: 'getUserRoutes',
    outputs: [
      {
        internalType: 'uint32[]',
        name: '',
        type: 'uint32[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint32',
        name: 'routeId',
        type: 'uint32',
      },
      {
        internalType: 'uint8',
        name: 'locationIndex',
        type: 'uint8',
      },
    ],
    name: 'markDeliveryCompleted',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
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
        name: '',
        type: 'address',
      },
    ],
    name: 'pausers',
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
        internalType: 'uint32',
        name: 'routeId',
        type: 'uint32',
      },
    ],
    name: 'processRouteOptimization',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_pauser',
        type: 'address',
      },
    ],
    name: 'removePauser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint32',
        name: 'xCoord',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'yCoord',
        type: 'uint32',
      },
      {
        internalType: 'uint8',
        name: 'priority',
        type: 'uint8',
      },
      {
        internalType: 'uint32',
        name: 'maxDistance',
        type: 'uint32',
      },
      {
        internalType: 'uint8',
        name: 'vehicleCapacityValue',
        type: 'uint8',
      },
    ],
    name: 'requestRouteOptimization',
    outputs: [
      {
        internalType: 'uint32',
        name: 'routeId',
        type: 'uint32',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'routeCounter',
    outputs: [
      {
        internalType: 'uint32',
        name: '',
        type: 'uint32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'togglePause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
