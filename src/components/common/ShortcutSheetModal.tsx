import React, { useEffect } from 'react';
import { X, Keyboard, Search, Play, Copy, FolderOpen, Save, Plus, ArrowRight, CornerDownLeft } from 'lucide-react';
import './ShortcutSheetModal.css';

interface ShortcutSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'General' | 'Execution' | 'Navigation' | 'Tabs';
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['Ctrl', 'K'], description: 'Omnisearch / Command Palette', category: 'General' },
  { keys: ['Ctrl', 'Shift', 'V'], description: 'Smart Paste sniffer', category: 'General' },
  { keys: ['?'], description: 'Open this keyboard shortcut cheatsheet', category: 'General' },
  { keys: ['Esc'], description: 'Close modals, overlays, or active dialog', category: 'General' },
  
  { keys: ['Ctrl', 'Enter'], description: 'Run or process active utility', category: 'Execution' },
  { keys: ['Ctrl', 'Shift', 'C'], description: 'Copy result text or output to clipboard', category: 'Execution' },
  { keys: ['Ctrl', 'O'], description: 'Open file / trigger file picker', category: 'Execution' },
  { keys: ['Ctrl', 'S'], description: 'Save processed output result', category: 'Execution' },

  { keys: ['Ctrl', 'T'], description: 'Open new workspace tab', category: 'Tabs' },
  { keys: ['Ctrl', 'W'], description: 'Close active tab', category: 'Tabs' },
];

export const ShortcutSheetModal: React.FC<ShortcutSheetModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: Array<'General' | 'Execution' | 'Tabs'> = ['General', 'Execution', 'Tabs'];

  return (
    <div className="shortcut-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Keyboard Shortcuts">
      <div className="shortcut-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="shortcut-modal-header">
          <div className="shortcut-title-group">
            <div className="shortcut-header-icon-wrap">
              <Keyboard size={16} />
            </div>
            <div>
              <h3 className="shortcut-modal-title">Keyboard Shortcuts</h3>
              <p className="shortcut-modal-subtitle">Fast navigation and workflow controls for power users</p>
            </div>
          </div>
          <button className="shortcut-close-btn" onClick={onClose} aria-label="Close shortcuts">
            <X size={15} />
          </button>
        </div>

        <div className="shortcut-modal-body">
          {categories.map((cat) => {
            const items = SHORTCUTS.filter((s) => s.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat} className="shortcut-category-block">
                <h4 className="shortcut-category-title">{cat}</h4>
                <div className="shortcut-rows-list">
                  {items.map((item, idx) => (
                    <div key={idx} className="shortcut-row">
                      <span className="shortcut-desc">{item.description}</span>
                      <div className="shortcut-keys-group">
                        {item.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd className="shortcut-kbd">{k}</kbd>
                            {kIdx < item.keys.length - 1 && <span className="shortcut-plus">+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="shortcut-modal-footer">
          <span className="shortcut-footer-hint">Press <kbd className="shortcut-kbd-inline">Esc</kbd> or click outside to dismiss</span>
        </div>
      </div>
    </div>
  );
};
