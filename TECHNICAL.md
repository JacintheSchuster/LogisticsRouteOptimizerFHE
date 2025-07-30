# LogisticsRouteOptimizer - Technical Documentation

## Overview

LogisticsRouteOptimizer is a privacy-preserving logistics route optimization platform built on Fully Homomorphic Encryption (FHE) technology. This document provides comprehensive technical details about the implementation, architecture, and usage.

## Architecture

### Smart Contract Components

#### Core Features
- **FHE Operations**: Utilizes FHEVM for confidential computation on encrypted data
- **Gateway Integration**: Async decryption through Zama Gateway
- **Pause Mechanism**: Emergency stop functionality with multiple pauser support
- **Access Control**: Role-based permissions (Owner, Pauser, Requester)

#### Contract Structure

```solidity
contract LogisticsRouteOptimizer is SepoliaConfig, GatewayCaller {
    // State Variables
    address public owner;
    uint32 public routeCounter;
    bool public paused;
    mapping(address => bool) public pausers;

    // Encrypted route data storage
    mapping(uint32 => RouteRequest) public routeRequests;
    mapping(uint32 => mapping(uint8 => DeliveryLocation)) public routeLocations;
    mapping(uint32 => OptimizedRoute) public optimizedRoutes;
}
```

### Data Structures

#### DeliveryLocation
```solidity
struct DeliveryLocation {
    euint32 encryptedX;     // Encrypted X coordinate
    euint32 encryptedY;     // Encrypted Y coordinate
    euint8 priority;        // Encrypted delivery priority
    bool isActive;          // Delivery status
}
```

#### RouteRequest
```solidity
struct RouteRequest {
    address requester;
    uint32 locationCount;
    euint32 maxTravelDistance;
    euint8 vehicleCapacity;
    bool processed;
    uint32 optimizedRouteId;
    uint256 timestamp;
    uint256 requestBlock;
}
```

#### OptimizedRoute
```solidity
struct OptimizedRoute {
    uint32 routeId;
    address requester;
    euint32 totalDistance;
    euint64 totalDistanceSquared;
    euint8 estimatedTime;
    bool isConfidential;
    uint256 createdAt;
    uint8[] locationOrder;
    bool finalized;
}
```

## FHE Operations

### Encrypted Types Used
- `euint32`: 32-bit encrypted unsigned integers (coordinates, distances)
- `euint64`: 64-bit encrypted unsigned integers (squared distances)
- `euint8`: 8-bit encrypted unsigned integers (priorities, capacity, time)
- `ebool`: Encrypted boolean (comparison results)

### Homomorphic Operations
- `FHE.add()`: Addition on encrypted values
- `FHE.sub()`: Subtraction on encrypted values
- `FHE.mul()`: Multiplication on encrypted values
- `FHE.div()`: Division on encrypted values
- `FHE.gt()`, `FHE.le()`: Comparison operations
- `FHE.select()`: Conditional selection
- `FHE.min()`: Minimum value selection

### Distance Calculation Algorithm

The contract uses **Manhattan Distance** for FHE efficiency:

```solidity
function _calculateDistance(uint32 routeId, uint8 from, uint8 to) private returns (euint32) {
    // Calculate |x2 - x1|
    ebool xGreater = FHE.gt(loc2.encryptedX, loc1.encryptedX);
    euint32 deltaX = FHE.select(
        xGreater,
        FHE.sub(loc2.encryptedX, loc1.encryptedX),
        FHE.sub(loc1.encryptedX, loc2.encryptedX)
    );

    // Calculate |y2 - y1|
    ebool yGreater = FHE.gt(loc2.encryptedY, loc1.encryptedY);
    euint32 deltaY = FHE.select(
        yGreater,
        FHE.sub(loc2.encryptedY, loc1.encryptedY),
        FHE.sub(loc1.encryptedY, loc2.encryptedY)
    );

    // Manhattan distance: |x2 - x1| + |y2 - y1|
    return FHE.add(deltaX, deltaY);
}
```

### Delivery Time Estimation

