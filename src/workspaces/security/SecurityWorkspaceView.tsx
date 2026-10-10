import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  FileCheck,
  Hash,
  Clock,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  FileDigit,
  ShieldAlert,
  Download,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  FileText,
} from 'lucide-react';
import { SecurityEngine, PasswordStrengthResult, PemDecodedResult } from '../../engines/security/security.engine';
import { Slider } from '../../components/ui';
import './SecurityWorkspaceView.css';

interface SecurityWorkspaceViewProps {
  groupId: string;
  utilityId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const SecurityWorkspaceView: React.FC<SecurityWorkspaceViewProps> = ({ utilityId }) => {
  return (
    <div className="sec-workspace">
      {utilityId === 'sec-hash-hmac' && <HashHmacView />}
      {utilityId === 'sec-password-generator' && <PasswordGeneratorView />}
      {utilityId === 'sec-passphrase-generator' && <PassphraseGeneratorView />}
      {utilityId === 'sec-password-strength' && <PasswordStrengthView />}
      {utilityId === 'sec-totp-generator' && <TOTPView />}
      {utilityId === 'sec-checksum-verifier' && <ChecksumView />}
      {utilityId === 'sec-file-encrypt' && <FileEncryptDecryptView />}
      {utilityId === 'sec-secure-shred' && <SecureShredView />}
      {utilityId === 'sec-metadata-scrubber' && <MetadataScrubberView />}
      {utilityId === 'sec-cert-decoder' && <PemDecoderView />}
      {utilityId === 'sec-keypair-generator' && <KeyPairGeneratorView />}
      {utilityId === 'sec-text-redaction' && <TextRedactionView />}
    </div>
  );
};

// ─── Shared UI Helpers ───────────────────────────────────────────────────────

function SecCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
}: {
  icon?: any;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="sec-card">
      <div className="sec-card-header">
        <div className="sec-card-header-left">
          {Icon && (
            <div className="sec-card-icon-tile">
              <Icon size={16} />
            </div>
          )}
          <div>
            <h3 className="sec-card-title">{title}</h3>
            {subtitle && <p className="sec-card-desc">{subtitle}</p>}
          </div>
        </div>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write errors
    }
  };
  return (
    <button className="sec-copy-btn" onClick={copy} title="Copy to clipboard">
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadBuffer(buffer: Uint8Array, fileName: string, mimeType: string = 'application/octet-stream') {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── 1. Hash & HMAC Generator ────────────────────────────────────────────────

function HashHmacView() {
  const [input, setInput] = useState('');
  const [algo, setAlgo] = useState<'SHA-256' | 'SHA-512' | 'SHA-384' | 'SHA-1' | 'MD5'>('SHA-256');
  const [hmacSecret, setHmacSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [result, setResult] = useState<{ hex: string; base64: string } | null>(null);
  const [verifyHash, setVerifyHash] = useState('');
  const [error, setError] = useState<string | null>(null);

  const compute = async () => {
    if (!input.trim()) {
      setResult(null);
      return;
    }
    setError(null);
    const r = await SecurityEngine.hashText(input, algo, hmacSecret || undefined);
    if (r.success && r.data) setResult(r.data);
    else setError(r.error || 'Computation failed');
  };

  useEffect(() => {
    compute();
  }, [input, algo, hmacSecret]);

  const byteLength = useMemo(() => new TextEncoder().encode(input).length, [input]);

  const isMatching = useMemo(() => {
    if (!verifyHash.trim() || !result) return null;
    const clean = verifyHash.trim().toLowerCase();
    return clean === result.hex.toLowerCase() || clean === result.base64;
  }, [verifyHash, result]);

  return (
    <div className="sec-workbench-layout">
      {/* Zone 1: Input & Configuration */}
      <SecCard
        icon={Hash}
        title="Input & Configuration"
        subtitle="Hash plaintext using cryptographic message digests or keyed HMAC"
        actions={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {!input.trim() && (
              <button
                type="button"
                className="sec-action-btn"
                onClick={() => setInput('Hello, Toiloki offline cryptographic suite!')}
                style={{ color: 'var(--accent)' }}
              >
                Try sample text
              </button>
            )}
            <button
              type="button"
              className="sec-action-btn"
              onClick={() => setInput('')}
              title="Clear input"
            >
              Clear
            </button>
          </div>
        }
      >
        <div className="control-group">
          <label className="control-label">
            <span>Input Text:</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {input.length} characters · {byteLength} bytes
            </span>
          </label>
          <textarea
            className="code-editor"
            rows={7}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste text to compute cryptographic hash…"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="sec-controls-row">
          <div className="control-group" style={{ flex: 1, minWidth: 150 }}>
            <label className="control-label">Algorithm:</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['SHA-256', 'SHA-512', 'SHA-384', 'SHA-1', 'MD5'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`sec-chip-btn ${algo === a ? 'active' : ''}`}
                  onClick={() => setAlgo(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            <span>HMAC Secret Key (Optional):</span>
            <button
              type="button"
              className="sec-action-btn"
              style={{ height: 22, padding: '0 6px', fontSize: 11 }}
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? <EyeOff size={11} /> : <Eye size={11} />}
              {showSecret ? 'Hide' : 'Show'}
            </button>
          </label>
          <input
            className="control-input"
            type={showSecret ? 'text' : 'password'}
            value={hmacSecret}
            onChange={(e) => setHmacSecret(e.target.value)}
            placeholder="Leave empty for standard hash, or enter key for HMAC"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </SecCard>

      {/* Zone 2: Live Digests & Verification */}
      <SecCard
        icon={ShieldCheck}
        title="Cryptographic Digests"
        subtitle="Live calculated hashes and quick comparison verification"
      >
        {error && <div className="sec-error">{error}</div>}

        {result && (
          <div className="sec-hash-list">
            <div className="sec-hash-item">
              <span className="sec-hash-item-label">HEX</span>
              <code className="sec-hash-item-value">{result.hex}</code>
              <CopyButton text={result.hex} />
            </div>

            <div className="sec-hash-item">
              <span className="sec-hash-item-label">Base64</span>
              <code className="sec-hash-item-value">{result.base64}</code>
              <CopyButton text={result.base64} />
            </div>
          </div>
        )}

        <div className="control-group" style={{ marginTop: 12 }}>
          <label className="control-label">Compare & Verify Hash:</label>
          <input
            className="control-input"
            value={verifyHash}
            onChange={(e) => setVerifyHash(e.target.value)}
            placeholder="Paste expected hash here to compare"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>

        {isMatching !== null && (
          <div className={isMatching ? 'sec-success' : 'sec-error'}>
            {isMatching
              ? '✓ Hash matches computed digest perfectly'
              : '✗ Hash does NOT match computed digest'}
          </div>
        )}
      </SecCard>
    </div>
  );
}

// ─── 2. Cryptographic Password Generator ─────────────────────────────────────

function PasswordGeneratorView() {
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [ambiguous, setAmbiguous] = useState(false);
  const [exclude, setExclude] = useState('');
  const [password, setPassword] = useState('');
  const [entropy, setEntropy] = useState(0);
  const [strength, setStrength] = useState<PasswordStrengthResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [bulkList, setBulkList] = useState<string[]>([]);

  const generate = () => {
    const r = SecurityEngine.generatePassword({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      ambiguous,
      exclude,
    });
    if (r.success && r.data) {
      const pwd = r.data.password;
      setPassword(pwd);
      setEntropy(r.data.entropy);
      setError(null);
      const sr = SecurityEngine.checkPasswordStrength(pwd);
      if (sr.success && sr.data) setStrength(sr.data);

      setHistory((prev) => [pwd, ...prev.filter((p) => p !== pwd)].slice(0, 5));
    } else {
      setError(r.error || 'Error generating password');
    }
  };

  const generateBulk = () => {
    const list: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = SecurityEngine.generatePassword({
        length,
        uppercase,
        lowercase,
        numbers,
        symbols,
        ambiguous,
        exclude,
      });
      if (r.success && r.data) list.push(r.data.password);
    }
    setBulkList(list);
  };

  useEffect(() => {
    generate();
  }, [length, uppercase, lowercase, numbers, symbols, ambiguous, exclude]);

  const lengthPresets = [12, 16, 20, 24, 32, 64];

  // Character breakdown calculation
  const charCounts = useMemo(() => {
    let u = 0, l = 0, n = 0, s = 0;
    for (const c of password) {
      if (/[A-Z]/.test(c)) u++;
      else if (/[a-z]/.test(c)) l++;
      else if (/[0-9]/.test(c)) n++;
      else s++;
    }
    return { u, l, n, s };
  }, [password]);

  return (
    <div className="sec-workbench-layout">
      {/* Zone 1: Parameters Panel */}
      <SecCard
        icon={Sliders}
        title="Password Rules & Entropy"
        subtitle="CSPRNG random generation with entropy calculated via Web Crypto API"
      >
        <div className="control-group">
          <label className="control-label">Length</label>
          <Slider
            min={4}
            max={128}
            step={1}
            value={length}
            onChange={setLength}
            unit="chars"
          />
        </div>

        <div className="sec-checkboxes">
          {[
            ['Uppercase (A-Z)', uppercase, setUppercase],
            ['Lowercase (a-z)', lowercase, setLowercase],
            ['Numbers (0-9)', numbers, setNumbers],
            ['Symbols (!@#$)', symbols, setSymbols],
            ['Avoid ambiguous (O, 0, I, 1)', ambiguous, setAmbiguous],
          ].map(([label, val, setter]: any) => (
            <label key={label} className="sec-checkbox-label">
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => setter(e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="control-group" style={{ marginTop: 6 }}>
          <label className="control-label">Exclude Specific Characters:</label>
          <input
            className="control-input"
            value={exclude}
            onChange={(e) => setExclude(e.target.value)}
            placeholder="e.g. `~{}[]"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </SecCard>

      {/* Zone 2: Output Hero & Inspector */}
      <SecCard
        icon={KeyRound}
        title="Generated Password"
        subtitle="High-entropy cryptographic token ready to copy"
      >
        {error && <div className="sec-error">{error}</div>}

        <div className="sec-password-display">
          <code className="sec-password-code">{password}</code>
          <div className="sec-password-actions">
            <button className="sec-refresh-btn" onClick={generate} title="Generate new password">
              <RefreshCw size={14} /> Regenerate
            </button>
            <button className="sec-refresh-btn" onClick={generateBulk} title="Generate 5 random passwords">
              Bulk Generate (5)
            </button>
            <CopyButton text={password} />
          </div>
        </div>

        {/* Character Breakdown Tags */}
        <div className="sec-char-breakdown">
          <span className="sec-char-tag">{charCounts.u} Uppercase</span>
          <span className="sec-char-tag">{charCounts.l} Lowercase</span>
          <span className="sec-char-tag">{charCounts.n} Numbers</span>
          <span className="sec-char-tag">{charCounts.s} Symbols</span>
        </div>

        {strength && (
          <div className="sec-strength-bar">
            <div className="sec-strength-track">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="sec-strength-segment"
                  style={{
                    backgroundColor:
                      i <= strength.score
                        ? strength.score >= 3
                          ? 'var(--success)'
                          : strength.score === 2
                          ? 'var(--warning)'
                          : 'var(--danger)'
                        : 'var(--border)',
                  }}
                />
              ))}
            </div>
            <div className="sec-strength-info">
              <span className="sec-strength-label">{strength.label}</span>
              <span className="sec-strength-meta">
                {entropy} bits entropy · Crack time: {strength.crackTime}
              </span>
            </div>
          </div>
        )}

        {/* Ephemeral History Tray */}
        {history.length > 1 && (
          <div className="sec-history-tray">
            <span className="sec-history-title">Session History (Ephemeral)</span>
            {history.slice(1).map((h, idx) => (
              <div key={idx} className="sec-history-item">
                <code style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{h}</code>
                <CopyButton text={h} label="Copy" />
              </div>
            ))}
          </div>
        )}

        {/* Bulk Generated Batch */}
        {bulkList.length > 0 && (
          <div className="sec-history-tray" style={{ marginTop: 12 }}>
            <span className="sec-history-title">Bulk Generated Batch (5 Tokens)</span>
            {bulkList.map((tok, idx) => (
              <div key={idx} className="sec-history-item">
                <code style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{tok}</code>
                <CopyButton text={tok} label="Copy" />
              </div>
            ))}
          </div>
        )}
      </SecCard>
    </div>
  );
}

// ─── 3. Diceware Passphrase Generator ────────────────────────────────────────

function PassphraseGeneratorView() {
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState('-');
  const [capitalize, setCapitalize] = useState(true);
  const [includeNumber, setIncludeNumber] = useState(true);
  const [phrase, setPhrase] = useState('');

  const generate = () => {
    const r = SecurityEngine.generatePassphrase({ wordCount, separator, capitalize, includeNumber });
    if (r.success && r.data) setPhrase(r.data);
  };

  useEffect(() => {
    generate();
  }, [wordCount, separator, capitalize, includeNumber]);

  return (
    <div className="sec-workbench-layout">
      <SecCard
        icon={Sliders}
        title="Diceware Configuration"
        subtitle="Generate memorable, cryptographically strong multi-word passphrases"
      >
        <div className="control-group">
          <label className="control-label">Word Count: {wordCount} words</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[3, 4, 5, 6, 8].map((wc) => (
              <button
                key={wc}
                type="button"
                className={`sec-chip-btn ${wordCount === wc ? 'active' : ''}`}
                onClick={() => setWordCount(wc)}
              >
                {wc} words
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Word Separator:</label>
          <select
            className="control-select"
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
          >
            <option value="-">Hyphen (-)</option>
            <option value="_">Underscore (_)</option>
            <option value=" ">Space ( )</option>
            <option value=".">Period (.)</option>
          </select>
        </div>

        <div className="sec-checkboxes">
          <label className="sec-checkbox-label">
            <input
              type="checkbox"
              checked={capitalize}
              onChange={(e) => setCapitalize(e.target.checked)}
            />
            Capitalize each word
          </label>
          <label className="sec-checkbox-label">
            <input
              type="checkbox"
              checked={includeNumber}
              onChange={(e) => setIncludeNumber(e.target.checked)}
            />
            Append random number
          </label>
        </div>
      </SecCard>

      <SecCard
        icon={KeyRound}
        title="Generated Passphrase"
        subtitle="Diceware phrase combining readability with entropy"
      >
        <div className="sec-password-display">
          <code className="sec-password-code" style={{ fontSize: 17 }}>
            {phrase}
          </code>
          <div className="sec-password-actions">
            <button className="sec-refresh-btn" onClick={generate}>
              <RefreshCw size={14} /> Regenerate
            </button>
            <CopyButton text={phrase} />
          </div>
        </div>

        <div className="sec-info-banner" style={{ marginTop: 8 }}>
          <ShieldCheck size={16} />
          <span>
            Passphrases provide high entropy against brute-force attacks while remaining easy to speak or memorize.
          </span>
        </div>
      </SecCard>
    </div>
  );
}

// ─── 4. Password Strength & Entropy Analyzer ─────────────────────────────────

function PasswordStrengthView() {
  const [password, setPassword] = useState('');
  const [showPlain, setShowPlain] = useState(false);

  const result = useMemo(() => {
    if (!password) return null;
    const r = SecurityEngine.checkPasswordStrength(password);
    return r.success ? r.data : null;
  }, [password]);

  return (
    <SecCard
      icon={ShieldCheck}
      title="Password Strength & Entropy Analyzer"
      subtitle="Evaluates NIST entropy, character distribution, and crack time resistance"
    >
      <div className="control-group">
        <label className="control-label">Enter Password to Evaluate:</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="control-input"
            type={showPlain ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type or paste password to evaluate…"
            style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
          />
          <button
            type="button"
            className="sec-action-btn"
            onClick={() => setShowPlain(!showPlain)}
          >
            {showPlain ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPlain ? 'Hide' : 'Reveal'}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <div className="sec-strength-bar">
            <div className="sec-strength-track">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="sec-strength-segment"
                  style={{
                    backgroundColor:
                      i <= result.score
                        ? result.score >= 3
                          ? 'var(--success)'
                          : result.score === 2
                          ? 'var(--warning)'
                          : 'var(--danger)'
                        : 'var(--border)',
                  }}
                />
              ))}
            </div>
            <div className="sec-strength-info">
              <span className="sec-strength-label">{result.label}</span>
              <span className="sec-strength-meta">
                {result.entropy} bits entropy · Crack resistance: {result.crackTime}
              </span>
            </div>
          </div>

          {result.suggestions.length > 0 && (
            <div className="sec-info-banner">
              <AlertTriangle size={16} />
              <div>
                <strong>Security Observations:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {result.suggestions.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </SecCard>
  );
}

// ─── 5. RFC 6238 TOTP Generator ──────────────────────────────────────────────

function TOTPView() {
  const [secret, setSecret] = useState('JBSWY3DPEHPK3PXP');
  const [result, setResult] = useState<{ code: string; secondsRemaining: number; validUntil: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    const update = async () => {
      if (!secret.trim()) return;
      const r = await SecurityEngine.generateTOTP(secret.trim());
      if (r.success && r.data) {
        setResult(r.data);
        setError(null);
      } else {
        setError(r.error || 'Invalid Base32 secret');
      }
    };

    update();
    timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [secret]);

  const progress = result ? (result.secondsRemaining / 30) * 100 : 0;

  return (
    <SecCard
      icon={Clock}
      title="RFC 6238 Time-based One-time Password (TOTP)"
      subtitle="Generates standard 30-second multi-factor authentication codes completely offline"
    >
      <div className="control-group">
        <label className="control-label">Base32 Authenticator Secret Key:</label>
        <input
          className="control-input"
          value={secret}
          onChange={(e) => setSecret(e.target.value.toUpperCase().replace(/\s/g, ''))}
          placeholder="Paste Base32 secret key (e.g. JBSWY3DPEHPK3PXP)"
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>

      {error && <div className="sec-error">{error}</div>}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 0' }}>
          <div
            style={{
              fontSize: 44,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--text)',
            }}
          >
            {result.code.slice(0, 3)} {result.code.slice(3)}
          </div>

          <div style={{ width: 260, height: 6, background: 'var(--surface-hover)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: progress > 25 ? 'var(--accent)' : 'var(--danger)',
                transition: 'width 1s linear',
              }}
            />
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Code rotates in {result.secondsRemaining}s · Valid until {result.validUntil}
          </div>

          <CopyButton text={result.code} label="Copy 6-Digit Code" />
        </div>
      )}
    </SecCard>
  );
}

// ─── 6. File Integrity & Checksum Verifier ────────────────────────────────────

function ChecksumView() {
  const [expectedHash, setExpectedHash] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    setHashes({});
    setError(null);
    setComputing(true);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());

      // Compute SHA-256, SHA-512, SHA-1, MD5 simultaneously
      const [sha256Res, sha512Res, sha1Res, md5Res] = await Promise.all([
        SecurityEngine.hashFile(buffer, 'SHA-256'),
        SecurityEngine.hashFile(buffer, 'SHA-512'),
        SecurityEngine.hashFile(buffer, 'SHA-1'),
        SecurityEngine.hashFile(buffer, 'MD5'),
      ]);

      setHashes({
        'SHA-256': sha256Res.data?.hex || '',
        'SHA-512': sha512Res.data?.hex || '',
        'SHA-1': sha1Res.data?.hex || '',
        'MD5': md5Res.data?.hex || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setComputing(false);
    }
  };

  const matchedAlgo = useMemo(() => {
    if (!expectedHash.trim() || Object.keys(hashes).length === 0) return null;
    const clean = expectedHash.trim().toLowerCase();
    for (const [algo, hex] of Object.entries(hashes)) {
      if (clean === hex.toLowerCase()) return algo;
    }
    return false;
  }, [expectedHash, hashes]);

  return (
    <SecCard
      icon={FileCheck}
      title="File Integrity & Checksum Verifier"
      subtitle="Computes simultaneous cryptographic fingerprints to verify file integrity"
    >
      <div className="sec-file-drop">
        <input type="file" id="checksum-file" style={{ display: 'none' }} onChange={handleFileChange} />
        <label htmlFor="checksum-file" className="sec-file-label">
          <FileCheck size={32} />
          <span>{computing ? 'Calculating digests in local memory…' : fileName ? `File: ${fileName}` : 'Select or drop a file to compute checksums'}</span>
          <span className="sec-file-hint">All file contents are buffered locally without cloud transfer</span>
        </label>
      </div>

      {fileName && (
        <div className="sec-file-summary-card">
          <div className="sec-file-summary-meta">
            <span className="sec-file-summary-name">{fileName}</span>
            <span className="sec-file-summary-size">{formatBytes(fileSize)}</span>
          </div>
          <label htmlFor="checksum-file" className="sec-secondary-btn" style={{ cursor: 'pointer' }}>
            Change File
          </label>
        </div>
      )}

      <div className="control-group">
        <label className="control-label">Expected Hash (Optional Verification):</label>
        <input
          className="control-input"
          value={expectedHash}
          onChange={(e) => setExpectedHash(e.target.value)}
          placeholder="Paste expected SHA-256, SHA-512, SHA-1, or MD5 hash to verify match…"
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>

      {matchedAlgo !== null && (
        <div className={matchedAlgo ? 'sec-success' : 'sec-error'}>
          {matchedAlgo
            ? `✓ Match confirmed: File matches expected ${matchedAlgo} checksum`
            : '✗ Verification failed: File checksum does NOT match expected hash'}
        </div>
      )}

      {error && <div className="sec-error">{error}</div>}

      {Object.keys(hashes).length > 0 && (
        <div className="sec-hash-list">
          {Object.entries(hashes).map(([algo, hex]) => (
            <div key={algo} className="sec-hash-item">
              <span className="sec-hash-item-label">{algo}</span>
              <code className="sec-hash-item-value">{hex}</code>
              <CopyButton text={hex} />
            </div>
          ))}
        </div>
      )}
    </SecCard>
  );
}

// ─── 7. Symmetric File Encrypt & Decrypt ──────────────────────────────────────

function FileEncryptDecryptView() {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    if (!file) {
      setError('Please select a target file');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (mode === 'encrypt' && password !== confirmPassword) {
      setError('Password confirmation does not match');
      return;
    }

    setError(null);
    setStatus(null);
    setProcessing(true);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());

      if (mode === 'encrypt') {
        const r = await SecurityEngine.encryptFile(buffer, password);
        if (r.success && r.data) {
          const outName = `${file.name}.toiloki`;
          downloadBuffer(r.data.encrypted, outName);
          setStatus(`Successfully encrypted ${file.name} (${formatBytes(r.data.encryptedSize)}). File saved.`);
        } else {
          setError(r.error || 'Encryption failed');
        }
      } else {
        const r = await SecurityEngine.decryptFile(buffer, password);
        if (r.success && r.data) {
          const outName = file.name.endsWith('.toiloki')
            ? file.name.slice(0, -8)
            : `decrypted_${file.name}`;
          downloadBuffer(r.data.decrypted, outName);
          setStatus(`Successfully decrypted ${file.name} (${formatBytes(r.data.originalSize)}). File saved.`);
        } else {
          setError(r.error || 'Decryption failed: Incorrect password or corrupted payload');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SecCard
      icon={Lock}
      title="Symmetric File Encrypt & Decrypt"
      subtitle="AES-256-GCM authenticated encryption with PBKDF2 (100,000 SHA-256 iterations)"
    >
      <div className="sec-tabs-row">
        <button
          type="button"
          className={`sec-tab-btn ${mode === 'encrypt' ? 'active' : ''}`}
          onClick={() => {
            setMode('encrypt');
            setError(null);
            setStatus(null);
          }}
        >
          <Lock size={14} /> Encrypt File (.toiloki)
        </button>
        <button
          type="button"
          className={`sec-tab-btn ${mode === 'decrypt' ? 'active' : ''}`}
          onClick={() => {
            setMode('decrypt');
            setError(null);
            setStatus(null);
          }}
        >
          <Unlock size={14} /> Decrypt File
        </button>
      </div>

      <div className="sec-info-banner">
        <ShieldAlert size={16} />
        <span>
          AES-256-GCM ensures confidentiality and tamper detection. All encryption happens in memory with zero cloud storage.
        </span>
      </div>

      <div className="sec-file-drop">
        <input
          type="file"
          id="sec-enc-file"
          style={{ display: 'none' }}
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setError(null);
            setStatus(null);
          }}
        />
        <label htmlFor="sec-enc-file" className="sec-file-label">
          {mode === 'encrypt' ? <Lock size={32} /> : <Unlock size={32} />}
          <span>{file ? `Selected: ${file.name} (${formatBytes(file.size)})` : 'Click or drop file to encrypt/decrypt'}</span>
          <span className="sec-file-hint">Supports documents, archives, images, media, and binary files</span>
        </label>
      </div>

      <div className="sec-controls-row">
        <div className="control-group" style={{ flex: 1, minWidth: 220 }}>
          <label className="control-label">
            <span>{mode === 'encrypt' ? 'Encryption Password:' : 'Decryption Password:'}</span>
            <button
              type="button"
              className="sec-action-btn"
              style={{ height: 20, padding: '0 6px', fontSize: 11 }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={11} /> : <Eye size={11} />}
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </label>
          <input
            className="control-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter secure master password"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>

        {mode === 'encrypt' && (
          <div className="control-group" style={{ flex: 1, minWidth: 220 }}>
            <label className="control-label">Confirm Password:</label>
            <input
              className="control-input"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        )}
      </div>

      {error && <div className="sec-error">{error}</div>}
      {status && <div className="sec-success">{status}</div>}

      <div>
        <button
          type="button"
          className="sec-primary-btn"
          onClick={handleProcess}
          disabled={processing || !file || !password}
        >
          {processing
            ? 'Processing in local memory…'
            : mode === 'encrypt'
            ? 'Encrypt and save .toiloki'
            : 'Decrypt and restore file'}
        </button>
      </div>
    </SecCard>
  );
}

// ─── 8. Secure Data Shredder ─────────────────────────────────────────────────

function SecureShredView() {
  const [file, setFile] = useState<File | null>(null);
  const [passes, setPasses] = useState<1 | 3 | 7>(3);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [shredding, setShredding] = useState(false);

  const handleShred = async () => {
    if (!file) {
      setError('Please select a target file to shred');
      return;
    }
    if (!confirmed) {
      setError('Please check the confirmation box before shredding');
      return;
    }

    setError(null);
    setShredding(true);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const r = SecurityEngine.shredBuffer(buffer, passes);
      if (r.success && r.data) {
        setResult(r.data);
      } else {
        setError(r.error || 'Shred failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setShredding(false);
    }
  };

  return (
    <SecCard
      icon={Trash2}
      title="Secure Multi-Pass Data Shredder"
      subtitle="Sanitizes file buffers with multi-pass zero-fill, ones-fill, and CSPRNG random patterns"
    >
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
        Overwrites file buffers with cryptographic entropy. SSD wear-leveling limits apply.
      </p>

      <div className="sec-file-drop">
        <input
          type="file"
          id="sec-shred-file"
          style={{ display: 'none' }}
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setResult(null);
            setError(null);
          }}
        />
        <label htmlFor="sec-shred-file" className="sec-file-label">
          <Trash2 size={32} />
          <span>{file ? `Target: ${file.name} (${formatBytes(file.size)})` : 'Select target file for secure multi-pass shredding'}</span>
          <span className="sec-file-hint">Replaces buffer with multi-pass pseudorandom cryptographic entropy</span>
        </label>
      </div>

      <div className="sec-controls-row">
        <div className="control-group" style={{ minWidth: 260 }}>
          <label className="control-label">Wipe Standard:</label>
          <select
            className="control-select"
            value={passes}
            onChange={(e) => setPasses(Number(e.target.value) as any)}
          >
            <option value={1}>Random overwrite (1 pass, default)</option>
            <option value={3}>Multi-pass overwrite (3 passes)</option>
            <option value={7}>Gutmann pattern (7 passes)</option>
          </select>
        </div>

        <label className="sec-checkbox-label" style={{ paddingBottom: 6 }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I confirm that I want to destroy this file data
        </label>
      </div>

      {error && <div className="sec-error">{error}</div>}

      <div>
        <button
          type="button"
          className="sec-primary-btn"
          style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)', color: 'var(--text)' }}
          onClick={handleShred}
          disabled={shredding || !file || !confirmed}
        >
          {shredding ? 'Executing multi-pass shredding…' : 'Execute Secure Shred'}
        </button>
      </div>

      {result && (
        <div className="sec-success">
          ✓ Successfully sanitized {formatBytes(result.wipedBytes)} across {result.passes} overwrite passes ({result.standard}).
        </div>
      )}
    </SecCard>
  );
}

// ─── 9. Bulk Metadata Scrubber ────────────────────────────────────────────────

function MetadataScrubberView() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScrub = async () => {
    if (!file) return;
    setError(null);
    setScrubbing(true);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const r = SecurityEngine.scrubMetadata(buffer, file.name);
      if (r.success && r.data) {
        setResult(r.data);
        const cleanName = `clean_${file.name}`;
        downloadBuffer(r.data.scrubbedBuffer, cleanName);
      } else {
        setError(r.error || 'Scrubbing failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setScrubbing(false);
    }
  };

  return (
    <SecCard
      icon={FileDigit}
      title="Bulk Metadata Scrubber"
      subtitle="Strips EXIF GPS markers, camera hardware tags, author identities, and revision traces in memory"
    >
      <div className="sec-file-drop">
        <input
          type="file"
          id="sec-scrub-file"
          style={{ display: 'none' }}
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setResult(null);
            setError(null);
          }}
        />
        <label htmlFor="sec-scrub-file" className="sec-file-label">
          <FileText size={32} />
          <span>{file ? `File: ${file.name} (${formatBytes(file.size)})` : 'Drop image or document to sanitize metadata'}</span>
          <span className="sec-file-hint">JPEG, PNG, PDF, and office documents processed strictly offline</span>
        </label>
      </div>

      {file && (
        <div className="sec-file-summary-card">
          <div className="sec-file-summary-meta">
            <span className="sec-file-summary-name">{file.name}</span>
            <span className="sec-file-summary-size">{formatBytes(file.size)} · Ready to scrub</span>
          </div>
        </div>
      )}

      {error && <div className="sec-error">{error}</div>}

      <div>
        <button
          type="button"
          className="sec-primary-btn"
          onClick={handleScrub}
          disabled={scrubbing || !file}
        >
          {scrubbing ? 'Scrubbing EXIF & headers…' : 'Scrub metadata & download clean file'}
        </button>
      </div>

      {result && (
        <div className="sec-success">
          ✓ Clean file downloaded! Removed {result.strippedCount} metadata tags ({result.strippedTags.join(', ')}).
        </div>
      )}
    </SecCard>
  );
}

