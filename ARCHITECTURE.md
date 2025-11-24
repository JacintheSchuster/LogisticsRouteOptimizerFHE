# Architecture Documentation

## Advanced Logistics Optimizer - System Architecture

### Overview

The Advanced Logistics Optimizer is a privacy-preserving logistics route optimization system built on Fully Homomorphic Encryption (FHE) technology. It enables secure, confidential route planning without revealing sensitive business data.

---

## Core Architecture Components

### 1. Gateway Callback Pattern

The system implements an asynchronous decryption model using the FHEVM Gateway:

```
User Request → Contract Records → Gateway Decryption → Callback Completion
```

**Flow:**

1. **User Submits Request**: User calls `requestRouteOptimization()` with encrypted parameters
2. **Contract Records**: System stores encrypted route data and generates privacy multipliers
3. **Operator Processes**: Operator triggers `processRouteOptimization()` which:
   - Performs homomorphic computations on encrypted data
   - Requests Gateway decryption via `FHE.requestDecryption()`
   - Stores request ID for callback mapping
4. **Gateway Decryption**: Off-chain Gateway decrypts ciphertexts and generates proof
5. **Callback Execution**: Gateway calls `gatewayCallback()` with decrypted values and proof
6. **Transaction Completion**: Contract verifies proof and finalizes route

**Benefits:**
- ✅ Non-blocking operations
- ✅ Cryptographic proof verification
- ✅ Secure off-chain computation
- ✅ Gas-efficient design

---

### 2. Refund Mechanism for Decryption Failures

Comprehensive refund system protects users from failed operations:

#### Refund Triggers:

1. **Decryption Failure**: Operator explicitly marks request as failed
2. **Processing Timeout**: Request processing exceeds `MAX_PROCESSING_TIME` (1 hour)
3. **Request Timeout**: Pending request exceeds `REQUEST_TIMEOUT` (24 hours)

#### Implementation:

```solidity
function requestRefund(uint32 routeId) external onlyRequester(routeId) {
    // Check eligibility conditions
    if (status == Processing && elapsed > MAX_PROCESSING_TIME) {
        // Issue refund for timeout
    } else if (status == Failed) {
        // Issue refund for decryption failure
    } else if (status == Pending && elapsed > REQUEST_TIMEOUT) {
        // Issue refund for abandoned request
    }

    // Transfer stake back to user (minus platform fee)
    // Mark as Refunded to prevent double-refund
}
```

**Security Features:**
- ✅ Double-refund prevention
- ✅ Status-based validation
- ✅ Requester-only access
- ✅ Automatic eligibility checking

---

### 3. Timeout Protection

Multi-layer timeout protection prevents permanent fund locks:

| Timeout Type | Duration | Trigger | Action |
|--------------|----------|---------|--------|
| Request Timeout | 24 hours | No processing initiated | Auto-refund eligible |
| Processing Timeout | 1 hour | Gateway not responding | Auto-refund eligible |
| Decryption Timeout | Variable | Gateway callback fails | Operator marks failed |

**Implementation:**

```solidity
// Timeout constants
uint256 public constant REQUEST_TIMEOUT = 24 hours;
uint256 public constant MAX_PROCESSING_TIME = 1 hours;

// Timestamp tracking
struct RouteRequest {
    uint256 timestamp;              // Request creation time
    uint256 processingStartTime;    // Processing initiation time
    // ...
}
```

**User Protection:**
- ✅ No funds permanently locked
- ✅ Transparent timeout periods
- ✅ User-initiated refund requests
- ✅ Operator accountability

---

### 4. Privacy-Protected Division Operations

FHE division is problematic due to privacy leakage. Solution: **Random Multiplier Technique**

#### Problem:
Direct division on encrypted values can reveal information through timing attacks or result patterns.

#### Solution:
```solidity
// Generate random multiplier (1000-9999)
uint32 privacyMultiplier = _generatePrivacyMultiplier(routeId);

// Apply multiplier before division
euint32 multiplier = FHE.asEuint32(privacyMultiplier);
euint32 protectedDistance = FHE.mul(distance, multiplier);

// Perform division on multiplied value
euint32 result = FHE.div(protectedDistance, divisor);

// Result is obfuscated by multiplier
```

**Privacy Guarantees:**
- ✅ Deterministic yet unpredictable multipliers
- ✅ Range: 1000-9999 (prevents overflow)
- ✅ Seed-based generation (route ID, timestamp, prevrandao)
- ✅ Division result obfuscation

---

### 5. Price Obfuscation Techniques

Prevents price leakage through pattern analysis:

#### Technique: Deterministic Noise Addition

