import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const RewardsContext = createContext();

export const RewardsProvider = ({ children }) => {
  const [rewards, setRewards] = useState({ points: 0, tier: 'Bronze', streak: 0, coupons: [], ledger: [] });


  const getTierMultiplier = (tier) => {
    switch ((tier || '').toLowerCase()) {
      case 'silver': return 1.1;
      case 'gold': return 1.25;
      case 'platinum': return 1.5;
      default: return 1.0;
    }
  };

  const refreshRewards = async () => {
    try {
      const res = await api.get('/rewards/summary');
      setRewards({
        points: res.data.points,
        tier: res.data.tier,
        streak: res.data.streak || 0,
        coupons: res.data.coupons || [],
        ledger: res.data.ledger || [],
      });
      localStorage.setItem('loyalty_points', res.data.points);
    } catch (err) {
      console.error('Failed to refresh rewards', err);
    }
  };

  useEffect(() => {
    refreshRewards();
  }, []);

  return (
    <RewardsContext.Provider value={{ rewards, refreshRewards }}>
      {children}
    </RewardsContext.Provider>
  );
};

export const useRewards = () => useContext(RewardsContext);