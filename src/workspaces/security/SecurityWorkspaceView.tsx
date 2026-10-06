import React from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  FileCheck,
  Hash,
  Clock,
  Trash2,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  FileDigit,
  ShieldAlert,
} from 'lucide-react';
import { SecurityEngine, PasswordStrengthResult } from '../../engines/security/security.engine';
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

function SecCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sec-card">
      <h3 className="sec-card-title">{title}</h3>
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
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
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
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

// ─── 1. Hash / HMAC ──────────────────────────────────────────────────────────

function HashHmacView() {
  const [input, setInput] = React.useState('Hello, Toiloki!');
  const [algo, setAlgo] = React.useState<'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256');
  const [hmacSecret, setHmacSecret] = React.useState('');
  const [result, setResult] = React.useState<{ hex: string; base64: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const compute = async () => {
    setError(null);
    const r = await SecurityEngine.hashText(input, algo, hmacSecret || undefined);
    if (r.success && r.data) setResult(r.data);
    else setError(r.error || 'Computation failed');
  };

  React.useEffect(() => {
    compute();
  }, [input, algo, hmacSecret]);

  return (
    <SecCard title="Hash & HMAC Generator">
      <div className="control-group">
        <label className="control-label">Input Text:</label>
        <textarea
          className="code-editor"
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </div>
      <div className="sec-controls-row">
        <div className="control-group" style={{ minWidth: 140 }}>
          <label className="control-label">Algorithm:</label>
          <select
            className="control-select"
            value={algo}
            onChange={(e) => setAlgo(e.target.value as typeof algo)}
          >
            <option>SHA-256</option>
            <option>SHA-512</option>
            <option>MD5</option>
            <option>SHA-1</option>
            <option>SHA-384</option>
          </select>
        </div>
        <div className="control-group" style={{ flex: 2, minWidth: 200 }}>
          <label className="control-label">HMAC Secret (optional):</label>
          <input
            className="control-input"
            type="password"
            value={hmacSecret}
            onChange={(e) => setHmacSecret(e.target.value)}
            placeholder="Leave empty for plain hash"
          />
        </div>
      </div>
      {error && <div className="sec-error">{error}</div>}
      {result && (
        <div className="sec-result-block">
          <div className="sec-result-row">
            <span className="sec-result-label">HEX:</span>
            <code className="sec-result-code">{result.hex}</code>
            <CopyButton text={result.hex} />
          </div>
          <div className="sec-result-row">
            <span className="sec-result-label">Base64:</span>
            <code className="sec-result-code">{result.base64}</code>
            <CopyButton text={result.base64} />
          </div>
        </div>
      )}
    </SecCard>
  );
}

// ─── 2. Password Generator ───────────────────────────────────────────────────

