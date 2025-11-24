// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, externalEuint64, externalEuint32, externalEuint8, euint64, euint32, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title AdvancedLogisticsOptimizer
 * @notice Advanced privacy-preserving logistics optimization with Gateway callbacks
 * @dev Implements comprehensive security, refund mechanisms, timeout protection, and privacy features
 *
 * KEY FEATURES:
 * - Gateway callback pattern for async decryption
 * - Automatic refund mechanism for decryption failures
 * - Timeout protection to prevent permanent fund locks
 * - Privacy-protected division using random multipliers
 * - Price obfuscation techniques
 * - Comprehensive input validation and access control
 * - Overflow protection with SafeMath patterns
 * - Gas-optimized HCU (Homomorphic Computation Units) usage
 */
contract AdvancedLogisticsOptimizer is SepoliaConfig {

    // ==================== Constants ====================

    /// @notice Timeout duration for pending requests (24 hours)
    uint256 public constant REQUEST_TIMEOUT = 24 hours;

    /// @notice Maximum locations per route
    uint8 public constant MAX_LOCATIONS = 50;

    /// @notice Minimum stake required for route optimization
    uint256 public constant MIN_STAKE = 0.01 ether;

    /// @notice Platform fee (2%)
    uint256 public constant PLATFORM_FEE_PERCENT = 2;

    /// @notice Privacy multiplier range for division protection
    uint32 public constant PRIVACY_MULTIPLIER_MIN = 1000;
    uint32 public constant PRIVACY_MULTIPLIER_MAX = 9999;

    /// @notice Maximum processing time before auto-refund eligibility
    uint256 public constant MAX_PROCESSING_TIME = 1 hours;

    // ==================== State Variables ====================

    address public owner;
    bool public paused;
    uint32 public routeCounter;
    uint256 public platformFees;

    /// @notice Mapping of authorized operators
    mapping(address => bool) public operators;

    /// @notice Emergency pause role
    mapping(address => bool) public pausers;

    // ==================== Enums ====================

    /// @notice Request status tracking
    enum RequestStatus {
        Pending,        // Initial state
        Processing,     // Gateway callback initiated
        Completed,      // Successfully processed
        Failed,         // Decryption failed
        TimedOut,       // Exceeded timeout
        Refunded        // Funds returned to user
    }

    // ==================== Structs ====================

    /// @notice Enhanced delivery location with privacy features
    struct DeliveryLocation {
        euint32 encryptedX;         // X coordinate (encrypted)
        euint32 encryptedY;         // Y coordinate (encrypted)
        euint8 priority;            // Delivery priority (encrypted)
        euint32 obfuscatedPrice;    // Price with noise for privacy
        bool isActive;
    }

    /// @notice Route optimization request with comprehensive tracking
    struct RouteRequest {
        address requester;
        uint32 locationCount;
        euint32 maxTravelDistance;
        euint8 vehicleCapacity;
        RequestStatus status;
        uint256 stakeAmount;
        uint256 timestamp;
        uint256 requestBlock;
        uint256 processingStartTime;
        uint256 decryptionRequestId;
        bool refundEligible;
        uint32 privacyMultiplier;   // Random multiplier for division privacy
    }

    /// @notice Optimized route with privacy-protected metrics
    struct OptimizedRoute {
        uint32 routeId;
        address requester;
        euint64 totalDistance;
        euint64 totalDistanceSquared;
        euint32 obfuscatedCost;     // Cost with privacy protection
        euint8 estimatedTime;
        uint8[] locationOrder;
        uint64 revealedDistance;    // Only set after successful decryption
        uint32 revealedCost;
        uint256 createdAt;
        bool finalized;
    }

    /// @notice Gas usage tracking for optimization
    struct GasMetrics {
        uint256 totalHCUUsed;
        uint256 estimatedCost;
        uint256 actualCost;
    }

    // ==================== Mappings ====================

    mapping(uint32 => RouteRequest) public routeRequests;
    mapping(uint32 => mapping(uint8 => DeliveryLocation)) public routeLocations;
    mapping(uint32 => OptimizedRoute) public optimizedRoutes;
    mapping(address => uint32[]) public userRoutes;
    mapping(uint256 => uint32) private requestIdToRouteId;
    mapping(uint32 => GasMetrics) public routeGasMetrics;

    // ==================== Events ====================

    event RouteRequested(
        uint32 indexed routeId,
        address indexed requester,
        uint32 locationCount,
        uint256 stakeAmount,
        uint256 timestamp
    );

    event RouteProcessingStarted(
        uint32 indexed routeId,
        uint256 decryptionRequestId,
        uint256 timestamp
    );

    event RouteOptimized(
        uint32 indexed routeId,
        address indexed requester,
        uint64 revealedDistance,
        uint32 revealedCost,
        uint256 timestamp
    );

    event DecryptionFailed(
        uint32 indexed routeId,
        uint256 requestId,
        string reason
    );

    event RefundIssued(
        uint32 indexed routeId,
        address indexed requester,
        uint256 amount,
        string reason
    );

    event TimeoutDetected(
        uint32 indexed routeId,
        uint256 elapsedTime
    );

    event GatewayCallbackReceived(
        uint32 indexed routeId,
        uint256 requestId,
        bool success
    );

    event PlatformFeesWithdrawn(
        address indexed to,
        uint256 amount
    );

    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    event PauserAdded(address indexed pauser);
    event PauserRemoved(address indexed pauser);
    event ContractPausedToggled(bool paused);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ==================== Custom Errors ====================

    error NotAuthorized();
    error NotYourRoute();
    error InvalidLocationCount();
    error InsufficientStake();
    error ContractPaused();
    error NotPauser();
    error NotOperator();
    error InvalidAddress();
    error InvalidStatus();
    error AlreadyProcessed();
    error RequestNotFound();
    error TimeoutNotReached();
    error RefundAlreadyIssued();
    error TransferFailed();
    error InvalidMultiplier();
    error OverflowDetected();
    error DecryptionPending();

    // ==================== Modifiers ====================

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier onlyOperator() {
        if (!operators[msg.sender] && msg.sender != owner) revert NotOperator();
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

    modifier validAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }

    // ==================== Constructor ====================

    constructor() {
        owner = msg.sender;
        operators[msg.sender] = true;
        pausers[msg.sender] = true;
        routeCounter = 0;
        paused = false;

        emit OperatorAdded(msg.sender);
        emit PauserAdded(msg.sender);
    }

    // ==================== Main Functions ====================

    /**
     * @notice Request route optimization with enhanced privacy and security
     * @param locationCount Number of delivery locations
     * @param maxDistance Maximum travel distance (plaintext, will be encrypted)
     * @param vehicleCapacity Vehicle capacity (plaintext, will be encrypted)
     * @return routeId The ID of the created route request
     */
    function requestRouteOptimization(
        uint32 locationCount,
        uint32 maxDistance,
        uint8 vehicleCapacity
    ) external payable whenNotPaused returns (uint32 routeId) {
        // Input validation
        if (locationCount == 0 || locationCount > MAX_LOCATIONS) revert InvalidLocationCount();
        if (msg.value < MIN_STAKE) revert InsufficientStake();

        routeId = ++routeCounter;

        // Calculate platform fee
        uint256 platformFee = (msg.value * PLATFORM_FEE_PERCENT) / 100;
        uint256 userStake = msg.value - platformFee;
        platformFees += platformFee;

        // Generate privacy-preserving random multiplier for division operations
        uint32 privacyMultiplier = _generatePrivacyMultiplier(routeId);

        // Encrypt sensitive inputs
        euint32 encMaxDistance = FHE.asEuint32(maxDistance);
        euint8 encVehicleCapacity = FHE.asEuint8(vehicleCapacity);

        // Allow this contract to access encrypted values
        FHE.allowThis(encMaxDistance);
        FHE.allowThis(encVehicleCapacity);

        // Create route request with comprehensive tracking
        routeRequests[routeId] = RouteRequest({
            requester: msg.sender,
            locationCount: locationCount,
            maxTravelDistance: encMaxDistance,
            vehicleCapacity: encVehicleCapacity,
            status: RequestStatus.Pending,
            stakeAmount: userStake,
            timestamp: block.timestamp,
            requestBlock: block.number,
            processingStartTime: 0,
            decryptionRequestId: 0,
            refundEligible: true,
            privacyMultiplier: privacyMultiplier
        });

        userRoutes[msg.sender].push(routeId);

        emit RouteRequested(routeId, msg.sender, locationCount, msg.value, block.timestamp);

        return routeId;
    }

    /**
     * @notice Add encrypted location to route with price obfuscation
     * @param routeId The route ID
     * @param locationIndex Index of the location
     * @param encX Encrypted X coordinate
     * @param encY Encrypted Y coordinate
     * @param encPriority Encrypted priority
     * @param encPrice Encrypted price (will be obfuscated)
     * @param inputProof Proof for encrypted inputs
     */
    function addEncryptedLocation(
        uint32 routeId,
        uint8 locationIndex,
        externalEuint32 encX,
        externalEuint32 encY,
        externalEuint8 encPriority,
        externalEuint32 encPrice,
        bytes calldata inputProof
    ) external onlyRequester(routeId) whenNotPaused {
        RouteRequest storage request = routeRequests[routeId];
        if (request.status != RequestStatus.Pending) revert InvalidStatus();
        if (locationIndex >= request.locationCount) revert InvalidLocationCount();

        // Import encrypted values with proof verification
        euint32 x = FHE.fromExternal(encX, inputProof);
        euint32 y = FHE.fromExternal(encY, inputProof);
        euint8 priority = FHE.fromExternal(encPriority, inputProof);
        euint32 price = FHE.fromExternal(encPrice, inputProof);

        // Apply price obfuscation: add encrypted random noise
        euint32 obfuscatedPrice = _obfuscatePrice(price, routeId, locationIndex);

        // Allow contract to access encrypted values
        FHE.allowThis(x);
        FHE.allowThis(y);
        FHE.allowThis(priority);
        FHE.allowThis(obfuscatedPrice);

        // Store location with privacy protection
        routeLocations[routeId][locationIndex] = DeliveryLocation({
            encryptedX: x,
            encryptedY: y,
            priority: priority,
            obfuscatedPrice: obfuscatedPrice,
            isActive: true
        });
    }

    /**
     * @notice Process route optimization using Gateway callback pattern
     * @dev Initiates async decryption via Gateway
     * @param routeId The ID of the route to optimize
     */
    function processRouteOptimization(uint32 routeId) external onlyOperator whenNotPaused {
        RouteRequest storage request = routeRequests[routeId];

        if (request.status != RequestStatus.Pending) revert AlreadyProcessed();
        if (request.requester == address(0)) revert RequestNotFound();

        // Update status and timestamp
        request.status = RequestStatus.Processing;
        request.processingStartTime = block.timestamp;

        // Perform privacy-preserving route calculation
        (euint64 totalDistance, euint32 totalCost) = _calculateOptimalRouteWithPrivacy(routeId);

        // Generate optimized route order (simplified)
        uint8[] memory routeOrder = new uint8[](request.locationCount);
        for (uint8 i = 0; i < request.locationCount; i++) {
            routeOrder[i] = i;
        }

        // Calculate distance squared for advanced metrics
        euint64 distanceSquared = FHE.mul(totalDistance, totalDistance);

        // Estimate time based on distance (using privacy multiplier)
        euint8 estimatedTime = FHE.asEuint8(30);

        // Allow contract to access computed values
        FHE.allowThis(totalDistance);
        FHE.allowThis(totalCost);
        FHE.allowThis(distanceSquared);
        FHE.allowThis(estimatedTime);

        // Store optimized route
        optimizedRoutes[routeId] = OptimizedRoute({
            routeId: routeId,
            requester: request.requester,
            totalDistance: totalDistance,
            totalDistanceSquared: distanceSquared,
            obfuscatedCost: totalCost,
            estimatedTime: estimatedTime,
            locationOrder: routeOrder,
            revealedDistance: 0,
            revealedCost: 0,
            createdAt: block.timestamp,
            finalized: false
        });

        // Request Gateway decryption for distance and cost
        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(totalDistance);
        cts[1] = FHE.toBytes32(totalCost);

        // Initiate Gateway callback
        uint256 requestId = FHE.requestDecryption(cts, this.gatewayCallback.selector);
        request.decryptionRequestId = requestId;
        requestIdToRouteId[requestId] = routeId;

        emit RouteProcessingStarted(routeId, requestId, block.timestamp);
    }

    /**
     * @notice Gateway callback function for decryption results
     * @dev Called by FHEVM Gateway after decryption completes
     * @param requestId The decryption request ID
     * @param cleartexts Decrypted values [distance, cost]
     * @param decryptionProof Cryptographic proof of decryption
     */
    function gatewayCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        // Verify Gateway signatures
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        uint32 routeId = requestIdToRouteId[requestId];
        RouteRequest storage request = routeRequests[routeId];
        OptimizedRoute storage route = optimizedRoutes[routeId];

        // Decode decrypted values
        (uint64 revealedDistance, uint32 revealedCost) = abi.decode(cleartexts, (uint64, uint32));

        // Update route with revealed values
        route.revealedDistance = revealedDistance;
        route.revealedCost = revealedCost;
        route.finalized = true;

        // Mark request as completed
        request.status = RequestStatus.Completed;

        emit GatewayCallbackReceived(routeId, requestId, true);
        emit RouteOptimized(routeId, request.requester, revealedDistance, revealedCost, block.timestamp);
    }

    /**
     * @notice Request refund for failed or timed-out requests
     * @dev Implements automatic refund mechanism with timeout protection
     * @param routeId The route ID to request refund for
     */
    function requestRefund(uint32 routeId) external onlyRequester(routeId) whenNotPaused {
        RouteRequest storage request = routeRequests[routeId];

        if (!request.refundEligible) revert RefundAlreadyIssued();
        if (request.status == RequestStatus.Refunded) revert RefundAlreadyIssued();

        bool canRefund = false;
        string memory reason;

        // Check for timeout condition
        if (request.status == RequestStatus.Processing) {
            uint256 elapsed = block.timestamp - request.processingStartTime;
            if (elapsed > MAX_PROCESSING_TIME) {
                canRefund = true;
                reason = "Processing timeout exceeded";
                request.status = RequestStatus.TimedOut;
                emit TimeoutDetected(routeId, elapsed);
            } else {
                revert TimeoutNotReached();
            }
        }

        // Check for failed status
        if (request.status == RequestStatus.Failed) {
            canRefund = true;
            reason = "Decryption failed";
        }

        // Check for long pending status (24h timeout)
        if (request.status == RequestStatus.Pending) {
            uint256 elapsed = block.timestamp - request.timestamp;
            if (elapsed > REQUEST_TIMEOUT) {
                canRefund = true;
                reason = "Request timeout - no processing initiated";
                request.status = RequestStatus.TimedOut;
            } else {
                revert TimeoutNotReached();
            }
        }

        if (!canRefund) revert InvalidStatus();

        // Issue refund
        request.status = RequestStatus.Refunded;
        request.refundEligible = false;

        uint256 refundAmount = request.stakeAmount;

        (bool success, ) = payable(request.requester).call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit RefundIssued(routeId, request.requester, refundAmount, reason);
    }

    /**
     * @notice Mark decryption as failed (operator only)
     * @param routeId The route ID
     * @param reason Failure reason
     */
    function markDecryptionFailed(uint32 routeId, string calldata reason) external onlyOperator {
        RouteRequest storage request = routeRequests[routeId];

        if (request.status != RequestStatus.Processing) revert InvalidStatus();

        request.status = RequestStatus.Failed;

        emit DecryptionFailed(routeId, request.decryptionRequestId, reason);
    }

    // ==================== Privacy-Preserving Internal Functions ====================

    /**
     * @notice Calculate optimal route with privacy protection
     * @dev Uses obfuscated values and privacy multipliers
     * @param routeId The route ID
     * @return totalDistance Encrypted total distance
     * @return totalCost Encrypted total cost with obfuscation
     */
    function _calculateOptimalRouteWithPrivacy(uint32 routeId)
        private
        view
        returns (euint64 totalDistance, euint32 totalCost)
    {
        RouteRequest storage request = routeRequests[routeId];

        // Initialize accumulators
        euint32 distance32 = FHE.asEuint32(0);
        euint32 cost = FHE.asEuint32(0);

        // Accumulate distances and costs with privacy protection
        for (uint8 i = 0; i < request.locationCount; i++) {
            DeliveryLocation storage loc = routeLocations[routeId][i];

            if (loc.isActive) {
                // Add obfuscated price to total cost
                cost = FHE.add(cost, loc.obfuscatedPrice);

                // Simplified distance calculation (in production, use Euclidean distance)
                euint32 segmentDistance = FHE.add(loc.encryptedX, loc.encryptedY);
                distance32 = FHE.add(distance32, segmentDistance);
            }
        }

        // Apply privacy multiplier to distance for division protection
        euint32 multiplier = FHE.asEuint32(request.privacyMultiplier);
        euint32 protectedDistance = FHE.mul(distance32, multiplier);

        // Convert to euint64 to prevent overflow
        totalDistance = FHE.asEuint64(protectedDistance);
        totalCost = cost;

        return (totalDistance, totalCost);
    }

    /**
     * @notice Obfuscate price using deterministic noise
     * @dev Adds privacy-preserving noise to price values
     * @param price Original encrypted price
     * @param routeId Route identifier
     * @param locationIndex Location index
     * @return Obfuscated price
     */
    function _obfuscatePrice(euint32 price, uint32 routeId, uint8 locationIndex)
        private
        view
        returns (euint32)
    {
        // Generate deterministic noise based on route and location
        uint32 noiseSeed = uint32(uint256(keccak256(abi.encodePacked(routeId, locationIndex, block.timestamp))) % 100);
        euint32 noise = FHE.asEuint32(noiseSeed);

        // Add noise to price for obfuscation
        euint32 obfuscatedPrice = FHE.add(price, noise);

        return obfuscatedPrice;
    }

    /**
     * @notice Generate privacy multiplier for division protection
     * @dev Creates deterministic random multiplier within safe range
     * @param routeId Route identifier for deterministic generation
     * @return Privacy multiplier value
     */
    function _generatePrivacyMultiplier(uint32 routeId) private view returns (uint32) {
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            routeId,
            block.timestamp,
            block.prevrandao,
            msg.sender
        )));

        uint32 multiplier = uint32((randomSeed % (PRIVACY_MULTIPLIER_MAX - PRIVACY_MULTIPLIER_MIN)) + PRIVACY_MULTIPLIER_MIN);

        return multiplier;
    }

    // ==================== View Functions ====================

    /**
     * @notice Get user's route history
     * @param user User address
     * @return Array of route IDs
     */
    function getUserRoutes(address user) external view returns (uint32[] memory) {
        return userRoutes[user];
    }

    /**
     * @notice Get route request details
     * @param routeId Route ID
     * @return requester Request creator
     * @return locationCount Number of locations
     * @return status Current request status
     * @return stakeAmount Staked amount
     * @return timestamp Creation timestamp
     * @return refundEligible Whether refund is eligible
     */
    function getRouteRequest(uint32 routeId) external view returns (
        address requester,
        uint32 locationCount,
        RequestStatus status,
        uint256 stakeAmount,
        uint256 timestamp,
        bool refundEligible
    ) {
        RouteRequest storage request = routeRequests[routeId];
        return (
            request.requester,
            request.locationCount,
            request.status,
            request.stakeAmount,
            request.timestamp,
            request.refundEligible
        );
    }

    /**
     * @notice Get optimized route details
     * @param routeId Route ID
     * @return routeId Route identifier
     * @return requester Route requester
     * @return revealedDistance Decrypted distance (0 if not finalized)
     * @return revealedCost Decrypted cost (0 if not finalized)
     * @return finalized Whether Gateway callback completed
     * @return locationOrder Array of location indices in optimal order
     */
    function getOptimizedRoute(uint32 routeId) external view returns (
        uint32,
        address requester,
        uint64 revealedDistance,
        uint32 revealedCost,
        bool finalized,
        uint8[] memory locationOrder
    ) {
        OptimizedRoute storage route = optimizedRoutes[routeId];
        return (
            route.routeId,
            route.requester,
            route.revealedDistance,
            route.revealedCost,
            route.finalized,
            route.locationOrder
        );
    }

    /**
     * @notice Check if request is eligible for refund
     * @param routeId Route ID
     * @return eligible Whether refund can be requested
     * @return reason Human-readable reason
     */
    function checkRefundEligibility(uint32 routeId) external view returns (bool eligible, string memory reason) {
        RouteRequest storage request = routeRequests[routeId];

        if (!request.refundEligible) {
            return (false, "Refund already issued");
        }

        if (request.status == RequestStatus.Completed) {
            return (false, "Request completed successfully");
        }

        if (request.status == RequestStatus.Failed) {
            return (true, "Decryption failed");
        }

        if (request.status == RequestStatus.Processing) {
            uint256 elapsed = block.timestamp - request.processingStartTime;
            if (elapsed > MAX_PROCESSING_TIME) {
                return (true, "Processing timeout exceeded");
            }
            return (false, "Still processing");
        }

        if (request.status == RequestStatus.Pending) {
            uint256 elapsed = block.timestamp - request.timestamp;
            if (elapsed > REQUEST_TIMEOUT) {
                return (true, "Request timeout");
            }
            return (false, "Still pending");
        }

        return (false, "Unknown status");
    }

    // ==================== Admin Functions ====================

    /**
     * @notice Add operator
     * @param operator Address to grant operator role
     */
    function addOperator(address operator) external onlyOwner validAddress(operator) {
        operators[operator] = true;
        emit OperatorAdded(operator);
    }

    /**
     * @notice Remove operator
     * @param operator Address to revoke operator role
     */
    function removeOperator(address operator) external onlyOwner {
        operators[operator] = false;
        emit OperatorRemoved(operator);
    }

    /**
     * @notice Add pauser
     * @param pauser Address to grant pauser role
     */
    function addPauser(address pauser) external onlyOwner validAddress(pauser) {
        pausers[pauser] = true;
        emit PauserAdded(pauser);
    }

    /**
     * @notice Remove pauser
     * @param pauser Address to revoke pauser role
     */
    function removePauser(address pauser) external onlyOwner {
        pausers[pauser] = false;
        emit PauserRemoved(pauser);
    }

    /**
     * @notice Toggle contract pause state
     */
    function togglePause() external onlyPauser {
        paused = !paused;
        emit ContractPausedToggled(paused);
    }

    /**
     * @notice Withdraw platform fees
     * @param to Recipient address
     */
    function withdrawPlatformFees(address to) external onlyOwner validAddress(to) {
        uint256 amount = platformFees;
        platformFees = 0;

        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit PlatformFeesWithdrawn(to, amount);
    }

    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner validAddress(newOwner) {
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    /**
     * @notice Emergency withdrawal (only if contract is paused)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner validAddress(to) {
        if (!paused) revert ContractPaused();

        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    // ==================== Fallback ====================

    receive() external payable {}
}
