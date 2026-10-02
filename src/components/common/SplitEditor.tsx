import React from 'react';
import { ArrowLeftRight, Copy, Check, Trash2, Download } from 'lucide-react';
import './SplitEditor.css';

interface SplitEditorProps {
  // Toolbar
  toolbarOptions?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
  };
  onClear?: () => void;
  onCopy?: () => void;
  onSwap?: () => void;
  onSave?: () => void;
  copied?: boolean;

  // Panes
  inputLabel?: string;
  inputMeta?: string;
  inputValue: string;
  onInputChange: (val: string) => void;
  inputPlaceholder?: string;

  outputLabel?: string;
  outputMeta?: string;
  outputValue: string;
  onOutputChange?: (val: string) => void;
  outputPlaceholder?: string;

  // Status Bar
  stats?: string; // e.g. "27 words • 181 chars • 5 lines"
}

export const SplitEditor: React.FC<SplitEditorProps> = ({
  toolbarOptions,
  primaryAction,
  onClear,
  onCopy,
  onSwap,
  onSave,
  copied = false,
  inputLabel = 'Input',
  inputMeta,
  inputValue,
  onInputChange,
  inputPlaceholder = 'Enter or paste text here...',
  outputLabel = 'Output',
  outputMeta,
  outputValue,
  onOutputChange,
  outputPlaceholder = 'Output will appear here...',
  stats,
}) => {
  const [fadeOutput, setFadeOutput] = React.useState(false);
  const [swapRotated, setSwapRotated] = React.useState(false);
  const prevOutputRef = React.useRef(outputValue);

  // 120ms fade when output pane content updates (skip if > 50KB)
  React.useEffect(() => {
    if (outputValue && outputValue !== prevOutputRef.current) {
      prevOutputRef.current = outputValue;
      if (outputValue.length <= 51200) {
        setFadeOutput(true);
        const timer = setTimeout(() => setFadeOutput(false), 120);
        return () => clearTimeout(timer);
      }
    }
  }, [outputValue]);

  const handleSwapClick = () => {
    setSwapRotated((prev) => !prev);
    onSwap?.();
  };

  const inputLineCount = inputValue ? inputValue.split('\n').length : 1;
  const outputLineCount = outputValue ? outputValue.split('\n').length : 1;

  // Generate line number strings
  const inputLineNumbers = Array.from({ length: inputLineCount }, (_, i) => i + 1).join('\n');
  const outputLineNumbers = Array.from({ length: outputLineCount }, (_, i) => i + 1).join('\n');

  return (
    <div className="split-editor-wrapper">
      {/* ─── ONE Toolbar Row: Options Left, Actions Right ─── */}
      <div className="split-editor-toolbar">
        <div className="toolbar-left-options">{toolbarOptions}</div>

        <div className="toolbar-right-actions">
          {onClear && (
            <button
              type="button"
              className="toiloki-btn toiloki-btn-ghost toiloki-btn-compact"
              onClick={onClear}
              title="Clear text"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}

          {onCopy && (
            <button
              type="button"
              className="toiloki-btn toiloki-btn-secondary toiloki-btn-compact"
              onClick={onCopy}
              disabled={!outputValue && !inputValue}
              title="Copy output"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          {onSave && (
            <button
              type="button"
              className="toiloki-btn toiloki-btn-secondary toiloki-btn-compact"
              onClick={onSave}
              disabled={!outputValue}
              title="Export / Download"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          )}

          {primaryAction && (
            <button
              type="button"
              className="toiloki-btn toiloki-btn-primary toiloki-btn-compact"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Split Panes of Equal Width Filling Remaining Height ─── */}
      <div className="split-editor-panes">
        {/* Input Pane */}
        <div className="editor-pane">
          <div className="editor-pane-header">
            <span className="editor-pane-title">{inputLabel}</span>
            {inputMeta && <span className="editor-pane-meta">{inputMeta}</span>}
          </div>
          <div className="editor-content-area">
            <div className="editor-line-numbers" aria-hidden="true">
              <pre>{inputLineNumbers}</pre>
            </div>
            <textarea
              className="editor-textarea"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={inputPlaceholder}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Small Icon-Only Swap Button Between Panes (rotates 180deg over 200ms) */}
        {onSwap && (
          <button
            type="button"
            className={`pane-swap-btn ${swapRotated ? 'rotated' : ''}`}
            onClick={handleSwapClick}
            title="Swap input and output"
            aria-label="Swap input and output"
          >
            <ArrowLeftRight size={13} />
          </button>
        )}

        {/* Output Pane */}
        <div className="editor-pane">
          <div className="editor-pane-header">
            <span className="editor-pane-title">{outputLabel}</span>
            {outputMeta && <span className="editor-pane-meta">{outputMeta}</span>}
          </div>
          <div className="editor-content-area">
            <div className="editor-line-numbers" aria-hidden="true">
              <pre>{outputLineNumbers}</pre>
            </div>
            <textarea
              className={`editor-textarea ${fadeOutput ? 'output-content-fade' : ''}`}
              value={outputValue}
              onChange={onOutputChange ? (e) => onOutputChange(e.target.value) : undefined}
              readOnly={!onOutputChange}
              placeholder={outputPlaceholder}
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* ─── 28px Status Bar with Inline Stats ─── */}
      {stats && (
        <div className="split-editor-status-bar">
          <span className="editor-stats-text">{stats}</span>
        </div>
      )}
    </div>
  );
};
