import React, { useState, useEffect } from 'react';
import './GroupCard.css';
import Button from '../common/Button/Button';
import deliveryAPI from '../../api/delivery';

const GroupCard = ({ group, onAction, actionLabel }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [etaInfo, setEtaInfo] = useState(null);
  const [clusterInfo, setClusterInfo] = useState(null);
  const currentUser = localStorage.getItem('username') || 'Guest';

  // Calculate countdown
  const calculateTimeRemaining = () => {
    const now = new Date();
    const orderTime = new Date(group.nextOrderTime);
    const diff = orderTime - now;
    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}h ${minutes
      .toString()
      .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  useEffect(() => {
    setTimeLeft(calculateTimeRemaining());
    const interval = setInterval(() => setTimeLeft(calculateTimeRemaining()), 1000);
    return () => clearInterval(interval);
  }, [group.nextOrderTime]);

  // Determine group status
  const getStatus = () => {
    const membersCount = group.members?.length || 0;
    const now = new Date();
    const orderTime = new Date(group.nextOrderTime);
    const diffMinutes = (orderTime - now) / 60000;

    if (membersCount >= group.maxMembers) return 'Full';
    if (diffMinutes <= 0) return 'Expired';
    if (diffMinutes <= 15) return 'Closing Soon';
    return 'Open';
  };

  const status = getStatus();

  // ADD THIS: Fetch AI-powered ETA
  useEffect(() => {
    const fetchETA = async () => {
      try {
        // Estimate distance based on delivery location or use default
        const distanceKm = group.distance || 5.0;
        const numStops = group.members?.length || 1;
        
        const eta = await deliveryAPI.predictETAWithRushHour(distanceKm, numStops);
        setEtaInfo(eta);
      } catch (error) {
        console.error('Error fetching ETA:', error);
        // Don't show error to user, just don't display ETA
      }
    };

    // Only fetch ETA if group is not expired
    if (status === 'Expired' || status === 'Full') {
      setEtaInfo(null); // Clear ETA for expired/full groups
    } else {
      fetchETA();
    }
  }, [group.id, group.members?.length, status]);

  useEffect(() => {
    const fetchClusterInfo = async () => {
      try {
        // For demo, we'll use mock nearby groups
        // In production, you'd fetch all active groups from your API
        const mockNearbyGroups = [
          { lat: 35.7796, lng: -78.6382, group_id: group.id, group_name: group.name },
          { lat: 35.7806, lng: -78.6392, group_id: 99, group_name: 'Pizza Lovers' },
          { lat: 35.7816, lng: -78.6402, group_id: 98, group_name: 'Taco Tuesday' }
        ];
        
        const result = await deliveryAPI.findMyCluster(group.id, mockNearbyGroups);
        
        if (result.in_cluster) {
          setClusterInfo(result);
        }
      } catch (error) {
        console.error('Error fetching cluster info:', error);
      }
    };

    // Simple mock data for demo - no API call
    if (status !== 'Expired' && status !== 'Full') {
      // Show cluster badge on active groups
      setClusterInfo({
        in_cluster: true,
        cluster: {
          size: 3,
          radius_km: 1.2
        }
      });
    } else {
      // Clear cluster info on expired/full groups
      setClusterInfo(null);
    }
  }, [status]);

  const statusColors = {
    Open: { bg: '#d1fae5', color: '#059669' },
    'Closing Soon': { bg: '#f2f0c5ff', color: '#ede628ff' },
    Expired: { bg: '#f5c8c8ff', color: '#ff0000ff' },
    Full: { bg: '#f5c8c8ff', color: '#ff0000ff' },
  };

  return (
    <div className="group-card">
      <div className="group-header">
        <h3 className="group-name">{group.name}</h3>
        <div className="group-detail-tags">
          <span
            className="group-detail-status"
            style={{
              background: statusColors[status].bg,
              color: statusColors[status].color,
            }}
          >
            {status}
          </span>
        </div>
      </div>

      <p className="group-members">
        👥 {group.members.length} / {group.maxMembers} members
      </p>

      {/* Only show next order info if NOT expired */}
      {status !== 'Expired' && (
      <p className="group-next-order"
        style={{
          background: statusColors[status].bg,
          color: statusColors[status].color,
        }}>
        🕒 Next order:{" "}
        {new Date(group.nextOrderTime).toLocaleString("en-US", {
          timeZone: "America/New_York",
          hour12: true,
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      )}

      <p className="group-countdown"
      style={{
              background: statusColors[status].bg,
              color: statusColors[status].color,
            }}>
        ⏳ {status === 'Expired' ? 'Time’s up!' : `Time left: ${timeLeft}`}
      </p>

      {/* AI-Powered ETA Display */}
      {status !== 'Expired' && status !== 'Full' && etaInfo && (
        <div className="ai-eta-compact">
          <div className="ai-eta-header">
            <span className="ai-eta-badge">🤖 Smart ETA</span>
            {etaInfo.adjusted_for_rush_hour && (
              <span className="ai-eta-rush-hour">🚦 Rush Hour</span>
            )}
          </div>
          <div className="ai-eta-time">
            {etaInfo.total_minutes} mins
          </div>
          <div className="ai-eta-breakdown">
            <span>👨‍🍳 {etaInfo.breakdown.prep_time}m</span>
            <span>🚗 {etaInfo.breakdown.travel_time}m</span>
            <span>📦 {etaInfo.breakdown.stop_time}m</span>
          </div>
        </div>
      )}

      {clusterInfo && clusterInfo.in_cluster && (
        <div className="cluster-badge-container">
          <span className="cluster-badge">
            📍 Clustered with {clusterInfo.cluster.size - 1} other {clusterInfo.cluster.size - 1 === 1 ? 'order' : 'orders'}
          </span>
          {clusterInfo.cluster.radius_km > 0 && (
            <span className="cluster-radius">
              📏 {clusterInfo.cluster.radius_km} km radius
            </span>
          )}
        </div>
      )}

      <div className="group-actions">
        <Button variant="primary" onClick={() => onAction(group)}>
          {actionLabel || 'View Group'}
        </Button>
      </div>
    </div>
  );
};

export default GroupCard;
