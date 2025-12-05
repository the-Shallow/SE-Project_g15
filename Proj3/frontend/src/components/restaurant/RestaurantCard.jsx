// src/components/restaurant/RestaurantCard.jsx

import React from 'react';
import './RestaurantCard.css';

const RestaurantCard = ({ restaurant, onClick }) => {
  const isPartner = restaurant.reward_multiplier  && restaurant.reward_multiplier > 1;
  return (
    <div onClick={() => onClick(restaurant)} className="restaurant-card">
      {isPartner && (
        <div className="reward-badge">
          ⭐ Partner Boost: +{Math.round((restaurant.reward_multiplier - 1) * 100)}% Points
        </div>
      )}
      <div className="restaurant-emoji">{restaurant.image}</div>
      <h3 className="restaurant-name">{restaurant.name}</h3>
      <div className="restaurant-rating">⭐ {restaurant.rating}</div>
      <div className="restaurant-location">📍 {restaurant.location}</div>
      <div className="restaurant-offer">{restaurant.offers}</div>
    </div>
  );
};

export default RestaurantCard;