function PasswordGeneratorView() {
  const [length, setLength] = React.useState(20);
  const [uppercase, setUppercase] = React.useState(true);
  const [lowercase, setLowercase] = React.useState(true);
  const [numbers, setNumbers] = React.useState(true);
  const [symbols, setSymbols] = React.useState(true);
  const [ambiguous, setAmbiguous] = React.useState(false);
  const [exclude, setExclude] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [entropy, setEntropy] = React.useState(0);
  const [strength, setStrength] = React.useState<PasswordStrengthResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

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
      setPassword(r.data.password);
      setEntropy(r.data.entropy);
      setError(null);
      const sr = SecurityEngine.checkPasswordStrength(r.data.password);
      if (sr.success && sr.data) setStrength(sr.data);
    } else {
      setError(r.error || 'Error generating password');
    }
  };

  React.useEffect(() => {
    generate();
  }, [length, uppercase, lowercase, numbers, symbols, ambiguous, exclude]);

  const lengthPresets = [12, 16, 20, 24, 32, 64];

  return (
    <SecCard title="Cryptographic Password Generator">
      <div className="sec-info-banner">
        <ShieldAlert size={16} />
        <span>
          Entropy calculated via <code>crypto.getRandomValues</code>. Generated passwords operate in ephemeral
          memory and are never stored in history, settings, or recent usage.
        </span>
      </div>

      <div className="sec-controls-row">
        <div className="control-group" style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label className="control-label">Length: {length} characters</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {lengthPresets.map((lp) => (
                <button
                  key={lp}
                  type="button"
                  className={`sec-chip-btn ${length === lp ? 'active' : ''}`}
                  onClick={() => setLength(lp)}
                >
                  {lp}
                </button>
              ))}
            </div>
          </div>
          <div className="sec-slider-control">
            <button
              type="button"
              className="sec-stepper-btn"
              onClick={() => setLength((l) => Math.max(4, l - 1))}
            >
              -
            </button>
            <input
              type="range"
              min={4}
              max={128}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="sec-range-input"
            />
            <button
              type="button"
              className="sec-stepper-btn"
              onClick={() => setLength((l) => Math.min(128, l + 1))}
            >
              +
            </button>
          </div>
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
      </div>

      <div className="control-group" style={{ maxWidth: 320 }}>
        <label className="control-label">Exclude specific characters:</label>
        <input
          className="control-input"
          value={exclude}
          onChange={(e) => setExclude(e.target.value)}
          placeholder="e.g. `~{}[]"
        />
      </div>

      {error && <div className="sec-error">{error}</div>}

      <div className="sec-password-display">
        <code className="sec-password-code">{password}</code>
        <div className="sec-password-actions">
          <button className="sec-refresh-btn" onClick={generate}>
            <RefreshCw size={14} /> Regenerate
          </button>
          <CopyButton text={password} />
        </div>
      </div>

      {strength && (
        <div className="sec-strength-bar">
          <div className="sec-strength-track">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`sec-strength-segment ${i <= strength.score ? 'active' : ''}`}
                style={{
                  background:
                    i <= strength.score
                      ? strength.score >= 3
                        ? 'var(--success)'
                        : strength.score === 2
                        ? 'var(--warning)'
                        : 'var(--danger)'
                      : undefined,
                }}
              />
            ))}
          </div>
          <span className="sec-strength-label">{strength.label}</span>
          <span className="sec-strength-meta">
            {entropy} bits entropy · Crack time: {strength.crackTime}
          </span>
        </div>
      )}
    </SecCard>
  );
}

// ─── 3. Passphrase Generator ─────────────────────────────────────────────────

function PassphraseGeneratorView() {
  const [wordCount, setWordCount] = React.useState(4);
  const [separator, setSeparator] = React.useState('-');
  const [capitalize, setCapitalize] = React.useState(true);
  const [includeNumber, setIncludeNumber] = React.useState(true);
  const [phrase, setPhrase] = React.useState('');

  const generate = () => {
    const r = SecurityEngine.generatePassphrase({ wordCount, separator, capitalize, includeNumber });
    if (r.success && r.data) setPhrase(r.data);
  };

  React.useEffect(() => {
    generate();
  }, [wordCount, separator, capitalize, includeNumber]);

  return (
    <SecCard title="Diceware Passphrase Generator">
      <div className="sec-controls-row">
        <div className="control-group">
          <label className="control-label">Word Count: {wordCount}</label>
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
          <label className="control-label">Separator:</label>
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
            Capitalize words
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
      </div>

      <div className="sec-password-display" style={{ marginTop: 16 }}>
        <code className="sec-password-code" style={{ fontSize: 18 }}>
          {phrase}
        </code>
        <div className="sec-password-actions">
          <button className="sec-refresh-btn" onClick={generate}>
            <RefreshCw size={14} /> Regenerate
          </button>
          <CopyButton text={phrase} />
        </div>
      </div>
    </SecCard>
  );
}

// ─── 4. Password Strength Checker ────────────────────────────────────────────

