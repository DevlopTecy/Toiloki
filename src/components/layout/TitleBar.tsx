import React, { useEffect, useState } from 'react';
import { Minus, Square, Copy, X, Search } from 'lucide-react';
import './TitleBar.css';

interface TitleBarProps {
  onOpenSearch?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenSearch }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.toiloki?.windowControls) {
      window.toiloki.windowControls.isMaximized().then(setIsMaximized);
      const unsubscribe = window.toiloki.windowControls.onMaximizeChanged(setIsMaximized);
      return () => unsubscribe();
    }
  }, []);

  const handleMinimize = () => window.toiloki?.windowControls?.minimize();
  const handleMaximize = () => window.toiloki?.windowControls?.maximize();
  const handleClose = () => window.toiloki?.windowControls?.close();

  return (
    <header className="title-bar drag-region">
      <div className="title-bar-left no-drag">
        <div className="app-logo-badge">
          <span>T</span>
        </div>
        <span className="app-wordmark">TOILOKI</span>
        <span className="app-suite-caption">LOCAL SUITE</span>
      </div>

      <div className="title-bar-center no-drag">
        {onOpenSearch ? (
          <button className="titlebar-search-trigger" onClick={onOpenSearch} title="Quick search (Ctrl+K)">
            <Search size={12} className="titlebar-search-icon" />
            <span className="titlebar-search-text">Search utilities...</span>
            <kbd className="titlebar-kbd">Ctrl K</kbd>
          </button>
        ) : (
          <div className="titlebar-center-status">
            <span className="status-dot-active" />
            <span>Local Suite • Offline Verified</span>
          </div>
        )}
      </div>

      <div className="title-bar-controls no-drag">
        <button
          className="window-control-btn minimize"
          onClick={handleMinimize}
          title="Minimize"
          aria-label="Minimize"
        >
          <Minus size={13} />
        </button>
        <button
          className="window-control-btn maximize"
          onClick={handleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
          aria-label={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? <Copy size={11} /> : <Square size={11} />}
        </button>
        <button
          className="window-control-btn close"
          onClick={handleClose}
          title="Close"
          aria-label="Close"
        >
          <X size={13} />
        </button>
      </div>
    </header>
  );
};
