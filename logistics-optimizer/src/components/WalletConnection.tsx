import React, { useState } from 'react';
import { ethers } from 'ethers';

interface WalletConnectionProps {
  onConnect: (address: string, signer: ethers.Signer) => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ onConnect }) => {
  const [address, setAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError('');

      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      setAddress(userAddress);
      onConnect(userAddress, signer);
    } catch (err: any) {
      setError(err.message);
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  if (address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className="status-indicator status-completed"></span>
        <span style={{ fontSize: '0.9rem' }}>
          {address.substring(0, 6)}...{address.substring(38)}
        </span>
      </div>
    );
  }

  return (
    <div>
      <button
        className="btn btn-primary"
        onClick={connectWallet}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <span className="loading-spinner"></span>
            Connecting...
          </>
        ) : (
          <>
            <span>💼</span>
            Connect Wallet
          </>
        )}
      </button>
      {error && (
        <div className="alert alert-danger" style={{ marginTop: '10px' }}>
          {error}
        </div>
      )}
    </div>
  );
};
