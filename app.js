// Logistics Route Optimizer DApp
class LogisticsRouteOptimizer {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.contractAddress = '0xE235A5C0DbF47ba76db3912c80267F9B43B8d1a8';

        // Contract ABI
        this.contractABI = [
            "function requestRouteOptimization(uint32[] memory xCoords, uint32[] memory yCoords, uint8[] memory priorities, uint32 maxDistance, uint8 vehicleCapacity) external returns (uint32 routeId)",
            "function processRouteOptimization(uint32 routeId) external",
            "function getOptimizedRoute(uint32 routeId) external view returns (bytes32 totalDistanceEncrypted, bytes32 estimatedTimeEncrypted, uint8[] memory locationOrder, uint256 createdAt)",
            "function markDeliveryCompleted(uint32 routeId, uint8 locationIndex) external",
            "function getUserRoutes(address user) external view returns (uint32[] memory)",
            "function getRouteRequest(uint32 routeId) external view returns (address requester, uint32 locationCount, bool processed, uint256 timestamp)",
            "function owner() external view returns (address)",
            "function routeCounter() external view returns (uint32)",
            "event RouteRequested(uint32 indexed routeId, address indexed requester, uint32 locationCount)",
            "event RouteOptimized(uint32 indexed routeId, address indexed requester, uint32 totalDistance)",
            "event DeliveryCompleted(uint32 indexed routeId, uint8 locationIndex)"
        ];

