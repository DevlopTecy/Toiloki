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
  Camera,
  Upload,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { HistoryService } from '../../core/services/history.service';
import { SplitEditor } from '../../components/common/SplitEditor';
import { plural } from '../../core/utils/plural';
import { generateCode128Svg, generateCode39Svg } from '../../core/utils/barcode';
import jsQR from 'jsqr';
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
        {utilityId === 'dev-qr-generator' && (
          <QRGeneratorView utilityId={utilityId} />
        )}

        {/* 1D Barcode Generator */}
        {utilityId === 'dev-barcode-generator' && <BarcodeGeneratorView />}

        {/* QR Scanner */}
        {utilityId === 'dev-qr-scanner' && <QRScannerView />}

        {/* URL Components & Web URL Parser */}
        {(utilityId === 'dev-url-components' || utilityId === 'web-url-parser') && <UrlComponentsView />}

        {/* Cryptographic Random Number */}
        {utilityId === 'gen-random-number' && <RandomNumberView />}

        {/* Mock Test Data Generator */}
        {utilityId === 'gen-test-data' && <TestDataView />}

        {/* HTTP Headers Inspector & Validator */}
        {utilityId === 'web-http-headers' && <HttpHeadersView />}

        {/* Query String Serializer / Deserializer */}
        {utilityId === 'web-query-string' && <QueryStringView />}

        {/* Hash & HMAC Keyed Digest */}
        {utilityId === 'sec-hash-hmac' && <HashHmacView />}

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

