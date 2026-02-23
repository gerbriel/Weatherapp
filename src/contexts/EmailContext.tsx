import React, { createContext, useContext } from 'react';

// This is a placeholder context to maintain compatibility
// The new email system uses Supabase directly via EmailSubscriptionService

interface EmailContextType {
  // Placeholder - actual functionality moved to Supabase
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Minimal context - functionality moved to Supabase
  const value = {};
  
  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
};

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
};