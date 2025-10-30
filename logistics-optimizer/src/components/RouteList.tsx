import React, { useState } from 'react';
import type { Route } from './LogisticsOptimizer';

interface RouteListProps {
  routes: Route[];
  onRefresh: () => Promise<void>;
  onSelectRoute: (routeId: number) => void;
  isOwner: boolean;
  onProcessRoute: (routeId: number) => Promise<void>;
}

export const RouteList: React.FC<RouteListProps> = ({
  routes,
  onRefresh,
  onSelectRoute,
  isOwner,
  onProcessRoute,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingRouteId, setProcessingRouteId] = useState<number | null>(null);
  const [adminRouteId, setAdminRouteId] = useState<string>('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleProcessRoute = async () => {
    const routeId = parseInt(adminRouteId);
    if (isNaN(routeId)) return;

    setProcessingRouteId(routeId);
    try {
      await onProcessRoute(routeId);
      setAdminRouteId('');
      await onRefresh();
    } finally {
      setProcessingRouteId(null);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📋</span>
            My Routes
          </h5>
        </div>
        <div className="card-body">
          <button
            className="btn btn-success"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ width: '100%', marginBottom: '15px' }}
          >
            {isRefreshing ? (
              <>
                <span className="loading-spinner"></span>
                Refreshing...
              </>
            ) : (
              <>
                <span>🔄</span>
                Refresh Routes
              </>
            )}
          </button>

          {routes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6c757d' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🚚</div>
              <p>No routes found. Create your first route optimization request!</p>
            </div>
          ) : (
            <div>
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="card"
                  style={{ marginBottom: '10px', cursor: 'pointer' }}
                  onClick={() => onSelectRoute(route.id)}
                >
                  <div className="card-body" style={{ padding: '15px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong>Route #{route.id}</strong>
                        <span
                          className={`status-indicator ${
                            route.processed ? 'status-completed' : 'status-pending'
                          }`}
                          style={{ marginLeft: '10px' }}
                        ></span>
                        <span
                          style={{
                            marginLeft: '5px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            background: route.processed ? '#d4edda' : '#fff3cd',
                            color: route.processed ? '#155724' : '#856404',
                          }}
                        >
                          {route.processed ? 'Processed' : 'Pending'}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#6c757d' }}>
                        <div>{route.timestamp.toLocaleDateString()}</div>
                        <div>{route.locationCount} locations</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div
            className="card-header"
            style={{ background: '#fff3cd', borderBottom: '1px solid #ffeaa7' }}
          >
            <h5
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#856404',
              }}
            >
              <span>⚙️</span>
              Admin Functions
            </h5>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '15px' }}>
              <label className="form-label">Route ID to Process</label>
              <input
                type="number"
                className="form-control"
                value={adminRouteId}
                onChange={(e) => setAdminRouteId(e.target.value)}
                placeholder="Enter route ID"
                disabled={processingRouteId !== null}
              />
            </div>
            <button
              className="btn btn-warning"
              onClick={handleProcessRoute}
              disabled={!adminRouteId || processingRouteId !== null}
              style={{ width: '100%' }}
            >
              {processingRouteId !== null ? (
                <>
                  <span className="loading-spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span>🔧</span>
                  Process Route
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
