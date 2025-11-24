import { ethers } from "hardhat";

async function main() {
  console.log("================================");
  console.log("Deploying Advanced Logistics Optimizer");
  console.log("================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  if (balance < ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance for deployment");
    process.exit(1);
  }

  // Deploy contract
  console.log("Deploying contract...");
  const AdvancedLogisticsOptimizer = await ethers.getContractFactory("AdvancedLogisticsOptimizer");
  const contract = await AdvancedLogisticsOptimizer.deploy();

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);

  // Verify initial state
  console.log("\n================================");
  console.log("Verifying Initial State");
  console.log("================================\n");

  const owner = await contract.owner();
  const paused = await contract.paused();
  const routeCounter = await contract.routeCounter();
  const platformFees = await contract.platformFees();
  const isOperator = await contract.operators(deployer.address);
  const isPauser = await contract.pausers(deployer.address);

  console.log("Owner:", owner);
  console.log("Paused:", paused);
  console.log("Route Counter:", routeCounter.toString());
  console.log("Platform Fees:", ethers.formatEther(platformFees), "ETH");
  console.log("Deployer is Operator:", isOperator);
  console.log("Deployer is Pauser:", isPauser);

  // Verify constants
  console.log("\n================================");
  console.log("Contract Constants");
  console.log("================================\n");

  const REQUEST_TIMEOUT = await contract.REQUEST_TIMEOUT();
  const MAX_PROCESSING_TIME = await contract.MAX_PROCESSING_TIME();
  const MAX_LOCATIONS = await contract.MAX_LOCATIONS();
  const MIN_STAKE = await contract.MIN_STAKE();
  const PLATFORM_FEE_PERCENT = await contract.PLATFORM_FEE_PERCENT();

  console.log("Request Timeout:", REQUEST_TIMEOUT.toString(), "seconds (", REQUEST_TIMEOUT / 3600n, "hours )");
  console.log("Max Processing Time:", MAX_PROCESSING_TIME.toString(), "seconds (", MAX_PROCESSING_TIME / 3600n, "hour )");
  console.log("Max Locations:", MAX_LOCATIONS.toString());
  console.log("Min Stake:", ethers.formatEther(MIN_STAKE), "ETH");
  console.log("Platform Fee:", PLATFORM_FEE_PERCENT.toString(), "%");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    deployerBalance: ethers.formatEther(balance),
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    constants: {
      REQUEST_TIMEOUT: REQUEST_TIMEOUT.toString(),
      MAX_PROCESSING_TIME: MAX_PROCESSING_TIME.toString(),
      MAX_LOCATIONS: MAX_LOCATIONS.toString(),
      MIN_STAKE: ethers.formatEther(MIN_STAKE),
      PLATFORM_FEE_PERCENT: PLATFORM_FEE_PERCENT.toString()
    }
  };

  console.log("\n================================");
  console.log("Deployment Complete!");
  console.log("================================\n");

  console.log("Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📋 Next Steps:");
  console.log("1. Save the contract address:", contractAddress);
  console.log("2. Verify contract on Etherscan:");
  console.log("   npx hardhat verify --network <network>", contractAddress);
  console.log("3. Configure operators:");
  console.log("   npx hardhat run scripts/configure.ts --network <network>");
  console.log("4. Test basic operations:");
  console.log("   npx hardhat run scripts/test-operations.ts --network <network>");

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
