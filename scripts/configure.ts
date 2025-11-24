import { ethers } from "hardhat";

async function main() {
  console.log("================================");
  console.log("Configuring Advanced Logistics Optimizer");
  console.log("================================\n");

  // Configuration parameters
  const contractAddress = process.env.CONTRACT_ADDRESS || "";
  const operatorAddresses = (process.env.OPERATOR_ADDRESSES || "").split(",").filter(a => a);
  const pauserAddresses = (process.env.PAUSER_ADDRESSES || "").split(",").filter(a => a);

  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not set in environment variables");
    console.log("Example: CONTRACT_ADDRESS=0x... npx hardhat run scripts/configure.ts");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Configuring with account:", deployer.address);

  // Connect to contract
  const contract = await ethers.getContractAt("AdvancedLogisticsOptimizer", contractAddress);
  console.log("Connected to contract at:", contractAddress);

  // Verify ownership
  const owner = await contract.owner();
  console.log("Contract owner:", owner);

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error("❌ You are not the contract owner");
    console.log("Current owner:", owner);
    console.log("Your address:", deployer.address);
    process.exit(1);
  }

  console.log("\n================================");
  console.log("Adding Operators");
  console.log("================================\n");

  if (operatorAddresses.length === 0) {
    console.log("ℹ️  No operator addresses provided");
    console.log("To add operators, set OPERATOR_ADDRESSES environment variable:");
    console.log("OPERATOR_ADDRESSES=0x...,0x... npx hardhat run scripts/configure.ts");
  } else {
    for (const operatorAddress of operatorAddresses) {
      try {
        // Check if already operator
        const isOperator = await contract.operators(operatorAddress);

        if (isOperator) {
          console.log("⏭️  Already operator:", operatorAddress);
          continue;
        }

        console.log("Adding operator:", operatorAddress);
        const tx = await contract.addOperator(operatorAddress);
        await tx.wait();
        console.log("✅ Operator added:", operatorAddress);
      } catch (error: any) {
        console.error("❌ Failed to add operator:", operatorAddress);
        console.error("Error:", error.message);
      }
    }
  }

  console.log("\n================================");
  console.log("Adding Pausers");
  console.log("================================\n");

  if (pauserAddresses.length === 0) {
    console.log("ℹ️  No pauser addresses provided");
    console.log("To add pausers, set PAUSER_ADDRESSES environment variable:");
    console.log("PAUSER_ADDRESSES=0x...,0x... npx hardhat run scripts/configure.ts");
  } else {
    for (const pauserAddress of pauserAddresses) {
      try {
        // Check if already pauser
        const isPauser = await contract.pausers(pauserAddress);

        if (isPauser) {
          console.log("⏭️  Already pauser:", pauserAddress);
          continue;
        }

        console.log("Adding pauser:", pauserAddress);
        const tx = await contract.addPauser(pauserAddress);
        await tx.wait();
        console.log("✅ Pauser added:", pauserAddress);
      } catch (error: any) {
        console.error("❌ Failed to add pauser:", pauserAddress);
        console.error("Error:", error.message);
      }
    }
  }

  console.log("\n================================");
  console.log("Current Configuration");
  console.log("================================\n");

  // List all operators
  console.log("Operators:");
  const allOperators = [deployer.address, ...operatorAddresses];
  for (const addr of allOperators) {
    const isOp = await contract.operators(addr);
    if (isOp) {
      console.log("  ✓", addr);
    }
  }

  // List all pausers
  console.log("\nPausers:");
  const allPausers = [deployer.address, ...pauserAddresses];
  for (const addr of allPausers) {
    const isPauser = await contract.pausers(addr);
    if (isPauser) {
      console.log("  ✓", addr);
    }
  }

  console.log("\n================================");
  console.log("Contract Status");
  console.log("================================\n");

  const paused = await contract.paused();
  const routeCounter = await contract.routeCounter();
  const platformFees = await contract.platformFees();

  console.log("Paused:", paused);
  console.log("Route Counter:", routeCounter.toString());
  console.log("Platform Fees:", ethers.formatEther(platformFees), "ETH");

  console.log("\n✅ Configuration complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Configuration failed:");
    console.error(error);
    process.exit(1);
  });