// ─── 10. PEM Certificate Decoder ─────────────────────────────────────────────

function PemDecoderView() {
  const samplePem =
    '-----BEGIN CERTIFICATE-----\nMIIDdzCCAl+gAwIBAgIET2jL0TANBgkqhkiG9w0BAQsFADBsMQswCQYDVQQGEwJV\nUzELMAkGA1UECBMCQ0ExEzARBgNVBAcTCk1vdW50YWluMS4wLAYDVQQKEyVUb2ls\nb2tpIEluYy4xITAfBgNVBAMTGFdpbmRvd3MgRGVza3RvcCBBcHAwHhcNMjYwMTAx\nMDAwMDAwWhcNMzYwMTAxMDAwMDAwWjBsMQswCQYDVQQGEwJVUzELMAkGA1UECBMC\nQ0ExEzARBgNVBAcTCk1vdW50YWluMS4wLAYDVQQKEyVUb2lsb2tpIEluYy4xITAf\nBgNVBAMTGFdpbmRvd3MgRGVza3RvcCBBcHAwggEiMA0GCSqGSIb3DQEBAQUAA4IB\nDwAwggEKAoIBAQC8jO12W7pM9Z15oH2xS=\n-----END CERTIFICATE-----';

  const [pem, setPem] = useState(samplePem);
  const [result, setResult] = useState<PemDecodedResult | null>(null);

  useEffect(() => {
    let active = true;
    SecurityEngine.decodePem(pem).then((r) => {
      if (!active) return;
      if (r.success && r.data) {
        setResult(r.data);
      } else {
        setResult(null);
      }
    });
    return () => {
      active = false;
    };
  }, [pem]);

  return (
    <div className="sec-workbench-layout">
      <SecCard
        icon={FileCheck}
        title="PEM Certificate Input"
        subtitle="Decode X.509 certificates and public/private key headers offline"
      >
        <div className="control-group">
          <label className="control-label">Paste PEM Certificate or Key:</label>
          <textarea
            className="code-editor"
            rows={10}
            value={pem}
            onChange={(e) => setPem(e.target.value)}
          />
        </div>
      </SecCard>

      <SecCard
        icon={ShieldCheck}
        title="Decoded Certificate Specs"
        subtitle="Cryptographic fingerprints and container metadata"
      >
        {result ? (
          <div className="sec-hash-list">
            <div className="sec-hash-item">
              <span className="sec-hash-item-label">Type</span>
              <span className="sec-hash-item-value" style={{ fontWeight: 600 }}>{result.type}</span>
            </div>
            <div className="sec-hash-item">
              <span className="sec-hash-item-label">DER Size</span>
              <span className="sec-hash-item-value">{result.derLength} bytes</span>
            </div>
            <div className="sec-hash-item">
              <span className="sec-hash-item-label">SHA-256</span>
              <code className="sec-hash-item-value">{result.fingerprintSha256}</code>
              <CopyButton text={result.fingerprintSha256} />
            </div>
            <div className="sec-hash-item">
              <span className="sec-hash-item-label">SHA-1</span>
              <code className="sec-hash-item-value">{result.fingerprintSha1}</code>
              <CopyButton text={result.fingerprintSha1} />
            </div>
          </div>
        ) : (
          <div className="sec-error">Could not parse valid PEM structure</div>
        )}
      </SecCard>
    </div>
  );
}