// ─── URL Components & Web URL Parser ──────────────────────────────────────────
function UrlComponentsView() {
  const [urlInput, setUrlInput] = React.useState('https://api.github.com:443/repos/octocat/hello-world/issues?state=open&sort=created&per_page=30#issue-123');
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const copyVal = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const parsed = React.useMemo(() => {
    try {
      const u = new URL(urlInput.trim());
      const params: Array<{ key: string; value: string }> = [];
      u.searchParams.forEach((val, k) => {
        params.push({ key: k, value: val });
      });
      return {
        valid: true,
        protocol: u.protocol,
        username: u.username,
        password: u.password,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? '443' : '80'),
        pathname: u.pathname,
        search: u.search,
        hash: u.hash,
        origin: u.origin,
        params,
      };
    } catch {
      return { valid: false };
    }
  }, [urlInput]);

  const updateParam = (index: number, newKey: string, newVal: string) => {
    try {
      const u = new URL(urlInput.trim());
      const currentKeys: string[] = [];
      u.searchParams.forEach((_, k) => currentKeys.push(k));
      const entries: [string, string][] = [];
      let i = 0;
      u.searchParams.forEach((v, k) => {
        if (i === index) {
          if (newKey) entries.push([newKey, newVal]);
        } else {
          entries.push([k, v]);
        }
        i++;
      });
      u.search = '';
      entries.forEach(([k, v]) => u.searchParams.append(k, v));
      setUrlInput(u.toString());
    } catch {}
  };

  const deleteParam = (index: number) => {
    try {
      const u = new URL(urlInput.trim());
      const entries: [string, string][] = [];
      let i = 0;
      u.searchParams.forEach((v, k) => {
        if (i !== index) entries.push([k, v]);
        i++;
      });
      u.search = '';
      entries.forEach(([k, v]) => u.searchParams.append(k, v));
      setUrlInput(u.toString());
    } catch {}
  };

  const addParam = () => {
    try {
      const u = new URL(urlInput.trim());
      u.searchParams.append('new_key', 'value');
      setUrlInput(u.toString());
    } catch {}
  };

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="control-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label className="control-label">URL to Inspect & Edit:</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="tool-btn secondary small-btn"
              onClick={() => setUrlInput('https://api.github.com:443/repos/octocat/hello-world/issues?state=open&sort=created&per_page=30#issue-123')}
              type="button"
            >
              API Sample
            </button>
            <button
              className="tool-btn secondary small-btn"
              onClick={() => setUrlInput('https://example.com/search?q=developer+tools&category=utilities&page=2')}
              type="button"
            >
              Search Sample
            </button>
          </div>
        </div>
        <input
          type="text"
          className="control-input"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
        />
      </div>

      {parsed.valid ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              ['Protocol', parsed.protocol, 'protocol'],
              ['Hostname', parsed.hostname, 'hostname'],
              ['Port', parsed.port, 'port'],
              ['Origin', parsed.origin, 'origin'],
              ['Pathname', parsed.pathname, 'pathname'],
              ['Hash / Anchor', parsed.hash || '(none)', 'hash'],
            ].map(([label, val, key]) => (
              <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</span>
                  {val && val !== '(none)' && (
                    <button
                      className="copy-mini-btn"
                      onClick={() => copyVal(val as string, key as string)}
                      type="button"
                      title="Copy"
                    >
                      {copiedKey === key ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                    </button>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', wordBreak: 'break-all' }}>
                  {val}
                </div>
              </div>
            ))}
          </div>

          {/* Query Parameters Table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Query Parameters</span>
                <span style={{ fontSize: 11, background: 'var(--border)', padding: '2px 8px', borderRadius: 10, color: 'var(--text-muted)' }}>
                  {parsed.params?.length || 0}
                </span>
              </div>
              <button className="tool-btn secondary small-btn" onClick={addParam} type="button">
                <Plus size={12} />
                <span>Add Parameter</span>
              </button>
            </div>

            {parsed.params && parsed.params.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {parsed.params.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      className="control-input"
                      value={p.key}
                      onChange={(e) => updateParam(idx, e.target.value, p.value)}
                      placeholder="key"
                      style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    />
                    <span style={{ color: 'var(--text-muted)' }}>=</span>
                    <input
                      type="text"
                      className="control-input"
                      value={p.value}
                      onChange={(e) => updateParam(idx, p.key, e.target.value)}
                      placeholder="value"
                      style={{ flex: 2, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    />
                    <button
                      className="tool-btn secondary small-btn"
                      onClick={() => copyVal(`${p.key}=${p.value}`, `param-${idx}`)}
                      type="button"
                    >
                      {copiedKey === `param-${idx}` ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    </button>
                    <button
                      className="tool-btn secondary small-btn"
                      onClick={() => deleteParam(idx)}
                      type="button"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' }}>
                No query parameters in this URL. Click "Add Parameter" to append one.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--danger)', fontSize: 13, padding: 12, background: 'var(--surface)', borderRadius: 6 }}>
          Invalid URL format. Please enter a valid URL including protocol (e.g., https://...).
        </div>
      )}
    </div>
  );
}

// ─── Cryptographic Random Number ──────────────────────────────────────────────
function RandomNumberView() {
  const [min, setMin] = React.useState(1);
  const [max, setMax] = React.useState(100);
  const [count, setCount] = React.useState(10);
  const [unique, setUnique] = React.useState(false);
  const [isFloat, setIsFloat] = React.useState(false);
  const [decimals, setDecimals] = React.useState(2);
  const [sortOrder, setSortOrder] = React.useState<'none' | 'asc' | 'desc'>('none');
  const [numbers, setNumbers] = React.useState<number[]>([]);
  const [copied, setCopied] = React.useState(false);

  const generate = () => {
    const range = max - min;
    if (range < 0) return;
    const res: number[] = [];
    const used = new Set<number>();
    const effectiveCount = unique ? Math.min(count, Math.floor(range) + 1) : count;

    const array = new Uint32Array(effectiveCount * 4 + 20);
    window.crypto.getRandomValues(array);
    let ptr = 0;

    while (res.length < effectiveCount && ptr < array.length) {
      const randNorm = array[ptr] / (0xffffffff + 1);
      ptr++;
      let val = min + randNorm * (range + (isFloat ? 0 : 1));
      if (!isFloat) val = Math.floor(val);
      else val = parseFloat(val.toFixed(decimals));

      if (unique) {
        if (!used.has(val)) {
          used.add(val);
          res.push(val);
        }
      } else {
        res.push(val);
      }
    }

    if (sortOrder === 'asc') res.sort((a, b) => a - b);
    else if (sortOrder === 'desc') res.sort((a, b) => b - a);

    setNumbers(res);
  };

  React.useEffect(() => {
    generate();
  }, []);

  const stats = React.useMemo(() => {
    if (numbers.length === 0) return null;
    const minVal = Math.min(...numbers);
    const maxVal = Math.max(...numbers);
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;
    return { minVal, maxVal, sum, avg: avg.toFixed(2) };
  }, [numbers]);

  const copyAll = (format: 'comma' | 'newline' | 'json') => {
    let str = '';
    if (format === 'comma') str = numbers.join(', ');
    else if (format === 'newline') str = numbers.join('\n');
    else str = JSON.stringify(numbers);
    navigator.clipboard.writeText(str);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
        <div className="control-group">
          <label className="control-label">Min Value:</label>
          <input type="number" className="control-input" value={min} onChange={e => setMin(Number(e.target.value))} />
        </div>
        <div className="control-group">
          <label className="control-label">Max Value:</label>
          <input type="number" className="control-input" value={max} onChange={e => setMax(Number(e.target.value))} />
        </div>
        <div className="control-group">
          <label className="control-label">Count (1-500):</label>
          <input type="number" min={1} max={500} className="control-input" value={count} onChange={e => setCount(Math.min(500, Math.max(1, Number(e.target.value))))} />
        </div>
        <div className="control-group">
          <label className="control-label">Sort:</label>
          <select className="control-input" value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}>
            <option value="none">None (Random order)</option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>
          <input type="checkbox" checked={unique} onChange={e => setUnique(e.target.checked)} />
          Unique (no duplicates)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>
          <input type="checkbox" checked={isFloat} onChange={e => setIsFloat(e.target.checked)} />
          Decimal (Floats)
        </label>
        {isFloat && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Decimals:</span>
            <input type="number" min={1} max={6} className="control-input" style={{ width: 60 }} value={decimals} onChange={e => setDecimals(Number(e.target.value))} />
          </div>
        )}
        <button className="tool-btn primary small-btn" onClick={generate} type="button" style={{ marginLeft: 'auto' }}>
          <RefreshCw size={12} />
          <span>Generate Random Numbers</span>
        </button>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[['COUNT', numbers.length], ['MIN', stats.minVal], ['MAX', stats.maxVal], ['AVERAGE', stats.avg]].map(([lbl, val]) => (
            <div key={lbl} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Results ({numbers.length})</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="tool-btn secondary small-btn" onClick={() => copyAll('comma')} type="button">
              {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
              <span>Copy CSV</span>
            </button>
            <button className="tool-btn secondary small-btn" onClick={() => copyAll('newline')} type="button">
              <span>Copy Lines</span>
            </button>
            <button className="tool-btn secondary small-btn" onClick={() => copyAll('json')} type="button">
              <span>Copy JSON</span>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 300, overflowY: 'auto', padding: 4 }}>
          {numbers.map((n, i) => (
            <span key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)' }}>
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Mock Test Data Generator ─────────────────────────────────────────────────
function TestDataView() {
  const [type, setType] = React.useState<'users' | 'products' | 'transactions'>('users');
  const [count, setCount] = React.useState(10);
  const [format, setFormat] = React.useState<'json' | 'csv' | 'sql'>('json');
  const [copied, setCopied] = React.useState(false);

  const data = React.useMemo(() => {
    const res = DevEngine.generateTestData(type, count);
    return res.success && res.data ? res.data : [];
  }, [type, count]);

  const outputText = React.useMemo(() => {
    if (data.length === 0) return '';
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      const keys = Object.keys(data[0]);
      const header = keys.join(',');
      const rows = data.map(item => keys.map(k => JSON.stringify(item[k] ?? '')).join(','));
      return [header, ...rows].join('\n');
    } else {
      const keys = Object.keys(data[0]);
      const table = type;
      return data.map(item => {
        const vals = keys.map(k => {
          const v = item[k];
          return typeof v === 'number' ? v : `'${String(v).replace(/'/g, "''")}'`;
        });
        return `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${vals.join(', ')});`;
      }).join('\n');
    }
  }, [data, format, type]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'sql';
    const blob = new Blob([outputText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mock-${type}-${Date.now()}.${ext}`;
    a.click();
  };

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="control-label" style={{ margin: 0 }}>Category:</label>
          <select className="control-input" value={type} onChange={e => setType(e.target.value as any)}>
            <option value="users">User Profiles</option>
            <option value="products">E-commerce Products</option>
            <option value="transactions">Financial Transactions</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="control-label" style={{ margin: 0 }}>Count:</label>
          <select className="control-input" value={count} onChange={e => setCount(Number(e.target.value))}>
            <option value={5}>5 records</option>
            <option value={10}>10 records</option>
            <option value={25}>25 records</option>
            <option value={50}>50 records</option>
            <option value={100}>100 records</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="control-label" style={{ margin: 0 }}>Format:</label>
          <div className="segmented-chip-row" style={{ display: 'flex', gap: 6 }}>
            {(['json', 'csv', 'sql'] as const).map(fmt => (
              <button
                key={fmt}
                type="button"
                className={`segmented-chip-btn ${format === fmt ? 'active' : ''}`}
                onClick={() => setFormat(fmt)}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="tool-btn secondary small-btn" onClick={handleCopy} type="button">
            {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
            <span>Copy</span>
          </button>
          <button className="tool-btn primary small-btn" onClick={handleDownload} type="button">
            <Download size={12} />
            <span>Download</span>
          </button>
        </div>
      </div>

      <textarea
        className="code-editor"
        readOnly
        value={outputText}
        style={{ width: '100%', height: 420, fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical' }}
      />
    </div>
  );
}

// ─── QR Scanner ───────────────────────────────────────────────────────────────
function QRScannerView() {
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animRef = React.useRef<number | null>(null);

  const decodeImageFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code) {
          setResult(code.data);
          setError(null);
        } else {
          setError('No QR code detected in this image. Try another image or higher resolution.');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        scanFrame();
      }
    } catch (e: any) {
      setError(`Camera error: ${e.message || 'Unable to access webcam.'}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setScanning(false);
  };

  const scanFrame = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          setResult(code.data);
          stopCamera();
          return;
        }
      }
    }
    animRef.current = requestAnimationFrame(scanFrame);
  };

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isUrl = result && (result.startsWith('http://') || result.startsWith('https://'));

  return (
    <div style={{ padding: '24px 32px', display: 'flex', gap: 24 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Upload Zone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              decodeImageFile(e.dataTransfer.files[0]);
            }
          }}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 8,
            padding: '36px 20px',
            textAlign: 'center',
            background: 'var(--surface)',
            cursor: 'pointer',
          }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
              if (e.target.files && e.target.files[0]) decodeImageFile(e.target.files[0]);
            };
            input.click();
          }}
        >
          <Upload size={32} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            Drop QR code image here, or click to browse
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Supports PNG, JPEG, WebP, GIF
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
          <button
            className="tool-btn secondary small-btn"
            onClick={scanning ? stopCamera : startCamera}
            type="button"
          >
            <Camera size={14} />
            <span>{scanning ? 'Stop Camera' : 'Scan via Webcam'}</span>
          </button>
        </div>

        {scanning && (
          <div style={{ position: 'relative', width: '100%', height: 260, background: '#000', borderRadius: 8, overflow: 'hidden' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 160, height: 160, border: '2px solid var(--accent)', borderRadius: 8, pointerEvents: 'none' }} />
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 13, background: 'var(--surface)', padding: 12, borderRadius: 6 }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Decoded Content</div>
        {result ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>✓ QR CODE DECODED</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {isUrl && (
                  <a
                    href={result}
                    target="_blank"
                    rel="noreferrer"
                    className="tool-btn secondary small-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    <ExternalLink size={12} />
                    <span>Open URL</span>
                  </a>
                )}
                <button className="tool-btn primary small-btn" onClick={handleCopy} type="button">
                  {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <textarea
              className="code-editor"
              readOnly
              value={result}
              style={{ width: '100%', height: 180, fontFamily: 'var(--font-mono)', fontSize: 13, resize: 'vertical' }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Length: {result.length} characters
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Scan a QR code image or camera stream to view the decoded payload here.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 1D Barcode Generator ─────────────────────────────────────────────────────
function BarcodeGeneratorView() {
  const [text, setText] = React.useState('TOILOKI-128');
  const [format, setFormat] = React.useState<'CODE128' | 'CODE39'>('CODE128');
  const [height, setHeight] = React.useState(80);
  const [barWidth, setBarWidth] = React.useState(2);
  const [showText, setShowText] = React.useState(true);

  const svgContent = React.useMemo(() => {
    if (!text.trim()) return '';
    try {
      if (format === 'CODE128') {
        return generateCode128Svg(text, { height, barWidth, showText, color: '#1a1a1a', background: '#ffffff' });
      } else {
        return generateCode39Svg(text, { height, barWidth, showText, color: '#1a1a1a', background: '#ffffff' });
      }
    } catch {
      return '';
    }
  }, [text, format, height, barWidth, showText]);

  const downloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `barcode-${format.toLowerCase()}-${Date.now()}.svg`;
    a.click();
  };

  const downloadPng = () => {
    if (!svgContent) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `barcode-${format.toLowerCase()}-${Date.now()}.png`;
      a.click();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
  };

  return (
    <div style={{ padding: '24px 32px', display: 'flex', gap: 24 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="control-group">
          <label className="control-label">Value to Encode:</label>
          <input
            type="text"
            className="control-input"
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
        <div className="control-group">
          <label className="control-label">Barcode Symbology:</label>
          <select className="control-input" value={format} onChange={e => setFormat(e.target.value as any)}>
            <option value="CODE128">Code 128 (High density, full ASCII)</option>
            <option value="CODE39">Code 39 (Alphanumeric standard)</option>
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">Bar Height: {height}px</label>
          <input
            type="range"
            min={40}
            max={140}
            value={height}
            onChange={e => setHeight(Number(e.target.value))}
            className="control-slider"
          />
        </div>
        <div className="control-group">
          <label className="control-label">Bar Width: {barWidth}px</label>
          <input
            type="range"
            min={1}
            max={4}
            value={barWidth}
            onChange={e => setBarWidth(Number(e.target.value))}
            className="control-slider"
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>
          <input type="checkbox" checked={showText} onChange={e => setShowText(e.target.checked)} />
          Display Human-Readable Label
        </label>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, background: 'var(--surface)', padding: 24, borderRadius: 8, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Barcode Preview</div>
        {svgContent ? (
          <div
            style={{ background: '#fff', padding: 16, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: '100%', overflowX: 'auto' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 32 }}>Enter text to render barcode</div>
        )}
        {svgContent && (
          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 320 }}>
            <button className="tool-btn secondary small-btn" onClick={downloadSvg} style={{ flex: 1 }} type="button">
              <Download size={12} />
              <span>SVG Vector</span>
            </button>
            <button className="tool-btn primary small-btn" onClick={downloadPng} style={{ flex: 1 }} type="button">
              <Download size={12} />
              <span>PNG Raster</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HTTP Headers Inspector & Validator ───────────────────────────────────────
function HttpHeadersView() {
  const [rawInput, setRawInput] = React.useState(
`HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Cache-Control: public, max-age=3600`
  );
  const [filter, setFilter] = React.useState('');

  const parsed = React.useMemo(() => {
    const res = DevEngine.parseHttpHeaders(rawInput);
    return res.success && res.data ? res.data : {};
  }, [rawInput]);

  const securityAudit = React.useMemo(() => {
    const keys = Object.keys(parsed).map(k => k.toLowerCase());
    const checks = [
      { name: 'Content-Security-Policy', key: 'content-security-policy', desc: 'Protects against XSS and injection attacks' },
      { name: 'Strict-Transport-Security (HSTS)', key: 'strict-transport-security', desc: 'Forces encrypted HTTPS connections' },
      { name: 'X-Content-Type-Options', key: 'x-content-type-options', desc: 'Prevents MIME-type sniffing' },
      { name: 'X-Frame-Options', key: 'x-frame-options', desc: 'Prevents clickjacking framing attacks' },
      { name: 'Referrer-Policy', key: 'referrer-policy', desc: 'Controls referrer information leaked in requests' },
    ];
    return checks.map(c => ({
      ...c,
      present: keys.includes(c.key),
      value: parsed[Object.keys(parsed).find(k => k.toLowerCase() === c.key) || ''],
    }));
  }, [parsed]);

  const addMissingSecurity = () => {
    const missingHeaders = [
      ['Content-Security-Policy', "default-src 'self'"],
      ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
      ['X-Content-Type-Options', 'nosniff'],
      ['X-Frame-Options', 'DENY'],
      ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ];
    let updated = rawInput.trim();
    missingHeaders.forEach(([header, val]) => {
      const exists = Object.keys(parsed).some(k => k.toLowerCase() === header.toLowerCase());
      if (!exists) {
        updated += `\n${header}: ${val}`;
      }
    });
    setRawInput(updated);
  };

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="control-label" style={{ margin: 0 }}>Raw HTTP Headers:</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="tool-btn secondary small-btn"
                onClick={() => setRawInput('Content-Type: application/json\nCache-Control: no-cache\nAuthorization: Bearer secret_token')}
                type="button"
              >
                Sample API
              </button>
              <button className="tool-btn secondary small-btn" onClick={addMissingSecurity} type="button">
                + Add Security Headers
              </button>
            </div>
          </div>
          <textarea
            className="code-editor"
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            style={{ height: 260, fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical' }}
          />
        </div>

        {/* Security Audit Panel */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={16} color="var(--accent)" />
            <span>Security Headers Checklist</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {securityAudit.map(c => (
              <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 8px', background: 'var(--bg)', borderRadius: 4 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.desc}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: c.present ? 'var(--success)' : 'var(--warning)', padding: '2px 6px', borderRadius: 4, background: c.present ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)' }}>
                  {c.present ? 'Configured' : 'Missing'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Parsed Headers Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            Parsed Headers ({Object.keys(parsed).length})
          </div>
          <input
            type="text"
            className="control-input"
            placeholder="Filter headers..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ width: 200, fontSize: 12 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 250, overflowY: 'auto' }}>
          {Object.entries(parsed)
            .filter(([k, v]) => k.toLowerCase().includes(filter.toLowerCase()) || v.toLowerCase().includes(filter.toLowerCase()))
            .map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{k}:</span>
                <span style={{ color: 'var(--text)', wordBreak: 'break-all', marginLeft: 12 }}>{v}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Query String Serializer / Deserializer ───────────────────────────────────
function QueryStringView() {
  const [queryString, setQueryString] = React.useState('search=react+desktop&category=developer&limit=50&active=true');
  const [jsonString, setJsonString] = React.useState('');
  const [copied, setCopied] = React.useState<'qs' | 'json' | null>(null);

  const handleQueryChange = (val: string) => {
    setQueryString(val);
    try {
      const clean = val.startsWith('?') ? val.slice(1) : val;
      const params = new URLSearchParams(clean);
      const obj: Record<string, any> = {};
      params.forEach((v, k) => {
        if (v === 'true') obj[k] = true;
        else if (v === 'false') obj[k] = false;
        else if (!isNaN(Number(v)) && v.trim() !== '') obj[k] = Number(v);
        else obj[k] = v;
      });
      setJsonString(JSON.stringify(obj, null, 2));
    } catch {
      setJsonString('');
    }
  };

  const handleJsonChange = (val: string) => {
    setJsonString(val);
    try {
      const obj = JSON.parse(val);
      const params = new URLSearchParams();
      Object.entries(obj).forEach(([k, v]) => {
        params.append(k, String(v));
      });
      setQueryString(params.toString());
    } catch {}
  };

  React.useEffect(() => {
    handleQueryChange(queryString);
  }, []);

  const copyVal = (text: string, type: 'qs' | 'json') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="control-label" style={{ margin: 0 }}>URL Query String:</label>
            <button className="tool-btn secondary small-btn" onClick={() => copyVal(queryString, 'qs')} type="button">
              {copied === 'qs' ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
              <span>Copy Query</span>
            </button>
          </div>
          <textarea
            className="code-editor"
            value={queryString}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="key1=value1&key2=value2..."
            style={{ height: 320, fontFamily: 'var(--font-mono)', fontSize: 13, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="control-label" style={{ margin: 0 }}>JSON Representation:</label>
            <button className="tool-btn secondary small-btn" onClick={() => copyVal(jsonString, 'json')} type="button">
              {copied === 'json' ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
              <span>Copy JSON</span>
            </button>
          </div>
          <textarea
            className="code-editor"
            value={jsonString}
            onChange={e => handleJsonChange(e.target.value)}
            placeholder='{\n  "key": "value"\n}'
            style={{ height: 320, fontFamily: 'var(--font-mono)', fontSize: 13, resize: 'vertical' }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Hash & HMAC Keyed Digest ─────────────────────────────────────────────────
function HashHmacView() {
  const [algo, setAlgo] = React.useState<'SHA-256' | 'SHA-512' | 'SHA-1' | 'MD5'>('SHA-256');
  const [isHmac, setIsHmac] = React.useState(false);
  const [message, setMessage] = React.useState('Hello Toiloki');
  const [secretKey, setSecretKey] = React.useState('my-secret-key');
  const [hashHex, setHashHex] = React.useState('');
  const [hashBase64, setHashBase64] = React.useState('');
  const [compareHash, setCompareHash] = React.useState('');
  const [copied, setCopied] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const compute = async () => {
      if (!message) {
        setHashHex('');
        setHashBase64('');
        return;
      }
      try {
        const enc = new TextEncoder();
        const msgBytes = enc.encode(message);

        if (isHmac) {
          if (algo === 'MD5') {
            const res = await (await import('../../engines/security/security.engine')).SecurityEngine.hashText(message, 'MD5');
            if (!cancelled && res.success && res.data) {
              setHashHex(res.data.hex);
              setHashBase64(res.data.base64);
            }
          } else {
            const keyBytes = enc.encode(secretKey || '');
            const cryptoKey = await window.crypto.subtle.importKey(
              'raw',
              keyBytes,
              { name: 'HMAC', hash: algo },
              false,
              ['sign']
            );
            const sig = await window.crypto.subtle.sign('HMAC', cryptoKey, msgBytes);
            const bytes = new Uint8Array(sig);
            const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
            let binary = '';
            bytes.forEach(b => binary += String.fromCharCode(b));
            const base64 = btoa(binary);
            if (!cancelled) {
              setHashHex(hex);
              setHashBase64(base64);
            }
          }
        } else {
          if (algo === 'MD5') {
            const res = await (await import('../../engines/security/security.engine')).SecurityEngine.hashText(message, 'MD5');
            if (!cancelled && res.success && res.data) {
              setHashHex(res.data.hex);
              setHashBase64(res.data.base64);
            }
          } else {
            const digest = await window.crypto.subtle.digest(algo, msgBytes);
            const bytes = new Uint8Array(digest);
            const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
            let binary = '';
            bytes.forEach(b => binary += String.fromCharCode(b));
            const base64 = btoa(binary);
            if (!cancelled) {
              setHashHex(hex);
              setHashBase64(base64);
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setHashHex('');
          setHashBase64('');
        }
      }
    };
    compute();
    return () => { cancelled = true; };
  }, [message, secretKey, algo, isHmac]);

  const copyVal = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const isMatch = compareHash.trim() && (
    compareHash.trim().toLowerCase() === hashHex.toLowerCase() ||
    compareHash.trim() === hashBase64
  );

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="control-label" style={{ margin: 0 }}>Algorithm:</label>
          <select className="control-input" value={algo} onChange={e => setAlgo(e.target.value as any)}>
            <option value="SHA-256">SHA-256 (NIST Standard)</option>
            <option value="SHA-512">SHA-512 (High Security)</option>
            <option value="SHA-1">SHA-1 (Legacy / Git)</option>
            <option value="MD5">MD5 (Checksum / Fingerprint)</option>
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>
          <input type="checkbox" checked={isHmac} onChange={e => setIsHmac(e.target.checked)} />
          HMAC Mode (Keyed Hash)
        </label>
      </div>

      <div className="control-group">
        <label className="control-label">Message Payload:</label>
        <textarea
          className="code-editor"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 13 }}
        />
      </div>

      {isHmac && (
        <div className="control-group">
          <label className="control-label">HMAC Secret Key:</label>
          <input
            type="text"
            className="control-input"
            value={secretKey}
            onChange={e => setSecretKey(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      )}

      {/* Digests Output */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Calculated Digest</div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>HEX:</span>
            <button className="copy-mini-btn" onClick={() => copyVal(hashHex, 'hex')} type="button">
              {copied === 'hex' ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
            </button>
          </div>
          <div style={{ background: 'var(--bg)', padding: '8px 12px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', wordBreak: 'break-all' }}>
            {hashHex || '(empty)'}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>BASE64:</span>
            <button className="copy-mini-btn" onClick={() => copyVal(hashBase64, 'b64')} type="button">
              {copied === 'b64' ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
            </button>
          </div>
          <div style={{ background: 'var(--bg)', padding: '8px 12px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', wordBreak: 'break-all' }}>
            {hashBase64 || '(empty)'}
          </div>
        </div>
      </div>

      {/* Verify / Compare */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Verify Against Expected Hash:</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            className="control-input"
            placeholder="Paste expected hex or base64 hash to compare..."
            value={compareHash}
            onChange={e => setCompareHash(e.target.value)}
            style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
          {compareHash.trim() && (
            <span style={{ fontSize: 12, fontWeight: 600, color: isMatch ? 'var(--success)' : 'var(--danger)', padding: '6px 12px', borderRadius: 4, background: isMatch ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
              {isMatch ? '✓ MATCH' : '✗ MISMATCH'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