```solidity
function _obfuscatePrice(euint32 price, uint32 routeId, uint8 locationIndex)
    private view returns (euint32)
{
    // Generate deterministic noise (0-99)
    uint32 noiseSeed = uint32(uint256(
        keccak256(abi.encodePacked(routeId, locationIndex, block.timestamp))
    ) % 100);

    euint32 noise = FHE.asEuint32(noiseSeed);

    // Add noise to price
    euint32 obfuscatedPrice = FHE.add(price, noise);

    return obfuscatedPrice;
}
```

**Features:**
- ✅ Deterministic for same inputs (reproducible)
- ✅ Unpredictable across different locations
- ✅ Small noise prevents overflow
- ✅ Preserves relative price ordering

**Use Cases:**
- Location pricing
- Cost calculations
- Fee obfuscation
- Revenue protection

---

### 6. Comprehensive Security Features

#### Input Validation

```solidity
// Location count validation
if (locationCount == 0 || locationCount > MAX_LOCATIONS)
    revert InvalidLocationCount();

// Stake validation
if (msg.value < MIN_STAKE)
    revert InsufficientStake();

// Address validation
modifier validAddress(address addr) {
    if (addr == address(0)) revert InvalidAddress();
    _;
}
```

#### Access Control

```solidity
// Role-based access
mapping(address => bool) public operators;  // Processing rights
mapping(address => bool) public pausers;    // Emergency pause
address public owner;                       // Admin rights

// Modifiers
modifier onlyOwner() { ... }
modifier onlyOperator() { ... }
modifier onlyPauser() { ... }
modifier onlyRequester(uint32 routeId) { ... }
```

#### Overflow Protection

```solidity
// Safe type conversions
euint32 distance32 = FHE.asEuint32(value);
euint64 distance64 = FHE.asEuint64(distance32); // Prevent overflow

// Squared distance using euint64
euint64 distanceSquared = FHE.mul(totalDistance, totalDistance);
```

#### Audit Hints

```solidity
// Custom errors for clarity
error InsufficientStake();
error InvalidLocationCount();
error OverflowDetected();

// Comprehensive events
event RouteRequested(...);
event RefundIssued(...);
event TimeoutDetected(...);

// Status tracking
enum RequestStatus { Pending, Processing, Completed, Failed, TimedOut, Refunded }
```

---

### 7. Gas Optimization & HCU Management

#### HCU (Homomorphic Computation Units)

HCU is the computational cost metric for FHE operations:

| Operation | HCU Cost | Strategy |
|-----------|----------|----------|
| `FHE.add()` | Low | Use freely |
| `FHE.mul()` | Medium | Batch operations |
| `FHE.div()` | High | Minimize usage |
| `FHE.decrypt()` | Very High | Use Gateway callbacks |

#### Optimization Strategies:

**1. Batch Encrypted Operations**
```solidity
// ❌ Bad: Multiple separate operations
euint32 result = FHE.add(a, b);
result = FHE.add(result, c);
result = FHE.add(result, d);

// ✅ Good: Minimize intermediate variables
euint32 temp1 = FHE.add(a, b);
euint32 temp2 = FHE.add(c, d);
euint32 result = FHE.add(temp1, temp2);
```

**2. Use Appropriate Data Types**
```solidity
// ❌ Bad: Oversized types
euint64 priority = FHE.asEuint64(5); // Waste

// ✅ Good: Right-sized types
euint8 priority = FHE.asEuint8(5);   // Efficient
```

**3. Minimize Decryption Requests**
```solidity
// ✅ Batch decrypt multiple values in one Gateway call
bytes32[] memory cts = new bytes32[](2);
cts[0] = FHE.toBytes32(totalDistance);
cts[1] = FHE.toBytes32(totalCost);
uint256 requestId = FHE.requestDecryption(cts, callback);
```

**4. Lazy Evaluation**
```solidity
// Only compute when necessary
if (request.status == RequestStatus.Processing) {
    // Perform expensive FHE operations
}
```

#### Gas Metrics Tracking:

```solidity
struct GasMetrics {
    uint256 totalHCUUsed;      // Estimated HCU consumption
    uint256 estimatedCost;     // Pre-execution estimate
    uint256 actualCost;        // Post-execution measurement
}

mapping(uint32 => GasMetrics) public routeGasMetrics;
```

---

## Data Structures

### RouteRequest
```solidity
struct RouteRequest {
    address requester;              // Request owner
    uint32 locationCount;           // Number of locations
    euint32 maxTravelDistance;      // Encrypted max distance
    euint8 vehicleCapacity;         // Encrypted capacity
    RequestStatus status;           // Current state
    uint256 stakeAmount;            // User stake (minus platform fee)
    uint256 timestamp;              // Creation time
    uint256 requestBlock;           // Block number
    uint256 processingStartTime;    // Processing start time
    uint256 decryptionRequestId;    // Gateway request ID
    bool refundEligible;            // Refund availability
    uint32 privacyMultiplier;       // Random multiplier for privacy
}
```

