import React from 'react';
import './ToilokiLogo.css';

export interface ToilokiLogoProps {
  /** Logo presentation style */
  variant?: 'symbol' | 'horizontal' | 'app-icon' | 'badge';
  /** Preset or custom size in pixels */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Force a theme or auto-detect from active app theme */
  theme?: 'auto' | 'dark' | 'light';
  /** Show the subtitle in horizontal lockup */
  showSubtitle?: boolean;
  /** Subtitle text override */
  subtitleText?: string;
  /** Optional custom CSS class name */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

const SIZE_MAP = {
  xs: 16,
  sm: 20,
  md: 28,
  lg: 40,
  xl: 64,
};

/**
 * Geometric Dimensional "T" Symbol SVG component
 * Uses pure SVG gradients for warm orange & amber tones with dimensional fold finish.
 */
export const ToilokiSymbolSvg: React.FC<{ size?: number; className?: string; idPrefix?: string }> = ({
  size = 28,
  className = '',
  idPrefix = 'tk',
}) => {
  const stemGradId = `${idPrefix}-stem-grad`;
  const leftArmGradId = `${idPrefix}-left-grad`;
  const rightArmGradId = `${idPrefix}-right-grad`;
  const creaseFilterId = `${idPrefix}-crease-filter`;
  const stemFilterId = `${idPrefix}-stem-filter`;
  const rimGradId = `${idPrefix}-rim-grad`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`toiloki-symbol-svg ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Vertical Stem: Warm Amber to Rich Deep Orange/Crimson */}
        <linearGradient id={stemGradId} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFA726" />
          <stop offset="35%" stopColor="#FB8C00" />
          <stop offset="70%" stopColor="#F4511E" />
          <stop offset="100%" stopColor="#BF360C" />
        </linearGradient>

        {/* Left Pill Arm: Warm Burnt Orange/Amber */}
        <linearGradient id={leftArmGradId} x1="0%" y1="20%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#BF360C" />
          <stop offset="30%" stopColor="#D84315" />
          <stop offset="100%" stopColor="#F4511E" />
        </linearGradient>

        {/* Right Overlapping Pill Arm: Radiant Amber Gold */}
        <linearGradient id={rightArmGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD54F" />
          <stop offset="40%" stopColor="#FFA726" />
          <stop offset="100%" stopColor="#F4511E" />
        </linearGradient>

        {/* Overlapping Facet Crease Shadow */}
        <filter id={creaseFilterId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-2.5" dy="2" stdDeviation="2.5" floodColor="#3E1103" floodOpacity="0.55" />
        </filter>

        {/* Crossbar Drop Shadow onto Stem */}
        <filter id={stemFilterId} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="2.5" floodColor="#3E1103" floodOpacity="0.45" />
        </filter>

        {/* Top Edge Rim Highlight */}
        <linearGradient id={rimGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* 1. Vertical Stem */}
      <rect x="37" y="24" width="26" height="64" rx="13" fill={`url(#${stemGradId})`} />

      {/* 2. Ambient Occlusion under crossbar */}
      <path d="M 37 39 L 63 39 L 63 49 C 63 45 50 43 37 46 Z" fill="#2E0E03" opacity="0.45" />

      {/* 3. Left Pill Arm */}
      <path
        d="M 24 13 L 50 13 L 50 39 L 24 39 C 16.8 39 11 33.2 11 26 C 11 18.8 16.8 13 24 13 Z"
        fill={`url(#${leftArmGradId})`}
        filter={`url(#${stemFilterId})`}
      />

      {/* 4. Right Overlapping Pill Arm with curved inner boundary */}
      <path
        d="M 47 13 L 76 13 C 83.2 13 89 18.8 89 26 C 89 33.2 83.2 39 76 39 L 39 39 C 47.5 32 48 20 47 13 Z"
        fill={`url(#${rightArmGradId})`}
        filter={`url(#${creaseFilterId})`}
      />

      {/* 5. Subtle Top Rim Highlight */}
      <path
        d="M 24 13.5 L 76 13.5 C 82.8 13.5 88.5 19 88.5 26 C 88.5 27 88.3 27.9 88 28.8 C 86.3 20 81 15 74.5 15 L 25.5 15 C 19 15 13.7 20 12 28.8 C 11.7 27.9 11.5 27 11.5 26 C 11.5 19 17.2 13.5 24 13.5 Z"
        fill={`url(#${rimGradId})`}
      />
    </svg>
  );
};

/**
 * Official Toiloki Brand Logo Component
 */
export const ToilokiLogo: React.FC<ToilokiLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  theme = 'auto',
  showSubtitle = true,
  subtitleText = 'LOCAL UTILITY SUITE',
  className = '',
  onClick,
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 28;
  const uniqueId = React.useId().replace(/:/g, '');

  // 1. Symbol Only
  if (variant === 'symbol') {
    return (
      <div
        className={`toiloki-logo-symbol-wrap theme-${theme} ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
        onClick={onClick}
        role="img"
        aria-label="Toiloki Symbol"
      >
        <ToilokiSymbolSvg size={pixelSize} idPrefix={`tk-sym-${uniqueId}`} />
      </div>
    );
  }

  // 2. App Icon (Squircle container)
  if (variant === 'app-icon') {
    return (
      <div
        className={`toiloki-logo-app-icon theme-${theme} ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
        onClick={onClick}
        role="img"
        aria-label="Toiloki App Icon"
      >
        <div className="toiloki-squircle-inner">
          <ToilokiSymbolSvg size={Math.round(pixelSize * 0.65)} idPrefix={`tk-ico-${uniqueId}`} />
        </div>
      </div>
    );
  }

  // 3. Compact Badge (for TitleBar)
  if (variant === 'badge') {
    return (
      <div
        className={`toiloki-logo-badge theme-${theme} ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
        onClick={onClick}
        role="img"
        aria-label="Toiloki Badge"
      >
        <ToilokiSymbolSvg size={pixelSize} idPrefix={`tk-bdg-${uniqueId}`} />
      </div>
    );
  }

  // 4. Horizontal Lockup (Default)
  const iconSize = Math.round(pixelSize * 0.9);
  const titleSize = Math.max(12, Math.round(pixelSize * 0.72));
  const subSize = Math.max(7.5, Math.round(titleSize * 0.32));

  return (
    <div
      className={`toiloki-logo-horizontal theme-${theme} ${className}`}
      onClick={onClick}
      role="img"
      aria-label="Toiloki - Local Utility Suite"
    >
      <div className="toiloki-logo-icon-slot" style={{ width: iconSize, height: iconSize }}>
        <ToilokiSymbolSvg size={iconSize} idPrefix={`tk-hz-${uniqueId}`} />
      </div>

      <div className="toiloki-logo-text-slot">
        <span className="toiloki-wordmark-title" style={{ fontSize: `${titleSize}px` }}>
          TOILOKI
        </span>
        {showSubtitle && (
          <span className="toiloki-wordmark-subtitle" style={{ fontSize: `${subSize}px` }}>
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
};
