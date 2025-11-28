import React, { useState, useEffect } from 'react';
import './GroupCard.css';
import Button from '../common/Button/Button';
import deliveryAPI from '../../api/delivery';

const GroupCard = ({ group, onAction, actionLabel }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [etaInfo, setEtaInfo] = useState(null);
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

      <div className="group-actions">
        <Button variant="primary" onClick={() => onAction(group)}>
          {actionLabel || 'View Group'}
        </Button>
      </div>
    </div>
  );
};

export default GroupCard;
