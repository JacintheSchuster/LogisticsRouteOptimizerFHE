const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Interact with LogisticsRouteOptimizer Contract
 *
 * This script demonstrates how to interact with the deployed contract
 * Usage: node scripts/interact.js [CONTRACT_ADDRESS]
 */

async function main() {
  console.log("\n========================================");
  console.log("  Contract Interaction");
  console.log("========================================\n");

  // Get contract address
  let contractAddress = process.argv[2];

  if (!contractAddress) {
    const network = await hre.ethers.provider.getNetwork();
    const networkName = network.name === "unknown" ? "localhost" : network.name;
    const deploymentFile = path.join(
      __dirname,
      "..",
      "deployments",
      `${networkName}-deployment.json`
    );

    if (fs.existsSync(deploymentFile)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
      contractAddress = deployment.contractAddress;
      console.log(
        `📄 Using contract address from ${networkName}-deployment.json`
      );
    } else {
      console.error("❌ Error: Contract address not provided!");
      console.log("\nUsage: node scripts/interact.js [CONTRACT_ADDRESS]");
      process.exit(1);
    }
  }

  console.log("📍 Contract Address:", contractAddress);
  console.log("");

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  const signerAddress = await signer.getAddress();
  const balance = await hre.ethers.provider.getBalance(signerAddress);

  console.log("👤 Signer:", signerAddress);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("");

  // Get contract instance
  const LogisticsRouteOptimizer = await hre.ethers.getContractFactory(
    "LogisticsRouteOptimizer"
  );
  const contract = LogisticsRouteOptimizer.attach(contractAddress);

  console.log("🔗 Connected to LogisticsRouteOptimizer contract");
  console.log("");

  try {
    // ========================================
    // 1. Read Contract State
    // ========================================
    console.log("📖 Reading contract state...\n");

    const owner = await contract.owner();
    const routeCounter = await contract.routeCounter();
    const paused = await contract.paused();

    console.log("   Owner:", owner);
    console.log("   Route Counter:", routeCounter.toString());
    console.log("   Paused:", paused);
    console.log("   Is Owner:", owner.toLowerCase() === signerAddress.toLowerCase());
    console.log("");

    // ========================================
    // 2. Get User Routes
    // ========================================
    console.log("📊 Checking user routes...\n");

    const userRoutes = await contract.getUserRoutes(signerAddress);
    console.log("   Your Routes:", userRoutes.length);

    if (userRoutes.length > 0) {
      console.log("   Route IDs:", userRoutes.map((r) => r.toString()).join(", "));

      // Display details for each route
      for (let i = 0; i < userRoutes.length; i++) {
        const routeId = userRoutes[i];
        const routeRequest = await contract.getRouteRequest(routeId);

        console.log(`\n   Route ${routeId}:`);
        console.log(`      Requester: ${routeRequest[0]}`);
        console.log(`      Locations: ${routeRequest[1]}`);
        console.log(`      Processed: ${routeRequest[2]}`);
        console.log(
          `      Timestamp: ${new Date(Number(routeRequest[3]) * 1000).toLocaleString()}`
        );
      }
    } else {
      console.log("   No routes found for this address");
    }
    console.log("");

    // ========================================
    // 3. Check Pauser Status
    // ========================================
    console.log("🔒 Checking pauser status...\n");

    const isPauser = await contract.pausers(signerAddress);
    console.log("   Is Pauser:", isPauser);
    console.log("");

    // ========================================
    // 4. Interactive Menu
    // ========================================
    console.log("========================================");
    console.log("  Available Actions");
    console.log("========================================\n");

    console.log("Read-only operations (no gas required):");
    console.log("  • Check contract state ✅ (shown above)");
    console.log("  • Get user routes ✅ (shown above)");
    console.log("  • View route details");
    console.log("");

    console.log("Write operations (requires gas):");
    console.log("  • Request route optimization");
    console.log("  • Process route optimization (owner only)");
    console.log("  • Mark delivery completed");
    console.log("  • Toggle pause (pauser only)");
    console.log("  • Add/remove pauser (owner only)");
    console.log("  • Transfer ownership (owner only)");
    console.log("");

    // ========================================
    // 5. Example: Request Route Optimization
    // ========================================
    console.log("========================================");
    console.log("  Example: Request Route Optimization");
    console.log("========================================\n");

    console.log("📝 To request a route optimization, you need:");
    console.log("   • Encrypted coordinates (X, Y) for each location");
    console.log("   • Priority values for each location");
    console.log("   • Maximum travel distance constraint");
    console.log("   • Vehicle capacity");
    console.log("");

    console.log("⚠️  Note: This contract uses FHEVM (Fully Homomorphic Encryption)");
    console.log("   which requires special setup and encryption libraries.");
    console.log("   Use the simulate.js script for testing with mock data.");
    console.log("");

    console.log("Example usage:");
    console.log(`   node scripts/simulate.js ${contractAddress}`);
    console.log("");

    // ========================================
    // 6. Owner-only Operations
    // ========================================
    if (owner.toLowerCase() === signerAddress.toLowerCase()) {
      console.log("========================================");
      console.log("  Owner Operations Available");
      console.log("========================================\n");

      console.log("As the contract owner, you can:");
      console.log("  • Process route optimization requests");
      console.log("  • Request route decryption via Gateway");
      console.log("  • Add or remove pausers");
      console.log("  • Transfer ownership");
      console.log("");

      // Example: Check if there are pending routes
      const totalRoutes = Number(routeCounter);
      if (totalRoutes > 0) {
        console.log(`💡 There are ${totalRoutes} route(s) in the system.`);
        console.log("   Check each route's processed status to find pending routes.");
        console.log("");
      }
    }

    // ========================================
    // 7. Network Information
    // ========================================
    const network = await hre.ethers.provider.getNetwork();
    const blockNumber = await hre.ethers.provider.getBlockNumber();

    console.log("========================================");
    console.log("  Network Information");
    console.log("========================================\n");
    console.log("   Network:", network.name);
    console.log("   Chain ID:", network.chainId.toString());
    console.log("   Block Number:", blockNumber);
    console.log("");

    // ========================================
    // 8. Useful Links
    // ========================================
    console.log("========================================");
    console.log("  Useful Links");
    console.log("========================================\n");

    if (network.name === "sepolia") {
      console.log("🔗 View contract on Etherscan:");
      console.log(
        `   https://sepolia.etherscan.io/address/${contractAddress}`
      );
      console.log("");
    }

    console.log("📚 Documentation:");
    console.log("   • FHEVM Docs: https://docs.zama.ai/fhevm");
    console.log("   • Contract ABI: ./artifacts/contracts/");
    console.log("");

    console.log("========================================\n");

  } catch (error) {
    console.error("\n❌ Error during interaction:");
    console.error(error.message);
    console.log("");

    if (error.message.includes("reverted")) {
      console.log("💡 The transaction was reverted. Possible reasons:");
      console.log("   • Insufficient permissions");
      console.log("   • Invalid parameters");
      console.log("   • Contract is paused");
    }

    process.exit(1);
  }

  console.log("✅ Interaction completed successfully!");
  console.log("");
}

// Execute interaction
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\n❌ Interaction script failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
