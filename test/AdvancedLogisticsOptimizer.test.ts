import { expect } from "chai";
import { ethers } from "hardhat";
import type { AdvancedLogisticsOptimizer } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AdvancedLogisticsOptimizer", function () {
  let contract: AdvancedLogisticsOptimizer;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const MIN_STAKE = ethers.parseEther("0.01");
  const STAKE_AMOUNT = ethers.parseEther("0.05");

  beforeEach(async function () {
    [owner, operator, user1, user2] = await ethers.getSigners();

    const AdvancedLogisticsOptimizerFactory = await ethers.getContractFactory(
      "AdvancedLogisticsOptimizer"
    );
    contract = await AdvancedLogisticsOptimizerFactory.deploy();
    await contract.waitForDeployment();

    // Add operator
    await contract.connect(owner).addOperator(operator.address);
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should initialize with paused as false", async function () {
      expect(await contract.paused()).to.equal(false);
    });

    it("Should set owner as operator and pauser", async function () {
      expect(await contract.operators(owner.address)).to.equal(true);
      expect(await contract.pausers(owner.address)).to.equal(true);
    });

    it("Should initialize routeCounter to 0", async function () {
      expect(await contract.routeCounter()).to.equal(0);
    });
  });

  describe("Route Optimization Requests", function () {
    it("Should create route optimization request successfully", async function () {
      const locationCount = 5;
      const maxDistance = 1000;
      const vehicleCapacity = 10;

      const tx = await contract.connect(user1).requestRouteOptimization(
        locationCount,
        maxDistance,
        vehicleCapacity,
        { value: STAKE_AMOUNT }
      );

      await expect(tx)
        .to.emit(contract, "RouteRequested")
        .withArgs(1, user1.address, locationCount, STAKE_AMOUNT, await ethers.provider.getBlockNumber() + 1);

      expect(await contract.routeCounter()).to.equal(1);
    });

    it("Should reject request with insufficient stake", async function () {
      await expect(
        contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
          value: ethers.parseEther("0.005"), // Less than MIN_STAKE
        })
      ).to.be.revertedWithCustomError(contract, "InsufficientStake");
    });

    it("Should reject request with zero locations", async function () {
      await expect(
        contract.connect(user1).requestRouteOptimization(0, 1000, 10, {
          value: STAKE_AMOUNT,
        })
      ).to.be.revertedWithCustomError(contract, "InvalidLocationCount");
    });

    it("Should reject request with too many locations", async function () {
      await expect(
        contract.connect(user1).requestRouteOptimization(51, 1000, 10, {
          value: STAKE_AMOUNT,
        })
      ).to.be.revertedWithCustomError(contract, "InvalidLocationCount");
    });

    it("Should track user routes correctly", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });
      await contract.connect(user1).requestRouteOptimization(3, 500, 5, {
        value: STAKE_AMOUNT,
      });

      const userRoutes = await contract.getUserRoutes(user1.address);
      expect(userRoutes.length).to.equal(2);
      expect(userRoutes[0]).to.equal(1);
      expect(userRoutes[1]).to.equal(2);
    });

    it("Should calculate platform fee correctly (2%)", async function () {
      const stakeAmount = ethers.parseEther("1.0");
      const expectedFee = (stakeAmount * 2n) / 100n; // 2% = 0.02 ETH

      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: stakeAmount,
      });

      expect(await contract.platformFees()).to.equal(expectedFee);
    });
  });

  describe("Route Request Details", function () {
    beforeEach(async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });
    });

    it("Should retrieve route request details correctly", async function () {
      const details = await contract.getRouteRequest(1);

      expect(details.requester).to.equal(user1.address);
      expect(details.locationCount).to.equal(5);
      expect(details.status).to.equal(0); // Pending
      expect(details.refundEligible).to.equal(true);
    });

    it("Should store privacy multiplier within valid range", async function () {
      const request = await contract.routeRequests(1);
      const multiplier = request.privacyMultiplier;

      expect(multiplier).to.be.gte(1000);
      expect(multiplier).to.be.lte(9999);
    });
  });

  describe("Refund Mechanism", function () {
    it("Should allow refund after timeout for pending request", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      // Increase time by 24 hours + 1 second
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      const balanceBefore = await ethers.provider.getBalance(user1.address);

      const tx = await contract.connect(user1).requestRefund(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user1.address);

      // Calculate platform fee (2%)
      const platformFee = (STAKE_AMOUNT * 2n) / 100n;
      const expectedRefund = STAKE_AMOUNT - platformFee;

      // User should receive refund minus gas
      expect(balanceAfter).to.be.closeTo(
        balanceBefore + expectedRefund - gasUsed,
        ethers.parseEther("0.0001") // Small tolerance for gas variations
      );
    });

    it("Should reject refund before timeout", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      await expect(
        contract.connect(user1).requestRefund(1)
      ).to.be.revertedWithCustomError(contract, "TimeoutNotReached");
    });

    it("Should allow refund for failed decryption", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      // Operator processes the route
      await contract.connect(operator).processRouteOptimization(1);

      // Operator marks decryption as failed
      await contract.connect(operator).markDecryptionFailed(1, "Gateway error");

      // User should be able to request refund immediately
      await expect(contract.connect(user1).requestRefund(1))
        .to.emit(contract, "RefundIssued")
        .withArgs(1, user1.address, await ethers.provider.getBalance(contract.target), "Decryption failed");
    });

    it("Should prevent double refund", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      // Wait for timeout
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // First refund
      await contract.connect(user1).requestRefund(1);

      // Second refund should fail
      await expect(
        contract.connect(user1).requestRefund(1)
      ).to.be.revertedWithCustomError(contract, "RefundAlreadyIssued");
    });

    it("Should only allow requester to request refund", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        contract.connect(user2).requestRefund(1)
      ).to.be.revertedWithCustomError(contract, "NotYourRoute");
    });
  });

  describe("Timeout Protection", function () {
    it("Should allow refund after processing timeout", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      // Start processing
      await contract.connect(operator).processRouteOptimization(1);

      // Wait for processing timeout (1 hour + 1 second)
      await ethers.provider.send("evm_increaseTime", [60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(contract.connect(user1).requestRefund(1))
        .to.emit(contract, "TimeoutDetected")
        .withArgs(1, await ethers.provider.getBlockNumber());
    });

    it("Should check refund eligibility correctly", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      // Before timeout
      let eligibility = await contract.checkRefundEligibility(1);
      expect(eligibility.eligible).to.equal(false);
      expect(eligibility.reason).to.equal("Still pending");

      // After timeout
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      eligibility = await contract.checkRefundEligibility(1);
      expect(eligibility.eligible).to.equal(true);
      expect(eligibility.reason).to.equal("Request timeout");
    });
  });

  describe("Access Control", function () {
    it("Should only allow operator to process routes", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      await expect(
        contract.connect(user2).processRouteOptimization(1)
      ).to.be.revertedWithCustomError(contract, "NotOperator");
    });

    it("Should only allow operator to mark decryption as failed", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      await contract.connect(operator).processRouteOptimization(1);

      await expect(
        contract.connect(user1).markDecryptionFailed(1, "Test failure")
      ).to.be.revertedWithCustomError(contract, "NotOperator");
    });

    it("Should only allow owner to add operators", async function () {
      await expect(
        contract.connect(user1).addOperator(user2.address)
      ).to.be.revertedWithCustomError(contract, "NotAuthorized");
    });

    it("Should only allow owner to withdraw platform fees", async function () {
      await expect(
        contract.connect(user1).withdrawPlatformFees(user1.address)
      ).to.be.revertedWithCustomError(contract, "NotAuthorized");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow pauser to toggle pause", async function () {
      await expect(contract.connect(owner).togglePause())
        .to.emit(contract, "ContractPausedToggled")
        .withArgs(true);

      expect(await contract.paused()).to.equal(true);
    });

    it("Should reject requests when paused", async function () {
      await contract.connect(owner).togglePause();

      await expect(
        contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
          value: STAKE_AMOUNT,
        })
      ).to.be.revertedWithCustomError(contract, "ContractPaused");
    });

    it("Should only allow pauser to pause", async function () {
      await expect(
        contract.connect(user1).togglePause()
      ).to.be.revertedWithCustomError(contract, "NotPauser");
    });
  });

  describe("Platform Fees", function () {
    it("Should withdraw platform fees correctly", async function () {
      const stakeAmount = ethers.parseEther("1.0");
      const expectedFee = (stakeAmount * 2n) / 100n;

      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: stakeAmount,
      });

      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await contract.connect(owner).withdrawPlatformFees(owner.address);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter).to.be.closeTo(
        balanceBefore + expectedFee - gasUsed,
        ethers.parseEther("0.0001")
      );

      expect(await contract.platformFees()).to.equal(0);
    });

    it("Should emit PlatformFeesWithdrawn event", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      const expectedFee = (STAKE_AMOUNT * 2n) / 100n;

      await expect(contract.connect(owner).withdrawPlatformFees(owner.address))
        .to.emit(contract, "PlatformFeesWithdrawn")
        .withArgs(owner.address, expectedFee);
    });
  });

  describe("Operator Management", function () {
    it("Should add operator successfully", async function () {
      await expect(contract.connect(owner).addOperator(user1.address))
        .to.emit(contract, "OperatorAdded")
        .withArgs(user1.address);

      expect(await contract.operators(user1.address)).to.equal(true);
    });

    it("Should remove operator successfully", async function () {
      await contract.connect(owner).addOperator(user1.address);

      await expect(contract.connect(owner).removeOperator(user1.address))
        .to.emit(contract, "OperatorRemoved")
        .withArgs(user1.address);

      expect(await contract.operators(user1.address)).to.equal(false);
    });

    it("Should reject adding zero address as operator", async function () {
      await expect(
        contract.connect(owner).addOperator(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(contract, "InvalidAddress");
    });
  });

  describe("Ownership Transfer", function () {
    it("Should transfer ownership successfully", async function () {
      await expect(contract.connect(owner).transferOwnership(user1.address))
        .to.emit(contract, "OwnershipTransferred")
        .withArgs(owner.address, user1.address);

      expect(await contract.owner()).to.equal(user1.address);
    });

    it("Should only allow owner to transfer ownership", async function () {
      await expect(
        contract.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWithCustomError(contract, "NotAuthorized");
    });

    it("Should reject transferring to zero address", async function () {
      await expect(
        contract.connect(owner).transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(contract, "InvalidAddress");
    });
  });

  describe("Emergency Withdrawal", function () {
    it("Should allow emergency withdrawal when paused", async function () {
      // Add some funds
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      // Pause contract
      await contract.connect(owner).togglePause();

      const contractBalance = await ethers.provider.getBalance(contract.target);
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await contract.connect(owner).emergencyWithdraw(
        owner.address,
        contractBalance
      );
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(ownerBalanceAfter).to.be.closeTo(
        ownerBalanceBefore + contractBalance - gasUsed,
        ethers.parseEther("0.0001")
      );
    });

    it("Should reject emergency withdrawal when not paused", async function () {
      await expect(
        contract.connect(owner).emergencyWithdraw(owner.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(contract, "ContractPaused");
    });
  });

  describe("Gateway Callback Pattern", function () {
    it("Should emit RouteProcessingStarted when processing begins", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      await expect(contract.connect(operator).processRouteOptimization(1))
        .to.emit(contract, "RouteProcessingStarted");
    });

    it("Should prevent processing same route twice", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      await contract.connect(operator).processRouteOptimization(1);

      await expect(
        contract.connect(operator).processRouteOptimization(1)
      ).to.be.revertedWithCustomError(contract, "AlreadyProcessed");
    });
  });

  describe("Privacy Features", function () {
    it("Should generate different privacy multipliers for different routes", async function () {
      await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      await contract.connect(user2).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });

      const request1 = await contract.routeRequests(1);
      const request2 = await contract.routeRequests(2);

      // Multipliers should be different (highly probable)
      expect(request1.privacyMultiplier).to.not.equal(request2.privacyMultiplier);
    });
  });

  describe("Gas Optimization", function () {
    it("Should handle batch requests efficiently", async function () {
      const tx1 = await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });
      const receipt1 = await tx1.wait();

      const tx2 = await contract.connect(user1).requestRouteOptimization(5, 1000, 10, {
        value: STAKE_AMOUNT,
      });
      const receipt2 = await tx2.wait();

      // Second request should have similar gas cost
      expect(receipt2!.gasUsed).to.be.closeTo(
        receipt1!.gasUsed,
        receipt1!.gasUsed / 10n // Within 10% variance
      );
    });
  });
});
