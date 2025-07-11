const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Simulate LogisticsRouteOptimizer Contract Operations
 *
 * This script simulates complete workflow including:
 * - Route optimization request
 * - Processing by owner
 * - Decryption via Gateway
 * - Delivery completion
 *
 * Usage: node scripts/simulate.js [CONTRACT_ADDRESS]
 */

async function main() {
  console.log("\n========================================");
  console.log("  Logistics Route Optimizer Simulation");
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
      console.log("\nUsage: node scripts/simulate.js [CONTRACT_ADDRESS]");
      process.exit(1);
    }
  }

  console.log("📍 Contract Address:", contractAddress);
  console.log("");

  // Get signers
  const [owner, requester, other] = await hre.ethers.getSigners();

  console.log("👥 Participants:");
  console.log("   Owner:", await owner.getAddress());
  console.log("   Requester:", await requester.getAddress());
  console.log("");

  // Get contract instance
  const LogisticsRouteOptimizer = await hre.ethers.getContractFactory(
    "LogisticsRouteOptimizer"
  );
  const contract = LogisticsRouteOptimizer.attach(contractAddress);

  console.log("🔗 Connected to contract");
  console.log("");

  try {
    // ========================================
    // Step 1: Check Initial State
    // ========================================
    console.log("========================================");
    console.log(" Step 1: Check Initial State");
    console.log("========================================\n");

    const initialOwner = await contract.owner();
    const initialCounter = await contract.routeCounter();
    const initialPaused = await contract.paused();

    console.log("Initial State:");
    console.log("   Owner:", initialOwner);
    console.log("   Route Counter:", initialCounter.toString());
    console.log("   Paused:", initialPaused);
    console.log("");

    // ========================================
    // Step 2: Prepare Route Request Data
    // ========================================
    console.log("========================================");
    console.log(" Step 2: Prepare Route Request Data");
    console.log("========================================\n");

    console.log("⚠️  Note: This simulation uses mock encrypted data");
    console.log("   In production, use fhevmjs library for proper encryption");
    console.log("");

    // Mock delivery locations (3 locations)
    const locations = [
      { x: 100, y: 200, priority: 1 },
      { x: 300, y: 150, priority: 2 },
      { x: 200, y: 400, priority: 3 },
    ];

    console.log("Delivery Locations:");
    locations.forEach((loc, i) => {
      console.log(`   Location ${i + 1}: (${loc.x}, ${loc.y}) - Priority: ${loc.priority}`);
    });
    console.log("");

    const maxDistance = 1000;
    const vehicleCapacity = 15;

    console.log("Route Constraints:");
    console.log("   Max Distance:", maxDistance);
    console.log("   Vehicle Capacity:", vehicleCapacity);
    console.log("");

    // ========================================
    // Step 3: Request Route Optimization
    // ========================================
    console.log("========================================");
    console.log(" Step 3: Request Route Optimization");
    console.log("========================================\n");

    console.log("📝 Submitting route optimization request...");
    console.log("   (This would normally require encrypted inputs via fhevmjs)");
    console.log("");

    console.log("⚠️  FHEVM Encryption Required:");
    console.log("   The actual requestRouteOptimization function requires:");
    console.log("   • inEuint32[] for X coordinates (encrypted)");
    console.log("   • inEuint32[] for Y coordinates (encrypted)");
    console.log("   • inEuint8[] for priorities (encrypted)");
    console.log("   • inEuint32 for max distance (encrypted)");
    console.log("   • inEuint8 for vehicle capacity (encrypted)");
    console.log("");

    console.log("📚 To create encrypted inputs, you need:");
    console.log("   1. Install fhevmjs library");
    console.log("   2. Initialize FHE instance");
    console.log("   3. Create input proofs for each value");
    console.log("   4. Submit encrypted data to contract");
    console.log("");

    console.log("Example code structure:");
    console.log("```javascript");
    console.log("const { createInstance } = require('fhevmjs');");
    console.log("const instance = await createInstance({ chainId, publicKey });");
    console.log("");
    console.log("const input = instance.createEncryptedInput(contractAddress, userAddress);");
    console.log("input.add32(xCoord).add32(yCoord).add8(priority);");
    console.log("const encryptedData = await input.encrypt();");
    console.log("```");
    console.log("");

    // Since we can't actually submit encrypted data without fhevmjs setup,
    // we'll simulate the remaining steps conceptually

    // ========================================
    // Step 4: Check User Routes
    // ========================================
    console.log("========================================");
    console.log(" Step 4: Check User Routes");
    console.log("========================================\n");

    const requesterAddress = await requester.getAddress();
    const userRoutes = await contract.getUserRoutes(requesterAddress);

    console.log("📊 User Routes:");
    console.log("   Requester:", requesterAddress);
    console.log("   Total Routes:", userRoutes.length);

    if (userRoutes.length > 0) {
      console.log("   Route IDs:", userRoutes.map((r) => r.toString()).join(", "));

      // Get details for the latest route
      const latestRouteId = userRoutes[userRoutes.length - 1];
      console.log(`\n   Latest Route (ID: ${latestRouteId}):`);

      const routeRequest = await contract.getRouteRequest(latestRouteId);
      console.log("      Requester:", routeRequest[0]);
      console.log("      Locations:", routeRequest[1].toString());
      console.log("      Processed:", routeRequest[2]);
      console.log(
        "      Timestamp:",
        new Date(Number(routeRequest[3]) * 1000).toLocaleString()
      );
    } else {
      console.log("   No routes found (simulation without encryption)");
    }
    console.log("");

    // ========================================
    // Step 5: Owner Processing (Conceptual)
    // ========================================
    console.log("========================================");
    console.log(" Step 5: Owner Processing (Conceptual)");
    console.log("========================================\n");

    console.log("🔧 Owner would call processRouteOptimization(routeId)");
    console.log("   This function performs:");
    console.log("   • Confidential distance calculations using FHE");
    console.log("   • Route optimization with encrypted coordinates");
    console.log("   • Delivery time estimation");
    console.log("   • Generate optimized route order");
    console.log("");

    // ========================================
    // Step 6: Gateway Decryption (Conceptual)
    // ========================================
    console.log("========================================");
    console.log(" Step 6: Gateway Decryption (Conceptual)");
    console.log("========================================\n");

    console.log("🔓 Owner would call requestRouteDecryption(routeId)");
    console.log("   This initiates async decryption via Zama Gateway:");
    console.log("   • Submits encrypted values to Gateway");
    console.log("   • Gateway performs decryption");
    console.log("   • Callback provides plaintext results");
    console.log("");

    // ========================================
    // Step 7: Workflow Summary
    // ========================================
    console.log("========================================");
    console.log(" Step 7: Complete Workflow Summary");
    console.log("========================================\n");

    console.log("Complete Route Optimization Workflow:");
    console.log("");
    console.log("1️⃣  User encrypts location data (frontend with fhevmjs)");
    console.log("   → Creates encrypted inputs for coordinates & priorities");
    console.log("   → Submits to requestRouteOptimization()");
    console.log("");

    console.log("2️⃣  Contract stores encrypted data on-chain");
    console.log("   → All location data remains confidential");
    console.log("   → Only authorized parties can decrypt");
    console.log("");

    console.log("3️⃣  Owner processes optimization (FHE computation)");
    console.log("   → Calculations on encrypted data");
    console.log("   → Results stay encrypted");
    console.log("   → Calls processRouteOptimization()");
    console.log("");

    console.log("4️⃣  Gateway decrypts results (async)");
    console.log("   → Owner calls requestRouteDecryption()");
    console.log("   → Gateway decrypts and calls back");
    console.log("   → Results available to authorized users");
    console.log("");

    console.log("5️⃣  User retrieves optimized route");
    console.log("   → Calls getOptimizedRoute()");
    console.log("   → Receives encrypted distance & time");
    console.log("   → Decrypts on frontend");
    console.log("");

    console.log("6️⃣  Delivery execution");
    console.log("   → Follow optimized route order");
    console.log("   → Mark each delivery as completed");
    console.log("   → Calls markDeliveryCompleted()");
    console.log("");

    // ========================================
    // Step 8: Contract Statistics
    // ========================================
    console.log("========================================");
    console.log(" Step 8: Contract Statistics");
    console.log("========================================\n");

    const finalCounter = await contract.routeCounter();
    const contractOwner = await contract.owner();
    const isPaused = await contract.paused();

    console.log("Current Contract State:");
    console.log("   Total Routes Created:", finalCounter.toString());
    console.log("   Contract Owner:", contractOwner);
    console.log("   Contract Paused:", isPaused);
    console.log("");

    // ========================================
    // Step 9: Testing Recommendations
    // ========================================
    console.log("========================================");
    console.log(" Step 9: Testing Recommendations");
    console.log("========================================\n");

    console.log("For Local Testing:");
    console.log("   • Use Hardhat local network with FHEVM setup");
    console.log("   • Install and configure fhevmjs");
    console.log("   • Set up mock Gateway for callbacks");
    console.log("   • Write unit tests with encrypted inputs");
    console.log("");

    console.log("For Testnet Deployment:");
    console.log("   • Deploy to Sepolia testnet");
    console.log("   • Configure Zama Gateway endpoints");
    console.log("   • Test with real encryption/decryption");
    console.log("   • Monitor Gateway callbacks");
    console.log("");

    console.log("Security Considerations:");
    console.log("   • Verify input proofs are properly validated");
    console.log("   • Check ACL permissions for encrypted data");
    console.log("   • Test Gateway callback authentication");
    console.log("   • Ensure only authorized access to decrypted data");
    console.log("");

    // ========================================
    // Step 10: Useful Resources
    // ========================================
    console.log("========================================");
    console.log(" Step 10: Useful Resources");
    console.log("========================================\n");

    console.log("📚 Documentation:");
    console.log("   • FHEVM: https://docs.zama.ai/fhevm");
    console.log("   • fhevmjs: https://docs.zama.ai/fhevm/how-to/use-fhevmjs");
    console.log("   • Gateway: https://docs.zama.ai/fhevm/how-to/decrypt");
    console.log("");

    console.log("💻 Code Examples:");
    console.log("   • Zama Examples: https://github.com/zama-ai/fhevm");
    console.log("   • Hardhat Plugin: https://github.com/zama-ai/fhevm-hardhat");
    console.log("");

    console.log("🛠️  Development Tools:");
    console.log("   • Hardhat: Already configured");
    console.log("   • TypeChain: For type-safe interactions");
    console.log("   • Ethers.js v6: Latest version");
    console.log("");

    console.log("========================================\n");

  } catch (error) {
    console.error("\n❌ Simulation error:");
    console.error(error.message);
    console.log("");

    if (error.message.includes("invalid proof")) {
      console.log("💡 This error is expected in simulation mode.");
      console.log("   Proper encryption with fhevmjs is required for actual transactions.");
    }

    process.exit(1);
  }

  console.log("✅ Simulation completed!");
  console.log("");
  console.log("Next steps:");
  console.log("   1. Set up fhevmjs in your frontend");
  console.log("   2. Implement encryption for user inputs");
  console.log("   3. Test on local FHEVM node");
  console.log("   4. Deploy and test on Sepolia");
  console.log("");
}

// Execute simulation
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\n❌ Simulation script failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
