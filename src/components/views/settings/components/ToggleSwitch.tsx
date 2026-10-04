import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  id,
  'aria-label': ariaLabel,
  className = '',
}) => {
  return (
    <label
      className={`toiloki-switch ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      <span className="toiloki-switch-track">
        <span className="toiloki-switch-thumb" />
      </span>
    </label>
  );
};
