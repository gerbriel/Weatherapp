import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextSimple';
import { TrialDashboard } from './TrialDashboard';
import { HomePage } from './marketing/HomePage';
import { ProductPage } from './marketing/ProductPage';
import { PricingPage } from './marketing/PricingPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { SimpleAuthTestPage } from '../pages/SimpleAuthTestPage';
import { SimpleDashboard } from '../pages/SimpleDashboard';

export const AppRouter: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const basename = import.meta.env.PROD ? '/Weatherapp' : '';

  return (
    <Router basename={basename}>
      <Routes>
        {/* Public password reset route */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Public Trial Route */}
        <Route path="/trial" element={<TrialDashboard />} />
        
        {/* Simple Auth Test Page - For testing new auth system */}
        <Route path="/auth-test" element={<SimpleAuthTestPage />} />

        {/* Protected Routes - Only accessible when authenticated */}
        {user ? (
          <>
            <Route path="/dashboard" element={<TrialDashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* Redirect all marketing routes to dashboard for authenticated users */}
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            <Route path="/product" element={<Navigate to="/dashboard" replace />} />
            <Route path="/pricing" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          <>
            {/* Public Marketing Routes - Only accessible when not authenticated */}
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/product" element={<ProductPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            {/* Redirect dashboard route to home for unauthenticated users */}
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
          </>
        )}
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
      </Routes>
    </Router>
  );
};