// ─── 11. Key Pair Generator ──────────────────────────────────────────────────

function KeyPairGeneratorView() {
  const [algo, setAlgo] = useState<'RSA-2048' | 'RSA-4096' | 'ECDSA-P256'>('RSA-2048');
  const [result, setResult] = useState<{ publicKeyPem: string; privateKeyPem: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await SecurityEngine.generateKeyPair(algo);
      if (r.success && r.data) setResult(r.data);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    generate();
  }, [algo]);

  return (
    <SecCard
      icon={KeyRound}
      title="Cryptographic Key Pair Generator"
      subtitle="Generates RSA and NIST P-256 elliptic-curve key pairs in standard PEM format"
    >
      <div className="sec-controls-row">
        <div className="control-group">
          <label className="control-label">Algorithm & Key Length:</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['RSA-2048', 'RSA-4096', 'ECDSA-P256'] as const).map((a) => (
              <button
                key={a}
                type="button"
                className={`sec-chip-btn ${algo === a ? 'active' : ''}`}
                onClick={() => setAlgo(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="sec-primary-btn"
          onClick={generate}
          disabled={generating}
        >
          <RefreshCw size={14} /> {generating ? 'Generating key pair…' : 'Regenerate Key Pair'}
        </button>
      </div>

      {result && (
        <div className="sec-workbench-split-equal" style={{ marginTop: 12 }}>
          <div className="control-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="control-label">Public Key (SPKI):</label>
              <CopyButton text={result.publicKeyPem} />
            </div>
            <textarea
              className="code-editor"
              rows={8}
              readOnly
              value={result.publicKeyPem}
            />
          </div>

          <div className="control-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="control-label">Private Key (PKCS#8):</label>
              <CopyButton text={result.privateKeyPem} />
            </div>
            <textarea
              className="code-editor"
              rows={8}
              readOnly
              value={result.privateKeyPem}
            />
          </div>
        </div>
      )}
    </SecCard>
  );
}

// ─── 12. PII Redactor / Text Sanitizer ────────────────────────────────────────

function TextRedactionView() {
  const [input, setInput] = useState(
    'Contact John at john.doe@company.com or +1-555-123-4567.\nSSN: 123-45-6789, Card: 4532-1234-5678-9012\nServer: 192.168.1.1'
  );
  const [maskStyle, setMaskStyle] = useState<'asterisk' | 'hash' | 'label'>('asterisk');
  const [maskEmails, setMaskEmails] = useState(true);
  const [maskPhones, setMaskPhones] = useState(true);
  const [maskSSN, setMaskSSN] = useState(true);
  const [maskCreditCards, setMaskCreditCards] = useState(true);
  const [maskIPs, setMaskIPs] = useState(true);

  const result = useMemo(() => {
    const r = SecurityEngine.redactText(input, {
      maskEmails,
      maskPhones,
      maskSSN,
      maskCreditCards,
      maskIPs,
      maskStyle,
    });
    return r.success ? r.data : null;
  }, [input, maskStyle, maskEmails, maskPhones, maskSSN, maskCreditCards, maskIPs]);

  return (
    <div className="sec-redaction-layout">
      {/* Options Sidebar */}
      <div className="sec-redaction-sidebar">
        <h3 className="sec-card-title">Detection & Rules</h3>

        <div className="control-group">
          <label className="control-label">Mask Style:</label>
          <select
            className="control-select"
            value={maskStyle}
            onChange={(e) => setMaskStyle(e.target.value as typeof maskStyle)}
          >
            <option value="asterisk">Asterisks (***)</option>
            <option value="hash">Hashes (###)</option>
            <option value="label">Label Tag ([EMAIL])</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)' }}>
            Detect & Mask Entities
          </span>
          {[
            ['Email addresses', maskEmails, setMaskEmails],
            ['Phone numbers', maskPhones, setMaskPhones],
            ['SSN (US)', maskSSN, setMaskSSN],
            ['Credit cards', maskCreditCards, setMaskCreditCards],
            ['IP addresses', maskIPs, setMaskIPs],
          ].map(([label, val, setter]: any) => (
            <label key={label} className="sec-checkbox-label">
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => setter(e.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        {result && (
          <div style={{ marginTop: 'auto', padding: '12px 14px', background: 'var(--surface-hover)', borderRadius: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Redactions Made</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {result.redactionCount}
            </div>
          </div>
        )}
      </div>

      {/* Input Editor Pane */}
      <div className="sec-redaction-pane">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="control-label">Raw Text Input:</label>
          <button
            type="button"
            className="sec-action-btn"
            style={{ height: 24, padding: '0 8px', fontSize: 11 }}
            onClick={() => setInput('')}
          >
            Clear
          </button>
        </div>
        <textarea
          className="code-editor"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste text containing sensitive PII data to sanitize…"
          style={{ flex: 1, minHeight: 280, resize: 'vertical' }}
        />
      </div>

      {/* Sanitized Output Pane */}
      <div className="sec-redaction-pane">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="control-label">Sanitized Output:</label>
          {result && <CopyButton text={result.redacted} label="Copy Clean Text" />}
        </div>
        <textarea
          className="code-editor"
          readOnly
          value={result?.redacted || ''}
          style={{ flex: 1, minHeight: 280, resize: 'vertical', color: 'var(--text)' }}
        />
      </div>
    </div>
  );
}
