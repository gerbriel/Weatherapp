import React from 'react';
import { useAuth } from '../contexts/AuthContextSimple';

export const SimpleDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();

  // Debug logging
  React.useEffect(() => {
    console.log('SimpleDashboard - User:', user);
    console.log('SimpleDashboard - Profile:', profile);
  }, [user, profile]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to ET Weather! 🌤️
            </h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
                ✅ Authentication System Working!
              </h2>
              <div className="space-y-2 text-blue-800 dark:text-blue-200">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Name:</strong> {profile?.full_name || 'Not set'}</p>
                <p><strong>Company:</strong> {profile?.company || 'Not set'}</p>
                <p><strong>Phone:</strong> {profile?.phone || 'Not set'}</p>
                <p><strong>Role:</strong> <span className="inline-block px-2 py-1 bg-blue-600 text-white text-sm rounded">{profile?.role}</span></p>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
                🎉 What's Working:
              </h2>
              <ul className="space-y-2 text-green-800 dark:text-green-200">
                <li>✅ User signup with email confirmation</li>
                <li>✅ User login with email/password</li>
                <li>✅ Password reset via email</li>
                <li>✅ User profile with company and phone</li>
                <li>✅ Role-based access (superuser, admin, user)</li>
                <li>✅ Secure Row Level Security (RLS) policies</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100 mb-4">
                🚧 Coming Soon:
              </h2>
              <ul className="space-y-2 text-yellow-800 dark:text-yellow-200">
                <li>📊 Weather Dashboard (TrialDashboard migration in progress)</li>
                <li>🏢 Organization Management</li>
                <li>📍 Location Management</li>
                <li>🌾 Crop Management</li>
                <li>👥 User Management (admin features)</li>
              </ul>
            </div>

            {profile?.role === 'superuser' && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-4">
                  👑 SuperUser Features:
                </h2>
                <p className="text-purple-800 dark:text-purple-200 mb-4">
                  As a superuser, you have access to all organizations and can manage all users and settings.
                </p>
                <div className="space-y-2">
                  <a 
                    href="/auth-test" 
                    className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    View Auth Test Page
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
