import React from 'react';
import './Radio.css';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  direction?: 'horizontal' | 'vertical';
  disabled?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  direction = 'vertical',
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`toiloki-radio-group toiloki-radio-${direction} ${className}`} role="radiogroup">
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const isDisabled = disabled || opt.disabled;

        return (
          <label
            key={opt.value}
            className={`toiloki-radio-label ${isDisabled ? 'is-disabled' : ''} ${isSelected ? 'is-selected' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => !isDisabled && onChange(opt.value)}
              disabled={isDisabled}
              className="toiloki-radio-native"
            />
            <span className={`toiloki-radio-circle ${isSelected ? 'is-checked' : ''}`}>
              <span className="toiloki-radio-dot" />
            </span>
            <span className="toiloki-radio-text">
              <span className="toiloki-radio-title">{opt.label}</span>
              {opt.description && <span className="toiloki-radio-desc">{opt.description}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
};
