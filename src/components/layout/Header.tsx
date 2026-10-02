import React from 'react';
import { Search } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSearchModal: () => void;
  showHeroBanner?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenSearchModal,
  showHeroBanner = true,
}) => {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="header-headline-wrap">
          <h1 className="hero-title">Local Utility Suite</h1>
          <p className="hero-subtitle">Fast, offline, deterministic tools running entirely on your machine.</p>
        </div>

        <div className="header-search-container" onClick={onOpenSearchModal} role="button" tabIndex={0}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tools and converters... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="search-shortcut-badge">
            <span>Ctrl K</span>
          </div>
        </div>
      </div>
    </header>
  );
};
