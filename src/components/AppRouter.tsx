import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TrialDashboard } from './TrialDashboard';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';

export const AppRouter: React.FC = () => {
  const basename = import.meta.env.PROD ? '/Weatherapp' : '';

  return (
    <Router basename={basename}>
      <Routes>
        {/* Public password reset route */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Public Trial Route */}
        <Route path="/trial" element={<TrialDashboard />} />
        
        {/* Dashboard - always public, no auth required */}
        <Route path="/dashboard" element={<TrialDashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        <Route path="/product" element={<Navigate to="/dashboard" replace />} />
        <Route path="/pricing" element={<Navigate to="/dashboard" replace />} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};