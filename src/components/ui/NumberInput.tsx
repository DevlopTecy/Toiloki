import React, { forwardRef } from 'react';
import { ChevronUp, ChevronDown, Plus, Minus } from 'lucide-react';
import './NumberInput.css';

export interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  size = 'md',
  disabled = false,
  className = '',
  id,
  name,
}, ref) => {
  const handleIncrement = () => {
    if (disabled) return;
    const next = max !== undefined ? Math.min(max, value + step) : value + step;
    onChange(next);
  };

  const handleDecrement = () => {
    if (disabled) return;
    const next = min !== undefined ? Math.max(min, value - step) : value - step;
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || raw === '-') {
      onChange(min !== undefined ? min : 0);
      return;
    }
    const parsed = Number(raw);
    if (!isNaN(parsed)) {
      let clamped = parsed;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      onChange(clamped);
    }
  };

  const isMin = min !== undefined && value <= min;
  const isMax = max !== undefined && value >= max;

  return (
    <div
      className={`toiloki-num-wrapper toiloki-num-${size} ${disabled ? 'is-disabled' : ''} ${className}`}
    >
      <button
        type="button"
        className="toiloki-num-btn toiloki-num-btn-dec"
        onClick={handleDecrement}
        disabled={disabled || isMin}
        aria-label="Decrement"
        tabIndex={-1}
      >
        <Minus size={13} />
      </button>

      <div className="toiloki-num-center">
        <input
          ref={ref}
          id={id}
          name={name}
          type="number"
          className="toiloki-num-input"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
        />
        {unit && <span className="toiloki-num-unit">{unit}</span>}
      </div>

      <button
        type="button"
        className="toiloki-num-btn toiloki-num-btn-inc"
        onClick={handleIncrement}
        disabled={disabled || isMax}
        aria-label="Increment"
        tabIndex={-1}
      >
        <Plus size={13} />
      </button>
    </div>
  );
});

NumberInput.displayName = 'NumberInput';
