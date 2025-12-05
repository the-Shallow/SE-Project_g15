import React, { useState, useEffect } from 'react';
import deliveryAPI from '../../api/delivery';
import './ETADisplay.css';

const ETADisplay = ({ distanceKm, numStops = 1, useRushHour = true }) => {
  const [etaInfo, setEtaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchETA = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = useRushHour
          ? await deliveryAPI.predictETAWithRushHour(distanceKm, numStops)
          : await deliveryAPI.predictETA(distanceKm, numStops);
        
        setEtaInfo(data);
      } catch (err) {
        setError('Unable to calculate ETA');
        console.error('Error fetching ETA:', err);
      } finally {
        setLoading(false);
      }
    };

    if (distanceKm > 0) {
      fetchETA();
    }
  }, [distanceKm, numStops, useRushHour]);

  if (loading) {
    return <div className="eta-loading">⏳ Calculating smart ETA...</div>;
  }

  if (error) {
    return <div className="eta-error">{error}</div>;
  }

  if (!etaInfo) {
    return null;
  }

  const formatETA = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="eta-display">
      <div className="eta-header">
        <span className="ai-badge">🤖 Smart ETA</span>
        {etaInfo.adjusted_for_rush_hour && (
          <span className="rush-hour-badge">🚦 Rush Hour Adjusted</span>
        )}
      </div>
      
      <div className="eta-main">
        <div className="eta-time">
          <span className="eta-value">{etaInfo.total_minutes}</span>
          <span className="eta-unit">mins</span>
        </div>
        <div className="eta-arrival">
          Arrives by {formatETA(etaInfo.eta)}
        </div>
      </div>

      <div className="eta-breakdown">
        <div className="breakdown-item">
          <span className="breakdown-icon">👨‍🍳</span>
          <span className="breakdown-label">Prep</span>
          <span className="breakdown-value">{etaInfo.breakdown.prep_time}m</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-icon">🚗</span>
          <span className="breakdown-label">Travel</span>
          <span className="breakdown-value">{etaInfo.breakdown.travel_time}m</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-icon">📦</span>
          <span className="breakdown-label">Stops</span>
          <span className="breakdown-value">{etaInfo.breakdown.stop_time}m</span>
        </div>
      </div>

      <div className="eta-footer">
        <span className={`traffic-indicator traffic-${etaInfo.traffic_status}`}>
          {etaInfo.traffic_status === 'normal' && '🟢'}
          {etaInfo.traffic_status === 'moderate' && '🟡'}
          {etaInfo.traffic_status === 'heavy' && '🔴'}
          {' '}
          {etaInfo.traffic_status.charAt(0).toUpperCase() + etaInfo.traffic_status.slice(1)} Traffic
        </span>
        <span className="confidence-indicator">
          Confidence: {etaInfo.confidence}
        </span>
      </div>
    </div>
  );
};

export default ETADisplay;