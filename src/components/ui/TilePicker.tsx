import React from 'react';
import { Check } from 'lucide-react';
import './TilePicker.css';

export interface TileOption<T extends string = string> {
  value: T;
  name: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

export interface TilePickerProps<T extends string = string> {
  options: TileOption<T>[];
  value: T | T[];
  onChange: (value: any) => void;
  multiple?: boolean;
  columns?: 2 | 3 | 4 | 5;
  disabled?: boolean;
  className?: string;
}

export const TilePicker = <T extends string = string>({
  options,
  value,
  onChange,
  multiple = false,
  columns = 3,
  disabled = false,
  className = '',
}: TilePickerProps<T>) => {
  const isSelected = (val: T) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(val);
    }
    return value === val;
  };

  const handleSelect = (val: T) => {
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
    <div
      className={`toiloki-tile-grid toiloki-tile-cols-${columns} ${className}`}
      role="group"
    >
      {options.map((opt) => {
        const selected = isSelected(opt.value);
        const optDisabled = disabled || opt.disabled;

        return (
          <button
            key={opt.value}
            type="button"
            className={`toiloki-tile ${selected ? 'is-selected' : ''} ${optDisabled ? 'is-disabled' : ''}`}
            onClick={() => !optDisabled && handleSelect(opt.value)}
            disabled={optDisabled}
            aria-pressed={selected}
          >
            <div className="toiloki-tile-header">
              <span className="toiloki-tile-icon">{opt.icon}</span>
              {selected && <Check size={16} className="toiloki-tile-check" />}
            </div>
            <div className="toiloki-tile-name">{opt.name}</div>
            <div className="toiloki-tile-desc">{opt.description}</div>
          </button>
        );
      })}
    </div>
  );
};
