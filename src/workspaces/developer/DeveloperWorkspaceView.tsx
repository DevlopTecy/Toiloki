import React, { useState, useEffect, useMemo } from 'react';
import { ToolLayout } from '../../components/common/ToolLayout';
import { DevEngine } from '../../engines/developer/dev.engine';
import {
  Copy,
  Check,
  RefreshCw,
  Globe,
  Key,
  Search,
  ExternalLink,
  Download,
  Trash2,
  Code,
  Layers,
  Sparkles,
} from 'lucide-react';
import { HistoryService } from '../../core/services/history.service';
import { SplitEditor } from '../../components/common/SplitEditor';
import './DeveloperWorkspaceView.css';

interface DeveloperWorkspaceViewProps {
  utilityId: string;
  featureId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const DeveloperWorkspaceView: React.FC<DeveloperWorkspaceViewProps> = ({
  utilityId,
  featureId,
  toolName,
  toolDescription,
  onBackToUtilities,
  isFavorite,
  onToggleFavorite,
}) => {
  // Code Formatter State
  const [codeSnippet, setCodeSnippet] = useState(
    '{"service":"Toiloki","version":"1.0.0","settings":{"localProcessing":true,"telemetry":false,"offlineOnly":true}}'
  );
  const [formattedCode, setFormattedCode] = useState('');
  const [jsonViewMode, setJsonViewMode] = useState<'formatted' | 'tree'>('formatted');
  const [copied, setCopied] = useState(false);

  // JWT Inspector State
  const [jwtInput, setJwtInput] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIE1vcmdhbiIsImFkbWluIjp0cnVlLCJpYXQiOjE3MjAwMDAwMDAsImV4cCI6MTg1MDAwMDAwMH0.signature'
  );
  const [jwtData, setJwtData] = useState<any>(null);

  // Encode / Decode State
  const [encodeInput, setEncodeInput] = useState(
    'https://toiloki.local/api/v1/query?tag=utility&lang=en'
  );
  const [encodeOutput, setEncodeOutput] = useState('');

  // Generators State
  const [uuidCount, setUuidCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const [randomStringLen, setRandomStringLen] = useState(16);
  const [randomStringResult, setRandomStringResult] = useState('');
  const [timestampInput, setTimestampInput] = useState(String(Math.floor(Date.now() / 1000)));
  const [timestampResult, setTimestampResult] = useState<string | null>(null);

  // Regex Tester State
  const [regexPattern, setRegexPattern] = useState(
    '([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})'
  );
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexText, setRegexText] = useState(
    'Contact the team at support@toiloki.local or sales-team@enterprise.org for offline licenses.'
  );
  const [regexMatches, setRegexMatches] = useState<any[]>([]);

  // HTTP Status Reference Search
  const [statusFilter, setStatusFilter] = useState('');

  const httpStatusCodes = [
    { code: 200, label: 'OK', desc: 'Standard successful HTTP response.' },
    {
      code: 201,
      label: 'Created',
      desc: 'Request fulfilled, resulting in the creation of a new resource.',
    },
    { code: 204, label: 'No Content', desc: 'Server fulfilled request, no payload returned.' },
    {
      code: 400,
      label: 'Bad Request',
      desc: 'Server cannot or will not process request due to client error.',
    },
    {
      code: 401,
      label: 'Unauthorized',
      desc: 'Authentication required and has failed or has not been provided.',
    },
    { code: 403, label: 'Forbidden', desc: 'Client does not have access rights to the content.' },
    { code: 404, label: 'Not Found', desc: 'Server cannot find requested resource.' },
    { code: 409, label: 'Conflict', desc: 'Request conflicts with current state of the server.' },
    { code: 422, label: 'Unprocessable Entity', desc: 'Semantic errors in request payload.' },
    {
      code: 500,
      label: 'Internal Server Error',
      desc: 'Generic error message when an unexpected condition was encountered.',
    },
    { code: 502, label: 'Bad Gateway', desc: 'Invalid response from upstream server.' },
    {
      code: 503,
      label: 'Service Unavailable',
      desc: 'Server is currently unable to handle request due to maintenance.',
    },
  ];

