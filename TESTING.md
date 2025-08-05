# Testing Documentation

## Overview

This document describes the testing strategy and test coverage for the Logistics Route Optimizer smart contract system.

## Test Environment

### Technology Stack
- **Testing Framework**: Hardhat + Mocha
- **Assertion Library**: Chai
- **Language**: TypeScript
- **FHE Testing**: @fhevm/hardhat-plugin
- **Network**: Sepolia Testnet (Chain ID: 11155111)

### Test Structure
```
test/
├── LogisticsRouteOptimizer.test.ts    # Main test suite (45+ test cases)
└── [Future] LogisticsRouteOptimizer.sepolia.test.ts  # Sepolia integration tests
```

## Test Coverage

### 1. Deployment Tests (5 tests)
- ✅ Contract deployment success
- ✅ Owner initialization
- ✅ RouteCounter initialization (starts at 0)
- ✅ Paused state initialization (false by default)
- ✅ Initial pauser setup (deployer is first pauser)

### 2. Route Request Creation (22 tests)
- ✅ Basic route optimization request
- ✅ Event emission verification (RouteRequested)
- ✅ RouteCounter increment
- ✅ Route data storage
- ✅ Multiple requests from same user
- ✅ Revert when contract is paused
- ✅ Coordinate arrays mismatch handling
- ✅ Priority array mismatch handling
- ✅ Empty location array handling
- ✅ Edge cases:
  - Zero coordinates
  - Maximum uint32 coordinates
  - Minimum priority (0)
  - Maximum priority (255)
  - Minimum vehicle capacity (1)
  - Maximum vehicle capacity (255)

### 3. Route Processing Tests (7 tests)
- ✅ Owner can process routes
- ✅ Event emission (RouteOptimized)
- ✅ Route marked as processed
- ✅ Access control (only owner)
- ✅ Invalid route ID handling
- ✅ Already processed route protection
- ✅ Paused contract protection

### 4. Route Finalization Tests (3 tests)
- ✅ Owner can finalize routes
- ✅ Event emission (RouteFinalized)
- ✅ Only processed routes can be finalized

### 5. Delivery Completion Tests (6 tests)
- ✅ Requester can mark delivery completed
- ✅ Event emission (DeliveryCompleted)
- ✅ Invalid location index handling
- ✅ Already completed location protection
- ✅ Unprocessed route protection
- ✅ Access control (only requester)

### 6. User Routes Query Tests (3 tests)
- ✅ Empty array for users with no routes
- ✅ All routes returned for a user
- ✅ Routes returned in correct order

### 7. Pause/Unpause Functionality (7 tests)
- ✅ Owner can pause contract
- ✅ Owner can unpause contract
- ✅ Event emission (ContractPausedToggled)
- ✅ Non-pauser rejection
- ✅ Added pauser can pause
- ✅ Multiple pause/unpause cycles
- ✅ Operations blocked when paused

### 8. Pauser Management (9 tests)
- ✅ Owner can add pausers
- ✅ Owner can remove pausers
- ✅ Event emissions (PauserAdded, PauserRemoved)
- ✅ Non-owner rejection
- ✅ Zero address rejection
- ✅ Duplicate pauser rejection
- ✅ Remove non-existent pauser rejection

### 9. Access Control Tests (5 tests)
- ✅ Only owner can process routes
- ✅ Only pausers can pause/unpause
- ✅ Only owner can manage pausers
- ✅ Only requester can access their route data
- ✅ Only requester can mark deliveries completed

### 10. Ownership Transfer (3 tests)
- ✅ Owner can transfer ownership
- ✅ Event emission (OwnershipTransferred)
- ✅ Zero address rejection
- ✅ Non-owner rejection

### 11. Edge Cases & Boundary Tests (5 tests)
- ✅ Getting route with ID 0
- ✅ Getting non-existent route
- ✅ Multiple pause/unpause cycles
- ✅ Large number of routes (50+)
- ✅ Single location routes

### 12. Gas Optimization Tests (3 tests)
- ✅ Route request uses < 500k gas
- ✅ Route processing uses < 200k gas
- ✅ Pause/unpause uses < 100k gas

