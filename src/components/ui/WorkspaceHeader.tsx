import React, { useState, useRef, useEffect } from 'react';
import { Star, Info, MoreHorizontal, RotateCcw } from 'lucide-react';
import './WorkspaceHeader.css';

export interface WorkspaceHeaderProps {
  breadcrumb: string[]; // e.g. ['Security & Privacy', 'Credentials', 'Password Generator']
  title: string;
  description: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onReset?: () => void;
  onInfoClick?: () => void;
  rightSlot?: React.ReactNode;
  className?: string;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  breadcrumb,
  title,
  description,
  isFavorite = false,
  onToggleFavorite,
  onReset,
  onInfoClick,
  rightSlot,
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className={`toiloki-ws-header ${className}`} role="banner">
      <div className="toiloki-ws-header-left">
        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <nav className="toiloki-ws-breadcrumb" aria-label="Breadcrumb">
            {breadcrumb.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="toiloki-ws-breadcrumb-sep">/</span>}
                <span className="toiloki-ws-breadcrumb-item">{item}</span>
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title row */}
        <div className="toiloki-ws-title-row">
          <h1 className="toiloki-ws-title">{title}</h1>

          {/* Star favorite */}
          {onToggleFavorite && (
            <button
              type="button"
              className={`toiloki-ws-icon-btn ${isFavorite ? 'is-favorited' : ''}`}
              onClick={onToggleFavorite}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              title={isFavorite ? 'Favorited' : 'Favorite'}
            >
              <Star size={16} fill={isFavorite ? 'var(--accent)' : 'none'} />
            </button>
          )}

          {/* (i) Info */}
          {onInfoClick && (
            <button
              type="button"
              className="toiloki-ws-icon-btn"
              onClick={onInfoClick}
              aria-label="View utility documentation and details"
              title="Information"
            >
              <Info size={16} />
            </button>
          )}

          {/* ... Menu */}
          {onReset && (
            <div className="toiloki-ws-menu-container" ref={menuRef}>
              <button
                type="button"
                className="toiloki-ws-icon-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Utility options"
                aria-expanded={isMenuOpen}
              >
                <MoreHorizontal size={16} />
              </button>

              {isMenuOpen && (
                <div className="toiloki-ws-menu-dropdown">
                  <button
                    type="button"
                    className="toiloki-ws-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onReset();
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Reset to defaults</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description line */}
        <p className="toiloki-ws-desc">{description}</p>
      </div>

      {rightSlot && <div className="toiloki-ws-header-right">{rightSlot}</div>}
    </header>
  );
};
