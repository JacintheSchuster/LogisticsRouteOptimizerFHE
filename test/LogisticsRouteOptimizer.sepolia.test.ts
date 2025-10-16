import { expect } from "chai";
import { ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { LogisticsRouteOptimizer } from "../typechain-types";

/**
 * Sepolia Testnet Integration Tests
 *
 * These tests run against a deployed contract on Sepolia testnet.
 * They test real FHE operations and network interactions.
 *
 * Prerequisites:
 * 1. Deploy contract: npx hardhat deploy --network sepolia
 * 2. Set SEPOLIA_RPC_URL in .env
 * 3. Set PRIVATE_KEY with funded account
 *
 * Run: npm run test:sepolia
 */

describe("LogisticsRouteOptimizer - Sepolia", function () {
  let signers: {
    alice: HardhatEthersSigner;
  };
  let contract: LogisticsRouteOptimizer;
  let contractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`  ${++step}/${steps} ${message}`);
  }

  before(async function () {
    // Skip if not on Sepolia network
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 11155111n) {
      console.warn("⚠️  These tests can only run on Sepolia Testnet (Chain ID: 11155111)");
      console.warn(`   Current network: ${network.name} (Chain ID: ${network.chainId})`);
      console.warn("   Run: npm run test:sepolia");
      this.skip();
    }

    const ethSigners = await ethers.getSigners();
    signers = { alice: ethSigners[0] };

    // Try to get deployed contract address
    try {
      // You can hardcode your deployed address here or read from deployments
      contractAddress = process.env.CONTRACT_ADDRESS || "0xE235A5C0DbF47ba76db3912c80267F9B43B8d1a8";

      console.log(`📍 Using contract at: ${contractAddress}`);

      contract = await ethers.getContractAt(
        "LogisticsRouteOptimizer",
        contractAddress
      ) as LogisticsRouteOptimizer;

      // Verify contract exists
      const code = await ethers.provider.getCode(contractAddress);
      if (code === "0x") {
        throw new Error("No contract code found at address");
      }

      console.log(`✅ Contract found on Sepolia`);
    } catch (error) {
      const err = error as Error;
      err.message += "\n\n💡 Deploy the contract first: npx hardhat deploy --network sepolia";
      throw err;
    }
  });

  beforeEach(() => {
    step = 0;
    steps = 0;
  });

  describe("Contract State Verification", function () {
    it("should have valid owner address", async function () {
      steps = 2;
      this.timeout(40000);

      progress("Fetching owner...");
      const owner = await contract.owner();
      expect(owner).to.be.properAddress;
      expect(owner).to.not.equal(ethers.ZeroAddress);

      progress(`Owner: ${owner}`);
    });

    it("should return route counter", async function () {
      steps = 2;
      this.timeout(40000);

      progress("Fetching route counter...");
      const counter = await contract.routeCounter();

      progress(`Current route counter: ${counter}`);
      expect(counter).to.be.gte(0);
    });

    it("should return paused state", async function () {
      steps = 2;
      this.timeout(40000);

      progress("Checking paused state...");
      const isPaused = await contract.paused();

      progress(`Contract paused: ${isPaused}`);
      expect(typeof isPaused).to.equal("boolean");
    });
  });

  describe("Route Request on Testnet", function () {
    it("should create route request on Sepolia", async function () {
      steps = 6;
      this.timeout(160000); // 160 seconds for network operations

      progress("Checking if contract is paused...");
      const isPaused = await contract.paused();
      if (isPaused) {
        console.warn("⚠️  Contract is paused. Skipping transaction test.");
        this.skip();
      }

      progress("Getting current route counter...");
      const counterBefore = await contract.routeCounter();

      progress("Submitting route optimization request...");
      const tx = await contract.connect(signers.alice).requestRouteOptimization(
        150,   // xCoord
        250,   // yCoord
        7,     // priority
        1200,  // maxDistance
        20     // vehicleCapacity
      );

      progress(`Transaction sent: ${tx.hash}`);
      progress("Waiting for confirmation...");
      const receipt = await tx.wait();
      expect(receipt!.status).to.equal(1);

      progress("Verifying route counter increased...");
      const counterAfter = await contract.routeCounter();
      expect(counterAfter).to.be.gt(counterBefore);

      console.log(`✅ Route #${counterAfter} created successfully`);
      console.log(`   Gas used: ${receipt!.gasUsed.toString()}`);
      console.log(`   Block: ${receipt!.blockNumber}`);
    });
  });

  describe("User Routes Query", function () {
    it("should retrieve user routes", async function () {
      steps = 3;
      this.timeout(40000);

      progress("Fetching user routes...");
      const routes = await contract.getUserRoutes(signers.alice.address);

      progress(`Found ${routes.length} route(s)`);
      expect(Array.isArray(routes)).to.be.true;

      if (routes.length > 0) {
        progress(`Latest route ID: ${routes[routes.length - 1]}`);
      }
    });
  });

  describe("Route Data Retrieval", function () {
    it("should get route request details", async function () {
      steps = 4;
      this.timeout(40000);

      progress("Getting latest route counter...");
      const counter = await contract.routeCounter();

      if (counter === 0n) {
        console.warn("⚠️  No routes exist yet. Skipping route data test.");
        this.skip();
      }

      progress(`Fetching route #${counter} details...`);
      const routeData = await contract.getRouteRequest(counter);

      progress("Validating route data...");
      expect(routeData[0]).to.be.properAddress; // requester
      expect(routeData[1]).to.be.gte(0); // locationCount
      expect(typeof routeData[2]).to.equal("boolean"); // processed
      expect(routeData[3]).to.be.gte(0); // timestamp

      progress(`Route Details:`);
      console.log(`   Requester: ${routeData[0]}`);
      console.log(`   Locations: ${routeData[1]}`);
      console.log(`   Processed: ${routeData[2]}`);
      console.log(`   Timestamp: ${new Date(Number(routeData[3]) * 1000).toISOString()}`);
    });
  });

  describe("Contract Information", function () {
    it("should display contract deployment info", async function () {
      steps = 5;
      this.timeout(40000);

      progress("Gathering contract information...");

      const owner = await contract.owner();
      const counter = await contract.routeCounter();
      const isPaused = await contract.paused();
      const balance = await ethers.provider.getBalance(contractAddress);

      progress("Contract Information:");
      console.log(`\n   📍 Address: ${contractAddress}`);
      console.log(`   👤 Owner: ${owner}`);
      console.log(`   🔢 Total Routes: ${counter}`);
      console.log(`   ⏸️  Paused: ${isPaused}`);
      console.log(`   💰 Balance: ${ethers.formatEther(balance)} ETH`);
      console.log(`   🌐 Network: Sepolia (Chain ID: 11155111)`);
      console.log(`   🔗 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);

      expect(owner).to.be.properAddress;
      expect(counter).to.be.gte(0);
    });

    it("should verify contract has code", async function () {
      steps = 2;
      this.timeout(40000);

      progress("Checking contract bytecode...");
      const code = await ethers.provider.getCode(contractAddress);

      expect(code).to.not.equal("0x");
      expect(code.length).to.be.gt(100);

      progress(`Contract has ${code.length} bytes of code`);
    });
  });

  describe("Network Performance", function () {
    it("should measure transaction time", async function () {
      steps = 5;
      this.timeout(160000);

      const isPaused = await contract.paused();
      if (isPaused) {
        console.warn("⚠️  Contract is paused. Skipping performance test.");
        this.skip();
      }

      progress("Starting performance measurement...");
      const startTime = Date.now();

      progress("Sending transaction...");
      const tx = await contract.connect(signers.alice).requestRouteOptimization(
        200, 300, 5, 1500, 25
      );

      progress("Waiting for confirmation...");
      await tx.wait();

      const endTime = Date.now();
      const duration = endTime - startTime;

      progress(`Transaction completed in ${duration}ms`);
      console.log(`\n   ⏱️  Performance Metrics:`);
      console.log(`      Transaction time: ${duration}ms`);
      console.log(`      Status: ${duration < 60000 ? "✅ Good" : "⚠️ Slow"}`);

      expect(duration).to.be.lt(120000); // Should complete within 120 seconds
    });
  });
});