```solidity
function _calculateDeliveryTime(uint32 routeId, euint32 totalDistance) private returns (euint8) {
    // Loading time: 5 minutes per stop
    euint32 loadingTime = FHE.mul(locationCount, FHE.asEuint32(5));

    // Travel time: distance / speed factor
    euint32 travelTime = FHE.div(totalDistance, FHE.asEuint32(10));

    // Capacity adjustment
    ebool highCapacity = FHE.gt(vehicleCapacity, FHE.asEuint32(10));
    euint32 adjustedTime = FHE.select(
        highCapacity,
        FHE.mul(totalTime, FHE.asEuint32(90)),  // 90% for high capacity
        totalTime
    );

    return FHE.asEuint8(cappedTime);
}
```

## Gateway Integration

### Decryption Flow

1. **Request Decryption**
```solidity
function requestRouteDecryption(uint32 routeId) external onlyOwner {
    uint256[] memory cts = new uint256[](2);
    cts[0] = Gateway.toUint256(route.totalDistance);
    cts[1] = Gateway.toUint256(route.estimatedTime);

    uint256 requestId = Gateway.requestDecryption(
        cts,
        this.callbackRouteDecryption.selector,
        0,
        block.timestamp + 100,
        false
    );
}
```

2. **Gateway Callback**
```solidity
function callbackRouteDecryption(
    uint256 requestId,
    uint32 decryptedDistance,
    uint8 decryptedTime
) public onlyGateway {
    // Process decrypted values
    route.finalized = true;
    emit RouteFinalized(routeId, decryptedDistance, decryptedTime);
}
```

## Access Control & Security

### Permission Levels

1. **Owner**
   - Process route optimization
   - Add/remove pausers
   - Transfer ownership
   - View all route data
   - Request Gateway decryption

2. **Pauser**
   - Toggle contract pause state

3. **Requester**
   - Submit route requests
   - View own routes
   - Mark deliveries complete

### Security Features

#### Fail-Closed Design
```solidity
// Constraint validation continues even if violated
ebool withinLimit = FHE.le(totalDistance, maxTravelDistance);
FHE.allowThis(withinLimit);
```

#### Input Validation
- Array length matching
- Non-zero location requirement
- Proper encryption type conversion

#### Custom Errors
```solidity
error NotAuthorized();
error NotYourRoute();
error RouteAlreadyProcessed();
error ContractPaused();
// ... more errors
```

## Development Setup

### Prerequisites
```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Installation
```bash
npm install
```

### Compilation
```bash
npm run compile
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run with gas reporting
REPORT_GAS=true npm test
```

### Deployment

#### Local Network
```bash
npm run deploy:local
```

#### Sepolia Testnet
```bash
# Configure .env file first
npm run deploy:sepolia
```

#### Simple Deployment Script
```bash
npx hardhat run scripts/deploy-simple.ts --network sepolia
```

## Testing Strategy

### Test Coverage Areas

1. **Deployment Tests**
   - Initial state verification
   - Owner setup
   - Pauser initialization

2. **Route Request Tests**
   - Valid request creation
   - Input validation
   - Array mismatch handling
   - User route tracking

3. **Route Processing Tests**
   - Optimization execution
   - Duplicate processing prevention
   - Owner-only access

4. **Delivery Completion Tests**
   - Status updates
   - Permission checks
   - Edge cases

5. **Pause Mechanism Tests**
   - Pauser management
   - State toggling
   - Operation blocking

6. **Access Control Tests**
   - Role-based permissions
   - Unauthorized access prevention

7. **Edge Cases**
   - Single location routes
   - Maximum value handling
   - Boundary conditions

### Test Example
```typescript
it("Should process route optimization successfully", async function () {
  const { logistics, owner, requester1 } = await loadFixture(deployLogisticsFixture);

  await logistics.connect(requester1).requestRouteOptimization(
    [100, 200, 300],
    [150, 250, 350],
    [1, 2, 3],
    1000,
    10
  );

  const tx = await logistics.connect(owner).processRouteOptimization(1);

  await expect(tx)
    .to.emit(logistics, "RouteOptimized")
    .withArgs(1, requester1.address, await time.latest());
});
```

## Contract Size Optimization

Using `hardhat-contract-sizer`:

```bash
npm run size
```

Current optimizations:
- Custom errors instead of require strings
- Efficient data packing
- Minimal storage usage
- Optimized loop structures

## Gas Optimization Strategies

1. **Storage Packing**
   - Efficient struct layouts
   - Minimal storage slots

2. **Loop Optimization**
   - Bounded iterations
   - Cache length checks

3. **Event Emission**
   - Indexed parameters for filtering
   - Minimal data in events

4. **Access Control**
   - Custom errors (cheaper than require strings)
   - Efficient modifier checks

## TypeChain Integration

TypeChain generates TypeScript types for contracts:

```typescript
import { LogisticsRouteOptimizer } from "../typechain-types";