        this.init();
    }

    async init() {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            this.provider = new ethers.BrowserProvider(window.ethereum);

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.connectWallet();
                }
            });

            // Listen for chain changes
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        } else {
            this.showAlert('MetaMask is not installed. Please install MetaMask to use this application.', 'warning');
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Route form submission
        document.getElementById('routeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.requestRouteOptimization();
        });

        // Contract address input
        document.getElementById('contractAddress').addEventListener('input', (e) => {
            this.contractAddress = e.target.value;
            if (this.contractAddress && this.signer) {
                this.initContract();
            }
        });
    }

    async connectWallet() {
        try {
            if (!this.provider) {
                throw new Error('MetaMask not detected');
            }

            // Request account access
            const accounts = await this.provider.send("eth_requestAccounts", []);
            this.signer = await this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();

            // Update UI
            this.updateConnectionStatus(true);
            document.getElementById('walletAddress').textContent =
                `${this.userAddress.substring(0, 6)}...${this.userAddress.substring(38)}`;
            document.getElementById('walletInfo').style.display = 'block';

            // Initialize contract if address is provided
            if (this.contractAddress) {
                await this.initContract();
            }

            this.showAlert('Wallet connected successfully!', 'success');

        } catch (error) {
            console.error('Connection error:', error);
            this.showAlert(`Failed to connect wallet: ${error.message}`, 'danger');
        }
    }

    disconnect() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;

        this.updateConnectionStatus(false);
        document.getElementById('walletInfo').style.display = 'none';
        document.getElementById('adminSection').style.display = 'none';
    }

    async initContract() {
        try {
            if (!this.signer || !this.contractAddress) {
                return;
            }

            this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);

            // Check if user is owner
            try {
                const owner = await this.contract.owner();
                if (owner.toLowerCase() === this.userAddress.toLowerCase()) {
                    document.getElementById('adminSection').style.display = 'block';
                }
            } catch (error) {
                console.log('Could not check owner status:', error.message);
            }

            this.showAlert('Contract connected successfully!', 'success');

        } catch (error) {
            console.error('Contract initialization error:', error);
            this.showAlert(`Failed to connect to contract: ${error.message}`, 'danger');
        }
    }

    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connectionStatus');
        const indicator = statusEl.querySelector('.status-indicator');

        if (connected) {
            indicator.className = 'status-indicator status-completed';
            statusEl.innerHTML = '<span class="status-indicator status-completed"></span>Connected';
        } else {
            indicator.className = 'status-indicator status-pending';
            statusEl.innerHTML = '<span class="status-indicator status-pending"></span>Disconnected';
        }
    }

    addLocation() {
        const container = document.getElementById('locationsContainer');
        const locationDiv = document.createElement('div');
        locationDiv.className = 'location-input-group';
        locationDiv.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <input type="number" class="form-control" name="xCoord"
                           placeholder="X Coordinate">
                </div>
                <div class="col-md-4">
                    <input type="number" class="form-control" name="yCoord"
                           placeholder="Y Coordinate">
                </div>
                <div class="col-md-3">
                    <input type="number" class="form-control" name="priority"
                           placeholder="Priority (1-10)" min="1" max="10">
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-outline-danger btn-sm"
                            onclick="app.removeLocation(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(locationDiv);
    }

    removeLocation(button) {
        const container = document.getElementById('locationsContainer');
        if (container.children.length > 1) {
            button.closest('.location-input-group').remove();
        } else {
            this.showAlert('At least one location is required', 'warning');
        }
    }

    async requestRouteOptimization() {
        try {
            if (!this.contract) {
                throw new Error('Contract not connected');
            }

            const submitBtn = document.querySelector('#routeForm button[type="submit"]');
            const loading = document.getElementById('submitLoading');

            submitBtn.disabled = true;
            loading.classList.add('show');

            // Collect form data
            const vehicleCapacity = parseInt(document.getElementById('vehicleCapacity').value);
            const maxDistance = parseInt(document.getElementById('maxDistance').value);

            if (vehicleCapacity < 1 || vehicleCapacity > 255) {
                throw new Error('Vehicle capacity must be between 1 and 255');
            }

            // Collect locations
            const locationGroups = document.querySelectorAll('.location-input-group');
            const xCoords = [];
            const yCoords = [];
            const priorities = [];

            for (let group of locationGroups) {
                const xCoord = parseInt(group.querySelector('input[name="xCoord"]').value);
                const yCoord = parseInt(group.querySelector('input[name="yCoord"]').value);
                const priority = parseInt(group.querySelector('input[name="priority"]').value);

                if (isNaN(xCoord) || isNaN(yCoord) || isNaN(priority)) {
                    throw new Error('All location fields must be filled with valid numbers');
                }

                if (priority < 1 || priority > 10) {
                    throw new Error('Priority must be between 1 and 10');
                }

                xCoords.push(xCoord);
                yCoords.push(yCoord);
                priorities.push(priority);
            }

            if (xCoords.length === 0) {
                throw new Error('At least one location is required');
            }

            // Send transaction
            const tx = await this.contract.requestRouteOptimization(
                xCoords,
                yCoords,
                priorities,
                maxDistance,
                vehicleCapacity
            );

            this.showAlert('Transaction submitted. Waiting for confirmation...', 'info');

            const receipt = await tx.wait();

            // Find the RouteRequested event
            const routeRequestedEvent = receipt.logs.find(log => {
                try {
                    const parsed = this.contract.interface.parseLog(log);
                    return parsed.name === 'RouteRequested';
                } catch {
                    return false;
                }
            });

            if (routeRequestedEvent) {
                const parsed = this.contract.interface.parseLog(routeRequestedEvent);
                const routeId = parsed.args.routeId.toString();
                this.showAlert(`Route optimization requested successfully! Route ID: ${routeId}`, 'success');

                // Clear form
                document.getElementById('routeForm').reset();

                // Refresh routes
                setTimeout(() => this.loadUserRoutes(), 2000);
            } else {
                this.showAlert('Route optimization requested successfully!', 'success');
            }

        } catch (error) {
            console.error('Request error:', error);
            this.showAlert(`Failed to request route optimization: ${error.message}`, 'danger');
        } finally {
            const submitBtn = document.querySelector('#routeForm button[type="submit"]');
            const loading = document.getElementById('submitLoading');

            submitBtn.disabled = false;
            loading.classList.remove('show');
        }
    }

    async loadUserRoutes() {
        try {
            if (!this.contract || !this.userAddress) {
                throw new Error('Contract or wallet not connected');
            }

            const routeIds = await this.contract.getUserRoutes(this.userAddress);
            const routesList = document.getElementById('routesList');

            if (routeIds.length === 0) {
                routesList.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-route fa-3x mb-3"></i>
                        <p>No routes found. Create your first route optimization request!</p>
                    </div>
                `;
                return;
            }

            let routesHTML = '';

            for (let routeId of routeIds) {
                try {
                    const routeInfo = await this.contract.getRouteRequest(routeId);
                    const isProcessed = routeInfo[2];
                    const timestamp = new Date(Number(routeInfo[3]) * 1000);

                    const statusClass = isProcessed ? 'status-completed' : 'status-pending';
                    const statusText = isProcessed ? 'Processed' : 'Pending';

                    routesHTML += `
                        <div class="card mb-2">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>Route #${routeId}</strong>
                                        <span class="status-indicator ${statusClass}"></span>
                                        <span class="badge bg-secondary">${statusText}</span>
                                    </div>
                                    <div class="text-end">
                                        <small class="text-muted">${timestamp.toLocaleDateString()}</small>
                                        ${isProcessed ?
                                            `<button class="btn btn-sm btn-outline-primary ms-2"
                                                     onclick="app.viewRouteDetails(${routeId})">
                                                <i class="fas fa-eye"></i> View
                                             </button>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error(`Error loading route ${routeId}:`, error);
                }
            }

            routesList.innerHTML = routesHTML;

        } catch (error) {
            console.error('Load routes error:', error);
            this.showAlert(`Failed to load routes: ${error.message}`, 'danger');
        }
    }

    async viewRouteDetails(routeId) {
        try {
            if (!this.contract) {
                throw new Error('Contract not connected');
            }

            const routeData = await this.contract.getOptimizedRoute(routeId);

            // Display route details
            const section = document.getElementById('routeDetailsSection');
            section.style.display = 'block';

            // Note: In a real implementation with FHEVM, you would decrypt these values
            // For demo purposes, we show encrypted hashes
            document.getElementById('routeDistance').textContent = 'Encrypted';
            document.getElementById('estimatedTime').textContent = 'Encrypted';

            // Display location order
            const locationOrder = routeData[2];
            const orderContainer = document.getElementById('locationOrder');
            orderContainer.innerHTML = '';

            locationOrder.forEach((location, index) => {
                const badge = document.createElement('span');
                badge.className = 'badge bg-primary me-1';
                badge.textContent = `${index + 1}. Location ${Number(location)}`;
                orderContainer.appendChild(badge);
            });

            // Simple route visualization
            const visualization = document.getElementById('routeVisualization');
            visualization.innerHTML = `
                <div class="text-center">
                    <h6>Route Order Visualization</h6>
                    <div class="d-flex justify-content-center align-items-center flex-wrap">
                        ${locationOrder.map((loc, idx) =>
                            `<div class="badge bg-secondary m-1 p-2">
                                <i class="fas fa-map-marker-alt"></i> ${Number(loc)}
                            </div>
                            ${idx < locationOrder.length - 1 ? '<i class="fas fa-arrow-right text-muted mx-1"></i>' : ''}`
                        ).join('')}
                    </div>
                    <p class="text-muted mt-3">
                        <i class="fas fa-info-circle"></i>
                        Route optimized with confidential computation
                    </p>
                </div>
            `;

            // Scroll to details
            section.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('View route details error:', error);
            this.showAlert(`Failed to load route details: ${error.message}`, 'danger');
        }
    }

    async processRoute() {
        try {
            if (!this.contract) {
                throw new Error('Contract not connected');
            }

            const routeId = parseInt(document.getElementById('adminRouteId').value);
            if (isNaN(routeId)) {
                throw new Error('Please enter a valid route ID');
            }

            const tx = await this.contract.processRouteOptimization(routeId);
            this.showAlert('Processing route optimization. Please wait for confirmation...', 'info');

            await tx.wait();
            this.showAlert(`Route ${routeId} processed successfully!`, 'success');

            // Clear input
            document.getElementById('adminRouteId').value = '';

        } catch (error) {
            console.error('Process route error:', error);
            this.showAlert(`Failed to process route: ${error.message}`, 'danger');
        }
    }

    showAlert(message, type) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

// Global functions for onclick handlers
function connectWallet() {
    app.connectWallet();
}

function addLocation() {
    app.addLocation();
}

function removeLocation(button) {
    app.removeLocation(button);
}

function loadUserRoutes() {
    app.loadUserRoutes();
}

function processRoute() {
    app.processRoute();
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new LogisticsRouteOptimizer();
});