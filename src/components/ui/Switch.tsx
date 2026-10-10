import React from 'react';
import './Switch.css';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  name,
  className = '',
}) => {
  return (
    <label
      className={`toiloki-switch-label ${disabled ? 'is-disabled' : ''} ${className}`}
      htmlFor={id}
    >
      <input
        type="checkbox"
        role="switch"
        id={id}
        name={name}
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="toiloki-switch-native"
        aria-checked={checked}
      />
      <span className={`toiloki-switch-track ${checked ? 'is-checked' : ''}`}>
        <span className="toiloki-switch-thumb" />
      </span>
      {(label || description) && (
        <span className="toiloki-switch-text">
          {label && <span className="toiloki-switch-title">{label}</span>}
          {description && <span className="toiloki-switch-desc">{description}</span>}
        </span>
      )}
    </label>
  );
};
