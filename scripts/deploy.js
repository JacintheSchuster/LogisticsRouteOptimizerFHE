const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy LogisticsRouteOptimizer Contract
 *
 * This script deploys the LogisticsRouteOptimizer smart contract to the specified network
 * and saves deployment information for future use.
 */

async function main() {
  console.log("\n========================================");
  console.log("  Logistics Route Optimizer Deployment");
  console.log("========================================\n");

  // Get network information
  const network = await hre.ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  const chainId = network.chainId;

  console.log("📡 Network:", networkName);
  console.log("🔗 Chain ID:", chainId.toString());
  console.log("");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);

  console.log("👤 Deployer:", deployerAddress);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("");

  // Check if balance is sufficient
  if (balance === 0n) {
    console.error("❌ Error: Deployer account has no balance!");
    process.exit(1);
  }

  // Deploy contract
  console.log("🚀 Deploying LogisticsRouteOptimizer contract...\n");

  const LogisticsRouteOptimizer = await hre.ethers.getContractFactory(
    "LogisticsRouteOptimizer"
  );

  const startTime = Date.now();
  const contract = await LogisticsRouteOptimizer.deploy();

  console.log("⏳ Waiting for deployment transaction to be mined...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n✅ Contract deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("⏱️  Deploy Time:", deployTime, "seconds");
  console.log("");

  // Get deployment transaction details
  const deployTx = contract.deploymentTransaction();
  if (deployTx) {
    console.log("📝 Transaction Details:");
    console.log("   Hash:", deployTx.hash);
    console.log("   Block:", deployTx.blockNumber);
    console.log("   Gas Used:", deployTx.gasLimit.toString());
    console.log("");
  }

  // Verify initial contract state
  console.log("🔍 Verifying initial state...");
  try {
    const owner = await contract.owner();
    const routeCounter = await contract.routeCounter();
    const paused = await contract.paused();

    console.log("   Owner:", owner);
    console.log("   Route Counter:", routeCounter.toString());
    console.log("   Paused:", paused);
    console.log("");
  } catch (error) {
    console.log("   ⚠️  Could not verify initial state:", error.message);
  }

  // Save deployment information
  const deploymentInfo = {
    network: networkName,
    chainId: chainId.toString(),
    contractName: "LogisticsRouteOptimizer",
    contractAddress: contractAddress,
    deployer: deployerAddress,
    deploymentTransaction: deployTx ? deployTx.hash : null,
    blockNumber: deployTx ? deployTx.blockNumber : null,
    timestamp: new Date().toISOString(),
    deployTime: deployTime,
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save to JSON file
  const deploymentFile = path.join(
    deploymentsDir,
    `${networkName}-deployment.json`
  );
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Deployment info saved to:", deploymentFile);
  console.log("");

  // Display post-deployment instructions
  console.log("========================================");
  console.log("  Next Steps");
  console.log("========================================\n");

  if (networkName === "sepolia" || networkName.includes("testnet")) {
    console.log("1️⃣  Verify contract on Etherscan:");
    console.log(
      `   npx hardhat verify --network ${networkName} ${contractAddress}`
    );
    console.log("");
    console.log("   Or use the verify script:");
    console.log(`   node scripts/verify.js ${contractAddress}`);
    console.log("");
  }

  console.log("2️⃣  Update frontend configuration:");
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Network: ${networkName}`);
  console.log("");

  console.log("3️⃣  Test contract interaction:");
  console.log(`   node scripts/interact.js`);
  console.log("");

  console.log("4️⃣  Run simulation:");
  console.log(`   node scripts/simulate.js`);
  console.log("");

  if (networkName === "sepolia") {
    console.log("🔗 View on Etherscan:");
    console.log(
      `   https://sepolia.etherscan.io/address/${contractAddress}`
    );
    console.log("");
  }

  console.log("========================================\n");

  return {
    contractAddress,
    deploymentInfo,
  };
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\n❌ Deployment failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