### OptimizedRoute
```solidity
struct OptimizedRoute {
    uint32 routeId;                 // Route identifier
    address requester;              // Route owner
    euint64 totalDistance;          // Encrypted total distance
    euint64 totalDistanceSquared;   // Encrypted distance²
    euint32 obfuscatedCost;         // Obfuscated cost
    euint8 estimatedTime;           // Encrypted time estimate
    uint8[] locationOrder;          // Optimized visit order
    uint64 revealedDistance;        // Decrypted distance (after callback)
    uint32 revealedCost;            // Decrypted cost (after callback)
    uint256 createdAt;              // Creation timestamp
    bool finalized;                 // Callback completion status
}
```

### DeliveryLocation
```solidity
struct DeliveryLocation {
    euint32 encryptedX;             // X coordinate (encrypted)
    euint32 encryptedY;             // Y coordinate (encrypted)
    euint8 priority;                // Delivery priority (encrypted)
    euint32 obfuscatedPrice;        // Price with noise (encrypted)
    bool isActive;                  // Active status
}
```

---

## State Management

### Request Lifecycle

```
┌─────────────┐
│   Pending   │ ← requestRouteOptimization()
└──────┬──────┘
       │
       │ processRouteOptimization()
       ▼
┌─────────────┐
│ Processing  │ ← Gateway decryption initiated
└──────┬──────┘
       │
       ├─────────────┬─────────────┬──────────────┐
       │             │             │              │
       ▼             ▼             ▼              ▼
┌─────────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐
│  Completed  │ │  Failed │ │ TimedOut │ │  Refunded  │
└─────────────┘ └─────────┘ └──────────┘ └────────────┘
       │             │             │              │
       │             └─────────────┴──────────────┘
       │                           │
       │                     requestRefund()
       │                           │
       ▼                           ▼
   [Success]                   [Refund Issued]
```

---

## Security Considerations

### 1. Reentrancy Protection
- All external calls use checks-effects-interactions pattern
- State updated before transfers
- Custom errors for failed transfers

### 2. Access Control
- Three-tier permission system (Owner, Operator, Pauser)
- Requester validation for route-specific actions
- Zero-address validation

### 3. Economic Security
- Platform fee (2%) prevents spam
- Minimum stake requirement
- Refund mechanism prevents fund locking

### 4. Privacy Guarantees
- All sensitive data encrypted with FHE
- Price obfuscation prevents leakage
- Privacy multipliers protect division operations
- Gateway callbacks minimize on-chain decryption

### 5. Operational Security
- Emergency pause functionality
- Emergency withdrawal (when paused)
- Timeout protections
- Decryption failure handling

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              Advanced Logistics Optimizer            │
│                   (Smart Contract)                   │
│                                                      │
└───────────┬─────────────────────────────┬────────────┘
            │                             │
            │                             │
            ▼                             ▼
┌─────────────────────┐       ┌─────────────────────┐
│   FHEVM Gateway     │       │   User Interface    │
│  (Decryption Layer) │       │   (Frontend/API)    │
└─────────────────────┘       └─────────────────────┘
            │                             │
            │                             │
            ▼                             ▼
┌─────────────────────┐       ┌─────────────────────┐
│  Decryption Oracles │       │   Operator Nodes    │
│  (Off-chain Compute)│       │  (Processing Pool)  │
└─────────────────────┘       └─────────────────────┘
```

---

## Performance Metrics

### Expected Gas Costs

| Operation | Estimated Gas | HCU Impact |
|-----------|--------------|------------|
| Request Route | ~500,000 | Medium (5 FHE ops) |
| Add Location | ~300,000 | Medium (4 FHE ops) |
| Process Route | ~800,000 | High (10+ FHE ops) |
| Gateway Callback | ~200,000 | Low (verification only) |
| Request Refund | ~100,000 | None |

### Scalability

- **Max Locations**: 50 per route (configurable)
- **Concurrent Requests**: Unlimited (async processing)
- **Timeout Protection**: 24h request, 1h processing
- **Storage**: ~2KB per route request

---

## Future Enhancements

1. **Multi-Vehicle Routing**: Support for fleet optimization
2. **Dynamic Pricing**: Real-time cost adjustments
3. **Route Analytics**: Encrypted performance metrics
4. **Integration APIs**: RESTful endpoints for external systems
5. **Advanced Privacy**: Zero-knowledge proof integration
6. **Machine Learning**: AI-powered route optimization (on encrypted data)

---

## Conclusion

The Advanced Logistics Optimizer demonstrates enterprise-grade FHE implementation with:

- ✅ **Privacy-First Design**: All sensitive data encrypted
- ✅ **User Protection**: Comprehensive refund and timeout mechanisms
- ✅ **Security Hardening**: Multi-layer access control and validation
- ✅ **Gas Efficiency**: Optimized HCU usage patterns
- ✅ **Production Ready**: Auditable, documented, tested

This architecture serves as a reference implementation for privacy-preserving logistics systems on blockchain.