const logistics: LogisticsRouteOptimizer = await ethers.getContractAt(
  "LogisticsRouteOptimizer",
  contractAddress
);

// Fully typed contract interactions
await logistics.requestRouteOptimization(xCoords, yCoords, priorities, maxDistance, capacity);
```

## Events

### RouteRequested
```solidity
event RouteRequested(
    uint32 indexed routeId,
    address indexed requester,
    uint32 locationCount,
    uint256 timestamp
);
```

### RouteOptimized
```solidity
event RouteOptimized(
    uint32 indexed routeId,
    address indexed requester,
    uint256 timestamp
);
```

### RouteFinalized
```solidity
event RouteFinalized(
    uint32 indexed routeId,
    uint32 decryptedDistance,
    uint8 decryptedTime
);
```

### DeliveryCompleted
```solidity
event DeliveryCompleted(
    uint32 indexed routeId,
    uint8 locationIndex,
    uint256 timestamp
);
```

### Administrative Events
```solidity
event PauserAdded(address indexed pauser);
event PauserRemoved(address indexed pauser);
event ContractPausedToggled(bool paused);
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
```

## Frontend Integration

### Using fhevmjs

```javascript
import { createInstance } from "fhevmjs";

// Initialize FHE instance
const instance = await createInstance({
  chainId: 11155111, // Sepolia
  networkUrl: "https://sepolia.infura.io/v3/YOUR_KEY",
  gatewayUrl: "https://gateway.zama.ai",
});

// Encrypt coordinates
const encryptedX = instance.encrypt32(100);
const encryptedY = instance.encrypt32(150);
const encryptedPriority = instance.encrypt8(1);

// Submit route request
await contract.requestRouteOptimization(
  [encryptedX],
  [encryptedY],
  [encryptedPriority],
  encryptedMaxDistance,
  encryptedCapacity
);

// Retrieve and decrypt results
const route = await contract.getOptimizedRoute(routeId);
const decryptedDistance = instance.decrypt(route.totalDistanceEncrypted);
```

## Best Practices

### For Users
1. Always encrypt sensitive data before submission
2. Store route IDs for future reference
3. Monitor events for route updates
4. Verify gas costs before transactions

### For Developers
1. Test all edge cases thoroughly
2. Use TypeChain for type safety
3. Monitor contract size regularly
4. Implement proper error handling
5. Document all FHE operations

## Performance Considerations

### Gas Costs (Approximate)
- Route Request: ~500,000 gas (varies with location count)
- Route Processing: ~800,000 gas
- Delivery Completion: ~50,000 gas
- Pause Toggle: ~30,000 gas

### Optimization Opportunities
- Batch multiple deliveries
- Use efficient coordinate encoding
- Minimize on-chain storage

## Future Enhancements

1. **Advanced Routing Algorithms**
   - TSP optimization
   - Multi-vehicle routing
   - Time window constraints

2. **Enhanced Privacy**
   - Zero-knowledge proofs for verification
   - Private route sharing

3. **Scalability**
   - Layer 2 integration
   - Off-chain computation with on-chain verification

## Support & Resources

- **Documentation**: This file and README.md
- **Tests**: `/test` directory for examples
- **Deployment**: `/deploy` directory for scripts
- **FHEVM Docs**: https://docs.zama.ai/fhevm

## License

MIT License - See LICENSE file for details
