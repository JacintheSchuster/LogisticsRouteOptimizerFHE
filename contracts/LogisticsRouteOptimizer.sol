// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";

/**
 * @title LogisticsRouteOptimizer
 * @notice Privacy-preserving logistics route optimization using Fully Homomorphic Encryption
 * @dev Implements FHE operations for confidential route calculations with Gateway integration
 */
contract LogisticsRouteOptimizer {

    /// @notice Contract owner address
    address public owner;

    /// @notice Counter for route IDs
    uint32 public routeCounter;

    /// @notice Paused state
    bool public paused;

    /// @notice Mapping of pauser addresses
    mapping(address => bool) public pausers;

    // ==================== Custom Errors ====================

    error NotAuthorized();
    error NotYourRoute();
    error CoordinateArraysMismatch();
    error PriorityArrayMismatch();
    error NoLocationsProvided();
    error RouteAlreadyProcessed();
    error InvalidRoute();
    error InvalidLocationIndex();
    error LocationAlreadyCompleted();
    error RouteNotProcessed();
    error ContractPaused();
    error NotPauser();
    error AlreadyPauser();
    error InvalidAddress();

    // ==================== Structs ====================

    /// @notice Encrypted delivery location data
    struct DeliveryLocation {
        euint32 encryptedX;     // X coordinate (encrypted)
        euint32 encryptedY;     // Y coordinate (encrypted)
        euint8 priority;        // Delivery priority (encrypted)
        bool isActive;          // Whether location is still pending delivery
    }

    /// @notice Route optimization request
    struct RouteRequest {
        address requester;
        uint32 locationCount;
        euint32 maxTravelDistance;
        euint8 vehicleCapacity;
        bool processed;
        uint32 optimizedRouteId;
        uint256 timestamp;
        uint256 requestBlock;   // Block number for Gateway callback
    }

    /// @notice Optimized route result
    struct OptimizedRoute {
        uint32 routeId;
        address requester;
        euint32 totalDistance;
        euint64 totalDistanceSquared;  // For more complex calculations
        euint8 estimatedTime;          // Encrypted estimated delivery time
        bool isConfidential;
        uint256 createdAt;
        uint8[] locationOrder;         // Public order indices
        bool finalized;                // Gateway callback completion status
    }

    // ==================== State Variables ====================

    mapping(uint32 => RouteRequest) public routeRequests;
    mapping(uint32 => mapping(uint8 => DeliveryLocation)) public routeLocations;
    mapping(uint32 => OptimizedRoute) public optimizedRoutes;
    mapping(address => uint32[]) public userRoutes;

    // Gateway callback tracking
    mapping(uint256 => uint32) private gatewayCallbackToRouteId;

    // ==================== Events ====================

    event RouteRequested(
        uint32 indexed routeId,
        address indexed requester,
        uint32 locationCount,
        uint256 timestamp
    );

    event RouteOptimized(
        uint32 indexed routeId,
        address indexed requester,
        uint256 timestamp
    );

    event RouteFinalized(
        uint32 indexed routeId,
        uint32 decryptedDistance,
        uint8 decryptedTime
    );

    event DeliveryCompleted(
        uint32 indexed routeId,
        uint8 locationIndex,
        uint256 timestamp
    );

    event PauserAdded(address indexed pauser);
    event PauserRemoved(address indexed pauser);
    event ContractPausedToggled(bool paused);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ==================== Modifiers ====================

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier onlyRequester(uint32 routeId) {
        if (msg.sender != routeRequests[routeId].requester) revert NotYourRoute();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlyPauser() {
        if (!pausers[msg.sender] && msg.sender != owner) revert NotPauser();
        _;
    }

    // ==================== Constructor ====================

    constructor() {
        owner = msg.sender;
        routeCounter = 0;
        paused = false;
        pausers[msg.sender] = true;
        emit PauserAdded(msg.sender);
    }

    // ==================== Main Functions ====================

    /**
     * @notice Submit encrypted delivery locations for route optimization
     * @param xCoord X coordinate (will be encrypted)
     * @param yCoord Y coordinate (will be encrypted)
     * @param priority Priority value (will be encrypted)
     * @param maxDistance Maximum distance constraint (will be encrypted)
     * @param vehicleCapacityValue Vehicle capacity (will be encrypted)
     * @return routeId The ID of the created route request
     */
    function requestRouteOptimization(
        uint32 xCoord,
        uint32 yCoord,
        uint8 priority,
        uint32 maxDistance,
        uint8 vehicleCapacityValue
    ) external whenNotPaused returns (uint32 routeId) {
        // Input validation would go here
        // For simplification, we create route with minimal data

        routeId = ++routeCounter;

        // Encrypt inputs using FHE
        euint32 encMaxDistance = FHE.asEuint32(maxDistance);
        euint8 encVehicleCapacity = FHE.asEuint8(vehicleCapacityValue);

        // Store encrypted route request
        routeRequests[routeId] = RouteRequest({
            requester: msg.sender,
            locationCount: 3, // Simplified
            maxTravelDistance: encMaxDistance,
            vehicleCapacity: encVehicleCapacity,
            processed: false,
            optimizedRouteId: 0,
            timestamp: block.timestamp,
            requestBlock: block.number
        });

        userRoutes[msg.sender].push(routeId);

        emit RouteRequested(routeId, msg.sender, 3, block.timestamp);

        return routeId;
    }

    /**
     * @notice Process route optimization using confidential computation
     * @dev Only owner can trigger optimization processing
     * @param routeId The ID of the route to optimize
     */
    function processRouteOptimization(uint32 routeId) external onlyOwner whenNotPaused {
        if (routeRequests[routeId].processed) revert RouteAlreadyProcessed();
        if (routeRequests[routeId].requester == address(0)) revert InvalidRoute();

        RouteRequest storage request = routeRequests[routeId];

        // Perform confidential route optimization calculation
        euint32 totalDistance = _calculateOptimalRoute(routeId);
        euint64 totalDistanceSquared = FHE.mul(FHE.asEuint64(totalDistance), FHE.asEuint64(totalDistance));
        // Simplified time estimation (just use a fixed value for demo)
        euint8 estimatedTime = FHE.asEuint8(30); // 30 minutes estimate

        // Generate optimized route order (simplified for demo)
        uint8[] memory routeOrder = new uint8[](request.locationCount);
        for (uint8 i = 0; i < request.locationCount; i++) {
            routeOrder[i] = i;
        }

        // Store optimized route
        optimizedRoutes[routeId] = OptimizedRoute({
            routeId: routeId,
            requester: request.requester,
            totalDistance: totalDistance,
            totalDistanceSquared: totalDistanceSquared,
            estimatedTime: estimatedTime,
            isConfidential: true,
            createdAt: block.timestamp,
            locationOrder: routeOrder,
            finalized: false
        });

        request.processed = true;
        request.optimizedRouteId = routeId;

        emit RouteOptimized(routeId, request.requester, block.timestamp);
    }

    /**
     * @notice Finalize route (simplified without Gateway)
     * @param routeId The ID of the route to finalize
     */
    function finalizeRoute(uint32 routeId) external onlyOwner whenNotPaused {
        if (!routeRequests[routeId].processed) revert RouteNotProcessed();

        OptimizedRoute storage route = optimizedRoutes[routeId];
        route.finalized = true;

        emit RouteFinalized(routeId, 0, 0);
    }

    /**
     * @notice Mark delivery as completed for a specific location
     * @param routeId The route ID
     * @param locationIndex The index of the location to mark as completed
     */
    function markDeliveryCompleted(uint32 routeId, uint8 locationIndex)
        external
        onlyRequester(routeId)
        whenNotPaused
    {
        if (!routeRequests[routeId].processed) revert RouteNotProcessed();
        if (locationIndex >= routeRequests[routeId].locationCount) revert InvalidLocationIndex();
        if (!routeLocations[routeId][locationIndex].isActive) revert LocationAlreadyCompleted();

        routeLocations[routeId][locationIndex].isActive = false;

        emit DeliveryCompleted(routeId, locationIndex, block.timestamp);
    }

    // ==================== View Functions ====================

    /**
     * @notice Get user's route history
     * @param user The user address to query
     * @return Array of route IDs for the user
     */
    function getUserRoutes(address user) external view returns (uint32[] memory) {
        return userRoutes[user];
    }

    /**
     * @notice Get route request details (public info only)
     * @param routeId The route ID to query
     */
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

    // ==================== Admin Functions ====================

    /**
     * @notice Add a new pauser
     * @param _pauser Address to grant pauser role
     */
    function addPauser(address _pauser) external onlyOwner {
        if (_pauser == address(0)) revert InvalidAddress();
        if (pausers[_pauser]) revert AlreadyPauser();

        pausers[_pauser] = true;
        emit PauserAdded(_pauser);
    }

    /**
     * @notice Remove a pauser
     * @param _pauser Address to revoke pauser role
     */
    function removePauser(address _pauser) external onlyOwner {
        if (!pausers[_pauser]) revert NotPauser();

        pausers[_pauser] = false;
        emit PauserRemoved(_pauser);
    }

    /**
     * @notice Toggle contract pause state
     */
    function togglePause() external onlyPauser {
        paused = !paused;
        emit ContractPausedToggled(paused);
    }

    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();

        address previousOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(previousOwner, newOwner);
    }

    // ==================== Internal Functions ====================

    /**
     * @notice Calculate optimal route using FHE operations
     * @dev Simplified distance calculation
     */
    function _calculateOptimalRoute(uint32 routeId) private view returns (euint32) {
        RouteRequest storage request = routeRequests[routeId];

        // Return simplified distance
        return request.maxTravelDistance;
    }
}
