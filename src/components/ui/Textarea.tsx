import React, { forwardRef, useEffect, useRef } from 'react';
import './Textarea.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoGrow?: boolean;
  mono?: boolean;
  isInvalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  autoGrow = false,
  mono = false,
  isInvalid = false,
  className = '',
  disabled,
  value,
  onChange,
  ...props
}, ref) => {
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (autoGrow && localRef.current) {
      localRef.current.style.height = 'auto';
      const scrollHeight = localRef.current.scrollHeight;
      localRef.current.style.height = `${Math.max(160, scrollHeight)}px`;
    }
  }, [value, autoGrow]);

  return (
    <textarea
      ref={(node) => {
        localRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={`toiloki-textarea ${mono ? 'is-mono' : ''} ${isInvalid ? 'is-invalid' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      disabled={disabled}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
