import React, { useState, useEffect } from 'react';
import { useFhevm, useEncrypt, useDecrypt } from '@zama/fhevm-sdk/react';
import { ethers } from 'ethers';
import { WalletConnection } from './WalletConnection';
import { RouteRequestForm } from './RouteRequestForm';
import { RouteList } from './RouteList';
import { RouteDetails } from './RouteDetails';

const CONTRACT_ADDRESS = '0x1AACA0ce21752dE30E0EB927169084b84d290B87';

const CONTRACT_ABI = [
  'function requestRouteOptimization(uint32[] memory xCoords, uint32[] memory yCoords, uint8[] memory priorities, uint32 maxDistance, uint8 vehicleCapacity) external returns (uint32 routeId)',
  'function processRouteOptimization(uint32 routeId) external',
  'function getOptimizedRoute(uint32 routeId) external view returns (bytes32 totalDistanceEncrypted, bytes32 estimatedTimeEncrypted, uint8[] memory locationOrder, uint256 createdAt)',
  'function markDeliveryCompleted(uint32 routeId, uint8 locationIndex) external',
  'function getUserRoutes(address user) external view returns (uint32[] memory)',
  'function getRouteRequest(uint32 routeId) external view returns (address requester, uint32 locationCount, bool processed, uint256 timestamp)',
  'function owner() external view returns (address)',
  'function routeCounter() external view returns (uint32)',
  'event RouteRequested(uint32 indexed routeId, address indexed requester, uint32 locationCount)',
  'event RouteOptimized(uint32 indexed routeId, address indexed requester, uint32 totalDistance)',
  'event DeliveryCompleted(uint32 indexed routeId, uint8 locationIndex)',
];

interface Location {
  x: number;
  y: number;
  priority: number;
}

export interface Route {
  id: number;
  processed: boolean;
  locationCount: number;
  timestamp: Date;
}

export const LogisticsOptimizer: React.FC = () => {
  const { isReady, error: fhevmError } = useFhevm();
  const { encrypt32, encrypt8, isEncrypting, error: encryptError } = useEncrypt();
  const { decrypt64, isDecrypting } = useDecrypt();

  const [walletAddress, setWalletAddress] = useState<string>('');
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [bgGradient, setBgGradient] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');

  const handleConnect = async (address: string, signer: ethers.Signer) => {
    setWalletAddress(address);

    // Initialize contract
    const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    setContract(contractInstance);

    // Check if user is owner
    try {
      const owner = await contractInstance.owner();
      setIsOwner(owner.toLowerCase() === address.toLowerCase());
    } catch (error) {
      console.error('Error checking owner:', error);
    }
  };

  const loadUserRoutes = async () => {
    if (!contract || !walletAddress) return;

    try {
      const routeIds = await contract.getUserRoutes(walletAddress);
      const loadedRoutes: Route[] = [];

      for (const routeId of routeIds) {
        const routeInfo = await contract.getRouteRequest(routeId);
        loadedRoutes.push({
          id: Number(routeId),
          processed: routeInfo[2],
          locationCount: Number(routeInfo[1]),
          timestamp: new Date(Number(routeInfo[3]) * 1000),
        });
      }

      setRoutes(loadedRoutes);
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  };

  const handleRouteRequest = async (
    locations: Location[],
    vehicleCapacity: number,
    maxDistance: number
  ) => {
    if (!contract || !isReady) {
      throw new Error('Contract or FHEVM not ready');
    }

    // Extract coordinates and priorities
    const xCoords = locations.map((loc) => loc.x);
    const yCoords = locations.map((loc) => loc.y);
    const priorities = locations.map((loc) => loc.priority);

    // Submit transaction (no encryption needed for this demo)
    const tx = await contract.requestRouteOptimization(
      xCoords,
      yCoords,
      priorities,
      maxDistance,
      vehicleCapacity
    );

    const receipt = await tx.wait();

    // Find the RouteRequested event
    const routeRequestedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'RouteRequested';
      } catch {
        return false;
      }
    });

    if (routeRequestedEvent) {
      const parsed = contract.interface.parseLog(routeRequestedEvent);
      return Number(parsed?.args.routeId);
    }

    return null;
  };

  const handleProcessRoute = async (routeId: number) => {
    if (!contract) throw new Error('Contract not connected');

    const tx = await contract.processRouteOptimization(routeId);
    await tx.wait();
  };

  const generateRandomGradient = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#10AC84', '#EE5A24', '#0ABDE3', '#C44569', '#F8B500',
      '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7',
      '#00B894', '#E17055', '#74B9FF', '#E84393', '#FDCB6E',
    ];

    const color1 = colors[Math.floor(Math.random() * colors.length)];
    let color2 = colors[Math.floor(Math.random() * colors.length)];

    while (color2 === color1) {
      color2 = colors[Math.floor(Math.random() * colors.length)];
    }

    const angle = Math.floor(Math.random() * 360);
    setBgGradient(`linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`);
  };

  useEffect(() => {
    generateRandomGradient();
  }, []);

  useEffect(() => {
    document.body.style.background = bgGradient;
  }, [bgGradient]);

  return (
    <div className="main-container">
      <nav className="navbar-custom">
        <div className="navbar-brand">
          <span>🚚</span>
          <span>Logistics Route Optimizer</span>
        </div>
        <div className="navbar-actions">
          <button
            className="btn btn-outline"
            onClick={generateRandomGradient}
            title="Change Background Color"
          >
            🎨
          </button>
          <WalletConnection onConnect={handleConnect} />
        </div>
      </nav>

      <div style={{ padding: '20px' }}>
        {fhevmError && (
          <div className="alert alert-danger">
            FHEVM Error: {fhevmError.message}
          </div>
        )}

        {encryptError && (
          <div className="alert alert-danger">
            Encryption Error: {encryptError.message}
          </div>
        )}

        {!isReady && (
          <div className="alert alert-warning">
            ⏳ Initializing FHEVM SDK...
          </div>
        )}

        {walletAddress && (
          <div className="grid grid-cols-2">
            <RouteRequestForm
              onSubmit={handleRouteRequest}
              onSuccess={loadUserRoutes}
              isReady={isReady}
              isEncrypting={isEncrypting}
            />

            <RouteList
              routes={routes}
              onRefresh={loadUserRoutes}
              onSelectRoute={setSelectedRouteId}
              isOwner={isOwner}
              onProcessRoute={handleProcessRoute}
            />
          </div>
        )}

        {selectedRouteId !== null && contract && (
          <RouteDetails
            routeId={selectedRouteId}
            contract={contract}
            decrypt64={decrypt64}
            isDecrypting={isDecrypting}
          />
        )}
      </div>
    </div>
  );
};
