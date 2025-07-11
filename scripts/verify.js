const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Verify LogisticsRouteOptimizer Contract on Etherscan
 *
 * This script verifies the deployed contract on Etherscan block explorer
 * Usage: node scripts/verify.js [CONTRACT_ADDRESS]
 */

async function main() {
  console.log("\n========================================");
  console.log("  Contract Verification");
  console.log("========================================\n");

  // Get contract address from command line or deployment file
  let contractAddress = process.argv[2];

  if (!contractAddress) {
    // Try to read from deployment file
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
      console.log("\nUsage: node scripts/verify.js [CONTRACT_ADDRESS]");
      console.log(
        "Or ensure deployment info exists in deployments/ directory"
      );
      process.exit(1);
    }
  }

  console.log("📍 Contract Address:", contractAddress);
  console.log("");

  // Check if ETHERSCAN_API_KEY is set
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ Error: ETHERSCAN_API_KEY not set in .env file");
    console.log("\nPlease add your Etherscan API key to .env:");
    console.log("ETHERSCAN_API_KEY=your_api_key_here");
    console.log(
      "\nGet your API key at: https://etherscan.io/myapikey"
    );
    process.exit(1);
  }

  // Get network information
  const network = await hre.ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;

  console.log("📡 Network:", networkName);
  console.log("");

  // Skip verification for local networks
  if (networkName === "localhost" || networkName === "hardhat") {
    console.log("⚠️  Skipping verification for local network");
    console.log("   Etherscan verification only works on public networks");
    process.exit(0);
  }

  console.log("🔍 Verifying contract on Etherscan...");
  console.log("   This may take a few moments...\n");

  try {
    // Verify the contract
    // Constructor arguments (empty for this contract)
    const constructorArgs = [];

    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });

    console.log("\n✅ Contract verified successfully!");
    console.log("");

    // Display Etherscan link
    let explorerUrl;
    switch (networkName) {
      case "sepolia":
        explorerUrl = `https://sepolia.etherscan.io/address/${contractAddress}#code`;
        break;
      case "mainnet":
      case "homestead":
        explorerUrl = `https://etherscan.io/address/${contractAddress}#code`;
        break;
      case "goerli":
        explorerUrl = `https://goerli.etherscan.io/address/${contractAddress}#code`;
        break;
      default:
        explorerUrl = null;
    }

    if (explorerUrl) {
      console.log("🔗 View verified contract:");
      console.log(`   ${explorerUrl}`);
      console.log("");
    }

    // Update deployment file with verification status
    const deploymentFile = path.join(
      __dirname,
      "..",
      "deployments",
      `${networkName}-deployment.json`
    );

    if (fs.existsSync(deploymentFile)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
      deployment.verified = true;
      deployment.verifiedAt = new Date().toISOString();
      deployment.explorerUrl = explorerUrl;

      fs.writeFileSync(
        deploymentFile,
        JSON.stringify(deployment, null, 2)
      );

      console.log("💾 Deployment info updated with verification status");
      console.log("");
    }

    console.log("========================================\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract is already verified!");
      console.log("");

      // Display Etherscan link
      let explorerUrl;
      switch (networkName) {
        case "sepolia":
          explorerUrl = `https://sepolia.etherscan.io/address/${contractAddress}#code`;
          break;
        case "mainnet":
        case "homestead":
          explorerUrl = `https://etherscan.io/address/${contractAddress}#code`;
          break;
        case "goerli":
          explorerUrl = `https://goerli.etherscan.io/address/${contractAddress}#code`;
          break;
        default:
          explorerUrl = null;
      }

      if (explorerUrl) {
        console.log("🔗 View contract:");
        console.log(`   ${explorerUrl}`);
        console.log("");
      }
    } else {
      console.error("\n❌ Verification failed:");
      console.error(error.message);
      console.log("");
      console.log("💡 Common issues:");
      console.log("   • Contract was just deployed - wait 1-2 minutes");
      console.log("   • Invalid Etherscan API key");
      console.log("   • Network mismatch");
      console.log("   • Constructor arguments mismatch");
      process.exit(1);
    }
  }
}

// Execute verification
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\n❌ Verification script failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