function PasswordStrengthView() {
  const [password, setPassword] = React.useState('');
  const [showPlain, setShowPlain] = React.useState(false);

  const result = React.useMemo(() => {
    if (!password) return null;
    const r = SecurityEngine.checkPasswordStrength(password);
    return r.success ? r.data : null;
  }, [password]);

  return (
    <SecCard title="Password Strength & Entropy Analyzer">
      <div className="control-group">
        <label className="control-label">Enter Password to Evaluate:</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="control-input"
            type={showPlain ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type or paste password to evaluate"
            style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
          />
          <button
            type="button"
            className="sec-action-btn"
            onClick={() => setShowPlain(!showPlain)}
          >
            {showPlain ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ marginTop: 16 }}>
          <div className="sec-strength-bar" style={{ marginBottom: 16 }}>
            <div className="sec-strength-track">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`sec-strength-segment ${i <= result.score ? 'active' : ''}`}
                  style={{
                    background:
                      i <= result.score
                        ? result.score >= 3
                          ? 'var(--success)'
                          : result.score === 2
                          ? 'var(--warning)'
                          : 'var(--danger)'
                        : undefined,
                  }}
                />
              ))}
            </div>
            <span className="sec-strength-label" style={{ fontSize: 15, fontWeight: 700 }}>
              {result.label}
            </span>
            <span className="sec-strength-meta">
              {result.entropy} bits · Crack time: {result.crackTime}
            </span>
          </div>

          {result.suggestions.length > 0 && (
            <div className="sec-info-banner">
              <AlertTriangle size={16} />
              <div>
                <strong>Security Recommendations:</strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
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

// ─── 5. TOTP Generator ───────────────────────────────────────────────────────

function TOTPView() {
  const [secret, setSecret] = React.useState('JBSWY3DPEHPK3PXP'); // Standard Base32 demo secret
  const [result, setResult] = React.useState<{ code: string; secondsRemaining: number; validUntil: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const updateTotp = async () => {
    if (!secret.trim()) return;
    const r = await SecurityEngine.generateTOTP(secret);
    if (r.success && r.data) {
      setResult(r.data);
      setError(null);
    } else {
      setError(r.error || 'Invalid Base32 secret');
    }
  };

  React.useEffect(() => {
    updateTotp();
    const interval = setInterval(updateTotp, 1000);
    return () => clearInterval(interval);
  }, [secret]);

  const progress = result ? (result.secondsRemaining / 30) * 100 : 0;

  return (
    <SecCard title="RFC 6238 Time-based One-time Password (TOTP)">
      <div className="control-group">
        <label className="control-label">Base32 Secret Key:</label>
        <input
          className="control-input"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Paste Base32 authenticator secret"
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>

      {error && <div className="sec-error">{error}</div>}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
          <div
            style={{
              fontSize: 42,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--text)',
            }}
          >
            {result.code.slice(0, 3)} {result.code.slice(3)}
          </div>

          <div style={{ width: 220, height: 6, background: 'var(--surface-hover)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: progress > 25 ? 'var(--accent)' : 'var(--danger)',
                transition: 'width 1s linear',
              }}
            />
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Expires in {result.secondsRemaining}s · Valid until {result.validUntil}
          </div>

          <CopyButton text={result.code} />
        </div>
      )}
    </SecCard>
  );
}

// ─── 6. File Checksum Verifier ────────────────────────────────────────────────

