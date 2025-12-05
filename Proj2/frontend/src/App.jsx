// src/App.jsx

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { RewardsProvider } from './context/RewardsContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <RewardsProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </RewardsProvider>
    </BrowserRouter>
  );
}

export default App;