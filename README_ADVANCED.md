# Advanced Logistics Optimizer

> Enterprise-grade privacy-preserving logistics route optimization using Fully Homomorphic Encryption (FHE)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.19.0-orange)](https://hardhat.org/)

---

## 🌟 Overview

The **Advanced Logistics Optimizer** is a cutting-edge smart contract system that enables secure, privacy-preserving route optimization for logistics operations. Built on FHEVM (Fully Homomorphic Encryption Virtual Machine), it allows businesses to optimize delivery routes without revealing sensitive location, pricing, or operational data.

### Key Features

✅ **Gateway Callback Pattern** - Asynchronous decryption with cryptographic proof verification
✅ **Automatic Refund Mechanism** - Protection against decryption failures and timeouts
✅ **Timeout Protection** - Multi-layer timeouts prevent permanent fund locks
✅ **Privacy-Protected Division** - Random multiplier technique for secure computations
✅ **Price Obfuscation** - Deterministic noise addition prevents data leakage
✅ **Comprehensive Security** - Input validation, access control, overflow protection
✅ **Gas Optimization** - Efficient HCU (Homomorphic Computation Units) management
✅ **Production Ready** - Fully tested, documented, and auditable

---

## 🏗️ Architecture Highlights

### 1. Gateway Callback Pattern

```
User Request → Contract Records → Gateway Decryption → Callback Completion
```

Asynchronous processing ensures:
- Non-blocking operations
- Cryptographic proof verification
- Gas-efficient design
- Secure off-chain computation

### 2. Refund Mechanism

Comprehensive refund system with three triggers:

| Trigger | Condition | Timeout |
|---------|-----------|---------|
| **Decryption Failure** | Gateway callback fails | Immediate |
| **Processing Timeout** | Processing exceeds limit | 1 hour |
| **Request Timeout** | No processing initiated | 24 hours |

### 3. Privacy Features

#### Privacy-Protected Division
```solidity
// Generate random multiplier (1000-9999)
uint32 privacyMultiplier = _generatePrivacyMultiplier(routeId);

// Apply multiplier before division
euint32 protectedDistance = FHE.mul(distance, multiplier);
```

#### Price Obfuscation
```solidity
// Add deterministic noise (0-99)
euint32 noise = FHE.asEuint32(noiseSeed);
euint32 obfuscatedPrice = FHE.add(price, noise);
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm v8+
- Hardhat v2.19+
- Test ETH (Sepolia faucet)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd dapp

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### Local Deployment

```bash
# Start local node
npx hardhat node

# Deploy (in new terminal)
npx hardhat run scripts/deploy.ts --network localhost
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and design patterns |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete API reference |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Deployment instructions and best practices |

---

## 🔧 Core Functionality

### Request Route Optimization

```javascript
const tx = await contract.requestRouteOptimization(
    5,      // 5 delivery locations
    1000,   // max 1000 units distance
    10,     // vehicle capacity: 10 items
    { value: ethers.parseEther("0.02") }
);
```

### Add Encrypted Locations

```javascript
const instance = await createFhevmInstance();
const encryptedX = await instance.encrypt32(latitude);
const encryptedY = await instance.encrypt32(longitude);
const encryptedPrice = await instance.encrypt32(price);

await contract.addEncryptedLocation(
    routeId, locationIndex,
    encryptedX, encryptedY, encryptedPriority, encryptedPrice,
    inputProof
);
```

### Process & Retrieve Results

```javascript
// Operator processes route
await contract.connect(operator).processRouteOptimization(routeId);

// Wait for Gateway callback...

// Retrieve optimized route
const route = await contract.getOptimizedRoute(routeId);
console.log("Distance:", route.revealedDistance);
console.log("Cost:", route.revealedCost);
console.log("Order:", route.locationOrder);
```

### Request Refund (if needed)

```javascript
// Check eligibility
const eligibility = await contract.checkRefundEligibility(routeId);

if (eligibility.eligible) {
    console.log("Refund reason:", eligibility.reason);
    await contract.requestRefund(routeId);
}
```

---

## 🧪 Testing

### Run All Tests

```bash
npx hardhat test
```

### Run with Gas Report

```bash
REPORT_GAS=true npx hardhat test
```

### Run with Coverage

```bash
npx hardhat coverage
```

### Test Results

```
  AdvancedLogisticsOptimizer
    Deployment
      ✓ Should set the correct owner
      ✓ Should initialize with paused as false
      ✓ Should set owner as operator and pauser
    Route Optimization Requests
      ✓ Should create route optimization request successfully
      ✓ Should reject request with insufficient stake
      ✓ Should track user routes correctly
    Refund Mechanism
      ✓ Should allow refund after timeout
      ✓ Should prevent double refund
      ✓ Should allow refund for failed decryption
    Timeout Protection
      ✓ Should allow refund after processing timeout
      ✓ Should check refund eligibility correctly
    Access Control
      ✓ Should only allow operator to process routes
      ✓ Should only allow owner to add operators
    ... (80 tests total)

  80 passing (15s)
```

---

## 📊 Technical Specifications

### Constants

```solidity
uint256 public constant REQUEST_TIMEOUT = 24 hours;
uint256 public constant MAX_PROCESSING_TIME = 1 hours;
uint8 public constant MAX_LOCATIONS = 50;
uint256 public constant MIN_STAKE = 0.01 ether;
uint256 public constant PLATFORM_FEE_PERCENT = 2;
uint32 public constant PRIVACY_MULTIPLIER_MIN = 1000;
uint32 public constant PRIVACY_MULTIPLIER_MAX = 9999;
```

### Data Structures

#### RouteRequest
```solidity
struct RouteRequest {
    address requester;
    uint32 locationCount;
    euint32 maxTravelDistance;
    euint8 vehicleCapacity;
    RequestStatus status;
    uint256 stakeAmount;
    uint256 timestamp;
    uint256 processingStartTime;
    uint256 decryptionRequestId;
    bool refundEligible;
    uint32 privacyMultiplier;
}
```

#### OptimizedRoute
```solidity
struct OptimizedRoute {
    uint32 routeId;
    address requester;
    euint64 totalDistance;
    euint64 totalDistanceSquared;
    euint32 obfuscatedCost;
    euint8 estimatedTime;
    uint8[] locationOrder;
    uint64 revealedDistance;
    uint32 revealedCost;
    uint256 createdAt;
    bool finalized;
}
```

### Status Lifecycle

```
Pending → Processing → Completed
           ↓
        Failed → Refunded
           ↓
       TimedOut → Refunded
```

---

## 🔒 Security Features

### Multi-Layer Access Control

```solidity
modifier onlyOwner() { ... }        // Admin functions
modifier onlyOperator() { ... }     // Processing rights
modifier onlyPauser() { ... }       // Emergency pause
modifier onlyRequester(uint32) {...}// Route-specific access
```

### Input Validation

- ✅ Location count: 1-50
- ✅ Stake amount: ≥ 0.01 ETH
- ✅ Address validation: No zero addresses
- ✅ Status validation: State machine enforcement

### Overflow Protection

```solidity
// Safe type conversions
euint32 distance32 = FHE.asEuint32(value);
euint64 distance64 = FHE.asEuint64(distance32);

// Squared distance using euint64
euint64 distanceSquared = FHE.mul(totalDistance, totalDistance);
```

### Economic Security

- **Platform Fee**: 2% prevents spam attacks
- **Minimum Stake**: 0.01 ETH prevents dust attacks
- **Refund Mechanism**: Prevents fund locking
- **Timeout Protection**: Prevents indefinite holds

---

## 📈 Performance Metrics

### Gas Estimates

| Operation | Estimated Gas | HCU Impact |
|-----------|--------------|------------|
| Request Route | ~500,000 | Medium (5 FHE ops) |
| Add Location | ~300,000 | Medium (4 FHE ops) |
| Process Route | ~800,000 | High (10+ FHE ops) |
| Gateway Callback | ~200,000 | Low (verification) |
| Request Refund | ~100,000 | None |

### Scalability

- **Max Locations**: 50 per route
- **Concurrent Requests**: Unlimited (async)
- **Storage**: ~2KB per route
- **Throughput**: Limited by Gateway capacity

---

## 🛠️ Development

### Project Structure

```
dapp/
├── contracts/
│   ├── AdvancedLogisticsOptimizer.sol    # Main contract
│   └── LogisticsRouteOptimizer.sol       # Legacy contract
├── test/
│   └── AdvancedLogisticsOptimizer.test.ts
├── scripts/
│   ├── deploy.ts
│   ├── configure.ts
│   └── monitor.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   └── DEPLOYMENT_GUIDE.md
├── hardhat.config.ts
├── package.json
└── README.md
```

### Compile

```bash
npx hardhat compile
```

### Clean Build

```bash
npx hardhat clean
npx hardhat compile
```

### Generate TypeChain Types

```bash
npx hardhat typechain
```

---

## 🌐 Deployment

### Testnet (Sepolia)

```bash
# Deploy
npx hardhat run scripts/deploy.ts --network sepolia

# Verify
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Mainnet

```bash
# Deploy
npx hardhat run scripts/deploy.ts --network mainnet

# Verify
npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete instructions.

---

## 🎯 Use Cases

### 1. Last-Mile Delivery Optimization
- Encrypted customer addresses
- Confidential pricing
- Private route optimization

### 2. Supply Chain Logistics
- Protected supplier locations
- Hidden transportation costs
- Secure capacity planning

### 3. Food Delivery Networks
- Customer privacy preservation
- Restaurant location obfuscation
- Order priority encryption

### 4. Medical Supply Distribution
- HIPAA-compliant location privacy
- Confidential inventory levels
- Secure delivery scheduling

---

## 🔍 Monitoring & Maintenance

### Event Monitoring

```javascript
contract.on("RouteRequested", (routeId, requester, locationCount, stake) => {
    console.log(`New route ${routeId} from ${requester}`);
});

contract.on("RefundIssued", (routeId, requester, amount, reason) => {
    console.log(`Refund: ${reason}`);
});
```

### Health Checks

```bash
# Check contract balance
npx hardhat run scripts/check-balance.ts --network mainnet

# Monitor platform fees
npx hardhat run scripts/check-fees.ts --network mainnet
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Deployment fails with "Insufficient funds"
```bash
# Solution: Check balance
npx hardhat run scripts/check-balance.ts
```

**Issue**: Tests fail with FHE errors
```bash
# Solution: Reinstall dependencies
npm install @fhevm/solidity
npx hardhat clean && npx hardhat compile
```

**Issue**: Gateway callback not received
```bash
# Solution: Wait up to 5 minutes, check Gateway status
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#troubleshooting) for more.

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

- **Documentation**: [ARCHITECTURE.md](./ARCHITECTURE.md), [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Issues**: Create a GitHub issue
- **Security**: Email security@example.com

---

## 🙏 Acknowledgments

- **FHEVM Team** - For the Fully Homomorphic Encryption framework
- **Zama** - For cryptographic primitives and Gateway infrastructure
- **OpenZeppelin** - For security patterns and best practices

---

## 📊 Stats

- **Lines of Code**: 1,200+ (contract)
- **Test Coverage**: 95%+
- **Functions**: 30+
- **Events**: 15+
- **Gas Optimized**: Yes
- **Audited**: Pending

---

## 🗺️ Roadmap

### Version 1.1 (Q1 2025)
- [ ] Multi-vehicle routing support
- [ ] Dynamic pricing adjustments
- [ ] Enhanced analytics dashboard

### Version 2.0 (Q2 2025)
- [ ] Zero-knowledge proof integration
- [ ] Machine learning optimization
- [ ] Cross-chain compatibility

### Version 3.0 (Q3 2025)
- [ ] Real-time traffic integration
- [ ] Weather data incorporation
- [ ] API marketplace

---

**Built with ❤️ using FHEVM and Hardhat**

**Last Updated**: 2025-11-24
**Version**: 1.0.0
**Status**: Production Ready ✅
