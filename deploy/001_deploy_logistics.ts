import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;

  const { deployer } = await getNamedAccounts();

  log("----------------------------------------------------");
  log("Deploying LogisticsRouteOptimizer contract...");

  const logisticsRouteOptimizer = await deploy("LogisticsRouteOptimizer", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: hre.network.name === "sepolia" ? 6 : 1,
  });

  log(`LogisticsRouteOptimizer deployed at: ${logisticsRouteOptimizer.address}`);
  log("----------------------------------------------------");

  // Verify contract on Etherscan if on Sepolia
  if (hre.network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
    log("Waiting for block confirmations...");
    await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 1 minute

    log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: logisticsRouteOptimizer.address,
        constructorArguments: [],
      });
      log("Contract verified successfully!");
    } catch (error: any) {
      if (error.message.toLowerCase().includes("already verified")) {
        log("Contract already verified!");
      } else {
        log("Error verifying contract:", error);
      }
    }
  }
};

export default func;
func.tags = ["all", "logistics"];
