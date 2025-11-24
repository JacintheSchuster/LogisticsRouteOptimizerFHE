# API Documentation

## Advanced Logistics Optimizer - Complete API Reference

---

## Table of Contents

1. [Contract Information](#contract-information)
2. [User Functions](#user-functions)
3. [Operator Functions](#operator-functions)
4. [Admin Functions](#admin-functions)
5. [View Functions](#view-functions)
6. [Events](#events)
7. [Error Codes](#error-codes)
8. [Usage Examples](#usage-examples)

---

## Contract Information

**Contract Name**: `AdvancedLogisticsOptimizer`

**License**: MIT

**Solidity Version**: ^0.8.24

**Dependencies**:
- `@fhevm/solidity/lib/FHE.sol`
- `@fhevm/solidity/config/ZamaConfig.sol`

---

## User Functions

### `requestRouteOptimization()`

Submit a route optimization request with encrypted parameters.

**Signature:**
```solidity
function requestRouteOptimization(
    uint32 locationCount,
    uint32 maxDistance,
    uint8 vehicleCapacity
) external payable returns (uint32 routeId)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `locationCount` | uint32 | Number of delivery locations (1-50) |
| `maxDistance` | uint32 | Maximum travel distance allowed (plaintext, will be encrypted) |
| `vehicleCapacity` | uint8 | Vehicle capacity limit (plaintext, will be encrypted) |

**Returns:**
| Name | Type | Description |
|------|------|-------------|
| `routeId` | uint32 | Unique identifier for the created route request |

**Requirements:**
- ✅ Contract must not be paused
- ✅ `msg.value >= MIN_STAKE` (0.01 ETH)
- ✅ `locationCount > 0 && locationCount <= 50`

**Emits:**
- `RouteRequested(routeId, requester, locationCount, stakeAmount, timestamp)`

**Example:**
```javascript
const tx = await contract.requestRouteOptimization(
    5,                          // 5 locations
    1000,                       // max 1000 units distance
    10,                         // capacity: 10 items
    { value: ethers.parseEther("0.05") }
);
const receipt = await tx.wait();
const routeId = receipt.events[0].args.routeId;
```

**Gas Estimate:** ~500,000

---

### `addEncryptedLocation()`

Add encrypted location data to a route request.

**Signature:**
```solidity
function addEncryptedLocation(
    uint32 routeId,
    uint8 locationIndex,
    externalEuint32 encX,
    externalEuint32 encY,
    externalEuint8 encPriority,
    externalEuint32 encPrice,
    bytes calldata inputProof
) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `routeId` | uint32 | Route identifier |
| `locationIndex` | uint8 | Index of location (0 to locationCount-1) |
| `encX` | externalEuint32 | Encrypted X coordinate |
| `encY` | externalEuint32 | Encrypted Y coordinate |
| `encPriority` | externalEuint8 | Encrypted priority level |
| `encPrice` | externalEuint32 | Encrypted delivery price |
| `inputProof` | bytes | Cryptographic proof for encrypted inputs |

**Requirements:**
- ✅ Must be route requester
- ✅ Contract not paused
- ✅ Route status must be `Pending`
- ✅ `locationIndex < locationCount`

**Example:**
```javascript
// Encrypt location data
const instance = await createFhevmInstance();
const encryptedX = await instance.encrypt32(latitude);
const encryptedY = await instance.encrypt32(longitude);
const encryptedPriority = await instance.encrypt8(priority);
const encryptedPrice = await instance.encrypt32(price);

await contract.addEncryptedLocation(
    routeId,
    0,                          // First location
    encryptedX,
    encryptedY,
    encryptedPriority,
    encryptedPrice,
    inputProof
);
```

**Gas Estimate:** ~300,000

---

### `requestRefund()`

Request refund for failed, timed-out, or abandoned route requests.

**Signature:**
```solidity
function requestRefund(uint32 routeId) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `routeId` | uint32 | Route identifier to refund |

**Requirements:**
- ✅ Must be route requester
- ✅ Contract not paused
- ✅ Refund must be eligible (see conditions below)

**Refund Conditions:**

1. **Processing Timeout**: Processing > 1 hour
2. **Request Timeout**: Pending > 24 hours
3. **Decryption Failed**: Status marked as `Failed`

**Returns:**
- Refunds stake amount (minus 2% platform fee already deducted)

**Emits:**
- `RefundIssued(routeId, requester, amount, reason)`
- `TimeoutDetected(routeId, elapsedTime)` (if timeout)

**Example:**
```javascript
// Check eligibility first
const eligibility = await contract.checkRefundEligibility(routeId);
if (eligibility.eligible) {
    console.log("Refund reason:", eligibility.reason);
    await contract.requestRefund(routeId);
}
```

**Gas Estimate:** ~100,000

---

## Operator Functions

### `processRouteOptimization()`

Process route optimization and initiate Gateway callback.

**Signature:**
```solidity
function processRouteOptimization(uint32 routeId) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `routeId` | uint32 | Route identifier to process |

**Requirements:**
- ✅ Must be operator or owner
- ✅ Contract not paused
- ✅ Route status must be `Pending`
- ✅ Route must exist

**Process:**
1. Updates status to `Processing`
2. Performs FHE calculations on encrypted data
3. Requests Gateway decryption
4. Stores optimized route
5. Maps decryption request ID to route ID

**Emits:**
- `RouteProcessingStarted(routeId, decryptionRequestId, timestamp)`

**Example:**
```javascript
// Operator processes the route
const tx = await contract.connect(operator).processRouteOptimization(routeId);
const receipt = await tx.wait();
const requestId = receipt.events[0].args.decryptionRequestId;

console.log("Gateway decryption request ID:", requestId);
```

**Gas Estimate:** ~800,000

---

### `markDecryptionFailed()`

Mark decryption as failed (enables refund).

**Signature:**
```solidity
function markDecryptionFailed(uint32 routeId, string calldata reason) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `routeId` | uint32 | Route identifier |
| `reason` | string | Human-readable failure reason |

**Requirements:**
- ✅ Must be operator or owner
- ✅ Route status must be `Processing`

**Emits:**
- `DecryptionFailed(routeId, requestId, reason)`

**Example:**
```javascript
await contract.connect(operator).markDecryptionFailed(
    routeId,
    "Gateway timeout: no response after 30 minutes"
);
```

**Gas Estimate:** ~50,000

---

### `gatewayCallback()`

**⚠️ Gateway-Only Function** - Called by FHEVM Gateway after decryption.

**Signature:**
```solidity
function gatewayCallback(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `requestId` | uint256 | Decryption request identifier |
| `cleartexts` | bytes | ABI-encoded decrypted values |
| `decryptionProof` | bytes | Cryptographic proof from Gateway |

**Process:**
1. Verifies Gateway signatures
2. Decodes cleartexts `[revealedDistance, revealedCost]`
3. Updates optimized route with revealed values
4. Marks route as `Completed` and `finalized`

**Emits:**
- `GatewayCallbackReceived(routeId, requestId, success)`
- `RouteOptimized(routeId, requester, revealedDistance, revealedCost, timestamp)`

**Note:** This function is called automatically by the Gateway. Do not call manually.

---

## Admin Functions

### `addOperator()`

Grant operator role to an address.

**Signature:**
```solidity
function addOperator(address operator) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `operator` | address | Address to grant operator role |

**Requirements:**
- ✅ Must be owner
- ✅ Address must not be zero

**Emits:**
- `OperatorAdded(operator)`

**Example:**
```javascript
await contract.connect(owner).addOperator(operatorAddress);
```

---

### `removeOperator()`

Revoke operator role from an address.

**Signature:**
```solidity
function removeOperator(address operator) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `operator` | address | Address to revoke operator role |

**Requirements:**
- ✅ Must be owner

**Emits:**
- `OperatorRemoved(operator)`

---

### `addPauser()`

Grant pauser role to an address.

**Signature:**
```solidity
function addPauser(address pauser) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `pauser` | address | Address to grant pauser role |

**Requirements:**
- ✅ Must be owner
- ✅ Address must not be zero

**Emits:**
- `PauserAdded(pauser)`

---

### `removePauser()`

Revoke pauser role from an address.

**Signature:**
```solidity
function removePauser(address pauser) external
```

---

### `togglePause()`

Toggle contract pause state.

**Signature:**
```solidity
function togglePause() external
```

**Requirements:**
- ✅ Must be pauser or owner

**Emits:**
- `ContractPausedToggled(paused)`

**Example:**
```javascript
// Pause contract
await contract.connect(pauser).togglePause();
console.log("Paused:", await contract.paused()); // true

// Unpause contract
await contract.connect(pauser).togglePause();
console.log("Paused:", await contract.paused()); // false
```

---

### `withdrawPlatformFees()`

Withdraw accumulated platform fees.

**Signature:**
```solidity
function withdrawPlatformFees(address to) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `to` | address | Recipient address for fees |

**Requirements:**
- ✅ Must be owner
- ✅ Address must not be zero

**Emits:**
- `PlatformFeesWithdrawn(to, amount)`

**Example:**
```javascript
const fees = await contract.platformFees();
console.log("Platform fees:", ethers.formatEther(fees), "ETH");

await contract.connect(owner).withdrawPlatformFees(treasuryAddress);
```

---

### `transferOwnership()`

Transfer contract ownership.

**Signature:**
```solidity
function transferOwnership(address newOwner) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `newOwner` | address | New owner address |

**Requirements:**
- ✅ Must be current owner
- ✅ New owner must not be zero

**Emits:**
- `OwnershipTransferred(previousOwner, newOwner)`

---

### `emergencyWithdraw()`

Emergency withdrawal when contract is paused.

**Signature:**
```solidity
function emergencyWithdraw(address to, uint256 amount) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `to` | address | Recipient address |
| `amount` | uint256 | Amount to withdraw (wei) |

**Requirements:**
- ✅ Must be owner
- ✅ Contract must be paused
- ✅ Address must not be zero

**Example:**
```javascript
// Pause first
await contract.connect(owner).togglePause();

// Emergency withdraw
await contract.connect(owner).emergencyWithdraw(
    safeAddress,
    ethers.parseEther("10")
);
```

---

## View Functions

### `getUserRoutes()`

Get all route IDs for a user.

**Signature:**
```solidity
function getUserRoutes(address user) external view returns (uint32[] memory)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `user` | address | User address to query |

**Returns:**
| Type | Description |
|------|-------------|
| uint32[] | Array of route IDs created by user |

**Example:**
```javascript
const routes = await contract.getUserRoutes(userAddress);
console.log("User has", routes.length, "routes:", routes);
```

---

### `getRouteRequest()`

Get route request details.

**Signature:**
```solidity
function getRouteRequest(uint32 routeId) external view returns (
    address requester,
    uint32 locationCount,
    RequestStatus status,
    uint256 stakeAmount,
    uint256 timestamp,
    bool refundEligible
)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `routeId` | uint32 | Route identifier |

**Returns:**
| Name | Type | Description |
|------|------|-------------|
| `requester` | address | Route creator |
| `locationCount` | uint32 | Number of locations |
| `status` | RequestStatus | Current status (0-5) |
| `stakeAmount` | uint256 | User's stake (wei) |
| `timestamp` | uint256 | Creation timestamp |
| `refundEligible` | bool | Refund eligibility |

**Example:**
```javascript
const request = await contract.getRouteRequest(routeId);
console.log("Requester:", request.requester);
console.log("Status:", request.status); // 0=Pending, 1=Processing, etc.
console.log("Stake:", ethers.formatEther(request.stakeAmount), "ETH");
```

---

### `getOptimizedRoute()`

Get optimized route details (including revealed values after callback).

**Signature:**
```solidity
function getOptimizedRoute(uint32 routeId) external view returns (
    uint32 routeId,
    address requester,
    uint64 revealedDistance,
    uint32 revealedCost,
    bool finalized,
    uint8[] memory locationOrder
)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `routeId` | uint32 | Route identifier |

**Returns:**
| Name | Type | Description |
|------|------|-------------|
| `routeId` | uint32 | Route identifier |
| `requester` | address | Route owner |
| `revealedDistance` | uint64 | Decrypted distance (0 if not finalized) |
| `revealedCost` | uint32 | Decrypted cost (0 if not finalized) |
| `finalized` | bool | Whether Gateway callback completed |
| `locationOrder` | uint8[] | Optimal visit order |

**Example:**
```javascript
const route = await contract.getOptimizedRoute(routeId);

if (route.finalized) {
    console.log("Total distance:", route.revealedDistance, "units");
    console.log("Total cost:", route.revealedCost);
    console.log("Visit order:", route.locationOrder);
} else {
    console.log("Route not finalized yet (Gateway pending)");
}
```

---

### `checkRefundEligibility()`

Check if route is eligible for refund.

**Signature:**
```solidity
function checkRefundEligibility(uint32 routeId) external view returns (
    bool eligible,
    string memory reason
)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `routeId` | uint32 | Route identifier |

**Returns:**
| Name | Type | Description |
|------|------|-------------|
| `eligible` | bool | Whether refund can be requested |
| `reason` | string | Human-readable reason/status |

**Example:**
```javascript
const check = await contract.checkRefundEligibility(routeId);
console.log("Eligible:", check.eligible);
console.log("Reason:", check.reason);

if (check.eligible) {
    // Show refund button to user
}
```

---

## Events

### `RouteRequested`

Emitted when user creates a route optimization request.

**Signature:**
```solidity
event RouteRequested(
    uint32 indexed routeId,
    address indexed requester,
    uint32 locationCount,
    uint256 stakeAmount,
    uint256 timestamp
)
```

---

### `RouteProcessingStarted`

Emitted when operator starts processing a route.

**Signature:**
```solidity
event RouteProcessingStarted(
    uint32 indexed routeId,
    uint256 decryptionRequestId,
    uint256 timestamp
)
```

---

### `RouteOptimized`

Emitted when Gateway callback completes successfully.

**Signature:**
```solidity
event RouteOptimized(
    uint32 indexed routeId,
    address indexed requester,
    uint64 revealedDistance,
    uint32 revealedCost,
    uint256 timestamp
)
```

---

### `RefundIssued`

Emitted when refund is processed.

**Signature:**
```solidity
event RefundIssued(
    uint32 indexed routeId,
    address indexed requester,
    uint256 amount,
    string reason
)
```

---

### `TimeoutDetected`

Emitted when timeout is detected during refund request.

**Signature:**
```solidity
event TimeoutDetected(
    uint32 indexed routeId,
    uint256 elapsedTime
)
```

---

### `DecryptionFailed`

Emitted when operator marks decryption as failed.

**Signature:**
```solidity
event DecryptionFailed(
    uint32 indexed routeId,
    uint256 requestId,
    string reason
)
```

---

### `GatewayCallbackReceived`

Emitted when Gateway callback is received.

**Signature:**
```solidity
event GatewayCallbackReceived(
    uint32 indexed routeId,
    uint256 requestId,
    bool success
)
```

---

## Error Codes

| Error | Description | When Thrown |
|-------|-------------|-------------|
| `NotAuthorized()` | Caller is not authorized | Only owner functions |
| `NotYourRoute()` | Caller is not route requester | Requester-only functions |
| `InvalidLocationCount()` | Location count out of range | Count = 0 or > 50 |
| `InsufficientStake()` | Stake below minimum | msg.value < MIN_STAKE |
| `ContractPaused()` | Contract is paused | Operations during pause |
| `NotOperator()` | Caller is not operator | Operator-only functions |
| `InvalidAddress()` | Zero address provided | Address validation |
| `InvalidStatus()` | Invalid request status | State mismatch |
| `AlreadyProcessed()` | Route already processed | Duplicate processing |
| `RequestNotFound()` | Route does not exist | Invalid route ID |
| `TimeoutNotReached()` | Timeout period not elapsed | Premature refund request |
| `RefundAlreadyIssued()` | Refund already claimed | Duplicate refund |
| `TransferFailed()` | ETH transfer failed | Failed send |

---

## Usage Examples

### Complete User Flow

```javascript
// 1. Create route request
const tx1 = await contract.requestRouteOptimization(
    3,      // 3 locations
    500,    // max 500 units
    5,      // capacity 5
    { value: ethers.parseEther("0.02") }
);
const receipt1 = await tx1.wait();
const routeId = 1; // First route

// 2. Add encrypted locations
const instance = await createFhevmInstance();

for (let i = 0; i < 3; i++) {
    const encX = await instance.encrypt32(locations[i].x);
    const encY = await instance.encrypt32(locations[i].y);
    const encPriority = await instance.encrypt8(locations[i].priority);
    const encPrice = await instance.encrypt32(locations[i].price);

    await contract.addEncryptedLocation(
        routeId, i, encX, encY, encPriority, encPrice, inputProof
    );
}

// 3. Wait for operator to process
// (Operator calls processRouteOptimization)

// 4. Wait for Gateway callback
// (Gateway calls gatewayCallback automatically)

// 5. Retrieve optimized route
const route = await contract.getOptimizedRoute(routeId);
if (route.finalized) {
    console.log("Optimized route ready!");
    console.log("Distance:", route.revealedDistance);
    console.log("Cost:", route.revealedCost);
    console.log("Order:", route.locationOrder);
}
```

### Refund Scenario

```javascript
// User requests route
const tx = await contract.requestRouteOptimization(5, 1000, 10, {
    value: ethers.parseEther("0.05")
});

// Wait 25 hours (exceeds 24h timeout)
await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
await ethers.provider.send("evm_mine", []);

// Check eligibility
const check = await contract.checkRefundEligibility(1);
console.log(check.eligible); // true
console.log(check.reason);   // "Request timeout"

// Request refund
await contract.requestRefund(1);
```

### Admin Operations

```javascript
// Add operator
await contract.connect(owner).addOperator(operatorAddress);

// Check platform fees
const fees = await contract.platformFees();
console.log("Fees:", ethers.formatEther(fees), "ETH");

// Withdraw fees
await contract.connect(owner).withdrawPlatformFees(treasuryAddress);

// Emergency pause
await contract.connect(owner).togglePause();
```

---

## Rate Limits & Quotas

| Resource | Limit | Notes |
|----------|-------|-------|
| Max Locations per Route | 50 | Configurable via `MAX_LOCATIONS` |
| Min Stake | 0.01 ETH | `MIN_STAKE` constant |
| Platform Fee | 2% | `PLATFORM_FEE_PERCENT` |
| Request Timeout | 24 hours | `REQUEST_TIMEOUT` |
| Processing Timeout | 1 hour | `MAX_PROCESSING_TIME` |
| Concurrent Requests | Unlimited | Async processing |

---

## Best Practices

### 1. Always Check Refund Eligibility
```javascript
const eligibility = await contract.checkRefundEligibility(routeId);
if (eligibility.eligible) {
    // Show refund option
}
```

### 2. Listen to Events
```javascript
contract.on("RouteOptimized", (routeId, requester, distance, cost) => {
    console.log(`Route ${routeId} optimized: ${distance} units, ${cost} cost`);
});

contract.on("RefundIssued", (routeId, requester, amount, reason) => {
    console.log(`Refund issued for route ${routeId}: ${reason}`);
});
```

### 3. Handle Encrypted Data Properly
```javascript
// Always use FHEVM instance for encryption
const instance = await createFhevmInstance();
const encrypted = await instance.encrypt32(value);

// Always provide input proof
const inputProof = instance.generateProof();
```

### 4. Validate User Input
```javascript
// Check stake amount
if (stakeAmount < MIN_STAKE) {
    throw new Error("Insufficient stake");
}

// Check location count
if (locationCount > 50 || locationCount === 0) {
    throw new Error("Invalid location count");
}
```

---

## Support & Contact

For technical support, bug reports, or feature requests:

- **Documentation**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Issues**: Create GitHub issue
- **Security**: Contact security team for vulnerability reports

---

**Last Updated**: 2025-11-24
**Version**: 1.0.0
**Contract Address**: TBD (deploy first)
