import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ImageSurface } from './ImageSurface';
import { getDefaultArtwork } from '../../assets/art-pack/default-art-pack';
import { useTheme } from '../../core/theme/ThemeContext';
import { CardPictureConfig } from '../../core/theme/theme.types';
import './ImageCard.css';

export interface ImageCardProps {
  id: string;
  title: string;
  description: string;
  toolCount: number;
  tooltip?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  categoryColor: string;
  cardStyle?: 'flat' | 'image';
  pictureConfig?: CardPictureConfig;
  onClick: () => void;
  className?: string;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  id,
  title,
  description,
  toolCount,
  tooltip,
  icon: Icon,
  categoryColor,
  cardStyle = 'flat',
  pictureConfig,
  onClick,
  className = '',
}) => {
  const { resolvedMode, activeTheme } = useTheme();

  // If High Contrast theme is active, force flat style per spec
  const isHighContrast = activeTheme.id === 'high-contrast';
  const effectiveStyle = isHighContrast ? 'flat' : cardStyle;

  // If Flat style, render the clean flat card matching the exact original design
  if (effectiveStyle === 'flat') {
    return (
      <div
        className={`category-card ${className}`.trim()}
        title={description}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onClick();
        }}
      >
        <div className="category-card-top">
          <div className={`category-icon-tile ${id}`}>
            <Icon size={20} />
          </div>
          <div className="category-meta-right">
            <span className="category-tool-pill" title={tooltip || `${toolCount} utilities`}>
              {toolCount} utilities
            </span>
          </div>
        </div>

        <div className="category-card-content">
          <h3 className="category-title">{title}</h3>
          <p className="category-desc">{description}</p>
        </div>
      </div>
    );
  }

  // ─── Image Style Card Treatment ───
  const defaultArt = getDefaultArtwork(id, resolvedMode);
  const activeImage = pictureConfig?.assetId || defaultArt;
  const imagePosition = pictureConfig?.position || 'right';
  const imageScale = pictureConfig?.scale || 1.0;
  const imageOpacity = pictureConfig?.opacity !== undefined
    ? pictureConfig.opacity
    : (resolvedMode === 'light' ? 0.55 : 1.0);
  const scrimStrength = pictureConfig?.scrim || 0.85;
  const enableTint = pictureConfig?.tint ?? false;

  return (
    <ImageSurface
      as="div"
      className={`image-card-launcher ${className}`.trim()}
      imageUrl={activeImage}
      imagePosition={imagePosition}
      imageScale={imageScale}
      imageOpacity={imageOpacity}
      scrimStrength={scrimStrength}
      tintColor={categoryColor}
      enableTint={enableTint}
      interactive={true}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
      }}
      role="button"
      tabIndex={0}
      title={description}
      ariaLabel={`${title}, ${toolCount} utilities available`}
    >
      {/* Card Header: 56px Icon Tile + Tool Count Badge */}
      <div className="image-card-header">
        <div
          className="image-card-icon-tile"
          style={{
            background: `linear-gradient(180deg, color-mix(in srgb, ${categoryColor} 92%, white 8%) 0%, ${categoryColor} 100%)`,
          }}
        >
          <Icon size={24} />
        </div>

        <span className="image-card-badge" title={tooltip || `${toolCount} utilities`}>
          {toolCount} utilities
        </span>
      </div>

      {/* Card Body: Title 18px/600, Description 14px/400 (max 2 lines) */}
      <div className="image-card-body">
        <h3 className="image-card-title">{title}</h3>
        <p className="image-card-desc">{description}</p>
      </div>

      {/* Card Footer: 40px Circle Chevron Button */}
      <div className="image-card-footer">
        <div className="image-card-chevron-btn" aria-hidden="true">
          <ChevronRight size={18} className="image-card-chevron-icon" />
        </div>
      </div>
    </ImageSurface>
  );
};