function ChecksumView() {
  const [algo, setAlgo] = React.useState<'SHA-256' | 'MD5' | 'SHA-1' | 'SHA-512'>('SHA-256');
  const [expectedHash, setExpectedHash] = React.useState('');
  const [result, setResult] = React.useState<{ match: boolean; actualHash: string } | null>(null);
  const [fileName, setFileName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [computing, setComputing] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);
    setComputing(true);
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      if (expectedHash.trim()) {
        const r = await SecurityEngine.verifyChecksum(buffer, expectedHash, algo);
        if (r.success && r.data) setResult(r.data);
        else setError(r.error || 'Verification error');
      } else {
        const r = await SecurityEngine.hashFile(buffer, algo);
        if (r.success && r.data) setResult({ match: false, actualHash: r.data.hex });
        else setError(r.error || 'Hash error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setComputing(false);
    }
  };

  return (
    <SecCard title="File Integrity & Checksum Verifier">
      <div className="sec-controls-row">
        <div className="control-group" style={{ minWidth: 160 }}>
          <label className="control-label">Hash Algorithm:</label>
          <select
            className="control-select"
            value={algo}
            onChange={(e) => setAlgo(e.target.value as typeof algo)}
          >
            <option>SHA-256</option>
            <option>MD5</option>
            <option>SHA-1</option>
            <option>SHA-512</option>
          </select>
        </div>
        <div className="control-group" style={{ flex: 1, minWidth: 260 }}>
          <label className="control-label">Expected Hash (optional for verification):</label>
          <input
            className="control-input"
            value={expectedHash}
            onChange={(e) => setExpectedHash(e.target.value)}
            placeholder="Paste expected checksum to compare"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </div>

      <div className="sec-file-drop">
        <input type="file" id="checksum-file" style={{ display: 'none' }} onChange={handleFileChange} />
        <label htmlFor="checksum-file" className="sec-file-label">
          <FileCheck size={28} />
          {computing ? 'Calculating checksum…' : fileName ? `File: ${fileName}` : 'Select or drop a file to compute hash'}
        </label>
      </div>

      {error && <div className="sec-error">{error}</div>}

      {result && (
        <div className={`sec-checksum-result ${expectedHash ? (result.match ? 'match' : 'mismatch') : ''}`}>
          {expectedHash && (
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 10,
                color: result.match ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {result.match ? '✓ Checksum matches expected hash' : '✗ Checksum does NOT match'}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <code className="sec-result-code">{result.actualHash}</code>
            <CopyButton text={result.actualHash} />
          </div>
        </div>
      )}
    </SecCard>
  );
}

// ─── 7. File Encrypt / Decrypt ────────────────────────────────────────────────

function FileEncryptDecryptView() {
  const [mode, setMode] = React.useState<'encrypt' | 'decrypt'>('encrypt');
  const [file, setFile] = React.useState<File | null>(null);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);

  const handleProcess = async () => {
    if (!file) {
      setError('Please select a file to process');
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
          setStatus(`Successfully encrypted file (${(r.data.encryptedSize / 1024).toFixed(1)} KB). Download started.`);
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
          setStatus(`Successfully decrypted file (${(r.data.originalSize / 1024).toFixed(1)} KB). Download started.`);
        } else {
          setError(r.error || 'Decryption failed');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SecCard title="Symmetric File Encrypt & Decrypt">
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
          <Lock size={14} style={{ marginRight: 6 }} /> Encrypt File
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
          <Unlock size={14} style={{ marginRight: 6 }} /> Decrypt File
        </button>
      </div>

      <div className="sec-info-banner">
        <ShieldAlert size={16} />
        <span>
          Uses AES-256-GCM authenticated encryption with PBKDF2 (100,000 iterations SHA-256). All processing
          runs strictly in local memory. Passwords and keys are never logged or stored.
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
          {mode === 'encrypt' ? <Lock size={28} /> : <Unlock size={28} />}
          {file ? `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'Click to select file for encryption / decryption'}
        </label>
      </div>

      <div className="sec-controls-row">
        <div className="control-group" style={{ flex: 1, minWidth: 220 }}>
          <label className="control-label">
            {mode === 'encrypt' ? 'Encryption Password:' : 'Decryption Password:'}
          </label>
          <input
            className="control-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter secure password"
          />
        </div>

        {mode === 'encrypt' && (
          <div className="control-group" style={{ flex: 1, minWidth: 220 }}>
            <label className="control-label">Confirm Password:</label>
            <input
              className="control-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
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
            ? 'Processing in memory…'
            : mode === 'encrypt'
            ? 'Encrypt and save .toiloki'
            : 'Decrypt file'}
        </button>
      </div>
    </SecCard>
  );
}

// ─── 8. Secure Shred ─────────────────────────────────────────────────────────

function SecureShredView() {
  const [file, setFile] = React.useState<File | null>(null);
  const [passes, setPasses] = React.useState<1 | 3 | 7>(3);
  const [confirmed, setConfirmed] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [shredding, setShredding] = React.useState(false);

  const handleShred = async () => {
    if (!file) {
      setError('Please select a file to shred');
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
    <SecCard title="Secure Data Shredder">
      <div className="sec-info-banner sec-ssd-notice">
        <AlertTriangle size={20} />
        <div>
          <strong>Notice on Solid-State Drives (SSDs) & Flash Media:</strong>
          <p style={{ margin: '4px 0 0' }}>
            Modern solid-state drives (SSDs) and flash memory employ internal wear-leveling algorithms that
            remap logical blocks. While multi-pass overwriting completely scrambles accessible file contents,
            physical flash cells may retain traces until hardware garbage collection or ATA Secure Erase.
          </p>
        </div>
      </div>

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
          <Trash2 size={28} />
          {file
            ? `Target File: ${file.name} (${(file.size / 1024).toFixed(1)} KB / ${file.size} bytes)`
            : 'Select target file for secure multi-pass shredding'}
        </label>
      </div>

      <div className="sec-controls-row">
        <div className="control-group">
          <label className="control-label">Wipe Standard:</label>
          <select
            className="control-select"
            value={passes}
            onChange={(e) => setPasses(Number(e.target.value) as any)}
          >
            <option value={1}>Zero Fill (1 pass)</option>
            <option value={3}>DoD 5220.22-M (3 passes)</option>
            <option value={7}>Gutmann / Paranoid (7 passes)</option>
          </select>
        </div>

        <label className="sec-checkbox-label" style={{ marginTop: 22 }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I confirm that I want to destroy this file data
        </label>
      </div>

      {error && <div className="sec-error">{error}</div>}

      {result && (
        <div className="sec-success">
          ✓ File memory successfully overwritten with {result.passes} passes ({result.standard}).{' '}
          {result.wipedBytes} bytes completely zeroed and randomized.
        </div>
      )}

      <div>
        <button
          type="button"
          className="sec-danger-btn"
          onClick={handleShred}
          disabled={shredding || !file || !confirmed}
        >
          {shredding ? 'Overwriting file data…' : 'Execute Secure Shred'}
        </button>
      </div>
    </SecCard>
  );
}

// ─── 9. Metadata Scrubber ────────────────────────────────────────────────────

function MetadataScrubberView() {
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [scrubbing, setScrubbing] = React.useState(false);

  const handleScrub = async () => {
    if (!file) return;
    setError(null);
    setStatus(null);
    setScrubbing(true);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const r = SecurityEngine.scrubMetadata(buffer, file.name);
      if (r.success && r.data) {
        const cleanName = `clean_${file.name}`;
        downloadBuffer(r.data.scrubbedBuffer, cleanName);
        setStatus(
          `Sanitized ${r.data.strippedCount} metadata tags (${(r.data.originalSize / 1024).toFixed(1)} KB → ${(r.data.scrubbedSize / 1024).toFixed(1)} KB). Download started.`
        );
      } else {
        setError(r.error || 'Metadata scrub error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setScrubbing(false);
    }
  };

  return (
    <SecCard title="Bulk Metadata Scrubber">
      <div className="sec-info-banner">
        <EyeOff size={16} />
        <span>
          Strips EXIF GPS markers, camera hardware tags, author identities, and revision traces across JPEG,
          PNG, PDF, and office documents locally in memory.
        </span>
      </div>

      <div className="sec-file-drop">
        <input
          type="file"
          id="sec-scrub-file"
          style={{ display: 'none' }}
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setError(null);
            setStatus(null);
          }}
        />
        <label htmlFor="sec-scrub-file" className="sec-file-label">
          <EyeOff size={28} />
          {file ? `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'Drop image or document to sanitize metadata'}
        </label>
      </div>

      {error && <div className="sec-error">{error}</div>}
      {status && <div className="sec-success">{status}</div>}

      <div>
        <button
          type="button"
          className="sec-primary-btn"
          onClick={handleScrub}
          disabled={scrubbing || !file}
        >
          {scrubbing ? 'Stripping metadata…' : 'Scrub metadata & download clean file'}
        </button>
      </div>
    </SecCard>
  );
}

// ─── 10. PEM / Certificate Decoder ───────────────────────────────────────────

function PemDecoderView() {
  const [pemText, setPemText] = React.useState(
    '-----BEGIN CERTIFICATE-----\nMIICpDCCAYwCCQDU6vT+s3V72zANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAls\nb2NhbGhvc3QwHhcNMjMwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjAUMRIwEAYD\nVQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC8\n-----END CERTIFICATE-----'
  );
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const decode = async () => {
    setError(null);
    const r = await SecurityEngine.decodePem(pemText);
    if (r.success && r.data) setResult(r.data);
    else setError(r.error || 'Failed to decode PEM block');
  };

  React.useEffect(() => {
    decode();
  }, [pemText]);

  return (
    <SecCard title="X.509 Certificate & PEM Decoder">
      <div className="control-group">
        <label className="control-label">Paste PEM Certificate or Key Block:</label>
        <textarea
          className="code-editor"
          rows={6}
          value={pemText}
          onChange={(e) => setPemText(e.target.value)}
          placeholder="-----BEGIN CERTIFICATE-----"
        />
      </div>

      {error && <div className="sec-error">{error}</div>}

      {result && (
        <div className="sec-result-block">
          <table className="sec-details-table">
            <tbody>
              <tr>
                <td>Type:</td>
                <td>{result.type}</td>
              </tr>
              <tr>
                <td>Subject:</td>
                <td>{result.subject}</td>
              </tr>
              <tr>
                <td>Issuer:</td>
                <td>{result.issuer}</td>
              </tr>
              {result.validFrom && (
                <tr>
                  <td>Validity:</td>
                  <td>
                    {result.validFrom} – {result.validTo}{' '}
                    {result.isExpired !== undefined && (
                      <span
                        style={{
                          color: result.isExpired ? 'var(--danger)' : 'var(--success)',
                          fontWeight: 600,
                          marginLeft: 8,
                        }}
                      >
                        {result.isExpired ? '(Expired)' : '(Valid)'}
                      </span>
                    )}
                  </td>
                </tr>
              )}
              <tr>
                <td>SHA-256 Fingerprint:</td>
                <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ wordBreak: 'break-all', flex: 1 }}>{result.fingerprintSha256}</span>
                  <CopyButton text={result.fingerprintSha256} />
                </td>
              </tr>
              <tr>
                <td>SHA-1 Fingerprint:</td>
                <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ wordBreak: 'break-all', flex: 1 }}>{result.fingerprintSha1}</span>
                  <CopyButton text={result.fingerprintSha1} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </SecCard>
  );
}

