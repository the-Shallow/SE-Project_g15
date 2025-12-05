// src/components/common/Navbar/Navbar.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { useRewards } from '../../../context/RewardsContext';
import './Navbar.css';

const Navbar = ({ currentPage, onPageChange }) => {
  const navigate = useNavigate();
  const { cartCount, setShowCart } = useCart();
  const { rewards } = useRewards();

  // helper to handle clicks universally
  const handleNavClick = (page) => {
    if (onPageChange) {
      // Case 1: Navbar inside Dashboard
      onPageChange(page);
    } else {
      // Case 2: Navbar on other pages (like Profile)
      navigate('/dashboard'); // go to dashboard first
      // we can optionally send page info in state if needed later
    }
  };

  return (
    <nav className="dashboard-navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <h1 className="brand" onClick={() => navigate('/dashboard')}>
            FoodPool
          </h1>
          <button
            onClick={() => handleNavClick('home')}
            className={`nav-button ${currentPage === 'home' ? 'active' : ''}`}
          >
            🏠 Home
          </button>
          <button
            onClick={() => handleNavClick('mygroups')}
            className={`nav-button ${currentPage === 'mygroups' ? 'active' : ''}`}
          >
            👥 My Groups
          </button>
          <button
            onClick={() => handleNavClick('findgroups')}
            className={`nav-button ${currentPage === 'findgroups' ? 'active' : ''}`}
          >
            🔍 Find Groups
          </button>
          <button
            onClick={() => navigate('/rewards')}
            className="nav-button"
          >
            💎 Rewards
          </button>
        </div>
        <div className="navbar-right">
          <button onClick={() => setShowCart(true)} className="cart-button">
            🛒
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <button onClick={() => navigate('/profile')} className="profile-button">
            👤
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
