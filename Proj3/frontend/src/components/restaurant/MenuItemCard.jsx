// src/components/restaurant/MenuItemCard.jsx

import React from 'react';
import Button from '../common/Button/Button';
import './MenuItemCard.css';

export function calculatePoints(price,poolSize = 1,multiplier=1.0){
  // console.log(price)
  const base = Math.floor(price*0.2);
  const bonus = Math.max(poolSize-1,0) * 2;
  return Math.floor((base + bonus) * multiplier);
}

const MenuItemCard = ({ item, restaurant, onAddToCart }) => {
  const points = calculatePoints(item.price,1,restaurant.reward_multiplier? restaurant.reward_multiplier : 1.0);
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