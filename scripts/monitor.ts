import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || "";

  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not set");
    console.log("Usage: CONTRACT_ADDRESS=0x... npx hardhat run scripts/monitor.ts");
    process.exit(1);
  }

  console.log("================================");
  console.log("Advanced Logistics Optimizer - Event Monitor");
  console.log("================================\n");
  console.log("Contract:", contractAddress);
  console.log("Monitoring events... (Press Ctrl+C to stop)\n");

  const contract = await ethers.getContractAt("AdvancedLogisticsOptimizer", contractAddress);

  // Monitor RouteRequested
  contract.on("RouteRequested", (routeId, requester, locationCount, stakeAmount, timestamp) => {
    console.log("\n🚀 [RouteRequested]");
    console.log("  Route ID:", routeId.toString());
    console.log("  Requester:", requester);
    console.log("  Locations:", locationCount.toString());
    console.log("  Stake:", ethers.formatEther(stakeAmount), "ETH");
    console.log("  Timestamp:", new Date(Number(timestamp) * 1000).toISOString());
  });

  // Monitor RouteProcessingStarted
  contract.on("RouteProcessingStarted", (routeId, decryptionRequestId, timestamp) => {
    console.log("\n⚙️  [RouteProcessingStarted]");
    console.log("  Route ID:", routeId.toString());
    console.log("  Decryption Request ID:", decryptionRequestId.toString());
    console.log("  Timestamp:", new Date(Number(timestamp) * 1000).toISOString());
  });

  // Monitor RouteOptimized
  contract.on("RouteOptimized", (routeId, requester, revealedDistance, revealedCost, timestamp) => {
    console.log("\n✅ [RouteOptimized]");
    console.log("  Route ID:", routeId.toString());
    console.log("  Requester:", requester);
    console.log("  Distance:", revealedDistance.toString(), "units");
    console.log("  Cost:", revealedCost.toString());
    console.log("  Timestamp:", new Date(Number(timestamp) * 1000).toISOString());
  });

  // Monitor RefundIssued
  contract.on("RefundIssued", (routeId, requester, amount, reason) => {
    console.log("\n💰 [RefundIssued]");
    console.log("  Route ID:", routeId.toString());
    console.log("  Requester:", requester);
    console.log("  Amount:", ethers.formatEther(amount), "ETH");
    console.log("  Reason:", reason);
  });

  // Monitor TimeoutDetected
  contract.on("TimeoutDetected", (routeId, elapsedTime) => {
    console.log("\n⏰ [TimeoutDetected]");
    console.log("  Route ID:", routeId.toString());
    console.log("  Elapsed Time:", elapsedTime.toString(), "seconds");
  });

  // Monitor DecryptionFailed
  contract.on("DecryptionFailed", (routeId, requestId, reason) => {
    console.log("\n❌ [DecryptionFailed]");
    console.log("  Route ID:", routeId.toString());
    console.log("  Request ID:", requestId.toString());
    console.log("  Reason:", reason);
  });

  // Monitor GatewayCallbackReceived
  contract.on("GatewayCallbackReceived", (routeId, requestId, success) => {
    console.log("\n📡 [GatewayCallbackReceived]");
    console.log("  Route ID:", routeId.toString());
    console.log("  Request ID:", requestId.toString());
    console.log("  Success:", success);
  });

  // Monitor PlatformFeesWithdrawn
  contract.on("PlatformFeesWithdrawn", (to, amount) => {
    console.log("\n💸 [PlatformFeesWithdrawn]");
    console.log("  To:", to);
    console.log("  Amount:", ethers.formatEther(amount), "ETH");
  });

  // Monitor OperatorAdded
  contract.on("OperatorAdded", (operator) => {
    console.log("\n👤 [OperatorAdded]");
    console.log("  Operator:", operator);
  });

  // Monitor OperatorRemoved
  contract.on("OperatorRemoved", (operator) => {
    console.log("\n👤 [OperatorRemoved]");
    console.log("  Operator:", operator);
  });

  // Monitor PauserAdded
  contract.on("PauserAdded", (pauser) => {
    console.log("\n🔒 [PauserAdded]");
    console.log("  Pauser:", pauser);
  });

  // Monitor PauserRemoved
  contract.on("PauserRemoved", (pauser) => {
    console.log("\n🔒 [PauserRemoved]");
    console.log("  Pauser:", pauser);
  });

  // Monitor ContractPausedToggled
  contract.on("ContractPausedToggled", (paused) => {
    console.log("\n⏸️  [ContractPausedToggled]");
    console.log("  Paused:", paused);
  });

  // Monitor OwnershipTransferred
  contract.on("OwnershipTransferred", (previousOwner, newOwner) => {
    console.log("\n👑 [OwnershipTransferred]");
    console.log("  Previous Owner:", previousOwner);
    console.log("  New Owner:", newOwner);
  });

  // Keep process alive
  await new Promise(() => {});
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
