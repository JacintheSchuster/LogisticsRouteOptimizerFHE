// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract LogisticsRouteOptimizer is SepoliaConfig {

    address public owner;
    uint32 public routeCounter;

    struct DeliveryLocation {
        euint32 encryptedX; // X coordinate (encrypted)
        euint32 encryptedY; // Y coordinate (encrypted)
        euint8 priority;    // Delivery priority (encrypted)
        bool isActive;
    }

    struct RouteRequest {
        address requester;
        uint32 locationCount;
        euint32 maxTravelDistance;
        euint8 vehicleCapacity;
        bool processed;
        uint32 optimizedRouteId;
        uint256 timestamp;
    }

    struct OptimizedRoute {
        uint32 routeId;
        address requester;
        euint32 totalDistance;
        euint8 estimatedTime;  // Encrypted estimated delivery time
        bool isConfidential;
        uint256 createdAt;
        uint8[] locationOrder; // Public order indices
    }

    mapping(uint32 => RouteRequest) public routeRequests;
    mapping(uint32 => mapping(uint8 => DeliveryLocation)) public routeLocations;
    mapping(uint32 => OptimizedRoute) public optimizedRoutes;
    mapping(address => uint32[]) public userRoutes;

    event RouteRequested(uint32 indexed routeId, address indexed requester, uint32 locationCount);
    event RouteOptimized(uint32 indexed routeId, address indexed requester, uint32 totalDistance);
    event DeliveryCompleted(uint32 indexed routeId, uint8 locationIndex);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyRequester(uint32 routeId) {
        require(msg.sender == routeRequests[routeId].requester, "Not your route");
        _;
    }

    constructor() {
        owner = msg.sender;
        routeCounter = 0;
    }

    // Submit encrypted delivery locations for route optimization
    function requestRouteOptimization(
        uint32[] memory xCoords,
        uint32[] memory yCoords,
        uint8[] memory priorities,
        uint32 maxDistance,
        uint8 vehicleCapacity
    ) external returns (uint32 routeId) {
        require(xCoords.length == yCoords.length, "Coordinate arrays must match");
        require(xCoords.length == priorities.length, "Priority array must match");
        require(xCoords.length > 0, "Must have at least one location");

        routeId = ++routeCounter;

        // Store encrypted route request
        routeRequests[routeId] = RouteRequest({
            requester: msg.sender,
            locationCount: uint32(xCoords.length),
            maxTravelDistance: FHE.asEuint32(maxDistance),
            vehicleCapacity: FHE.asEuint8(vehicleCapacity),
            processed: false,
            optimizedRouteId: 0,
            timestamp: block.timestamp
        });

        // Store encrypted location data
        for (uint8 i = 0; i < xCoords.length; i++) {
            euint32 encX = FHE.asEuint32(xCoords[i]);
            euint32 encY = FHE.asEuint32(yCoords[i]);
            euint8 encPriority = FHE.asEuint8(priorities[i]);

            routeLocations[routeId][i] = DeliveryLocation({
                encryptedX: encX,
                encryptedY: encY,
                priority: encPriority,
                isActive: true
            });

            // Grant access permissions
            FHE.allowThis(encX);
            FHE.allowThis(encY);
            FHE.allowThis(encPriority);
            FHE.allow(encX, msg.sender);
            FHE.allow(encY, msg.sender);
            FHE.allow(encPriority, msg.sender);
        }

        // Grant access to route constraints
        FHE.allowThis(routeRequests[routeId].maxTravelDistance);
        FHE.allowThis(routeRequests[routeId].vehicleCapacity);
        FHE.allow(routeRequests[routeId].maxTravelDistance, msg.sender);
        FHE.allow(routeRequests[routeId].vehicleCapacity, msg.sender);

        userRoutes[msg.sender].push(routeId);

        emit RouteRequested(routeId, msg.sender, uint32(xCoords.length));

        return routeId;
    }

    // Process route optimization using confidential computation
    function processRouteOptimization(uint32 routeId) external onlyOwner {
        require(!routeRequests[routeId].processed, "Route already processed");
        require(routeRequests[routeId].requester != address(0), "Invalid route");

        RouteRequest storage request = routeRequests[routeId];

        // Perform confidential route optimization calculation
        euint32 totalDistance = _calculateOptimalRoute(routeId);
        euint8 estimatedTime = _calculateDeliveryTime(routeId, totalDistance);

        // Generate optimized route order (simplified for demo)
        uint8[] memory routeOrder = _generateRouteOrder(request.locationCount);

        // Store optimized route
        optimizedRoutes[routeId] = OptimizedRoute({
            routeId: routeId,
            requester: request.requester,
            totalDistance: totalDistance,
            estimatedTime: estimatedTime,
            isConfidential: true,
            createdAt: block.timestamp,
            locationOrder: routeOrder
        });

        // Grant access to optimization results
        FHE.allowThis(totalDistance);
        FHE.allowThis(estimatedTime);
        FHE.allow(totalDistance, request.requester);
        FHE.allow(estimatedTime, request.requester);

        request.processed = true;
        request.optimizedRouteId = routeId;

        emit RouteOptimized(routeId, request.requester, 0); // Distance kept confidential in event
    }

    // Get route optimization results (encrypted)
    function getOptimizedRoute(uint32 routeId) external view onlyRequester(routeId) returns (
        bytes32 totalDistanceEncrypted,
        bytes32 estimatedTimeEncrypted,
        uint8[] memory locationOrder,
        uint256 createdAt
    ) {
        require(routeRequests[routeId].processed, "Route not processed yet");

        OptimizedRoute storage route = optimizedRoutes[routeId];

        return (
            FHE.toBytes32(route.totalDistance), // Return as bytes32 for client decryption
            FHE.toBytes32(route.estimatedTime),
            route.locationOrder,
            route.createdAt
        );
    }

    // Mark delivery as completed for a specific location
    function markDeliveryCompleted(uint32 routeId, uint8 locationIndex) external onlyRequester(routeId) {
        require(routeRequests[routeId].processed, "Route not processed");
        require(locationIndex < routeRequests[routeId].locationCount, "Invalid location index");
        require(routeLocations[routeId][locationIndex].isActive, "Location already completed");

        routeLocations[routeId][locationIndex].isActive = false;

        emit DeliveryCompleted(routeId, locationIndex);
    }

    // Get user's route history
    function getUserRoutes(address user) external view returns (uint32[] memory) {
        return userRoutes[user];
    }

    // Get route request details (public info only)
    function getRouteRequest(uint32 routeId) external view returns (
        address requester,
        uint32 locationCount,
        bool processed,
        uint256 timestamp
    ) {
        RouteRequest storage request = routeRequests[routeId];
        return (
            request.requester,
            request.locationCount,
            request.processed,
            request.timestamp
        );
    }

    // Internal function to calculate optimal route using FHE operations
    function _calculateOptimalRoute(uint32 routeId) private returns (euint32) {
        RouteRequest storage request = routeRequests[routeId];
        euint32 totalDistance = FHE.asEuint32(0);

        // Simplified distance calculation using FHE operations
        // In practice, this would implement a more sophisticated optimization algorithm
        for (uint8 i = 0; i < request.locationCount - 1; i++) {
            // Calculate distance between consecutive locations
            euint32 distance = _calculateDistance(routeId, i, i + 1);
            totalDistance = FHE.add(totalDistance, distance);
        }

        return totalDistance;
    }

    // Calculate encrypted distance between two locations
    function _calculateDistance(uint32 routeId, uint8 from, uint8 to) private returns (euint32) {
        DeliveryLocation storage loc1 = routeLocations[routeId][from];
        DeliveryLocation storage loc2 = routeLocations[routeId][to];

        // Simplified Manhattan distance calculation using FHE
        euint32 deltaX = FHE.sub(loc2.encryptedX, loc1.encryptedX);
        euint32 deltaY = FHE.sub(loc2.encryptedY, loc1.encryptedY);

        // Approximate distance (Manhattan distance for simplicity)
        return FHE.add(deltaX, deltaY);
    }

    // Calculate estimated delivery time based on distance and vehicle capacity
    function _calculateDeliveryTime(uint32 routeId, euint32 totalDistance) private returns (euint8) {
        RouteRequest storage request = routeRequests[routeId];

        // Simplified time calculation using available FHE operations
        euint32 loadingTime = FHE.mul(FHE.asEuint32(request.locationCount), FHE.asEuint32(5)); // 5 min per stop

        // Convert to euint8 with range constraint
        return FHE.asEuint8(100); // Simplified placeholder for demo
    }

    // Generate route order (simplified - in practice would use optimization algorithm)
    function _generateRouteOrder(uint32 locationCount) private pure returns (uint8[] memory) {
        uint8[] memory order = new uint8[](locationCount);
        for (uint8 i = 0; i < locationCount; i++) {
            order[i] = i;
        }
        return order;
    }

    // Get encrypted route data for owner (read-only access)
    function getRouteDataForOwner(uint32 routeId) external view onlyOwner returns (
        bytes32 encryptedTotalDistance,
        bytes32 encryptedEstimatedTime,
        address requester,
        uint256 createdAt
    ) {
        require(routeRequests[routeId].processed, "Route not processed");

        OptimizedRoute storage route = optimizedRoutes[routeId];
        return (
            FHE.toBytes32(route.totalDistance),
            FHE.toBytes32(route.estimatedTime),
            route.requester,
            route.createdAt
        );
    }
}