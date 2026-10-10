import React from 'react';
import './Slider.css';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  className = '',
  id,
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) {
      onChange(Math.max(min, Math.min(max, val)));
    }
  };

  return (
    <div className={`toiloki-slider-wrapper ${disabled ? 'is-disabled' : ''} ${className}`}>
      <div className="toiloki-slider-track-container">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleRangeChange}
          disabled={disabled}
          className="toiloki-slider-range"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percentage}%, var(--border-strong) ${percentage}%, var(--border-strong) 100%)`,
          }}
        />
      </div>

      <div className="toiloki-slider-stepper">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleNumberChange}
          disabled={disabled}
          className="toiloki-slider-number-input"
        />
        {unit && <span className="toiloki-slider-unit">{unit}</span>}
      </div>
    </div>
  );
};
