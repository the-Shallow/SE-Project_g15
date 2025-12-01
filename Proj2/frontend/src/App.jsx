// src/App.jsx

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <BrowserRouter>
  <CartProvider>
    <LocationProvider>
      <AppRoutes />
    </LocationProvider>
  </CartProvider>
</BrowserRouter>
  );
}

export default App;