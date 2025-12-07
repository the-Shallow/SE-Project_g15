import React, { useState, useEffect } from 'react';
import { predictETAWithRushHour, findMyCluster, getActiveGroupsForClustering } from '../../api/delivery';
import './GroupCard.css';
import Button from '../common/Button/Button';

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

  // Fetch AI-powered ETA
  useEffect(() => {
    const fetchETA = async () => {
      try {
        // Estimate distance based on delivery location or use default
        const distanceKm = group.distance || 5.0;
        const numStops = group.members?.length || 1;
        
        const eta = await predictETAWithRushHour(distanceKm, numStops);
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
        // Skip if group doesn't have location data
        if (!group.latitude || !group.longitude) {
          console.log('Group missing location data, skipping clustering');
          setClusterInfo(null);
          return;
        }

        // Fetch all active groups with locations from backend
        const activeGroups = await getActiveGroupsForClustering();
        
        // If there are no other groups, skip clustering
        if (!activeGroups || activeGroups.length === 0) {
          setClusterInfo(null);
          return;
        }

        // Convert to format expected by clustering API
        const locationsForClustering = activeGroups.map(g => ({
          lat: g.lat,
          lng: g.lng,
          group_id: g.group_id,
          group_name: g.group_name
        }));
        
        // Find cluster for this specific group
        const result = await findMyCluster(group.id, locationsForClustering);
        
        if (result.in_cluster) {
          setClusterInfo(result);
        } else {
          setClusterInfo(null);
        }
      } catch (error) {
        console.error('Error fetching cluster info:', error);
        // Don't show error to user, just don't display cluster badge
        setClusterInfo(null);
      }
    };

    // Only fetch cluster info for active groups
    if (status !== 'Expired' && status !== 'Full') {
      fetchClusterInfo();
    } else {
      // Clear cluster info on expired/full groups
      setClusterInfo(null);
    }
  }, [group.id, group.latitude, group.longitude, status]);

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

      {/* UPDATED: Show cluster badge only when real cluster data is available */}
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
          {/* Show cluster mates if available */}
          {clusterInfo.cluster_mates && clusterInfo.cluster_mates.length > 0 && (
            <div className="cluster-mates">
              <small>Nearby: {clusterInfo.cluster_mates.join(', ')}</small>
            </div>
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
