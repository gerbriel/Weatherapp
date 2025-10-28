import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTrial } from '../contexts/TrialContext';
import { WeatherDashboard } from './WeatherDashboard';
import { TrialDashboard } from './TrialDashboard';
import { HomePage } from './marketing/HomePage';
import { ProductPage } from './marketing/ProductPage';
import { PricingPage } from './marketing/PricingPage';

export const AppRouter: React.FC = () => {
  const { user, loading } = useAuth();
  const { isTrialMode } = useTrial();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Trial Mode Route - Accessible without authentication */}
        {isTrialMode && (
          <Route path="/trial" element={<TrialDashboard />} />
        )}

        {/* Protected Routes - Only accessible when authenticated */}
        {user ? (
          <>
            <Route path="/dashboard" element={<WeatherDashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* Redirect all marketing routes to dashboard for authenticated users */}
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            <Route path="/product" element={<Navigate to="/dashboard" replace />} />
            <Route path="/pricing" element={<Navigate to="/dashboard" replace />} />
            {/* Redirect trial to dashboard for authenticated users */}
            <Route path="/trial" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          <>
            {/* Public Marketing Routes - Only accessible when not authenticated */}
            <Route path="/" element={isTrialMode ? <Navigate to="/trial" replace /> : <HomePage />} />
            <Route path="/home" element={isTrialMode ? <Navigate to="/trial" replace /> : <HomePage />} />
            <Route path="/product" element={<ProductPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            {/* Redirect dashboard route to home for unauthenticated users (unless in trial mode) */}
            <Route path="/dashboard" element={<Navigate to={isTrialMode ? "/trial" : "/"} replace />} />
          </>
        )}
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : (isTrialMode ? "/trial" : "/")} replace />} />
      </Routes>
    </Router>
  );
};