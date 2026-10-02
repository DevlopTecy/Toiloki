import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ icon, className = '', ...props }) => {
  if (icon) {
    return (
      <div className={`toiloki-input-wrap ${className}`}>
        <span className="toiloki-input-icon">{icon}</span>
        <input className="toiloki-input with-icon" {...props} />
      </div>
    );
  }
  return <input className={`toiloki-input ${className}`} {...props} />;
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select: React.FC<SelectProps> = ({ className = '', children, ...props }) => {
  return (
    <select className={`toiloki-select ${className}`} {...props}>
      {children}
    </select>
  );
};
