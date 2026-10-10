import React from 'react';
import { Check } from 'lucide-react';
import './ChipGroup.css';

export interface ChipItem<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface ChipGroupProps<T extends string = string> {
  items: ChipItem<T>[];
  value: T | T[];
  onChange: (value: any) => void;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ChipGroup = <T extends string = string>({
  items,
  value,
  onChange,
  multiple = false,
  disabled = false,
  className = '',
}: ChipGroupProps<T>) => {
  const isSelected = (val: T) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(val);
    }
    return value === val;
  };

  const handleToggle = (val: T) => {
    if (disabled) return;
    if (multiple && Array.isArray(value)) {
      if (value.includes(val)) {
        onChange(value.filter((v) => v !== val));
      } else {
        onChange([...value, val]);
      }
    } else {
      onChange(val);
    }
  };

  return (
    <div className={`toiloki-chip-group ${className}`} role="group">
      {items.map((item) => {
        const selected = isSelected(item.value);
        const itemDisabled = disabled || item.disabled;

        return (
          <button
            key={item.value}
            type="button"
            className={`toiloki-chip ${selected ? 'is-selected' : ''} ${itemDisabled ? 'is-disabled' : ''}`}
            onClick={() => !itemDisabled && handleToggle(item.value)}
            disabled={itemDisabled}
            aria-pressed={selected}
          >
            {item.icon && <span className="toiloki-chip-icon">{item.icon}</span>}
            <span className="toiloki-chip-label">{item.label}</span>
            {selected && multiple && <Check size={12} className="toiloki-chip-check" />}
          </button>
        );
      })}
    </div>
  );
};