// ─── 11. Key Pair Generator ──────────────────────────────────────────────────

function KeyPairGeneratorView() {
  const [algo, setAlgo] = React.useState<'RSA-2048' | 'RSA-4096' | 'ECDSA-P256'>('RSA-2048');
  const [result, setResult] = React.useState<{ publicKeyPem: string; privateKeyPem: string } | null>(null);
  const [generating, setGenerating] = React.useState(false);

  const generate = async () => {
    setGenerating(true);
    const r = await SecurityEngine.generateKeyPair(algo);
    if (r.success && r.data) {
      setResult(r.data);
    }
    setGenerating(false);
  };

  return (
    <SecCard title="Cryptographic Key Pair Generator">
      <div className="sec-controls-row">
        <div className="control-group">
          <label className="control-label">Key Algorithm:</label>
          <select
            className="control-select"
            value={algo}
            onChange={(e) => setAlgo(e.target.value as typeof algo)}
          >
            <option value="RSA-2048">RSA 2048-bit</option>
            <option value="RSA-4096">RSA 4096-bit</option>
            <option value="ECDSA-P256">ECDSA P-256 (NIST Curve)</option>
          </select>
        </div>
        <button
          type="button"
          className="sec-primary-btn"
          onClick={generate}
          disabled={generating}
        >
          {generating ? 'Generating key pair…' : 'Generate Key Pair'}
        </button>
      </div>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="control-label">Public Key (SPKI):</label>
              <CopyButton text={result.publicKeyPem} />
            </div>
            <textarea
              className="code-editor"
              rows={5}
              readOnly
              value={result.publicKeyPem}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="control-label">Private Key (PKCS#8):</label>
              <CopyButton text={result.privateKeyPem} />
            </div>
            <textarea
              className="code-editor"
              rows={7}
              readOnly
              value={result.privateKeyPem}
            />
          </div>
        </div>
      )}
    </SecCard>
  );
}

