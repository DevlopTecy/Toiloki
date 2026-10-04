import React, { useEffect, useState } from 'react';
import { Minus, Square, Copy, X, Search, Clipboard, Link } from 'lucide-react';
import { ToilokiLogo } from '../common/ToilokiLogo';
import './TitleBar.css';

interface TitleBarProps {
  onOpenSearch?: () => void;
  onOpenSmartPaste?: () => void;
  onOpenChains?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  onOpenSearch,
  onOpenSmartPaste,
  onOpenChains,
}) => {
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
        <ToilokiLogo variant="symbol" size={18} />
        <span className="app-wordmark">Toiloki</span>
        <span className="app-suite-caption">Local Utility Suite</span>
      </div>

      <div className="title-bar-center no-drag" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {onOpenSearch && (
          <button className="titlebar-search-trigger" onClick={onOpenSearch} title="Quick search (Ctrl+K)">
            <Search size={12} className="titlebar-search-icon" />
            <span className="titlebar-search-text">Search utilities...</span>
            <kbd className="titlebar-kbd">Ctrl K</kbd>
          </button>
        )}
        {onOpenSmartPaste && (
          <button
            className="titlebar-search-trigger"
            onClick={onOpenSmartPaste}
            title="Smart Paste (Ctrl+Shift+V)"
            style={{ padding: '4px 8px' }}
          >
            <Clipboard size={12} style={{ color: 'var(--color-accent)' }} />
            <span className="titlebar-search-text" style={{ fontSize: '11px' }}>Smart Paste</span>
            <kbd className="titlebar-kbd">Ctrl+Shift+V</kbd>
          </button>
        )}
        {onOpenChains && (
          <button
            className="titlebar-search-trigger"
            onClick={onOpenChains}
            title="Chains & Presets"
            style={{ padding: '4px 8px' }}
          >
            <Link size={12} style={{ color: 'var(--color-accent)' }} />
            <span className="titlebar-search-text" style={{ fontSize: '11px' }}>Chains</span>
          </button>
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
