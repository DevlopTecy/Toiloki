import React from 'react';
import { Button, ButtonProps } from './Button';
import './ImageButton.css';

export interface ImageButtonProps extends ButtonProps {
  skinImage?: string;
  scrimStrength?: number;
}

export const ImageButton: React.FC<ImageButtonProps> = ({
  skinImage,
  scrimStrength = 0.70,
  children,
  className = '',
  style = {},
  variant = 'primary',
  ...props
}) => {
  if (!skinImage || variant !== 'primary') {
    return (
      <Button variant={variant} className={className} style={style} {...props}>
        {children}
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      className={`toiloki-btn-with-skin ${className}`.trim()}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden',
      }}
      {...props}
    >
      {/* Background skin layer */}
      <span
        className="btn-skin-layer"
        aria-hidden="true"
        style={{
          backgroundImage: `url('${skinImage}')`,
        }}
      />
      {/* Contrast scrim */}
      <span
        className="btn-skin-scrim"
        aria-hidden="true"
        style={{
          opacity: scrimStrength,
        }}
      />
      {/* Centered label */}
      <span className="btn-skin-label">
        {children}
      </span>
    </Button>
  );
};
