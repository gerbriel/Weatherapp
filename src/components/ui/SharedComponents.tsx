/**
 * Reusable UI Components with centralized styling
 * Use these components to ensure consistent styling across the app
 */

import React from 'react';
import { theme, cn } from '../../styles/theme';

// Card Components
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'compact' | 'elevated';
  children: React.ReactNode;
}

export const Card = ({ variant = 'base', children, className, ...props }: CardProps) => {
  return (
    <div 
      className={cn(theme.components.card[variant], className)} 
      {...props}
    >
      {children}
    </div>
  );
};

// Section Header Component
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'gradient';
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const SectionHeader = ({ 
  title, 
  subtitle, 
  action, 
  variant = 'gradient',
  collapsed,
  onToggle,
  className 
}: SectionHeaderProps) => {
  const headerClass = variant === 'gradient' 
    ? theme.components.section.header 
    : theme.components.section.headerCompact;

  const Component = onToggle ? 'button' : 'div';
  
  return (
    <Component
      onClick={onToggle}
      className={cn(
        headerClass,
        onToggle && theme.components.card.headerHover,
        'transition-colors',
        className
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div>
          <h2 className={cn(theme.typography.h2, 'text-white')}>{title}</h2>
          {subtitle && (
            <p className={cn(theme.typography.caption, 'text-white/80 mt-1')}>{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {action}
          {onToggle && (
            <svg
              className={cn(
                'h-5 w-5 text-white transition-transform',
                collapsed && 'transform rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
    </Component>
  );
};

// Metric Card Component
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconColor?: keyof typeof theme.colors.metrics;
  className?: string;
}

export const MetricCard = ({ icon, label, value, iconColor = 'et0', className }: MetricCardProps) => {
  const iconColorClass = theme.colors.metrics[iconColor];
  
  return (
    <div className={cn(theme.components.metricCard.base, className)}>
      <div className="flex items-center gap-1 mb-1">
        <span className={iconColorClass}>{icon}</span>
        <span className={theme.components.metricCard.label}>{label}</span>
      </div>
      <div className={theme.components.metricCard.value}>{value}</div>
    </div>
  );
};

// Button Components
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className, 
  ...props 
}: ButtonProps) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        theme.components.button[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Tab Navigation
interface TabProps {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
}

export const Tab = ({ label, icon, active, onClick, className }: TabProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        theme.components.nav.tab,
        active ? theme.components.nav.tabActive : theme.components.nav.tabInactive,
        'flex items-center gap-2',
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

// Input Components
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className="w-full">
      {label && (
        <label className={cn(theme.typography.label, 'block mb-1')}>
          {label}
        </label>
      )}
      <input
        className={cn(
          theme.components.input.base,
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className={cn(theme.colors.status.error, 'text-xs mt-1')}>
          {error}
        </p>
      )}
    </div>
  );
};

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = ({ label, error, options, className, ...props }: SelectProps) => {
  return (
    <div className="w-full">
      {label && (
        <label className={cn(theme.typography.label, 'block mb-1')}>
          {label}
        </label>
      )}
      <select
        className={cn(
          theme.components.input.select,
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className={cn(theme.colors.status.error, 'text-xs mt-1')}>
          {error}
        </p>
      )}
    </div>
  );
};

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export const Badge = ({ children, variant = 'info', className }: BadgeProps) => {
  const variantClasses = {
    success: cn(theme.colors.status.successBg, theme.colors.status.success),
    warning: cn(theme.colors.status.warningBg, theme.colors.status.warning),
    error: cn(theme.colors.status.errorBg, theme.colors.status.error),
    info: cn(theme.colors.status.infoBg, theme.colors.status.info),
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

// Loading Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', sizeClasses[size], className)}>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Skeleton Loader Component
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton = ({ className, variant = 'rectangular' }: SkeletonProps) => {
  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  return (
    <div className={cn(theme.utils.skeleton, variantClasses[variant], className)} />
  );
};

// Divider Component
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider = ({ orientation = 'horizontal', className }: DividerProps) => {
  return (
    <div
      className={cn(
        orientation === 'horizontal' 
          ? cn('w-full h-px', theme.components.section.divider)
          : cn('h-full w-px', theme.components.section.divider),
        className
      )}
    />
  );
};
