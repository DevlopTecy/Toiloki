import React from 'react';
import './StatCard.css';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  helper?: string;
  icon?: React.ReactNode;
  mono?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  helper,
  icon,
  mono = false,
  className = '',
}) => {
  return (
    <div className={`toiloki-statcard ${className}`}>
      <div className="toiloki-statcard-top">
        <span className="toiloki-statcard-label">{label}</span>
        {icon && <span className="toiloki-statcard-icon">{icon}</span>}
      </div>
      <div className="toiloki-statcard-mid">
        <span className={`toiloki-statcard-value ${mono ? 'is-mono' : ''}`}>
          {value}
        </span>
        {unit && <span className="toiloki-statcard-unit">{unit}</span>}
      </div>
      {helper && <div className="toiloki-statcard-helper">{helper}</div>}
    </div>
  );
};
