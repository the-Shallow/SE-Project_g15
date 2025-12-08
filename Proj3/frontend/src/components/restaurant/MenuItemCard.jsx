// src/components/restaurant/MenuItemCard.jsx

import React from 'react';
import Button from '../common/Button/Button';
import './MenuItemCard.css';
import { useRewards } from '../../context/RewardsContext';

export function calculatePoints(totalPrice, poolSize = 1, multiplier = 1.0, user = {}) {
  // Default mock user for preview
  const streakCount = user.streak_count || 0;
  const tierMultiplier = user.tier_multiplier || (() => 1.0);

  const base = Math.floor(totalPrice * 0.5);
  const bonus = Math.max(poolSize - 1, 0) * 2;
  const streakBonus = 1.0 + Math.min(streakCount * 0.05, 0.30);
  const totalMultiplier = multiplier * bonus * streakBonus * tierMultiplier();
  return Math.floor(base + totalMultiplier);
}

const MenuItemCard = ({ item, restaurant, onAddToCart }) => {
  const { rewards } = useRewards();
  const points = calculatePoints(item.price,1,restaurant.reward_multiplier? restaurant.reward_multiplier : 1.0,{
      streak_count: rewards.streak,
      tier_multiplier: rewards.tier_multiplier,
    });
  return (
    <div className="menu-item">
      <div className="menu-item-header">
        <h4 className="menu-item-name">{item.name}</h4>
        <span className="menu-item-price">${item.price}</span>
      </div>
      <div className="expected-points">
        ⭐ Earn ~{points} points
      </div>
      <p className="menu-item-description">{item.description}</p>
      <Button 
        variant="primary" 
        size="small" 
        fullWidth
        onClick={() => onAddToCart(item)}
      >
        Add to Cart
      </Button>
    </div>
  );
};

export default MenuItemCard;