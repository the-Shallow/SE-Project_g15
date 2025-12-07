import React, { createContext, useContext, useState } from 'react';
import { updateUserLocation } from '../api/discovery'; 
const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = () => {
  setLoading(true);
  setError(null);

  if (!navigator.geolocation) {
    setError('Geolocation not supported by your browser');
    setLoading(false);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {  // ← Made this async
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      
      // Save to local state first
      setLocation(coords);
      
      // NOW SEND TO BACKEND
      try {
        await updateUserLocation(coords.latitude, coords.longitude);
        console.log('Location saved to database successfully');
      } catch (error) {
        console.error('Failed to save location to database:', error);
        // Don't show error to user - location still works locally
      }
      
      setLoading(false);
    },
    (err) => {
      setError(err.message);
      setLoading(false);
    }
  );
};

  const value = {
    location,
    loading,
    error,
    requestLocation
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};