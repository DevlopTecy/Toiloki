import React, { forwardRef } from 'react';
import { X } from 'lucide-react';
import './TextInput.css';

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  mono?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isInvalid?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(({
  prefixIcon,
  suffixIcon,
  clearable,
  onClear,
  mono = false,
  size = 'md',
  isInvalid = false,
  className = '',
  disabled,
  value,
  onChange,
  ...props
}, ref) => {
  const showClear = clearable && !disabled && Boolean(value) && onClear;

  return (
    <div
      className={`toiloki-input-wrapper toiloki-input-${size} ${mono ? 'is-mono' : ''} ${isInvalid ? 'is-invalid' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
    >
      {prefixIcon && <span className="toiloki-input-prefix">{prefixIcon}</span>}
      <input
        ref={ref}
        type="text"
        className="toiloki-text-input"
        disabled={disabled}
        value={value}
        onChange={onChange}
        {...props}
      />
      {showClear && (
        <button
          type="button"
          className="toiloki-input-clear"
          onClick={onClear}
          aria-label="Clear input"
          tabIndex={-1}
        >
          <X size={14} />
        </button>
      )}
      {suffixIcon && !showClear && <span className="toiloki-input-suffix">{suffixIcon}</span>}
    </div>
  );
});

TextInput.displayName = 'TextInput';
