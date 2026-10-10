import React, { useState, useEffect, useMemo } from 'react';
import { ToolLayout } from '../../components/common/ToolLayout';
import { DevEngine } from '../../engines/developer/dev.engine';
import { DeveloperEngine } from '../../engines/developer/developer.engine';
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
} from 'lucide-react';
import { HistoryService } from '../../core/services/history.service';
import { SplitEditor } from '../../components/common/SplitEditor';
import { plural } from '../../core/utils/plural';
import './DeveloperWorkspaceView.css';

interface DeveloperWorkspaceViewProps {
  groupId: string;
  utilityId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const DeveloperWorkspaceView: React.FC<DeveloperWorkspaceViewProps> = ({
  groupId,
  utilityId,
  toolName,
  toolDescription,
  onBackToUtilities,
  isFavorite,
  onToggleFavorite,
}) => {
  // Code Formatter State
  const [codeSnippet, setCodeSnippet] = useState('');
  const [formattedCode, setFormattedCode] = useState('');
  const [jsonViewMode, setJsonViewMode] = useState<'formatted' | 'tree'>('formatted');
  const [sortJsonKeys, setSortJsonKeys] = useState(false);
  const [minifyJson, setMinifyJson] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // JWT Inspector State
  const [jwtInput, setJwtInput] = useState('');
  const [jwtData, setJwtData] = useState<any>(null);

  // Encode / Decode State
  const [encodeInput, setEncodeInput] = useState('');
  const [encodeOutput, setEncodeOutput] = useState('');
  const [encodeMode, setEncodeMode] = useState<'standard' | 'urlsafe'>('standard');

  // Generators State
  const [uuidCount, setUuidCount] = useState(5);
  const [uuidUppercase, setUuidUppercase] = useState(false);
  const [uuidNoDashes, setUuidNoDashes] = useState(false);
  const [uuidBraces, setUuidBraces] = useState(false);
  const [uuids, setUuids] = useState<string[]>([]);
  const [randomStringLen, setRandomStringLen] = useState(16);
  const [randomStringResult, setRandomStringResult] = useState('');
  const [timestampInput, setTimestampInput] = useState(String(Math.floor(Date.now() / 1000)));
  const [timestampResult, setTimestampResult] = useState<string | null>(null);
  const [timestampData, setTimestampData] = useState<any>(null);

  // Regex Tester State
  const [regexPattern, setRegexPattern] = useState(
    '([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})'
  );
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexText, setRegexText] = useState('');
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
    if (utilityId === 'dev-jwt') {
      const res = DevEngine.decodeJwt(jwtInput);
      if (res.success) setJwtData(res.data);
    } else if (utilityId === 'gen-uuid') {
      const res = DevEngine.generateUuids(uuidCount, {
        uppercase: uuidUppercase,
        noDashes: uuidNoDashes,
        braces: uuidBraces,
      });
      if (res.success && res.data) setUuids(res.data);
    } else if (utilityId === 'regex-tester-feature') {
      const res = DevEngine.testRegex(regexPattern, regexFlags, regexText);
      if (res.success && res.data) setRegexMatches(res.data.matches);
    }
  }, [utilityId]);

  const handleFormatCode = () => {
    setFormatError(null);
    try {
      const isJson =
        utilityId.includes('json') ||
        codeSnippet.trim().startsWith('{') ||
        codeSnippet.trim().startsWith('[');

      if (isJson) {
        const res = DevEngine.formatJson(codeSnippet, {
          indent: 2,
          sortKeys: sortJsonKeys,
          minify: minifyJson,
        });
        if (res.success && res.data) {
          setFormattedCode(res.data.formatted);
          setFormatError(null);
        } else {
          setFormatError(res.error || 'Syntax error in JSON');
          setFormattedCode('');
        }
      } else if (utilityId.includes('sql')) {
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
        groupId,
        utilityId,
        input: `${codeSnippet.length} chars`,
        output: 'Formatted code payload',
        status: 'completed',
      });
    } catch (e: any) {
      setFormatError(e.message || 'Syntax error: Unable to parse snippet.');
      setFormattedCode('');
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
    const res = DevEngine.generateTimestamp(timestampInput);
    if (res.success && res.data) {
      setTimestampData(res.data);
      setTimestampResult(
        `UTC: ${res.data.isoUtc}\nLocal: ${res.data.localString}\nRelative: ${res.data.relative}\nUnix ms: ${res.data.unixMs}\nTimezone: ${res.data.timezone}`
      );
    } else {
      setTimestampResult(res.error || 'Invalid timestamp input');
      setTimestampData(null);
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
        {(utilityId === 'dev-formatter' || utilityId.startsWith('format-') || groupId === 'dev-formatter') && (
          <SplitEditor
            toolbarOptions={
              <div className="segmented-chip-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                {(utilityId.includes('json') || codeSnippet.trim().startsWith('{') || codeSnippet.trim().startsWith('[')) && (
                  <>
                    <button
                      type="button"
                      className={`segmented-chip-btn ${sortJsonKeys ? 'active' : ''}`}
                      onClick={() => setSortJsonKeys(s => !s)}
                      title="Sort object keys alphabetically"
                    >
                      Sort Keys {sortJsonKeys ? '✓' : ''}
                    </button>
                    <button
                      type="button"
                      className={`segmented-chip-btn ${minifyJson ? 'active' : ''}`}
                      onClick={() => setMinifyJson(m => !m)}
                      title="Minify JSON output"
                    >
                      Minify {minifyJson ? '✓' : ''}
                    </button>
                  </>
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
              setFormatError(null);
            }}
            onCopy={() => handleCopy(formattedCode || codeSnippet)}
            onSave={() => handleDownload(formattedCode || codeSnippet, 'formatted.txt')}
            copied={copied}
            inputValue={codeSnippet}
            onInputChange={(val) => {
              setCodeSnippet(val);
              if (formatError) setFormatError(null);
            }}
            inputLabel="Input Code"
            inputMeta={plural(codeSnippet.trim() ? codeSnippet.split('\n').length : 0, 'line')}
            outputValue={formatError ? `Syntax error: ${formatError}` : formattedCode}
            onOutputChange={setFormattedCode}
            outputLabel="Formatted Output"
            outputMeta={plural(formattedCode.trim() ? formattedCode.split('\n').length : 0, 'line')}
            stats={`${codeSnippet.length} chars in • ${formattedCode ? formattedCode.length : 0} chars out`}
          />
        )}


        {/* JWT Inspector */}
        {utilityId === 'dev-jwt' && (
          <div className="jwt-container">
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>🔒</span>
              <span><strong>Offline Inspection:</strong> Signature verification requires a secret or public key; payload decoded for offline inspection only.</span>
            </div>
            <div className="jwt-input-header" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="field-label">Encoded JWT Token:</span>
              {!jwtInput.trim() && (
                <button
                  className="tool-btn secondary small-btn"
                  onClick={() => {
                    const sample = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIE1vcmdhbiIsImFkbWluIjp0cnVlLCJpYXQiOjE3MjAwMDAwMDAsImV4cCI6MTg1MDAwMDAwMH0.signature';
                    setJwtInput(sample);
                    const res = DevEngine.decodeJwt(sample);
                    if (res.success) setJwtData(res.data);
                  }}
                  type="button"
                >
                  Try a sample JWT
                </button>
              )}
              <button
                className="tool-btn secondary small-btn"
                onClick={() => { setJwtInput(''); setJwtData(null); }}
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
                else setJwtData(null);
              }}
              placeholder="Paste encoded JWT here..."
            />

            {jwtData && (
              <div className="jwt-cards-grid">
                {/* Header card */}
                <div className="jwt-segment-card">
                  <div className="jwt-card-header">
                    <span className="jwt-card-badge">Decoded Header</span>
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
                    <span className="jwt-card-badge">Decoded Payload</span>
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
                  <div className="jwt-time-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {jwtData.issuedAt && <div>Issued: {jwtData.issuedAt}</div>}
                    {jwtData.expiresAt && <div>Expires: {jwtData.expiresAt}</div>}
                    {jwtData.notBefore && <div>Not Before: {jwtData.notBefore}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Encode / Decode */}
        {(utilityId === 'dev-base64' || utilityId === 'dev-url') && (
          <div className="encode-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="field-label">Input Text:</span>
              {!encodeInput.trim() && (
                <button
                  className="tool-btn secondary small-btn"
                  onClick={() => setEncodeInput('https://toiloki.local/api/v1/query?tag=utility&lang=en')}
                  type="button"
                  style={{ color: 'var(--accent)' }}
                >
                  Try sample text
                </button>
              )}
            </div>
            <textarea
              className="monospace-code-editor encode-area"
              value={encodeInput}
              onChange={(e) => setEncodeInput(e.target.value)}
            />
            <div className="encode-action-btns" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {utilityId === 'dev-base64' ? (
                <>
                  <button
                    className="tool-btn secondary"
                    onClick={() => {
                      const res = DevEngine.encodeDecode(encodeInput, 'base64-encode');
                      if (res.success && res.data) setEncodeOutput(res.data);
                    }}
                    type="button"
                  >
                    Base64 Encode
                  </button>
                  <button
                    className="tool-btn secondary"
                    onClick={() => {
                      const res = DevEngine.encodeDecode(encodeInput, 'base64-decode');
                      if (res.success && res.data) setEncodeOutput(res.data);
                    }}
                    type="button"
                  >
                    Base64 Decode
                  </button>
                  <button
                    className="tool-btn secondary"
                    onClick={() => {
                      const res = DevEngine.encodeDecode(encodeInput, 'base64url-encode');
                      if (res.success && res.data) setEncodeOutput(res.data);
                    }}
                    type="button"
                  >
                    Base64URL Encode
                  </button>
                  <button
                    className="tool-btn secondary"
                    onClick={() => {
                      const res = DevEngine.encodeDecode(encodeInput, 'base64url-decode');
                      if (res.success && res.data) setEncodeOutput(res.data);
                    }}
                    type="button"
                  >
                    Base64URL Decode
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="tool-btn secondary"
                    onClick={() => {
                      const res = DevEngine.encodeDecode(encodeInput, 'url-encode');
                      if (res.success && res.data) setEncodeOutput(res.data);
                    }}
                    type="button"
                  >
                    URL Encode
                  </button>
                  <button
                    className="tool-btn secondary"
                    onClick={() => {
                      const res = DevEngine.encodeDecode(encodeInput, 'url-decode');
                      if (res.success && res.data) setEncodeOutput(res.data);
                    }}
                    type="button"
                  >
                    URL Decode
                  </button>
                </>
              )}
            </div>
            {encodeOutput && (
              <div className="formatted-result-box">
                <div className="result-header-row">
                  <span className="result-label-tag">Converted Result</span>
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
        {utilityId === 'gen-uuid' && (
          <div className="generator-container">
            <div className="gen-controls-bar" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  <option value={50}>50 UUIDs</option>
                  <option value={100}>100 UUIDs</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={uuidUppercase}
                  onChange={(e) => setUuidUppercase(e.target.checked)}
                />
                Uppercase
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={uuidNoDashes}
                  onChange={(e) => setUuidNoDashes(e.target.checked)}
                />
                No Hyphens
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={uuidBraces}
                  onChange={(e) => setUuidBraces(e.target.checked)}
                />
                Braces {'{}'}
              </label>
              <button
                className="tool-btn primary small-btn"
                onClick={() => {
                  const res = DevEngine.generateUuids(uuidCount, {
                    uppercase: uuidUppercase,
                    noDashes: uuidNoDashes,
                    braces: uuidBraces,
                  });
                  if (res.success && res.data) setUuids(res.data);
                }}
                type="button"
              >
                <RefreshCw size={12} />
                <span>Generate UUIDs</span>
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
        {utilityId === 'gen-random-string' && (
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
        {utilityId === 'gen-timestamp' && (
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
        {utilityId === 'regex-tester-feature' && (
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="field-label">Input Text:</span>
              {!regexText.trim() && (
                <button
                  className="tool-btn secondary small-btn"
                  onClick={() => {
                    const sample = 'Contact the team at support@toiloki.local or sales-team@enterprise.org for offline licenses.';
                    setRegexText(sample);
                    const res = DevEngine.testRegex(regexPattern, regexFlags, sample);
                    if (res.success && res.data) setRegexMatches(res.data.matches);
                  }}
                  type="button"
                >
                  Try sample text
                </button>
              )}
            </div>
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
        {utilityId === 'web-status-codes' && (
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

        {/* QR Code Generator */}
        {(utilityId === 'dev-qr-generator' || utilityId === 'dev-barcode-generator') && (
          <QRGeneratorView utilityId={utilityId} />
        )}

        {/* Cron Explainer */}
        {utilityId === 'dev-cron-explainer' && <CronExplainerView />}

        {/* px / rem Converter */}
        {utilityId === 'dev-px-rem' && <PxRemView />}

        {/* chmod Calculator */}
        {utilityId === 'dev-chmod-calculator' && <ChmodView />}

        {/* User-Agent Parser */}
        {utilityId === 'dev-user-agent-parser' && <UserAgentView />}

        {/* .gitignore Generator */}
        {utilityId === 'dev-gitignore-generator' && <GitignoreView />}

        {/* .env Diff */}
        {utilityId === 'dev-env-diff' && <EnvDiffView />}

      </div>
    </ToolLayout>
  );
};

// ─── QR Generator ───────────────────────────────────────────────────────────
function QRGeneratorView({ utilityId }: { utilityId: string }) {
  const [text, setText] = React.useState('https://toiloki.local');
  const [size, setSize] = React.useState(256);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const copied = React.useRef(false);
  const [copiedState, setCopiedState] = React.useState(false);

  const generate = async () => {
    if (!text.trim()) { setError('Enter text or URL to encode'); return; }
    setLoading(true); setError(null);
    try {
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(text, { width: size, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } });
      setQrDataUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  };

  React.useEffect(() => { if (text.trim()) generate(); }, []);

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="dev-tool-layout" style={{ display: 'flex', gap: 24, padding: '24px 32px', flex: 1 }}>
      <div style={{ flex: 1 }}>
        <div className="control-group">
          <label className="control-label">Text or URL:</label>
          <textarea className="code-editor" rows={4} value={text} onChange={e => setText(e.target.value)}
            style={{ resize: 'vertical', fontFamily: 'var(--font-mono)' }} />
        </div>
        <div className="control-group">
          <label className="control-label">Size: {size}×{size}px</label>
          <input type="range" min={128} max={512} step={32} value={size} onChange={e => setSize(Number(e.target.value))}
            style={{ width: '100%' }} className="control-slider" />
        </div>
        <button className="btn-primary" onClick={generate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate QR Code'}
        </button>
        {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{error}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {qrDataUrl ? (
          <>
            <img src={qrDataUrl} alt="QR Code" style={{ border: '1px solid var(--border)', borderRadius: 8 }} />
            <button className="btn-secondary" onClick={downloadQR} style={{ width: '100%' }}>Download PNG</button>
          </>
        ) : (
          <div style={{ width: size, height: size, background: 'var(--surface)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            QR preview
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cron Explainer ──────────────────────────────────────────────────────────
function CronExplainerView() {
  const [expr, setExpr] = React.useState('0 9 * * 1-5');

  const result = React.useMemo(() => {
    const r = DeveloperEngine.explainCron(expr, 10);
    return r.success ? r.data : null;
  }, [expr]);

  const err = React.useMemo(() => {
    const r = DeveloperEngine.explainCron(expr, 10);
    return r.success ? null : r.error;
  }, [expr]);

  const presets = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily midnight', value: '0 0 * * *' },
    { label: 'Daily 9am Mon–Fri', value: '0 9 * * 1-5' },
    { label: 'Weekly Sunday', value: '0 0 * * 0' },
    { label: 'Monthly 1st', value: '0 0 1 * *' },
    { label: 'Every 5 min', value: '*/5 * * * *' },
    { label: 'Yearly Jan 1', value: '0 0 1 1 *' },
  ];

  return (
    <div style={{ padding: '24px 32px', flex: 1, overflow: 'auto' }}>
      <div className="control-group" style={{ maxWidth: 500 }}>
        <label className="control-label">Cron Expression (5 fields):</label>
        <input className="control-input" style={{ fontSize: 18 }}
          value={expr} onChange={e => setExpr(e.target.value)} placeholder="* * * * *" />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
          min  hour  day  month  weekday
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {presets.map(p => (
          <button key={p.value} onClick={() => setExpr(p.value)}
            style={{ fontSize: 11, padding: '3px 8px', background: expr === p.value ? 'var(--surface-hover)' : 'var(--surface)', color: expr === p.value ? 'var(--text)' : 'var(--text-2)', border: expr === p.value ? '1px solid var(--text-muted)' : '1px solid var(--border)', borderRadius: 4, cursor: 'pointer' }}>
            {p.label}
          </button>
        ))}
      </div>
      {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>}
      {result && (
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Human Readable</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{result.human}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {Object.entries(result.parts).map(([field, val]) => (
                <div key={field} style={{ background: 'var(--surface)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{field.toUpperCase()}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ width: 280 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>NEXT 10 RUNS</div>
            {result.nextRuns.slice(0, 10).map((run, i) => (
              <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>{i + 1}.</span>{run}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── px/rem Converter ────────────────────────────────────────────────────────
function PxRemView() {
  const [value, setValue] = React.useState(16);
  const [dir, setDir] = React.useState<'pxToRem' | 'remToPx'>('pxToRem');
  const [base, setBase] = React.useState(16);

  const result = React.useMemo(() => {
    const r = DeveloperEngine.convertPxRem(value, dir, base);
    return r.success ? r.data : null;
  }, [value, dir, base]);

  return (
    <div style={{ padding: '24px 32px', flex: 1 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20, maxWidth: 500 }}>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">{dir === 'pxToRem' ? 'Pixels (px)' : 'REM'}:</label>
          <input type="number" className="control-input" value={value} min={0} step={dir === 'pxToRem' ? 1 : 0.01} onChange={e => setValue(Number(e.target.value))} />
        </div>
        <button className="btn-secondary" onClick={() => setDir(d => d === 'pxToRem' ? 'remToPx' : 'pxToRem')} style={{ marginBottom: 0 }}>⇄</button>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Base Font Size (px):</label>
          <input type="number" className="control-input" value={base} min={1} onChange={e => setBase(Number(e.target.value))} />
        </div>
      </div>
      {result && (
        <>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
            {result.result}{dir === 'pxToRem' ? 'rem' : 'px'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>{result.formula}</div>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr>
                <th style={{ padding: '6px 16px 6px 0', textAlign: 'left', color: 'var(--text-2)' }}>px</th>
                <th style={{ padding: '6px 16px', textAlign: 'left', color: 'var(--text-2)' }}>rem</th>
              </tr>
            </thead>
            <tbody>
              {result.scale.map(row => (
                <tr key={row.px} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '4px 16px 4px 0' }}>{row.px}px</td>
                  <td style={{ padding: '4px 16px', color: 'var(--text)' }}>{row.rem}rem</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// ─── chmod Calculator ────────────────────────────────────────────────────────
function ChmodView() {
  const [mode, setMode] = React.useState('755');

  const result = React.useMemo(() => {
    const r = DeveloperEngine.parseChmod(mode);
    return r.success ? r.data : null;
  }, [mode]);

  const err = React.useMemo(() => {
    const r = DeveloperEngine.parseChmod(mode);
    return r.success ? null : r.error;
  }, [mode]);

  const PermBox = ({ label, perm }: { label: string; perm: { read: boolean; write: boolean; execute: boolean } }) => (
    <div style={{ background: 'var(--surface)', borderRadius: 6, padding: '12px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, marginBottom: 8 }}>{label}</div>
      {[['r', perm.read, 'Read'], ['w', perm.write, 'Write'], ['x', perm.execute, 'Execute']].map(([sym, on, name]) => (
        <div key={sym as string} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 18, height: 18, borderRadius: 3, background: on ? 'var(--text)' : 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: on ? 'var(--bg)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{on ? sym : '—'}</div>
          <span style={{ fontSize: 12, color: on ? 'var(--text)' : 'var(--text-muted)' }}>{name as string}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '24px 32px', flex: 1 }}>
      <div className="control-group" style={{ maxWidth: 300 }}>
        <label className="control-label">Mode (octal or symbolic):</label>
        <input className="control-input" style={{ fontSize: 18 }}
          value={mode} onChange={e => setMode(e.target.value)} placeholder="755 or rwxr-xr-x" />
      </div>
      {err && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12 }}>{err}</div>}
      {result && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{result.octal}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--text-2)' }}>{result.symbolic}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Bitmask: {result.bitmask}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 480 }}>
            <PermBox label="Owner" perm={result.owner} />
            <PermBox label="Group" perm={result.group} />
            <PermBox label="Others" perm={result.others} />
          </div>
        </>
      )}
    </div>
  );
}

// ─── User-Agent Parser ───────────────────────────────────────────────────────
function UserAgentView() {
  const [ua, setUa] = React.useState(navigator.userAgent);

  const result = React.useMemo(() => {
    const r = DeveloperEngine.parseUserAgent(ua);
    return r.success ? r.data : null;
  }, [ua]);

  return (
    <div style={{ padding: '24px 32px', flex: 1 }}>
      <div className="control-group">
        <label className="control-label">User-Agent String:</label>
        <textarea className="code-editor" rows={3} value={ua} onChange={e => setUa(e.target.value)}
          style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 11 }} />
      </div>
      <button className="btn-secondary" onClick={() => setUa(navigator.userAgent)} style={{ marginBottom: 16 }}>
        Use Current Browser UA
      </button>
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 600 }}>
          {[['Browser', result.browser], ['Operating System', result.os], ['Rendering Engine', result.engine], ['Device Type', result.device]].map(([label, val]) => (
            <div key={label} style={{ background: 'var(--surface)', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{val || 'Unknown'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── .gitignore Generator ─────────────────────────────────────────────────────
function GitignoreView() {
  const [selected, setSelected] = React.useState<string[]>(['node', 'react', 'macos', 'windows', 'ide']);
  const [output, setOutput] = React.useState('');

  const techs = [
    { id: 'node', label: 'Node.js' }, { id: 'python', label: 'Python' }, { id: 'react', label: 'React' },
    { id: 'vite', label: 'Vite' }, { id: 'nextjs', label: 'Next.js' }, { id: 'java', label: 'Java' },
    { id: 'dotnet', label: '.NET' }, { id: 'rust', label: 'Rust' }, { id: 'go', label: 'Go' },
    { id: 'swift', label: 'Swift' }, { id: 'macos', label: 'macOS' }, { id: 'windows', label: 'Windows' },
    { id: 'linux', label: 'Linux' }, { id: 'ide', label: 'IDEs' }, { id: 'docker', label: 'Docker' },
  ];

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  React.useEffect(() => {
    const r = DeveloperEngine.generateGitignore(selected);
    if (r.success) setOutput(r.data || '');
  }, [selected]);

  const download = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '.gitignore';
    a.click();
  };

  return (
    <div style={{ padding: '24px 32px', flex: 1, display: 'flex', gap: 24 }}>
      <div style={{ width: 200 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Select Technologies</div>
        {techs.map(t => (
          <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggle(t.id)} />
            {t.label}
          </label>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>.gitignore preview</span>
          <button className="btn-primary" onClick={download}>Download .gitignore</button>
        </div>
        <textarea className="code-editor" readOnly value={output} style={{ flex: 1, minHeight: 400, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
      </div>
    </div>
  );
}

// ─── .env Diff ────────────────────────────────────────────────────────────────
function EnvDiffView() {
  const [env1, setEnv1] = React.useState('DATABASE_URL=postgres://localhost/app\nAPI_KEY=secret123\nDEBUG=true\nPORT=3000');
  const [env2, setEnv2] = React.useState('DATABASE_URL=\nAPI_KEY=\nSESSION_SECRET=\nPORT=3000\nNODE_ENV=production');
  const [maskSecrets, setMaskSecrets] = React.useState(true);

  const result = React.useMemo(() => {
    const r = DeveloperEngine.diffEnvFiles(env1, env2, '.env', '.env.example', { maskSecrets });
    return r.success ? r.data : null;
  }, [env1, env2, maskSecrets]);

  return (
    <div style={{ padding: '24px 32px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Compare environment variables and detect missing keys</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-2)' }}>
          <input
            type="checkbox"
            checked={maskSecrets}
            onChange={(e) => setMaskSecrets(e.target.checked)}
          />
          Mask Secrets (••••••••)
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[[env1, setEnv1, '.env (actual)'], [env2, setEnv2, '.env.example (template)']].map(([val, setter, label], i) => (
          <div key={i} className="control-group">
            <label className="control-label">{label as string}:</label>
            <textarea className="code-editor" rows={8} value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }} />
          </div>
        ))}
      </div>
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {result.missingInFirst.length > 0 && (
            <div style={{ background: 'var(--surface)', borderRadius: 6, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>MISSING IN .env ({result.missingInFirst.length})</div>
              {result.missingInFirst.map(k => <div key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)' }}>{k}</div>)}
            </div>
          )}
          {result.missingInSecond.length > 0 && (
            <div style={{ background: 'var(--surface)', borderRadius: 6, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600, marginBottom: 8 }}>MISSING IN TEMPLATE ({result.missingInSecond.length})</div>
              {result.missingInSecond.map(k => <div key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--warning)' }}>{k}</div>)}
            </div>
          )}
          {result.commonKeys.length > 0 && (
            <div style={{ background: 'var(--surface)', borderRadius: 6, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, marginBottom: 8 }}>SHARED KEYS ({result.commonKeys.length})</div>
              {result.commonKeys.slice(0, 10).map(k => <div key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{k}</div>)}
            </div>
          )}
          {result.differing.length > 0 && (
            <div style={{ background: 'var(--surface)', borderRadius: 6, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--cat-documents)', fontWeight: 600, marginBottom: 8 }}>DIFFERING VALUES ({result.differing.length})</div>
              {result.differing.map(d => (
                <div key={d.key} style={{ marginBottom: 4 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>{d.key}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{d.val1 || '(empty)'} → {d.val2 || '(empty)'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
