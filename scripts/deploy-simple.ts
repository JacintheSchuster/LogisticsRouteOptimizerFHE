import { ethers } from "hardhat";

async function main() {
  console.log("Deploying LogisticsRouteOptimizer contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const LogisticsRouteOptimizer = await ethers.getContractFactory(
    "LogisticsRouteOptimizer"
  );
  const logistics = await LogisticsRouteOptimizer.deploy();

  await logistics.waitForDeployment();

  const address = await logistics.getAddress();
  console.log("LogisticsRouteOptimizer deployed to:", address);

  // Display deployment info
  console.log("\n=== Deployment Information ===");
  console.log("Contract:", "LogisticsRouteOptimizer");
  console.log("Address:", address);
  console.log("Deployer:", deployer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Block:", await ethers.provider.getBlockNumber());
  console.log("=============================\n");

  // Verify initial state
  console.log("Verifying initial state...");
  const owner = await logistics.owner();
  const routeCounter = await logistics.routeCounter();
  const paused = await logistics.paused();

  console.log("Owner:", owner);
  console.log("Route Counter:", routeCounter.toString());
  console.log("Paused:", paused);

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
