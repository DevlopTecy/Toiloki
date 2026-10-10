import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'default' | 'compact' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'default',
  icon,
  loading = false,
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const effectiveSize = size === 'sm' || size === 'compact' ? 'compact' : 'default';
  const effectiveLoading = loading || isLoading;

  return (
    <button
      className={`toiloki-btn toiloki-btn-${variant} toiloki-btn-${effectiveSize} ${effectiveLoading ? 'is-loading' : ''} ${className}`}
      disabled={disabled || effectiveLoading}
      {...props}
    >
      {effectiveLoading ? (
        <span className="toiloki-btn-spinner" aria-label="Loading" />
      ) : (
        <>
          {icon && <span className="toiloki-btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
