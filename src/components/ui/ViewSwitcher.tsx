import React from 'react';
import './ViewSwitcher.css';

export interface ViewSwitcherOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface ViewSwitcherProps<T extends string = string> {
  options: ViewSwitcherOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

export const ViewSwitcher = <T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  ariaLabel = 'View switcher',
}: ViewSwitcherProps<T>) => {
  // Enforce at most 3 segments
  const displayedOptions = options.slice(0, 3);

  return (
    <div
      className={`toiloki-view-switcher ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {displayedOptions.map((opt) => {
        const isSelected = opt.value === value;

        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={opt.disabled}
            className={`toiloki-view-segment ${isSelected ? 'is-selected' : ''}`}
            onClick={() => !opt.disabled && onChange(opt.value)}
          >
            {opt.icon && <span className="toiloki-view-segment-icon">{opt.icon}</span>}
            <span className="toiloki-view-segment-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
