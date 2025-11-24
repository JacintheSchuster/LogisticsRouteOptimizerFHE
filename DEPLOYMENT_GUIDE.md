# Deployment Guide

## Advanced Logistics Optimizer - Complete Deployment Documentation

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Testing](#testing)
5. [Testnet Deployment](#testnet-deployment)
6. [Mainnet Deployment](#mainnet-deployment)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Verification](#verification)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Git**: Latest version
- **Hardhat**: v2.19.0 or higher

### Required Accounts

- **Wallet**: MetaMask or hardware wallet
- **RPC Provider**: Alchemy, Infura, or similar
- **Etherscan API Key**: For contract verification (optional)

### Minimum Funds

- **Testnet**: ~0.1 test ETH (for deployment + testing)
- **Mainnet**: ~0.5 ETH (deployment + initial operations)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd dapp
```

### 2. Install Dependencies

```bash
npm install
```

**Key Dependencies:**
```json
{
  "dependencies": {
    "@fhevm/solidity": "^0.8.0",
    "hardhat": "^2.19.0",
    "ethers": "^6.9.0",
    "@nomicfoundation/hardhat-ethers": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "chai": "^4.3.0",
    "@typechain/hardhat": "^9.0.0"
  }
}
```

### 3. Configure Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Network Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Private Keys (NEVER commit these!)
DEPLOYER_PRIVATE_KEY=0x...
OPERATOR_PRIVATE_KEY=0x...

# Etherscan Verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# FHEVM Configuration
FHEVM_GATEWAY_URL=https://gateway.fhevm.io
GATEWAY_RELAYER_URL=https://relayer.fhevm.io

# Contract Settings
MIN_STAKE=10000000000000000  # 0.01 ETH in wei
PLATFORM_FEE_PERCENT=2
```

⚠️ **Security Warning**: Never commit `.env` to version control!

### 4. Update Hardhat Configuration

Edit `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ""],
      chainId: 11155111,
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ""],
      chainId: 1,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
```

---

## Local Development

### 1. Start Local Node

```bash
npx hardhat node
```

This starts a local Ethereum node at `http://127.0.0.1:8545/`

### 2. Deploy Locally

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

### 3. Create Deployment Script

Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Advanced Logistics Optimizer...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy contract
  const AdvancedLogisticsOptimizer = await ethers.getContractFactory("AdvancedLogisticsOptimizer");
  const contract = await AdvancedLogisticsOptimizer.deploy();

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("Contract deployed to:", contractAddress);

  // Verify initial state
  console.log("\nVerifying initial state...");
  console.log("Owner:", await contract.owner());
  console.log("Paused:", await contract.paused());
  console.log("Route Counter:", await contract.routeCounter());
  console.log("Platform Fees:", ethers.formatEther(await contract.platformFees()), "ETH");

  // Save deployment info
  const deploymentInfo = {
    network: "localhost",
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log("\nDeployment Info:", JSON.stringify(deploymentInfo, null, 2));

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## Testing

### 1. Run All Tests

```bash
npx hardhat test
```

### 2. Run Specific Test Suite

```bash
npx hardhat test test/AdvancedLogisticsOptimizer.test.ts
```

### 3. Run with Gas Report

```bash
REPORT_GAS=true npx hardhat test
```

### 4. Run with Coverage

```bash
npx hardhat coverage
```

**Expected Output:**
```
  AdvancedLogisticsOptimizer
    Deployment
      ✓ Should set the correct owner
      ✓ Should initialize with paused as false
      ...
    Route Optimization Requests
      ✓ Should create route optimization request successfully
      ...
    Refund Mechanism
      ✓ Should allow refund after timeout
      ...

  80 passing (15s)
```

---

## Testnet Deployment

### 1. Sepolia Testnet

#### Get Testnet ETH

- **Faucet 1**: https://sepoliafaucet.com/
- **Faucet 2**: https://faucet.quicknode.com/ethereum/sepolia

#### Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

**Sample Output:**
```
Deploying Advanced Logistics Optimizer...
Deploying with account: 0x1234...5678
Account balance: 0.5 ETH
Contract deployed to: 0xabcd...ef01
Owner: 0x1234...5678
Paused: false
Route Counter: 0
```

#### Verify Contract on Etherscan

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### 2. Configure Operators

Create `scripts/configure.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x..."; // Your deployed contract
  const operatorAddress = "0x..."; // Operator wallet

  const contract = await ethers.getContractAt("AdvancedLogisticsOptimizer", contractAddress);

  console.log("Adding operator:", operatorAddress);
  const tx = await contract.addOperator(operatorAddress);
  await tx.wait();

  console.log("Operator added successfully!");
  console.log("Is operator:", await contract.operators(operatorAddress));
}

main().catch(console.error);
```

Run:
```bash
npx hardhat run scripts/configure.ts --network sepolia
```

---

## Mainnet Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Gas optimization reviewed
- [ ] Deployment script tested on testnet
- [ ] Environment variables configured
- [ ] Backup deployer private key
- [ ] Sufficient ETH for deployment (~0.5 ETH)
- [ ] Multi-sig wallet prepared (if applicable)

### 1. Final Code Review

```bash
# Check for any issues
npx hardhat compile

# Run full test suite
npx hardhat test

# Generate gas report
REPORT_GAS=true npx hardhat test
```

### 2. Deploy to Mainnet

```bash
npx hardhat run scripts/deploy.ts --network mainnet
```

⚠️ **Warning**: This will use real ETH!

### 3. Verify on Etherscan

```bash
npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
```

### 4. Save Deployment Artifacts

Create `deployments/mainnet.json`:

```json
{
  "contractAddress": "0x...",
  "deployer": "0x...",
  "blockNumber": 12345678,
  "timestamp": "2025-11-24T10:00:00Z",
  "transactionHash": "0x...",
  "gasUsed": "1234567",
  "deploymentCost": "0.05 ETH"
}
```

---

## Post-Deployment Configuration

### 1. Set Up Operators

```typescript
// scripts/setup-operators.ts
const operators = [
  "0x1111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222",
];

for (const operator of operators) {
  await contract.addOperator(operator);
  console.log("Added operator:", operator);
}
```

### 2. Set Up Pausers

```typescript
const pausers = [
  "0x3333333333333333333333333333333333333333",
];

for (const pauser of pausers) {
  await contract.addPauser(pauser);
  console.log("Added pauser:", pauser);
}
```

### 3. Configure Multi-Sig (Optional)

```typescript
// Transfer ownership to multi-sig
const multiSigAddress = "0x...";
await contract.transferOwnership(multiSigAddress);
console.log("Ownership transferred to:", multiSigAddress);
```

### 4. Test Basic Operations

```typescript
// Test route request
const tx = await contract.requestRouteOptimization(
  5,      // 5 locations
  1000,   // max distance
  10,     // capacity
  { value: ethers.parseEther("0.02") }
);

const receipt = await tx.wait();
console.log("Test route created:", receipt.events[0].args.routeId);
```

---

## Verification

### 1. Verify Contract Code on Etherscan

**Manual Verification:**

1. Go to https://etherscan.io/address/<CONTRACT_ADDRESS>#code
2. Click "Verify and Publish"
3. Fill in:
   - Compiler: Solidity 0.8.24
   - Optimization: Yes, 200 runs
   - Contract Name: AdvancedLogisticsOptimizer
4. Paste flattened source code
5. Submit

**Automated Verification:**

```bash
npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
```

### 2. Verify Initial State

```javascript
const contract = await ethers.getContractAt("AdvancedLogisticsOptimizer", contractAddress);

console.log("Owner:", await contract.owner());
console.log("Paused:", await contract.paused());
console.log("Route Counter:", await contract.routeCounter());
console.log("Platform Fees:", await contract.platformFees());
console.log("MIN_STAKE:", await contract.MIN_STAKE());
console.log("PLATFORM_FEE_PERCENT:", await contract.PLATFORM_FEE_PERCENT());
```

### 3. Verify Roles

```javascript
console.log("Is deployer operator?", await contract.operators(deployerAddress));
console.log("Is deployer pauser?", await contract.pausers(deployerAddress));
```

---

## Monitoring

### 1. Set Up Event Monitoring

```typescript
// scripts/monitor.ts
import { ethers } from "hardhat";

async function monitor() {
  const contract = await ethers.getContractAt("AdvancedLogisticsOptimizer", contractAddress);

  console.log("Monitoring events...");

  contract.on("RouteRequested", (routeId, requester, locationCount, stakeAmount, timestamp) => {
    console.log(`\n[RouteRequested]`);
    console.log(`  Route ID: ${routeId}`);
    console.log(`  Requester: ${requester}`);
    console.log(`  Locations: ${locationCount}`);
    console.log(`  Stake: ${ethers.formatEther(stakeAmount)} ETH`);
  });

  contract.on("RouteOptimized", (routeId, requester, distance, cost, timestamp) => {
    console.log(`\n[RouteOptimized]`);
    console.log(`  Route ID: ${routeId}`);
    console.log(`  Distance: ${distance}`);
    console.log(`  Cost: ${cost}`);
  });

  contract.on("RefundIssued", (routeId, requester, amount, reason) => {
    console.log(`\n[RefundIssued]`);
    console.log(`  Route ID: ${routeId}`);
    console.log(`  Requester: ${requester}`);
    console.log(`  Amount: ${ethers.formatEther(amount)} ETH`);
    console.log(`  Reason: ${reason}`);
  });
}

monitor().catch(console.error);
```

### 2. Monitor Contract Balance

```bash
# Check contract balance
npx hardhat run scripts/check-balance.ts --network mainnet
```

```typescript
// scripts/check-balance.ts
const balance = await ethers.provider.getBalance(contractAddress);
console.log("Contract balance:", ethers.formatEther(balance), "ETH");
```

### 3. Monitor Platform Fees

```typescript
const fees = await contract.platformFees();
console.log("Platform fees:", ethers.formatEther(fees), "ETH");

if (fees > ethers.parseEther("1.0")) {
  console.log("⚠️ Consider withdrawing fees");
}
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails: "Insufficient Funds"

**Solution:**
```bash
# Check balance
npx hardhat run scripts/check-balance.ts --network sepolia

# Get more testnet ETH from faucet
```

#### 2. Verification Fails: "Compiler Version Mismatch"

**Solution:**
Ensure `hardhat.config.ts` matches verification settings:
```typescript
solidity: {
  version: "0.8.24",  // Must match exactly
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,        // Must match
    },
  },
}
```

#### 3. Test Failures: "FHE Operations Failing"

**Solution:**
```bash
# Ensure FHEVM dependencies are installed
npm install @fhevm/solidity

# Clear cache and recompile
npx hardhat clean
npx hardhat compile
```

#### 4. Gateway Callback Not Received

**Solution:**
- Check FHEVM Gateway is running
- Verify `GATEWAY_RELAYER_URL` in `.env`
- Check decryption request ID is valid
- Wait up to 5 minutes for callback

#### 5. "NotOperator" Error

**Solution:**
```bash
# Add operator
npx hardhat run scripts/configure.ts --network sepolia
```

### Gas Estimation Issues

If gas estimation fails:

```typescript
// Manually set gas limit
const tx = await contract.requestRouteOptimization(5, 1000, 10, {
  value: ethers.parseEther("0.02"),
  gasLimit: 600000  // Set manually
});
```

### RPC Rate Limiting

If hitting rate limits:

```typescript
// Add delay between transactions
await new Promise(resolve => setTimeout(resolve, 1000));
```

---

## Security Best Practices

### 1. Private Key Management

- ✅ Use hardware wallet for mainnet
- ✅ Never commit private keys to git
- ✅ Use environment variables
- ✅ Rotate keys periodically
- ✅ Use multi-sig for ownership

### 2. Contract Security

- ✅ Complete security audit before mainnet
- ✅ Enable contract pause in emergencies
- ✅ Set up monitoring alerts
- ✅ Test all functions on testnet first
- ✅ Verify contract code on Etherscan

### 3. Operational Security

- ✅ Use separate wallets for deployer/operator
- ✅ Set up 2FA on all accounts
- ✅ Keep backup of deployment artifacts
- ✅ Document all post-deployment changes
- ✅ Regular security reviews

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor contract events
- Check platform fee accumulation
- Review refund requests

**Weekly:**
- Withdraw platform fees (if > threshold)
- Review operator performance
- Check for pending timeouts

**Monthly:**
- Security review
- Gas optimization analysis
- Update documentation

---

## Rollback Plan

If critical issue found:

1. **Pause Contract**
   ```bash
   npx hardhat run scripts/pause.ts --network mainnet
   ```

2. **Announce Downtime**
   - Update website
   - Notify users
   - Provide timeline

3. **Issue Refunds**
   - Mark all pending requests as failed
   - Allow users to claim refunds

4. **Deploy Fixed Version**
   - Deploy new contract
   - Migrate state (if possible)
   - Update frontend

5. **Resume Operations**
   - Unpause new contract
   - Notify users
   - Monitor closely

---

## Contact & Support

**Technical Issues:**
- Create GitHub issue
- Email: tech-support@example.com

**Security Issues:**
- Email: security@example.com
- PGP Key: [link]

**Documentation:**
- [Architecture](./ARCHITECTURE.md)
- [API Docs](./API_DOCUMENTATION.md)

---

**Last Updated**: 2025-11-24
**Version**: 1.0.0
