import React, { useState } from 'react';
import './ImageSurface.css';

export interface ImageSurfaceProps {
  as?: 'div' | 'article' | 'section' | 'button';
  className?: string;
  style?: React.CSSProperties;
  imageUrl?: string;
  imagePosition?: 'left' | 'center' | 'right';
  imageScale?: number;
  imageOpacity?: number;
  scrimStrength?: number; // 0.60 to 1.0 (default ~0.85)
  tintColor?: string;
  enableTint?: boolean;
  interactive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  tabIndex?: number;
  role?: string;
  title?: string;
  ariaLabel?: string;
}

export const ImageSurface: React.FC<ImageSurfaceProps> = ({
  as: Component = 'div',
  className = '',
  style = {},
  imageUrl,
  imagePosition = 'right',
  imageScale = 1.0,
  imageOpacity,
  scrimStrength = 0.85,
  tintColor,
  enableTint = false,
  interactive = false,
  disabled = false,
  children,
  onClick,
  onKeyDown,
  tabIndex,
  role,
  title,
  ariaLabel,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Compute CSS custom variables for dynamic scrim and scale
  const artScrimArtOpacity = Math.max(0, (1 - scrimStrength) * 0.5);
  const dynamicStyles: React.CSSProperties = {
    ...style,
    ['--scrim-strength-art' as any]: artScrimArtOpacity.toString(),
  };

  const hasValidImage = Boolean(imageUrl && !imageError);

  return (
    <Component
      className={`image-surface ${interactive ? 'is-interactive' : ''} ${className}`.trim()}
      style={dynamicStyles}
      onClick={disabled ? undefined : onClick}
      onKeyDown={disabled ? undefined : onKeyDown}
      tabIndex={interactive && !disabled ? (tabIndex ?? 0) : undefined}
      role={role}
      title={title}
      aria-label={ariaLabel}
      aria-disabled={disabled}
    >
      {/* ─── Layer 2: Artwork (Lazy, Async Decoding) ─── */}
      {hasValidImage && (
        <div className={`image-surface-artwork-wrap pos-${imagePosition}`}>
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            decoding="async"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`image-surface-artwork-img ${imageLoaded ? 'is-loaded' : ''}`}
            style={{
              transform: `scale(${imageScale})`,
              opacity: imageOpacity !== undefined ? imageOpacity : undefined,
            }}
          />
        </div>
      )}

      {/* ─── Layer 3: Mandatory Readability Scrim (Left-to-Right) ─── */}
      {hasValidImage && (
        <div
          className="image-surface-scrim"
          aria-hidden="true"
          style={{
            opacity: scrimStrength,
          }}
        />
      )}

      {/* ─── Layer 4: Category Tint Overlay (8-12%) ─── */}
      {hasValidImage && enableTint && tintColor && (
        <div
          className="image-surface-tint"
          aria-hidden="true"
          style={{
            backgroundColor: tintColor,
          }}
        />
      )}

      {/* ─── Layer 5: Content Layer ─── */}
      <div className="image-surface-content">
        {children}
      </div>
    </Component>
  );
};