// ─── 12. Text Redaction ──────────────────────────────────────────────────────

function TextRedactionView() {
  const [input, setInput] = React.useState(
    'Contact John at john.doe@company.com or +1-555-123-4567.\nSSN: 123-45-6789, Card: 4532-1234-5678-9012\nServer: 192.168.1.1'
  );
  const [maskStyle, setMaskStyle] = React.useState<'asterisk' | 'hash' | 'label'>('asterisk');
  const [maskEmails, setMaskEmails] = React.useState(true);
  const [maskPhones, setMaskPhones] = React.useState(true);
  const [maskSSN, setMaskSSN] = React.useState(true);
  const [maskCreditCards, setMaskCreditCards] = React.useState(true);
  const [maskIPs, setMaskIPs] = React.useState(true);

  const result = React.useMemo(() => {
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
      <div className="sec-redaction-controls">
        <h3 className="sec-card-title">Options</h3>
        <div className="control-group">
          <label className="control-label">Mask Style:</label>
          <select
            className="control-select"
            value={maskStyle}
            onChange={(e) => setMaskStyle(e.target.value as typeof maskStyle)}
          >
            <option value="asterisk">Asterisks (***)</option>
            <option value="hash">Hashes (###)</option>
            <option value="label">[LABEL]</option>
          </select>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 12 }}>
          Detect & Mask
        </div>
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
            {label}
          </label>
        ))}
        {result && (
          <div style={{ marginTop: 16, padding: '8px 12px', background: 'var(--surface)', borderRadius: 6, fontSize: 12 }}>
            <div style={{ color: 'var(--text-muted)' }}>Redactions Made</div>
            <div
              style={{
                fontSize: 20,
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Input Text:</label>
          <textarea
            className="code-editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1, minHeight: 180, resize: 'vertical' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label className="control-label">Sanitized Output:</label>
            {result && <CopyButton text={result.redacted} />}
          </div>
          <textarea
            className="code-editor"
            readOnly
            value={result?.redacted || ''}
            style={{ width: '100%', minHeight: 180, resize: 'vertical', color: 'var(--text-2)' }}
          />
        </div>
      </div>
    </div>
  );
}
