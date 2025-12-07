import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const RewardsContext = createContext();

export const RewardsProvider = ({ children }) => {
  const [rewards, setRewards] = useState({ points: 0, tier: 'Bronze' });

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