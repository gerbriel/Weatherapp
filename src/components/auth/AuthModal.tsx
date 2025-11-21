import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SimpleLoginForm } from './SimpleLoginForm';
import { SimpleSignupForm } from './SimpleSignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot-password';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(initialMode);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        {mode === 'login' ? (
          <SimpleLoginForm
            onSuccess={handleSuccess}
            onSwitchToSignup={() => setMode('signup')}
            onSwitchToForgotPassword={() => setMode('forgot-password')}
          />
        ) : mode === 'signup' ? (
          <SimpleSignupForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setMode('login')}
          />
        ) : (
          <ForgotPasswordForm
            onBack={() => setMode('login')}
          />
        )}
      </div>
    </div>
  );
};