  useEffect(() => {
    if (featureId === 'dev-jwt') {
      const res = DevEngine.decodeJwt(jwtInput);
      if (res.success) setJwtData(res.data);
    } else if (featureId === 'gen-uuid') {
      const res = DevEngine.generateUuids(uuidCount);
      if (res.success && res.data) setUuids(res.data);
    } else if (featureId === 'regex-tester-feature') {
      const res = DevEngine.testRegex(regexPattern, regexFlags, regexText);
      if (res.success && res.data) setRegexMatches(res.data.matches);
    }
  }, [featureId]);

  const handleFormatCode = () => {
    try {
      if (featureId.includes('json') || codeSnippet.trim().startsWith('{') || codeSnippet.trim().startsWith('[')) {
        const parsed = JSON.parse(codeSnippet);
        setFormattedCode(JSON.stringify(parsed, null, 2));
      } else if (featureId.includes('sql')) {
        const formatted = codeSnippet
          .replace(/\bSELECT\b/gi, 'SELECT\n ')
          .replace(/\bFROM\b/gi, '\nFROM')
          .replace(/\bWHERE\b/gi, '\nWHERE')
          .replace(/\bAND\b/gi, '\n  AND')
          .replace(/\bORDER BY\b/gi, '\nORDER BY');
        setFormattedCode(formatted);
      } else {
        setFormattedCode(codeSnippet);
      }
      HistoryService.record({
        toolName,
        workspaceId: 'developer',
        utilityId,
        featureId,
        input: `${codeSnippet.length} chars`,
        output: 'Formatted code payload',
        status: 'completed',
      });
    } catch {
      setFormattedCode('Syntax error: Unable to parse snippet.');
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConvertTimestamp = () => {
    const num = Number(timestampInput);
    if (!isNaN(num)) {
      const date = new Date(num > 10000000000 ? num : num * 1000);
      setTimestampResult(
        `UTC: ${date.toUTCString()}\nISO 8601: ${date.toISOString()}\nLocal: ${date.toLocaleString()}`
      );
    }
  };

  const handleGenRandomString = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let res = '';
    for (let i = 0; i < randomStringLen; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRandomStringResult(res);
  };

  const lineNumbers = useMemo(() => {
    const count = codeSnippet.split('\n').length;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [codeSnippet]);

  const parsedJsonTree = useMemo(() => {
    try {
      return JSON.parse(formattedCode || codeSnippet);
    } catch {
      return null;
    }
  }, [formattedCode, codeSnippet]);

  const breadcrumbs = [
    { label: 'Home', onClick: onBackToUtilities },
    { label: 'Developer', onClick: onBackToUtilities },
    { label: toolName },
  ];

  return (
    <ToolLayout
      breadcrumbItems={breadcrumbs}
      title={toolName}
      description={toolDescription}
      badgeGradient="var(--badge-dev)"
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      onReset={() => {
        setCodeSnippet('');
        setFormattedCode('');
      }}
    >
      <div className="dev-tool-body">
        {/* Code Formatter & JSON using Template B SplitEditor */}
        {utilityId === 'dev-formatter' && (
          <SplitEditor
            toolbarOptions={
              <div className="segmented-chip-row">
                <button
                  type="button"
                  className={`segmented-chip-btn ${jsonViewMode === 'formatted' ? 'active' : ''}`}
                  onClick={() => setJsonViewMode('formatted')}
                >
                  Formatted
                </button>
                {parsedJsonTree && (
                  <button
                    type="button"
                    className={`segmented-chip-btn ${jsonViewMode === 'tree' ? 'active' : ''}`}
                    onClick={() => setJsonViewMode('tree')}
                  >
                    Tree View
                  </button>
                )}
              </div>
            }
            primaryAction={{
              label: 'Format Code',
              onClick: handleFormatCode,
            }}
            onClear={() => {
              setCodeSnippet('');
              setFormattedCode('');
            }}
            onCopy={() => handleCopy(formattedCode || codeSnippet)}
            onSave={() => handleDownload(formattedCode || codeSnippet, 'formatted.txt')}
            copied={copied}
            inputValue={codeSnippet}
            onInputChange={setCodeSnippet}
            inputLabel="Input Code"
            inputMeta={`${codeSnippet.split('\n').length} lines`}
            outputValue={formattedCode}
            onOutputChange={setFormattedCode}
            outputLabel="Formatted Output"
            outputMeta={`${formattedCode.split('\n').length} lines`}
            stats={`${codeSnippet.length} chars in • ${formattedCode ? formattedCode.length : 0} chars out`}
          />
        )}


        {/* JWT Inspector */}
        {featureId === 'dev-jwt' && (
          <div className="jwt-container">
            <div className="jwt-input-header">
              <span className="field-label">Encoded JWT Token:</span>
              <button
                className="tool-btn secondary small-btn"
                onClick={() => setJwtInput('')}
                type="button"
              >
                Clear
              </button>
            </div>
            <textarea
              className="monospace-code-editor jwt-input-area"
              value={jwtInput}
              onChange={(e) => {
                setJwtInput(e.target.value);
                const res = DevEngine.decodeJwt(e.target.value);
                if (res.success) setJwtData(res.data);
              }}
              placeholder="Paste encoded JWT here..."
            />

            {jwtData && (
              <div className="jwt-cards-grid">
                {/* Header card */}
                <div className="jwt-segment-card">
                  <div className="jwt-card-header">
                    <span className="jwt-card-badge">DECODED HEADER</span>
                    <button
                      className="copy-mini-btn"
                      onClick={() => handleCopy(JSON.stringify(jwtData.header, null, 2))}
                      type="button"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                  <pre className="jwt-code-pre">{JSON.stringify(jwtData.header, null, 2)}</pre>
                </div>

                {/* Payload card */}
                <div className="jwt-segment-card">
                  <div className="jwt-card-header">
                    <span className="jwt-card-badge">DECODED PAYLOAD</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {jwtData.isExpired !== undefined && (
                        <span className={`exp-badge ${jwtData.isExpired ? 'expired' : 'valid'}`}>
                          {jwtData.isExpired ? 'Expired' : 'Active'}
                        </span>
                      )}
                      <button
                        className="copy-mini-btn"
                        onClick={() => handleCopy(JSON.stringify(jwtData.payload, null, 2))}
                        type="button"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                  <pre className="jwt-code-pre">{JSON.stringify(jwtData.payload, null, 2)}</pre>
                  {jwtData.expiresAt && (
                    <div className="jwt-time-info">Expires at: {jwtData.expiresAt}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Encode / Decode */}
        {(featureId === 'dev-base64' || featureId === 'dev-url') && (
          <div className="encode-container">
            <span className="field-label">Input Text:</span>
            <textarea
              className="monospace-code-editor encode-area"
              value={encodeInput}
              onChange={(e) => setEncodeInput(e.target.value)}
            />
            <div className="encode-action-btns">
              <button
                className="tool-btn secondary"
                onClick={() => {
                  const res = DevEngine.encodeDecode(
                    encodeInput,
                    featureId === 'dev-base64' ? 'base64-encode' : 'url-encode'
                  );
                  if (res.success && res.data) setEncodeOutput(res.data);
                }}
                type="button"
              >
                Encode
              </button>
              <button
                className="tool-btn secondary"
                onClick={() => {
                  const res = DevEngine.encodeDecode(
                    encodeInput,
                    featureId === 'dev-base64' ? 'base64-decode' : 'url-decode'
                  );
                  if (res.success && res.data) setEncodeOutput(res.data);
                }}
                type="button"
              >
                Decode
              </button>
            </div>
            {encodeOutput && (
              <div className="formatted-result-box">
                <div className="result-header-row">
                  <span className="result-label-tag">CONVERTED RESULT</span>
                  <button className="tool-btn secondary small-btn" onClick={() => handleCopy(encodeOutput)} type="button">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="monospace-code-output">{encodeOutput}</pre>
              </div>
            )}
          </div>
        )}

        {/* UUID Generator */}
        {featureId === 'gen-uuid' && (
          <div className="generator-container">
            <div className="gen-controls-bar">
              <label>Count:</label>
              <select
                className="control-input"
                value={uuidCount}
                onChange={(e) => setUuidCount(Number(e.target.value))}
              >
                <option value={1}>1 UUID</option>
                <option value={5}>5 UUIDs</option>
                <option value={10}>10 UUIDs</option>
                <option value={25}>25 UUIDs</option>
              </select>
              <button
                className="tool-btn primary small-btn"
                onClick={() => {
                  const res = DevEngine.generateUuids(uuidCount);
                  if (res.success && res.data) setUuids(res.data);
                }}
                type="button"
              >
                <RefreshCw size={12} />
                <span>Generate New UUIDs</span>
              </button>
            </div>

            <div className="uuid-list-card">
              <div className="uuid-list-header">
                <span>Generated UUIDs (v4 RFC 4122)</span>
                <button
                  className="tool-btn secondary small-btn"
                  onClick={() => handleCopy(uuids.join('\n'))}
                  type="button"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>Copy All</span>
                </button>
              </div>
              <div className="uuid-rows-wrapper">
                {uuids.map((id, i) => (
                  <div key={i} className="uuid-row-item">
                    <code>{id}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Random String */}
        {featureId === 'gen-random-string' && (
          <div className="generator-container">
            <div className="gen-controls-bar">
              <label>Length (characters):</label>
              <input
                type="number"
                className="control-input"
                style={{ width: '80px' }}
                value={randomStringLen}
                onChange={(e) => setRandomStringLen(Number(e.target.value))}
              />
              <button className="tool-btn primary small-btn" onClick={handleGenRandomString} type="button">
                Generate Random Key
              </button>
            </div>
            {randomStringResult && (
              <div className="formatted-result-box">
                <pre className="monospace-code-output">{randomStringResult}</pre>
              </div>
            )}
          </div>
        )}

        {/* Timestamp Converter */}
        {featureId === 'gen-timestamp' && (
          <div className="generator-container">
            <div className="gen-controls-bar">
              <label>Epoch Timestamp (seconds or ms):</label>
              <input
                type="text"
                className="control-input"
                value={timestampInput}
                onChange={(e) => setTimestampInput(e.target.value)}
              />
              <button className="tool-btn primary small-btn" onClick={handleConvertTimestamp} type="button">
                Convert Date
              </button>
            </div>
            {timestampResult && (
              <div className="formatted-result-box">
                <pre className="monospace-code-output">{timestampResult}</pre>
              </div>
            )}
          </div>
        )}

        {/* Regex Tester */}
        {featureId === 'regex-tester-feature' && (
          <div className="regex-tester-container">
            <div className="regex-inputs-strip">
              <span className="regex-slash">/</span>
              <input
                type="text"
                className="regex-pattern-field"
                value={regexPattern}
                onChange={(e) => {
                  setRegexPattern(e.target.value);
                  const res = DevEngine.testRegex(e.target.value, regexFlags, regexText);
                  if (res.success && res.data) setRegexMatches(res.data.matches);
                }}
                placeholder="pattern..."
              />
              <span className="regex-slash">/</span>
              <input
                type="text"
                className="regex-flags-field"
                value={regexFlags}
                onChange={(e) => {
                  setRegexFlags(e.target.value);
                  const res = DevEngine.testRegex(regexPattern, e.target.value, regexText);
                  if (res.success && res.data) setRegexMatches(res.data.matches);
                }}
              />
            </div>

            <span className="field-label">Sample Input Text:</span>
            <textarea
              className="monospace-code-editor regex-text-area"
              value={regexText}
              onChange={(e) => {
                setRegexText(e.target.value);
                const res = DevEngine.testRegex(regexPattern, regexFlags, e.target.value);
                if (res.success && res.data) setRegexMatches(res.data.matches);
              }}
            />

            <div className="regex-matches-panel">
              <span className="matches-count-label">
                Matches Found: <strong>{regexMatches.length}</strong>
              </span>
              <div className="matches-chips-list">
                {regexMatches.map((m, idx) => (
                  <div key={idx} className="regex-match-chip">
                    <span className="chip-match-text">"{m.match}"</span>
                    <span className="chip-match-index">Index {m.index}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HTTP Status Reference */}
        {featureId === 'web-status-codes' && (
          <div className="http-status-container">
            <input
              type="text"
              className="control-input status-search-field"
              placeholder="Search status code or description (e.g. 404, OK, unauthorized)..."
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <div className="status-codes-table">
              {httpStatusCodes
                .filter(
                  (s) =>
                    String(s.code).includes(statusFilter) ||
                    s.label.toLowerCase().includes(statusFilter.toLowerCase()) ||
                    s.desc.toLowerCase().includes(statusFilter.toLowerCase())
                )
                .map((s) => (
                  <div key={s.code} className="status-row">
                    <span
                      className={`status-num-badge ${s.code >= 500 ? 'code-5xx' : s.code >= 400 ? 'code-4xx' : 'code-2xx'
                        }`}
                    >
                      {s.code}
                    </span>
                    <div className="status-details">
                      <span className="status-label-bold">{s.label}</span>
                      <span className="status-desc-text">{s.desc}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
