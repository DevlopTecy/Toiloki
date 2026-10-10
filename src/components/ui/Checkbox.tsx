import React from 'react';
import { Check } from 'lucide-react';
import './Checkbox.css';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
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
      className={`toiloki-checkbox-label ${disabled ? 'is-disabled' : ''} ${className}`}
      htmlFor={id}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="toiloki-checkbox-native"
      />
      <span className={`toiloki-checkbox-box ${checked ? 'is-checked' : ''}`}>
        {checked && <Check size={12} className="toiloki-checkbox-check" />}
      </span>
      {(label || description) && (
        <span className="toiloki-checkbox-text">
          {label && <span className="toiloki-checkbox-title">{label}</span>}
          {description && <span className="toiloki-checkbox-desc">{description}</span>}
        </span>
      )}
    </label>
  );
};
