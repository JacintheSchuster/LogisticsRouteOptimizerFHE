'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { useState, useEffect } from 'react';
import { Loader2, Package, Route, TrendingUp, Clock, CheckCircle2, AlertCircle, Lock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as Toast from '@radix-ui/react-toast';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [xCoord, setXCoord] = useState('100');
  const [yCoord, setYCoord] = useState('200');
  const [priority, setPriority] = useState('5');
  const [maxDistance, setMaxDistance] = useState('1000');
  const [vehicleCapacity, setVehicleCapacity] = useState('15');
  const [userRoutes, setUserRoutes] = useState<bigint[]>([]);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Read contract data
  const { data: routeCounter } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'routeCounter',
  });

  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  });

  const { data: paused } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'paused',
  });

  const { data: routes, refetch: refetchRoutes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserRoutes',
    args: address ? [address] : undefined,
  });

  // Write contract
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (routes) {
      setUserRoutes(routes as bigint[]);
    }
  }, [routes]);

  useEffect(() => {
    if (isSuccess && hash) {
      const newTx = {
        hash,
        type: 'Route Request',
        timestamp: Date.now(),
        status: 'confirmed',
      };
      setTxHistory((prev) => [newTx, ...prev]);
      refetchRoutes();
      showToast('Route optimization requested successfully!', 'success');
    }
  }, [isSuccess, hash, refetchRoutes]);

  useEffect(() => {
    if (error) {
      showToast(error.message || 'Transaction failed', 'error');
    }
  }, [error]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      showToast('Please connect your wallet first', 'error');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'requestRouteOptimization',
        args: [
          BigInt(xCoord),
          BigInt(yCoord),
          BigInt(priority),
          BigInt(maxDistance),
          BigInt(vehicleCapacity),
        ],
      });
      showToast('Transaction sent! Please confirm in your wallet.', 'info');
    } catch (err: any) {
      console.error('Error:', err);
      showToast(err.message || 'Failed to send transaction', 'error');
    }
  };

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  return (
    <Toast.Provider swipeDirection="right">
      <div className="min-h-screen">
        {/* Header */}
        <header className="glass-panel sticky top-0 z-50 border-b">
          <div className="container mx-auto px-4 lg:px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-soft rounded-lg border border-accent-border">
                  <Package className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-color-text">
                    Logistics Route Optimizer
                  </h1>
                  <p className="text-xs lg:text-sm text-color-text-dim hidden sm:block">
                    Privacy-Preserving FHE Route Optimization
                  </p>
                </div>
              </div>
              <ConnectButton />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 lg:px-6 py-6 lg:py-8" style={{ maxWidth: '1200px' }}>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="stat-card">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent-soft rounded-full border border-accent-border">
                  <Route className="w-5 h-5 lg:w-6 lg:h-6 text-accent" />
                </div>
                <div>
                  <p className="stat-label">Total Routes</p>
                  <p className="stat-value">{routeCounter?.toString() || '0'}</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success-soft rounded-full border border-[rgba(43,195,123,0.28)]">
                  <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-success" />
                </div>
                <div>
                  <p className="stat-label">Your Routes</p>
                  <p className="stat-value">{userRoutes?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="stat-card sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full border ${
                  paused
                    ? 'bg-error-soft border-[rgba(239,83,80,0.28)]'
                    : 'bg-success-soft border-[rgba(43,195,123,0.28)]'
                }`}>
                  <Clock className={`w-5 h-5 lg:w-6 lg:h-6 ${paused ? 'text-error' : 'text-success'}`} />
                </div>
                <div>
                  <p className="stat-label">Contract Status</p>
                  <p className={`stat-value ${paused ? 'text-error' : 'text-success'}`}>
                    {paused ? 'Paused' : 'Active'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Request Form */}
            <div className="glass-panel p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-5">
                <Lock className="w-5 h-5 text-accent" />
                <h2 className="text-lg lg:text-xl font-bold text-color-text">
                  Request Route Optimization
                </h2>
              </div>

              {!isConnected ? (
                <div className="text-center py-8 lg:py-12">
                  <div className="p-4 bg-accent-soft rounded-full border border-accent-border w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Package className="w-10 h-10 text-accent" />
                  </div>
                  <p className="text-color-text-dim mb-6 text-sm lg:text-base">
                    Connect your wallet to request encrypted route optimization
                  </p>
                  <ConnectButton />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">X Coordinate</label>
                      <input
                        type="number"
                        value={xCoord}
                        onChange={(e) => setXCoord(e.target.value)}
                        className="form-input"
                        placeholder="Enter X coordinate"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Y Coordinate</label>
                      <input
                        type="number"
                        value={yCoord}
                        onChange={(e) => setYCoord(e.target.value)}
                        className="form-input"
                        placeholder="Enter Y coordinate"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Priority Level (0-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="form-input"
                      placeholder="Route priority"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Max Distance</label>
                    <input
                      type="number"
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(e.target.value)}
                      className="form-input"
                      placeholder="Maximum travel distance"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Vehicle Capacity (1-255)</label>
                    <input
                      type="number"
                      min="1"
                      max="255"
                      value={vehicleCapacity}
                      onChange={(e) => setVehicleCapacity(e.target.value)}
                      className="form-input"
                      placeholder="Vehicle load capacity"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isPending || isConfirming || paused}
                      className="btn btn-primary w-full"
                    >
                      {isPending || isConfirming ? (
                        <>
                          <Loader2 className="w-5 h-5 spinner" />
                          {isConfirming ? 'Confirming...' : 'Submitting...'}
                        </>
                      ) : (
                        <>
                          <Route className="w-5 h-5" />
                          Request Optimization
                        </>
                      )}
                    </button>
                    {paused && (
                      <p className="text-xs text-error text-center mt-2">
                        Contract is paused. Please wait for it to be unpaused.
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <div className="badge badge-primary">
                      <Lock className="w-3 h-3" />
                      Encrypted with FHE
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Routes & Transaction History */}
            <div className="space-y-6">
              {/* User Routes */}
              <div className="glass-panel p-5 lg:p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg lg:text-xl font-bold text-color-text">
                    Your Routes
                  </h2>
                  <span className="badge badge-success">{userRoutes.length}</span>
                </div>

                {!isConnected ? (
                  <p className="text-color-text-dim text-center py-8 text-sm">
                    Connect wallet to view routes
                  </p>
                ) : userRoutes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-3 bg-color-panel-alt rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <Route className="w-8 h-8 text-color-text-dim" />
                    </div>
                    <p className="text-color-text-dim text-sm">
                      No routes yet. Request your first optimization!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {userRoutes.map((routeId) => (
                      <RouteItem key={routeId.toString()} routeId={routeId} />
                    ))}
                  </div>
                )}
              </div>

              {/* Transaction History */}
              <div className="glass-panel p-5 lg:p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg lg:text-xl font-bold text-color-text">
                    Transaction History
                  </h2>
                  <span className="badge badge-primary">{txHistory.length}</span>
                </div>

                {txHistory.length === 0 ? (
                  <p className="text-color-text-dim text-center py-8 text-sm">
                    No transactions yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {txHistory.map((tx, index) => (
                      <div
                        key={index}
                        className="p-3 bg-color-panel-alt rounded-lg border border-color-border hover:border-color-border-strong transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <span className="text-sm font-semibold text-color-text">
                              {tx.type}
                            </span>
                          </div>
                          <span className="text-xs text-color-text-dim">
                            {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="address text-xs hover:underline flex items-center gap-1"
                        >
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contract Info */}
          <div className="mt-6 lg:mt-8 glass-panel p-5 lg:p-6">
            <h3 className="text-base lg:text-lg font-bold mb-4 text-color-text">
              Contract Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-color-text-dim text-xs uppercase tracking-wider">Contract Address</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="address block mt-1 hover:underline flex items-center gap-1"
                >
                  {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <span className="text-color-text-dim text-xs uppercase tracking-wider">Network</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="badge badge-primary">Sepolia</span>
                </div>
              </div>
              <div>
                <span className="text-color-text-dim text-xs uppercase tracking-wider">Owner</span>
                <span className="address block mt-1 text-xs">
                  {owner?.slice(0, 10)}...{owner?.slice(-8)}
                </span>
              </div>
              {isOwner && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <span className="badge badge-warning">
                    <Lock className="w-3 h-3" />
                    You are the contract owner
                  </span>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="glass-panel border-t mt-8 lg:mt-12">
          <div className="container mx-auto px-4 lg:px-6 py-6 text-center text-xs lg:text-sm text-color-text-dim">
            <p>Privacy-Preserving Logistics Route Optimization with FHEVM</p>
            <p className="mt-2">Powered by Next.js, wagmi, and RainbowKit</p>
          </div>
        </footer>
      </div>

      {/* Toast Notifications */}
      <Toast.Root
        className={`glass-panel p-4 flex items-start gap-3 ${
          toastType === 'success' ? 'border-l-4 border-success' :
          toastType === 'error' ? 'border-l-4 border-error' :
          'border-l-4 border-info'
        }`}
        open={toastOpen}
        onOpenChange={setToastOpen}
      >
        <div>
          {toastType === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : toastType === 'error' ? (
            <AlertCircle className="w-5 h-5 text-error" />
          ) : (
            <AlertCircle className="w-5 h-5 text-info" />
          )}
        </div>
        <div className="flex-1">
          <Toast.Title className={`font-semibold text-sm ${
            toastType === 'success' ? 'text-success' :
            toastType === 'error' ? 'text-error' :
            'text-info'
          }`}>
            {toastType === 'success' ? 'Success' : toastType === 'error' ? 'Error' : 'Info'}
          </Toast.Title>
          <Toast.Description className="text-color-text text-sm mt-1">
            {toastMessage}
          </Toast.Description>
        </div>
      </Toast.Root>
      <Toast.Viewport className="fixed top-4 right-4 flex flex-col gap-2 w-[390px] max-w-[calc(100vw-2rem)] z-[100]" />
    </Toast.Provider>
  );
}

function RouteItem({ routeId }: { routeId: bigint }) {
  const { data: routeData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getRouteRequest',
    args: [Number(routeId)],
  });

  if (!routeData) {
    return (
      <div className="p-3 bg-color-panel-alt rounded-lg border border-color-border animate-pulse">
        <div className="h-4 bg-color-border rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-color-border rounded w-1/2"></div>
      </div>
    );
  }

  const [requester, locationCount, processed, timestamp] = routeData;
  const date = new Date(Number(timestamp) * 1000);

  return (
    <div className="p-3 bg-color-panel-alt rounded-lg border border-color-border hover:border-color-border-strong transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-color-text text-sm">
            Route #{routeId.toString()}
          </span>
          <span className={`badge ${processed ? 'badge-success' : 'badge-warning'}`}>
            {processed ? 'Processed' : 'Pending'}
          </span>
        </div>
      </div>
      <p className="text-xs text-color-text-dim">
        {locationCount.toString()} locations • {date.toLocaleDateString()} {date.toLocaleTimeString()}
      </p>
    </div>
  );
}
