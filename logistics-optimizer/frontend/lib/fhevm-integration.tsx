/**
 * FHEVM SDK Integration for Logistics Route Optimizer
 *
 * This file demonstrates how to use the Universal FHEVM SDK
 * in a real production application.
 */

'use client';

import React, { useState } from 'react';
import { useEncrypt, useDecrypt, useContract, useFhevm } from '@zama/fhevm-sdk/react';
import { ethers } from 'ethers';

// Contract ABI (minimal for demo)
const CONTRACT_ABI = [
  'function submitRoute(bytes calldata encStartX, bytes calldata encStartY, bytes calldata encEndX, bytes calldata encEndY, bytes calldata encPriority) external',
  'function processRoute(uint256 routeId) external',
  'function getUserRoute(address user, uint256 index) external view returns (tuple)',
  'function getUserRouteCount(address user) external view returns (uint256)',
  'function isRouteProcessed(uint256 routeId) external view returns (bool)',
];

const CONTRACT_ADDRESS = '0xE235A5C0DbF47ba76db3912c80267F9B43B8d1a8'; // Sepolia

/**
 * Route Submission Component
 * Demonstrates SDK encryption integration
 */
export function RouteSubmissionForm() {
  const { isReady, error: fhevmError } = useFhevm();
  const { encrypt32, encrypt8, isEncrypting, error: encryptError } = useEncrypt();
  const [formData, setFormData] = useState({
    startX: 100,
    startY: 200,
    endX: 500,
    endY: 800,
    priority: 4,
  });
  const [submitStatus, setSubmitStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isReady) {
      setSubmitStatus('❌ FHEVM SDK not ready. Please wait...');
      return;
    }

    try {
      setSubmitStatus('🔐 Encrypting route data...');

      // Step 1: Encrypt all route coordinates using SDK
      const encStartX = await encrypt32(formData.startX);
      const encStartY = await encrypt32(formData.startY);
      const encEndX = await encrypt32(formData.endX);
      const encEndY = await encrypt32(formData.endY);
      const encPriority = await encrypt8(formData.priority);

      setSubmitStatus('📤 Submitting encrypted route to contract...');

      // Step 2: Get contract instance
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Step 3: Submit encrypted data to contract
      const tx = await contract.submitRoute(
        encStartX,
        encStartY,
        encEndX,
        encEndY,
        encPriority
      );

      setSubmitStatus('⏳ Waiting for transaction confirmation...');

      await tx.wait();

      setSubmitStatus('✅ Route submitted successfully!');

    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmitStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-bold mb-4">Submit Encrypted Route</h2>

      {fhevmError && (
        <div className="alert alert-error mb-4">
          FHEVM Error: {fhevmError.message}
        </div>
      )}

      {encryptError && (
        <div className="alert alert-error mb-4">
          Encryption Error: {encryptError.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start X:</label>
            <input
              type="number"
              value={formData.startX}
              onChange={(e) => setFormData({ ...formData, startX: Number(e.target.value) })}
              className="input-field"
              disabled={isEncrypting}
            />
          </div>
          <div>
            <label className="label">Start Y:</label>
            <input
              type="number"
              value={formData.startY}
              onChange={(e) => setFormData({ ...formData, startY: Number(e.target.value) })}
              className="input-field"
              disabled={isEncrypting}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">End X:</label>
            <input
              type="number"
              value={formData.endX}
              onChange={(e) => setFormData({ ...formData, endX: Number(e.target.value) })}
              className="input-field"
              disabled={isEncrypting}
            />
          </div>
          <div>
            <label className="label">End Y:</label>
            <input
              type="number"
              value={formData.endY}
              onChange={(e) => setFormData({ ...formData, endY: Number(e.target.value) })}
              className="input-field"
              disabled={isEncrypting}
            />
          </div>
        </div>

        <div>
          <label className="label">Priority (1-5):</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
            className="input-field"
            disabled={isEncrypting}
          >
            <option value={1}>1 - Low</option>
            <option value={2}>2 - Below Normal</option>
            <option value={3}>3 - Normal</option>
            <option value={4}>4 - High</option>
            <option value={5}>5 - Critical</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!isReady || isEncrypting}
          className="btn-primary w-full"
        >
          {isEncrypting ? '🔐 Encrypting...' : '🚀 Submit Encrypted Route'}
        </button>

        {submitStatus && (
          <div className="p-4 rounded-lg bg-gray-800 text-sm">
            {submitStatus}
          </div>
        )}
      </form>

      <div className="mt-6 p-4 border border-accent/20 rounded-lg">
        <h3 className="font-semibold mb-2">🔐 Privacy Protected:</h3>
        <ul className="text-sm space-y-1 opacity-80">
          <li>✅ Coordinates encrypted client-side</li>
          <li>✅ Data remains private on-chain</li>
          <li>✅ Only you can decrypt your routes</li>
          <li>✅ Manhattan distance calculated on encrypted data</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Route Results Component
 * Demonstrates SDK decryption integration
 */
export function RouteResults({ userAddress }: { userAddress: string }) {
  const { decrypt64, isDecrypting } = useDecrypt();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [decryptedData, setDecryptedData] = useState<Map<number, any>>(new Map());

  const loadUserRoutes = async () => {
    try {
      setLoadingRoutes(true);

      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Get route count
      const count = await contract.getUserRouteCount(userAddress);
      const routeCount = Number(count);

      // Load all routes
      const loadedRoutes = [];
      for (let i = 0; i < routeCount; i++) {
        const route = await contract.getUserRoute(userAddress, i);
        loadedRoutes.push({ index: i, data: route });
      }

      setRoutes(loadedRoutes);
    } catch (err: any) {
      console.error('Load routes error:', err);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const decryptRoute = async (routeIndex: number, route: any) => {
    try {
      // Decrypt distance using SDK
      const distance = await decrypt64(
        CONTRACT_ADDRESS,
        route.encOptimizedDistance
      );

      // Decrypt estimated time
      const estimatedTime = await decrypt64(
        CONTRACT_ADDRESS,
        route.encEstimatedTime
      );

      // Store decrypted data
      setDecryptedData(new Map(decryptedData.set(routeIndex, {
        distance,
        estimatedTime,
      })));

    } catch (err: any) {
      console.error('Decryption error:', err);
    }
  };

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-bold mb-4">My Routes</h2>

      <button
        onClick={loadUserRoutes}
        disabled={loadingRoutes}
        className="btn-secondary mb-4"
      >
        {loadingRoutes ? '⏳ Loading...' : '🔄 Load My Routes'}
      </button>

      <div className="space-y-4">
        {routes.length === 0 ? (
          <p className="text-center opacity-60">No routes found. Submit a route first!</p>
        ) : (
          routes.map((route) => {
            const decrypted = decryptedData.get(route.index);

            return (
              <div key={route.index} className="border border-accent/20 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">Route #{route.index + 1}</h3>
                    <p className="text-sm opacity-60">
                      Status: {route.data.processed ? '✅ Processed' : '⏳ Pending'}
                    </p>
                  </div>

                  {!decrypted && (
                    <button
                      onClick={() => decryptRoute(route.index, route.data)}
                      disabled={isDecrypting}
                      className="btn-primary btn-sm"
                    >
                      {isDecrypting ? '🔓 Decrypting...' : '🔓 Decrypt Results'}
                    </button>
                  )}
                </div>

                {decrypted && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-accent/10 rounded">
                    <div>
                      <p className="text-sm opacity-60">Distance:</p>
                      <p className="font-mono font-semibold">
                        {decrypted.distance.toString()} units
                      </p>
                    </div>
                    <div>
                      <p className="text-sm opacity-60">Estimated Time:</p>
                      <p className="font-mono font-semibold">
                        {decrypted.estimatedTime.toString()} seconds
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs opacity-60">
                  <p>🔐 Encrypted data stored on Sepolia</p>
                  <p className="font-mono mt-1">
                    <a
                      href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      View on Etherscan ↗
                    </a>
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Complete Page Component with Provider
 */
export function LogisticsOptimizerApp() {
  const [userAddress, setUserAddress] = useState<string>('');

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);
    } catch (err: any) {
      console.error('Connect wallet error:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          🚚 Logistics Route Optimizer
        </h1>
        <p className="text-lg opacity-80">
          Privacy-preserving route optimization using Universal FHEVM SDK
        </p>

        {!userAddress ? (
          <button onClick={connectWallet} className="btn-primary mt-6">
            🔌 Connect Wallet
          </button>
        ) : (
          <div className="mt-4">
            <p className="text-sm opacity-60">Connected:</p>
            <p className="font-mono text-accent">{userAddress}</p>
          </div>
        )}
      </header>

      {userAddress && (
        <div className="grid md:grid-cols-2 gap-8">
          <RouteSubmissionForm />
          <RouteResults userAddress={userAddress} />
        </div>
      )}

      <footer className="mt-12 text-center text-sm opacity-60">
        <p>Powered by Universal FHEVM SDK</p>
        <p className="mt-2">
          Contract: <span className="font-mono">{CONTRACT_ADDRESS}</span>
        </p>
      </footer>
    </div>
  );
}
