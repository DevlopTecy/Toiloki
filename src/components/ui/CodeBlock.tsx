import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import './CodeBlock.css';

export interface CodeBlockProps {
  code: string;
  language?: string;
  lineNumbers?: boolean;
  maxHeight?: number | string;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  lineNumbers = false,
  maxHeight = 360,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lines = code.split('\n');

  return (
    <div className={`toiloki-codeblock-wrapper ${className}`}>
      <div className="toiloki-codeblock-header">
        {language && <span className="toiloki-codeblock-lang">{language}</span>}
        <button
          type="button"
          className={`toiloki-codeblock-copy ${copied ? 'is-copied' : ''}`}
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div
        className="toiloki-codeblock-body"
        style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}
      >
        {lineNumbers ? (
          <div className="toiloki-codeblock-numbered">
            <div className="toiloki-codeblock-gutter" aria-hidden="true">
              {lines.map((_, i) => (
                <span key={i} className="toiloki-codeblock-line-no">
                  {i + 1}
                </span>
              ))}
            </div>
            <pre className="toiloki-codeblock-pre">
              <code>{code}</code>
            </pre>
          </div>
        ) : (
          <pre className="toiloki-codeblock-pre">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
};
