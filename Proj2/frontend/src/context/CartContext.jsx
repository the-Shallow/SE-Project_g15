// src/context/CartContext.jsx

import React, { createContext, useContext, useState } from 'react';
import { calculatePoints } from '../components/restaurant/MenuItemCard';
import { useRewards } from './RewardsContext';

const CartContext = createContext();

const addPointsToUser = (earnedPoints) => {
  let current = Number(localStorage.getItem("loyalty_points")) || 0;
  const updated = current + earnedPoints;
  localStorage.setItem("loyalty_points", String(updated));
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { rewards } = useRewards();
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const addToCart = (item) => {
    console.log("Adding to cart:", item);
    const existing = cart.find(cartItem => cartItem.id === item.id);
    if (existing) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, restaurantId: item.restaurantId, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(cartItem => cartItem.id === itemId);
    if (existing.quantity === 1) {
      setCart(cart.filter(cartItem => cartItem.id !== itemId));
    } else {
      setCart(cart.map(cartItem => 
        cartItem.id === itemId 
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ));
    }
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const expectedPoints = cart.reduce(
    (sum,item) => sum + calculatePoints(item.price*item.quantity,1,item.reward_multiplier,{
    streak_count: rewards.streak,
    tier_multiplier: rewards.tier_multiplier,
  }),0
  )

  const value = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
    expectedPoints,
    showCart,
    setShowCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};