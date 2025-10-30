import React, { useState } from 'react';

interface Location {
  x: number;
  y: number;
  priority: number;
}

interface RouteRequestFormProps {
  onSubmit: (
    locations: Location[],
    vehicleCapacity: number,
    maxDistance: number
  ) => Promise<number | null>;
  onSuccess: () => void;
  isReady: boolean;
  isEncrypting: boolean;
}

export const RouteRequestForm: React.FC<RouteRequestFormProps> = ({
  onSubmit,
  onSuccess,
  isReady,
  isEncrypting,
}) => {
  const [vehicleCapacity, setVehicleCapacity] = useState(10);
  const [maxDistance, setMaxDistance] = useState(1000);
  const [locations, setLocations] = useState<Location[]>([
    { x: 0, y: 0, priority: 5 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);

  const addLocation = () => {
    setLocations([...locations, { x: 0, y: 0, priority: 5 }]);
  };

  const removeLocation = (index: number) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    } else {
      setMessage({ text: 'At least one location is required', type: 'warning' });
    }
  };

  const updateLocation = (index: number, field: keyof Location, value: number) => {
    const updated = [...locations];
    updated[index][field] = value;
    setLocations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!isReady) {
      setMessage({ text: 'FHEVM SDK not ready', type: 'warning' });
      return;
    }

    if (vehicleCapacity < 1 || vehicleCapacity > 255) {
      setMessage({ text: 'Vehicle capacity must be between 1 and 255', type: 'danger' });
      return;
    }

    // Validate locations
    for (const loc of locations) {
      if (loc.priority < 1 || loc.priority > 10) {
        setMessage({ text: 'Priority must be between 1 and 10', type: 'danger' });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setMessage({ text: 'Submitting route optimization request...', type: 'info' });

      const routeId = await onSubmit(locations, vehicleCapacity, maxDistance);

      if (routeId !== null) {
        setMessage({
          text: `Route optimization requested successfully! Route ID: ${routeId}`,
          type: 'success',
        });

        // Reset form
        setLocations([{ x: 0, y: 0, priority: 5 }]);
        setVehicleCapacity(10);
        setMaxDistance(1000);

        // Refresh routes after 2 seconds
        setTimeout(onSuccess, 2000);
      }
    } catch (error: any) {
      setMessage({ text: `Error: ${error.message}`, type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🗺️</span>
          Request Route Optimization
        </h5>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label className="form-label">Vehicle Capacity</label>
            <input
              type="number"
              className="form-control"
              value={vehicleCapacity}
              onChange={(e) => setVehicleCapacity(Number(e.target.value))}
              min="1"
              max="255"
              disabled={isSubmitting}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label className="form-label">Max Travel Distance</label>
            <input
              type="number"
              className="form-control"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label className="form-label">Delivery Locations</label>
            {locations.map((loc, index) => (
              <div key={index} className="location-input-group">
                <div className="location-row">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="X Coordinate"
                    value={loc.x}
                    onChange={(e) =>
                      updateLocation(index, 'x', Number(e.target.value))
                    }
                    disabled={isSubmitting}
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Y Coordinate"
                    value={loc.y}
                    onChange={(e) =>
                      updateLocation(index, 'y', Number(e.target.value))
                    }
                    disabled={isSubmitting}
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Priority (1-10)"
                    value={loc.priority}
                    onChange={(e) =>
                      updateLocation(index, 'priority', Number(e.target.value))
                    }
                    min="1"
                    max="10"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeLocation(index)}
                    disabled={isSubmitting}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline"
              onClick={addLocation}
              disabled={isSubmitting}
              style={{ marginTop: '10px' }}
            >
              ➕ Add Location
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isReady || isSubmitting || isEncrypting}
            style={{ width: '100%' }}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner"></span>
                Submitting...
              </>
            ) : (
              <>
                <span>🚀</span>
                Request Optimization
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
