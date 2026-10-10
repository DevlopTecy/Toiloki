import React from 'react';
import './Field.css';

export interface FieldProps {
  label?: string;
  htmlFor?: string;
  helpText?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  helpText,
  error,
  required = false,
  className = '',
  children,
}) => {
  return (
    <div className={`toiloki-field ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <div className="toiloki-field-header">
          <label className="toiloki-field-label" htmlFor={htmlFor}>
            {label}
            {required && <span className="toiloki-field-required" aria-hidden="true">*</span>}
          </label>
        </div>
      )}
      <div className="toiloki-field-control">
        {children}
      </div>
      {error ? (
        <div className="toiloki-field-error" role="alert">
          {error}
        </div>
      ) : helpText ? (
        <div className="toiloki-field-help">
          {helpText}
        </div>
      ) : null}
    </div>
  );
};
