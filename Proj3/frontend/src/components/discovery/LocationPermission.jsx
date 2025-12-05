import React, { useState } from 'react';
import { useLocation } from '../../context/LocationContext';
import './LocationPermission.css';

const LocationPermission = () => {
  const { location, loading, error, requestLocation } = useLocation();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if location already enabled or user dismissed
  if (location || dismissed) return null;

  return (
    <div className="location-permission-banner">
      <div className="banner-content">
        <div className="banner-icon">📍</div>
        <div className="banner-text">
          <h3>Enable Location Services</h3>
          <p>Find food pools near you by sharing your location</p>
        </div>
        <div className="banner-actions">
          <button 
            onClick={requestLocation} 
            className="btn-enable"
            disabled={loading}
          >
            {loading ? 'Requesting...' : 'Enable Location'}
          </button>
          <button 
            onClick={() => setDismissed(true)} 
            className="btn-dismiss"
          >
            Maybe Later
          </button>
        </div>
      </div>
      {error && (
        <div className="banner-error">
          <p>⚠️ {error}</p>
          <p className="error-hint">
            Please enable location in your browser settings to use this feature
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationPermission;