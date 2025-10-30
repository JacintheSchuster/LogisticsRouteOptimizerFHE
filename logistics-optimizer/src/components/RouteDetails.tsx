import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface RouteDetailsProps {
  routeId: number;
  contract: ethers.Contract;
  decrypt64: (contractAddress: string, encryptedValue: any) => Promise<bigint>;
  isDecrypting: boolean;
}

export const RouteDetails: React.FC<RouteDetailsProps> = ({
  routeId,
  contract,
  decrypt64,
  isDecrypting,
}) => {
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [decryptedDistance, setDecryptedDistance] = useState<string | null>(null);
  const [decryptedTime, setDecryptedTime] = useState<string | null>(null);

  useEffect(() => {
    loadRouteDetails();
  }, [routeId]);

  const loadRouteDetails = async () => {
    try {
      setLoading(true);
      const data = await contract.getOptimizedRoute(routeId);
      setRouteData(data);
    } catch (error) {
      console.error('Error loading route details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!routeData) return;

    try {
      // In a real FHEVM implementation, you would decrypt these values
      // For now, we show that they are encrypted
      setDecryptedDistance('Encrypted (Demo)');
      setDecryptedTime('Encrypted (Demo)');
    } catch (error) {
      console.error('Decryption error:', error);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '15px' }}>Loading route details...</p>
        </div>
      </div>
    );
  }

  if (!routeData) {
    return null;
  }

  const locationOrder = routeData[2] || [];

  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <div className="card-header">
        <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>ℹ️</span>
          Route Details - #{routeId}
        </h5>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-2" style={{ marginBottom: '20px' }}>
          <div className="metric-card">
            <div className="metric-value">
              {decryptedDistance || 'Encrypted'}
            </div>
            <div className="metric-label">Total Distance</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">
              {decryptedTime || 'Encrypted'}
            </div>
            <div className="metric-label">Estimated Time</div>
          </div>
        </div>

        {!decryptedDistance && (
          <button
            className="btn btn-primary"
            onClick={handleDecrypt}
            disabled={isDecrypting}
            style={{ width: '100%', marginBottom: '20px' }}
          >
            {isDecrypting ? (
              <>
                <span className="loading-spinner"></span>
                Decrypting...
              </>
            ) : (
              <>
                <span>🔓</span>
                Decrypt Results
              </>
            )}
          </button>
        )}

        <div className="route-visualization">
          <h6 style={{ marginBottom: '15px' }}>Route Order Visualization</h6>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {locationOrder.map((loc: any, idx: number) => (
              <React.Fragment key={idx}>
                <div
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                  }}
                >
                  📍 Location {Number(loc)}
                </div>
                {idx < locationOrder.length - 1 && (
                  <span style={{ color: '#6c757d', fontSize: '1.2rem' }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <p style={{ marginTop: '20px', color: '#6c757d', fontSize: '0.9rem' }}>
            ℹ️ Route optimized with confidential computation
          </p>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h6>Location Order:</h6>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {locationOrder.map((loc: any, idx: number) => (
              <span
                key={idx}
                style={{
                  background: 'var(--secondary-color)',
                  color: 'white',
                  padding: '5px 12px',
                  borderRadius: '15px',
                  fontSize: '0.85rem',
                }}
              >
                {idx + 1}. Location {Number(loc)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
