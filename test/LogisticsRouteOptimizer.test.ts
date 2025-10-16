import { expect } from "chai";
import { ethers } from "hardhat";
import { LogisticsRouteOptimizer } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("LogisticsRouteOptimizer", function () {
  // Fixture for deploying the contract
  async function deployLogisticsFixture() {
    const [owner, requester1, requester2, pauser1, pauser2, unauthorized] =
      await ethers.getSigners();

    const LogisticsRouteOptimizerFactory = await ethers.getContractFactory(
      "LogisticsRouteOptimizer"
    );
    const logistics = await LogisticsRouteOptimizerFactory.deploy();

    return {
      logistics,
      owner,
      requester1,
      requester2,
      pauser1,
      pauser2,
      unauthorized,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { logistics, owner } = await loadFixture(deployLogisticsFixture);
      expect(await logistics.owner()).to.equal(owner.address);
    });

    it("Should initialize routeCounter to 0", async function () {
      const { logistics } = await loadFixture(deployLogisticsFixture);
      expect(await logistics.routeCounter()).to.equal(0);
    });

    it("Should initialize paused to false", async function () {
      const { logistics } = await loadFixture(deployLogisticsFixture);
      expect(await logistics.paused()).to.equal(false);
    });

    it("Should add owner as initial pauser", async function () {
      const { logistics, owner } = await loadFixture(deployLogisticsFixture);
      expect(await logistics.pausers(owner.address)).to.equal(true);
    });
  });

  describe("Route Request Creation", function () {
    it("Should create a route request successfully", async function () {
      const { logistics, requester1 } = await loadFixture(deployLogisticsFixture);

      // Mock encrypted inputs (in real scenario, these would be encrypted)
      const xCoords = [100, 200, 300];
      const yCoords = [150, 250, 350];
      const priorities = [1, 2, 3];
      const maxDistance = 1000;
      const vehicleCapacity = 10;

      const tx = await logistics.connect(requester1).requestRouteOptimization(
        xCoords,
        yCoords,
        priorities,
        maxDistance,
        vehicleCapacity
      );

      await expect(tx)
        .to.emit(logistics, "RouteRequested")
        .withArgs(1, requester1.address, 3, await time.latest());

      expect(await logistics.routeCounter()).to.equal(1);
    });

    it("Should revert if coordinate arrays mismatch", async function () {
      const { logistics, requester1 } = await loadFixture(deployLogisticsFixture);

      const xCoords = [100, 200];
      const yCoords = [150]; // Mismatched length
      const priorities = [1, 2];

      await expect(
        logistics.connect(requester1).requestRouteOptimization(
          xCoords,
          yCoords,
          priorities,
          1000,
          10
        )
      ).to.be.revertedWithCustomError(logistics, "CoordinateArraysMismatch");
    });

    it("Should revert if priority array mismatch", async function () {
      const { logistics, requester1 } = await loadFixture(deployLogisticsFixture);

      const xCoords = [100, 200];
      const yCoords = [150, 250];
      const priorities = [1]; // Mismatched length

      await expect(
        logistics.connect(requester1).requestRouteOptimization(
          xCoords,
          yCoords,
          priorities,
          1000,
          10
        )
      ).to.be.revertedWithCustomError(logistics, "PriorityArrayMismatch");
    });

    it("Should revert if no locations provided", async function () {
      const { logistics, requester1 } = await loadFixture(deployLogisticsFixture);

      await expect(
        logistics.connect(requester1).requestRouteOptimization(
          [],
          [],
          [],
          1000,
          10
        )
      ).to.be.revertedWithCustomError(logistics, "NoLocationsProvided");
    });

    it("Should track user routes correctly", async function () {
      const { logistics, requester1 } = await loadFixture(deployLogisticsFixture);

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200],
        [150, 250],
        [1, 2],
        1000,
        10
      );

      await logistics.connect(requester1).requestRouteOptimization(
        [300, 400],
        [350, 450],
        [1, 2],
        1000,
        10
      );

      const userRoutes = await logistics.getUserRoutes(requester1.address);
      expect(userRoutes.length).to.equal(2);
      expect(userRoutes[0]).to.equal(1);
      expect(userRoutes[1]).to.equal(2);
    });
  });

  describe("Route Processing", function () {
    it("Should process route optimization successfully", async function () {
      const { logistics, owner, requester1 } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200, 300],
        [150, 250, 350],
        [1, 2, 3],
        1000,
        10
      );

      const tx = await logistics.connect(owner).processRouteOptimization(1);

      await expect(tx)
        .to.emit(logistics, "RouteOptimized")
        .withArgs(1, requester1.address, await time.latest());

      const routeRequest = await logistics.getRouteRequest(1);
      expect(routeRequest.processed).to.equal(true);
    });

    it("Should revert if route already processed", async function () {
      const { logistics, owner, requester1 } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200],
        [150, 250],
        [1, 2],
        1000,
        10
      );

      await logistics.connect(owner).processRouteOptimization(1);

      await expect(
        logistics.connect(owner).processRouteOptimization(1)
      ).to.be.revertedWithCustomError(logistics, "RouteAlreadyProcessed");
    });

    it("Should revert if invalid route ID", async function () {
      const { logistics, owner } = await loadFixture(deployLogisticsFixture);

      await expect(
        logistics.connect(owner).processRouteOptimization(999)
      ).to.be.revertedWithCustomError(logistics, "InvalidRoute");
    });

    it("Should only allow owner to process routes", async function () {
      const { logistics, requester1, unauthorized } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200],
        [150, 250],
        [1, 2],
        1000,
        10
      );

      await expect(
        logistics.connect(unauthorized).processRouteOptimization(1)
      ).to.be.revertedWithCustomError(logistics, "NotAuthorized");
    });
  });

  describe("Delivery Completion", function () {
    it("Should mark delivery as completed", async function () {
      const { logistics, owner, requester1 } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200],
        [150, 250],
        [1, 2],
        1000,
        10
      );

      await logistics.connect(owner).processRouteOptimization(1);

      const tx = await logistics.connect(requester1).markDeliveryCompleted(1, 0);

      await expect(tx)
        .to.emit(logistics, "DeliveryCompleted")
        .withArgs(1, 0, await time.latest());
    });

    it("Should revert if route not processed", async function () {
      const { logistics, requester1 } = await loadFixture(deployLogisticsFixture);

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200],
        [150, 250],
        [1, 2],
        1000,
        10
      );

      await expect(
        logistics.connect(requester1).markDeliveryCompleted(1, 0)
      ).to.be.revertedWithCustomError(logistics, "RouteNotProcessed");
    });

    it("Should revert if invalid location index", async function () {
      const { logistics, owner, requester1 } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200],
        [150, 250],
        [1, 2],
        1000,
        10
      );

      await logistics.connect(owner).processRouteOptimization(1);

      await expect(
        logistics.connect(requester1).markDeliveryCompleted(1, 99)
      ).to.be.revertedWithCustomError(logistics, "InvalidLocationIndex");
    });

    it("Should revert if location already completed", async function () {
      const { logistics, owner, requester1 } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200],
        [150, 250],
        [1, 2],
        1000,
        10
      );

      await logistics.connect(owner).processRouteOptimization(1);
      await logistics.connect(requester1).markDeliveryCompleted(1, 0);

      await expect(
        logistics.connect(requester1).markDeliveryCompleted(1, 0)
      ).to.be.revertedWithCustomError(logistics, "LocationAlreadyCompleted");
    });

    it("Should only allow requester to mark delivery completed", async function () {
      const { logistics, owner, requester1, unauthorized } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200],
        [150, 250],
        [1, 2],
        1000,
        10
      );

      await logistics.connect(owner).processRouteOptimization(1);

      await expect(
        logistics.connect(unauthorized).markDeliveryCompleted(1, 0)
      ).to.be.revertedWithCustomError(logistics, "NotYourRoute");
    });
  });

  describe("Pause Mechanism", function () {
    it("Should allow owner to add pauser", async function () {
      const { logistics, owner, pauser1 } = await loadFixture(
        deployLogisticsFixture
      );

      await expect(logistics.connect(owner).addPauser(pauser1.address))
        .to.emit(logistics, "PauserAdded")
        .withArgs(pauser1.address);

      expect(await logistics.pausers(pauser1.address)).to.equal(true);
    });

    it("Should revert when adding zero address as pauser", async function () {
      const { logistics, owner } = await loadFixture(deployLogisticsFixture);

      await expect(
        logistics.connect(owner).addPauser(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(logistics, "InvalidAddress");
    });

    it("Should revert when adding existing pauser", async function () {
      const { logistics, owner, pauser1 } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(owner).addPauser(pauser1.address);

      await expect(
        logistics.connect(owner).addPauser(pauser1.address)
      ).to.be.revertedWithCustomError(logistics, "AlreadyPauser");
    });

    it("Should allow owner to remove pauser", async function () {
      const { logistics, owner, pauser1 } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(owner).addPauser(pauser1.address);

      await expect(logistics.connect(owner).removePauser(pauser1.address))
        .to.emit(logistics, "PauserRemoved")
        .withArgs(pauser1.address);

      expect(await logistics.pausers(pauser1.address)).to.equal(false);
    });

    it("Should allow pauser to toggle pause", async function () {
      const { logistics, owner, pauser1 } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(owner).addPauser(pauser1.address);

      await expect(logistics.connect(pauser1).togglePause())
        .to.emit(logistics, "ContractPausedToggled")
        .withArgs(true);

      expect(await logistics.paused()).to.equal(true);

      await expect(logistics.connect(pauser1).togglePause())
        .to.emit(logistics, "ContractPausedToggled")
        .withArgs(false);

      expect(await logistics.paused()).to.equal(false);
    });

    it("Should revert operations when paused", async function () {
      const { logistics, owner, requester1 } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(owner).togglePause();

      await expect(
        logistics.connect(requester1).requestRouteOptimization(
          [100, 200],
          [150, 250],
          [1, 2],
          1000,
          10
        )
      ).to.be.revertedWithCustomError(logistics, "ContractPaused");
    });

    it("Should only allow pauser or owner to toggle pause", async function () {
      const { logistics, unauthorized } = await loadFixture(
        deployLogisticsFixture
      );

      await expect(
        logistics.connect(unauthorized).togglePause()
      ).to.be.revertedWithCustomError(logistics, "NotPauser");
    });
  });

  describe("Access Control", function () {
    it("Should get optimized route only for requester", async function () {
      const { logistics, owner, requester1, unauthorized } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200],
        [150, 250],
        [1, 2],
        1000,
        10
      );

      await logistics.connect(owner).processRouteOptimization(1);

      await expect(
        logistics.connect(unauthorized).getOptimizedRoute(1)
      ).to.be.revertedWithCustomError(logistics, "NotYourRoute");
    });

    it("Should get route data for owner only", async function () {
      const { logistics, owner, requester1, unauthorized } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200],
        [150, 250],
        [1, 2],
        1000,
        10
      );

      await logistics.connect(owner).processRouteOptimization(1);

      await expect(
        logistics.connect(unauthorized).getRouteDataForOwner(1)
      ).to.be.revertedWithCustomError(logistics, "NotAuthorized");
    });
  });

  describe("Ownership Transfer", function () {
    it("Should transfer ownership successfully", async function () {
      const { logistics, owner, requester1 } = await loadFixture(
        deployLogisticsFixture
      );

      await expect(logistics.connect(owner).transferOwnership(requester1.address))
        .to.emit(logistics, "OwnershipTransferred")
        .withArgs(owner.address, requester1.address);

      expect(await logistics.owner()).to.equal(requester1.address);
    });

    it("Should revert when transferring to zero address", async function () {
      const { logistics, owner } = await loadFixture(deployLogisticsFixture);

      await expect(
        logistics.connect(owner).transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(logistics, "InvalidAddress");
    });

    it("Should only allow owner to transfer ownership", async function () {
      const { logistics, requester1, unauthorized } = await loadFixture(
        deployLogisticsFixture
      );

      await expect(
        logistics.connect(unauthorized).transferOwnership(requester1.address)
      ).to.be.revertedWithCustomError(logistics, "NotAuthorized");
    });
  });

  describe("View Functions", function () {
    it("Should get route request details", async function () {
      const { logistics, requester1 } = await loadFixture(deployLogisticsFixture);

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200, 300],
        [150, 250, 350],
        [1, 2, 3],
        1000,
        10
      );

      const routeRequest = await logistics.getRouteRequest(1);
      expect(routeRequest.requester).to.equal(requester1.address);
      expect(routeRequest.locationCount).to.equal(3);
      expect(routeRequest.processed).to.equal(false);
    });

    it("Should get user routes", async function () {
      const { logistics, requester1, requester2 } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200],
        [150, 250],
        [1, 2],
        1000,
        10
      );

      await logistics.connect(requester2).requestRouteOptimization(
        [300, 400],
        [350, 450],
        [1, 2],
        1000,
        10
      );

      const user1Routes = await logistics.getUserRoutes(requester1.address);
      const user2Routes = await logistics.getUserRoutes(requester2.address);

      expect(user1Routes.length).to.equal(1);
      expect(user2Routes.length).to.equal(1);
      expect(user1Routes[0]).to.equal(1);
      expect(user2Routes[0]).to.equal(2);
    });
  });

  describe("Edge Cases and Boundary Conditions", function () {
    it("Should handle single location route", async function () {
      const { logistics, owner, requester1 } = await loadFixture(
        deployLogisticsFixture
      );

      await logistics.connect(requester1).requestRouteOptimization(
        [100],
        [150],
        [1],
        1000,
        10
      );

      await logistics.connect(owner).processRouteOptimization(1);

      const routeRequest = await logistics.getRouteRequest(1);
      expect(routeRequest.processed).to.equal(true);
    });

    it("Should handle maximum uint8 values for priorities", async function () {
      const { logistics, requester1 } = await loadFixture(deployLogisticsFixture);

      await logistics.connect(requester1).requestRouteOptimization(
        [100, 200],
        [150, 250],
        [255, 255], // Max uint8
        1000,
        255 // Max uint8
      );

      expect(await logistics.routeCounter()).to.equal(1);
    });

    it("Should handle large coordinate values", async function () {
      const { logistics, requester1 } = await loadFixture(deployLogisticsFixture);

      const maxUint32 = 4294967295;

      await logistics.connect(requester1).requestRouteOptimization(
        [maxUint32, maxUint32],
        [maxUint32, maxUint32],
        [1, 2],
        maxUint32,
        10
      );

      expect(await logistics.routeCounter()).to.equal(1);
    });

    it("Should handle multiple routes from same requester", async function () {
      const { logistics, requester1 } = await loadFixture(deployLogisticsFixture);

      for (let i = 0; i < 5; i++) {
        await logistics.connect(requester1).requestRouteOptimization(
          [100 + i, 200 + i],
          [150 + i, 250 + i],
          [1, 2],
          1000,
          10
        );
      }

      const userRoutes = await logistics.getUserRoutes(requester1.address);
      expect(userRoutes.length).to.equal(5);
    });
  });
});