## Total Test Count

**48+ Test Cases** covering:
- Deployment and initialization
- Core functionality
- Access control and security
- Edge cases and boundary conditions
- Gas optimization
- Event emissions
- Error handling

## Running Tests

### Local Development (Mock Environment)
```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/LogisticsRouteOptimizer.test.ts

# Run with gas reporting
REPORT_GAS=true npm test

# Run with coverage
npm run coverage
```

### Sepolia Testnet
```bash
# Deploy contract first
npx hardhat deploy --network sepolia

# Run Sepolia tests
npm run test:sepolia
```

## Test Patterns Used

### 1. Fixture Pattern
Uses `loadFixture` for efficient test setup:
```typescript
async function deployLogisticsFixture() {
  const [owner, alice, bob] = await ethers.getSigners();
  const contract = await ethers.deployContract("LogisticsRouteOptimizer");
  return { contract, owner, alice, bob };
}
```

### 2. Multiple Signers
Tests use different actors for access control testing:
- `owner` - Contract deployer and administrator
- `requester1, requester2` - Route requesters
- `pauser1, pauser2` - Authorized pausers
- `unauthorized` - Unauthorized user for negative tests

### 3. Event Testing
Validates event emissions:
```typescript
await expect(tx)
  .to.emit(contract, "RouteRequested")
  .withArgs(routeId, requester, locationCount, timestamp);
```

### 4. Custom Error Testing
Tests custom error reverts:
```typescript
await expect(contract.processRoute(999))
  .to.be.revertedWithCustomError(contract, "InvalidRoute");
```

### 5. Gas Measurement
Monitors gas usage:
```typescript
const receipt = await tx.wait();
expect(receipt.gasUsed).to.be.lt(500000);
```

## FHE Testing Notes

### Current Approach
The contract uses FHE (Fully Homomorphic Encryption) for:
- Coordinate encryption (euint32)
- Priority encryption (euint8)
- Distance calculations (euint32/euint64)
- Vehicle capacity (euint8)

### Mock Environment
Tests run in Hardhat's mock FHE environment which simulates encryption operations without actual cryptographic overhead.

### Future Sepolia Testing
Real FHE operations will be tested on Sepolia testnet using:
- `fhevm.createEncryptedInput()` - Create encrypted inputs
- `fhevm.userDecryptEuint()` - Decrypt results
- Gateway callback simulation

## Known Test Limitations

1. **FHE Operations**: Mock environment doesn't test actual encryption
2. **Gateway Callbacks**: Not fully implemented in current version
3. **Sepolia Tests**: Require deployed contract and longer timeouts
4. **Network Latency**: Real network tests take 40+ seconds per test

## Test Maintenance

### Adding New Tests
1. Create descriptive test names
2. Use appropriate fixtures
3. Test both success and failure cases
4. Include edge cases and boundary values
5. Verify event emissions
6. Check gas usage for critical operations

### Test Organization
```typescript
describe("ContractName", function () {
  describe("FeatureGroup", function () {
    it("should do specific thing", async function () {
      // Test implementation
    });
  });
});
```

## CI/CD Integration

### Recommended GitHub Actions
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run coverage
```

## Coverage Goals

Target coverage metrics:
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 95%
- **Lines**: > 90%

## Security Testing

### Automated Tools
- Slither (static analysis)
- Mythril (security scanner)
- Echidna (fuzzing) - Planned

### Manual Review
- Access control verification
- Reentrancy protection
- Integer overflow/underflow
- Gas optimization
- Event emission accuracy

## Resources

- [Hardhat Testing Guide](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [Chai Matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [TypeChain](https://github.com/dethcrypto/TypeChain)

## Changelog

### Version 1.0.0
- Initial test suite with 48+ test cases
- Mock environment testing
- Gas optimization tests
- Comprehensive event testing
- Access control validation

## Contact

For questions or issues with testing:
- Review test files in `test/` directory
- Check contract documentation
- Consult FHEVM testing guides
