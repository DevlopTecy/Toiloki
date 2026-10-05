import React from 'react';
import { Trash2 } from 'lucide-react';
import './CalcKeypad.css';

interface CalcKeypadProps {
  expression?: string;
  displayValue: string;
  onKeyPress: (key: string) => void;
  history?: string[];
  onClearHistory?: () => void;
  onSelectHistory?: (item: string) => void;
  scientific?: boolean;
}

export const CalcKeypad: React.FC<CalcKeypadProps> = ({
  expression,
  displayValue,
  onKeyPress,
  history = [],
  onClearHistory,
  onSelectHistory,
  scientific = false,
}) => {
  const [fadeDisplay, setFadeDisplay] = React.useState(false);
  const prevDisplayRef = React.useRef(displayValue);

  // 100ms fade of previous value on change
  React.useEffect(() => {
    if (displayValue !== prevDisplayRef.current) {
      prevDisplayRef.current = displayValue;
      setFadeDisplay(true);
      const timer = setTimeout(() => setFadeDisplay(false), 100);
      return () => clearTimeout(timer);
    }
  }, [displayValue]);

  // Keyboard event listener for numbers, operators, Enter, Backspace, Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an active input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        onKeyPress(e.key);
      } else if (e.key === '.') {
        onKeyPress('.');
      } else if (e.key === '+') {
        onKeyPress('+');
      } else if (e.key === '-') {
        onKeyPress('−');
      } else if (e.key === '*') {
        onKeyPress('×');
      } else if (e.key === '/') {
        e.preventDefault();
        onKeyPress('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        onKeyPress('=');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        onKeyPress('⌫');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onKeyPress('C');
      } else if (e.key === '%') {
        onKeyPress('%');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress]);

  const formattedDisplay = React.useMemo(() => {
    if (!displayValue || displayValue === 'Error' || displayValue === 'Cannot divide by zero') {
      return displayValue;
    }
    const num = Number(displayValue);
    if (!isNaN(num) && isFinite(num) && !displayValue.endsWith('.')) {
      const parts = displayValue.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
    return displayValue;
  }, [displayValue]);

  const standardKeys = [
    ['C', 'CE', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['±', '0', '.', '='],
  ];

  const getKeyType = (key: string) => {
    if (key === '=') return 'key-equals';
    if (['+', '−', '×', '÷', '%'].includes(key)) return 'key-operator';
    if (['C', 'CE', '⌫'].includes(key)) return 'key-clear';
    return 'key-digit';
  };

  return (
    <div className="calc-template-container">
      {/* ─── Calculator Card (Max-width 360px) ─── */}
      <div className="calc-card">
        {/* Display: Expression above, 40px right-aligned tabular numbers */}
        <div className="calc-display-wrap">
          <div className="calc-expression-line">{expression || '\u00A0'}</div>
          <div className={`calc-main-display ${fadeDisplay ? 'display-value-fade' : ''}`}>
            {formattedDisplay}
          </div>
        </div>

        {/* Keypad: 56px high, 8px gap, 10px radius */}
        <div className="calc-grid">
          {standardKeys.map((row, rIdx) => (
            <div key={rIdx} className="calc-row">
              {row.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`calc-key ${getKeyType(k)}`}
                  onClick={() => onKeyPress(k)}
                >
                  {k}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── History: 320px Right Panel with Sans "History" Header & Clear Button ─── */}
      <div className="calc-history-panel">
        <div className="calc-history-header">
          <h3 className="calc-history-title">History</h3>
          {history.length > 0 && onClearHistory && (
            <button
              type="button"
              className="toiloki-btn toiloki-btn-ghost toiloki-btn-compact"
              onClick={onClearHistory}
              title="Clear calculation history"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="calc-history-list">
          {history.length > 0 ? (
            history.map((item, idx) => (
              <div
                key={idx}
                className="calc-history-item"
                onClick={() => onSelectHistory?.(item)}
                role="button"
                tabIndex={0}
              >
                <span>{item}</span>
              </div>
            ))
          ) : (
            <div className="calc-history-empty">
              <span>No calculation history</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
