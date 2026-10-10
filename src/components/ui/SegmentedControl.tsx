import React from 'react';
import './SegmentedControl.css';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const SegmentedControl = <T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  disabled = false,
  className = '',
  ariaLabel = 'Segmented options',
}: SegmentedControlProps<T>) => {
  return (
    <div
      className={`toiloki-segmented-control toiloki-segmented-${size} ${disabled ? 'is-disabled' : ''} ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const isDisabled = disabled || opt.disabled;

        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={isDisabled}
            className={`toiloki-segmented-item ${isSelected ? 'is-selected' : ''}`}
            onClick={() => !isDisabled && onChange(opt.value)}
          >
            {opt.icon && <span className="toiloki-segmented-icon">{opt.icon}</span>}
            <span className="toiloki-segmented-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
