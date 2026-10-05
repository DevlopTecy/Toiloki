import React, { useEffect, useState } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { ToilokiLogo } from '../common/ToilokiLogo';
import { EcommerceSearchBar } from '../search/EcommerceSearchBar';
import { WorkspaceId } from '../../core/types/workspace';
import './TitleBar.css';

interface TitleBarProps {
  onSelectUtility: (
    workspaceId: WorkspaceId,
    groupId: string,
    utilityId: string,
    featureId?: string,
    openInNewTab?: boolean
  ) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onSelectUtility }) => {
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
      {/* ─── Left Section: Logo + Toiloki only ─── */}
      <div className="title-bar-left no-drag">
        <ToilokiLogo variant="symbol" size={18} />
        <span className="app-wordmark">Toiloki</span>
      </div>

      {/* ─── Center Section: E-Commerce Style Search ─── */}
      <div className="title-bar-center no-drag">
        <EcommerceSearchBar onSelectUtility={onSelectUtility} />
      </div>

      {/* ─── Right Section: Window Controls ─── */}
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
