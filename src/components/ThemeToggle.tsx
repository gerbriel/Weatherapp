import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="gh-btn p-2"
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4 text-github-attention-fg dark:text-github-dark-attention-fg" />
      ) : (
        <Moon className="h-4 w-4 text-github-fg-muted dark:text-github-dark-fg-muted" />
      )}
    </button>
  );
};