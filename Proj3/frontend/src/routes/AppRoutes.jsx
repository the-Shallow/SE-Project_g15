// src/routes/AppRoutes.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import SignUp from '../pages/SignUp/SignUp';
import Dashboard from '../pages/Dashboard/Dashboard';
import OrderOptions from '../pages/OrderOptions/OrderOptions';
import GroupsPage from '../components/group/GroupPage';
import GroupDetailPage from '../components/group/GroupDetail';
import Profile from '../pages/Profile/Profile';
import RewardsPage from '../pages/Rewards/RewardsPage';


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/order-options" element={<OrderOptions />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/groups/:id" element={<GroupDetailPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/rewards" element={<RewardsPage />} />
    </Routes>
  );
};

export default AppRoutes;