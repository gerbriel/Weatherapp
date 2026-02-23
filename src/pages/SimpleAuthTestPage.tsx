import React, { useState } from 'react';
import { SimpleLoginForm } from '../components/auth/SimpleLoginForm';
import { SimpleSignupForm } from '../components/auth/SimpleSignupForm';

export const SimpleAuthTestPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      {mode === 'login' ? (
        <SimpleLoginForm
          onSuccess={() => {
            console.log('Login successful!');
            window.location.href = '/trial';
          }}
          onSwitchToSignup={() => setMode('signup')}
        />
      ) : (
        <SimpleSignupForm
          onSuccess={() => {
            console.log('Signup successful!');
            window.location.href = '/trial';
          }}
          onSwitchToLogin={() => setMode('login')}
        />
      )}
    </div>
  );
};
