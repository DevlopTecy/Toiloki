import React from 'react';
import { SecurityEngine } from '../../engines/security/security.engine';
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
      {utilityId === 'sec-text-redaction' && <TextRedactionView />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

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
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="sec-copy-btn" onClick={copy}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ─── Hash / HMAC ─────────────────────────────────────────────────────────────
function HashHmacView() {
  const [input, setInput] = React.useState('Hello, Toiloki!');
  const [algo, setAlgo] = React.useState<'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256');
  const [hmacSecret, setHmacSecret] = React.useState('');
  const [result, setResult] = React.useState<{ hex: string; base64: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const compute = async () => {
    setError(null);
    const r = await SecurityEngine.hashText(input, algo, hmacSecret || undefined);
    if (r.success && r.data) setResult(r.data);
    else setError(r.error || 'Unknown error');
  };

  React.useEffect(() => { compute(); }, [input, algo, hmacSecret]);

  return (
    <SecCard title="Hash / HMAC Generator">
      <div className="control-group">
        <label className="control-label">Input Text:</label>
        <textarea className="code-editor" rows={4} value={input} onChange={e => setInput(e.target.value)}
          style={{ resize: 'vertical' }} />
      </div>
      <div className="sec-controls-row">
        <div className="control-group">
          <label className="control-label">Algorithm:</label>
          <select className="control-select" value={algo} onChange={e => setAlgo(e.target.value as typeof algo)}>
            <option>SHA-1</option>
            <option>SHA-256</option>
            <option>SHA-384</option>
            <option>SHA-512</option>
          </select>
        </div>
        <div className="control-group" style={{ flex: 2 }}>
          <label className="control-label">HMAC Secret (optional):</label>
          <input className="control-input" type="password" value={hmacSecret} onChange={e => setHmacSecret(e.target.value)}
            placeholder="Leave empty for plain hash" />
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

// ─── Password Generator ───────────────────────────────────────────────────────
function PasswordGeneratorView() {
  const [length, setLength] = React.useState(20);
  const [uppercase, setUppercase] = React.useState(true);
  const [lowercase, setLowercase] = React.useState(true);
  const [numbers, setNumbers] = React.useState(true);
  const [symbols, setSymbols] = React.useState(true);
  const [ambiguous, setAmbiguous] = React.useState(false);
  const [exclude, setExclude] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [strength, setStrength] = React.useState<any>(null);

  const generate = () => {
    const r = SecurityEngine.generatePassword({ length, uppercase, lowercase, numbers, symbols, ambiguous, exclude });
    if (r.success && r.data) {
      setPassword(r.data);
      setError(null);
      const sr = SecurityEngine.checkPasswordStrength(r.data);
      if (sr.success) setStrength(sr.data);
    } else {
      setError(r.error || 'Error');
    }
  };

  React.useEffect(() => { generate(); }, [length, uppercase, lowercase, numbers, symbols, ambiguous, exclude]);

  const strengthColors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22c55e'];

  return (
    <SecCard title="Password Generator">
      <div className="sec-controls-row">
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Length: {length}</label>
          <input type="range" min={4} max={128} value={length} onChange={e => setLength(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div className="sec-checkboxes">
          {[['A–Z', uppercase, setUppercase], ['a–z', lowercase, setLowercase], ['0–9', numbers, setNumbers], ['!@#', symbols, setSymbols], ['No ambiguous', ambiguous, setAmbiguous]].map(([label, val, setter]: any) => (
            <label key={label} className="sec-checkbox-label">
              <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} /> {label}
            </label>
          ))}
        </div>
      </div>
      <div className="control-group">
        <label className="control-label">Exclude characters:</label>
        <input className="control-input" value={exclude} onChange={e => setExclude(e.target.value)} placeholder="e.g. oO0Iil1" style={{ fontFamily: 'var(--font-mono)' }} />
      </div>
      {error && <div className="sec-error">{error}</div>}
      <div className="sec-password-display">
        <code className="sec-password-code">{password}</code>
        <div className="sec-password-actions">
          <CopyButton text={password} />
          <button className="sec-refresh-btn" onClick={generate}>↻ New</button>
        </div>
      </div>
      {strength && (
        <div className="sec-strength-bar">
          <div className="sec-strength-track">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={`sec-strength-segment ${i <= strength.score ? 'active' : ''}`}
                style={{ background: i <= strength.score ? strengthColors[strength.score] : undefined }} />
            ))}
          </div>
          <span className="sec-strength-label" style={{ color: strengthColors[strength.score] }}>{strength.label}</span>
          <span className="sec-strength-meta">{strength.entropy} bits · {strength.crackTime}</span>
        </div>
      )}
    </SecCard>
  );
}

// ─── Passphrase Generator ─────────────────────────────────────────────────────
function PassphraseGeneratorView() {
  const [wordCount, setWordCount] = React.useState(4);
  const [separator, setSeparator] = React.useState('-');
  const [capitalize, setCapitalize] = React.useState(true);
  const [includeNumber, setIncludeNumber] = React.useState(false);
  const [phrase, setPhrase] = React.useState('');

  const generate = () => {
    const r = SecurityEngine.generatePassphrase({ wordCount, separator, capitalize, includeNumber });
    if (r.success && r.data) setPhrase(r.data);
  };

  React.useEffect(() => { generate(); }, [wordCount, separator, capitalize, includeNumber]);

  return (
    <SecCard title="Passphrase Generator">
      <div className="sec-controls-row">
        <div className="control-group">
          <label className="control-label">Word Count: {wordCount}</label>
          <input type="range" min={2} max={8} value={wordCount} onChange={e => setWordCount(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div className="control-group">
          <label className="control-label">Separator:</label>
          <select className="control-select" value={separator} onChange={e => setSeparator(e.target.value)}>
            <option value="-">Hyphen (–)</option>
            <option value=" ">Space</option>
            <option value=".">Period (.)</option>
            <option value="_">Underscore (_)</option>
          </select>
        </div>
      </div>
      <div className="sec-checkboxes">
        <label className="sec-checkbox-label"><input type="checkbox" checked={capitalize} onChange={e => setCapitalize(e.target.checked)} /> Capitalize words</label>
        <label className="sec-checkbox-label"><input type="checkbox" checked={includeNumber} onChange={e => setIncludeNumber(e.target.checked)} /> Include number</label>
      </div>
      <div className="sec-password-display" style={{ marginTop: 16 }}>
        <code className="sec-password-code" style={{ fontSize: 18 }}>{phrase}</code>
        <div className="sec-password-actions">
          <CopyButton text={phrase} />
          <button className="sec-refresh-btn" onClick={generate}>↻ New</button>
        </div>
      </div>
    </SecCard>
  );
}

// ─── Password Strength Checker ────────────────────────────────────────────────
function PasswordStrengthView() {
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const result = React.useMemo(() => {
    if (!password) return null;
    const r = SecurityEngine.checkPasswordStrength(password);
    return r.success ? r.data : null;
  }, [password]);

  const strengthColors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22c55e'];

  return (
    <SecCard title="Password Strength Checker">
      <div className="control-group">
        <label className="control-label">Password:</label>
        <div style={{ position: 'relative' }}>
          <input className="control-input" type={showPassword ? 'text' : 'password'}
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Enter a password to analyze…" style={{ width: '100%', fontFamily: 'var(--font-mono)', paddingRight: 72 }} />
          <button onClick={() => setShowPassword(s => !s)}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      {result && (
        <div>
          <div className="sec-strength-bar" style={{ marginBottom: 16 }}>
            <div className="sec-strength-track">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className={`sec-strength-segment ${i <= result.score ? 'active' : ''}`}
                  style={{ background: i <= result.score ? strengthColors[result.score] : undefined, height: 8 }} />
              ))}
            </div>
            <span className="sec-strength-label" style={{ color: strengthColors[result.score], fontSize: 16, fontWeight: 700 }}>{result.label}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'var(--bg-raised)', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Entropy</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{result.entropy} bits</div>
            </div>
            <div style={{ background: 'var(--bg-raised)', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Crack Time</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: strengthColors[result.score] }}>{result.crackTime}</div>
            </div>
          </div>
          {result.suggestions.length > 0 && (
            <div style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: 6, padding: '12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f87171', marginBottom: 8 }}>Suggestions</div>
              {result.suggestions.map(s => (
                <div key={s} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>• {s}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </SecCard>
  );
}

// ─── TOTP Generator ───────────────────────────────────────────────────────────
function TOTPView() {
  const [secret, setSecret] = React.useState('JBSWY3DPEHPK3PXP');
  const [digits, setDigits] = React.useState(6);
  const [period, setPeriod] = React.useState(30);
  const [result, setResult] = React.useState<{ code: string; secondsRemaining: number; validUntil: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const generate = async () => {
    if (!secret.trim()) return;
    const r = await SecurityEngine.generateTOTP(secret.trim(), digits, period);
    if (r.success && r.data) { setResult(r.data); setError(null); }
    else setError(r.error || 'Error');
  };

  React.useEffect(() => {
    generate();
    const interval = setInterval(generate, 1000);
    return () => clearInterval(interval);
  }, [secret, digits, period]);

  const progress = result ? ((result.secondsRemaining / period) * 100) : 0;

  return (
    <SecCard title="TOTP Code Generator (Offline)">
      <div className="sec-info-banner">
        🔒 Fully offline. Secret never leaves your device.
      </div>
      <div className="control-group">
        <label className="control-label">Base32 Secret:</label>
        <input className="control-input" value={secret} onChange={e => setSecret(e.target.value)}
          placeholder="JBSWY3DPEHPK3PXP" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }} />
      </div>
      <div className="sec-controls-row">
        <div className="control-group">
          <label className="control-label">Digits:</label>
          <select className="control-select" value={digits} onChange={e => setDigits(Number(e.target.value))}>
            <option value={6}>6</option>
            <option value={8}>8</option>
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">Period (seconds):</label>
          <select className="control-select" value={period} onChange={e => setPeriod(Number(e.target.value))}>
            <option value={30}>30</option>
            <option value={60}>60</option>
          </select>
        </div>
      </div>
      {error && <div className="sec-error">{error}</div>}
      {result && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 52, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.3em', color: 'var(--accent)', marginBottom: 8 }}>
            {result.code}
          </div>
          <div style={{ height: 4, background: 'var(--bg-hover)', borderRadius: 2, margin: '0 auto 8px', maxWidth: 200, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: progress > 25 ? 'var(--accent)' : '#f87171', borderRadius: 2, transition: 'width 1s linear' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Expires in {result.secondsRemaining}s · Valid until {result.validUntil}
          </div>
          <CopyButton text={result.code} />
        </div>
      )}
    </SecCard>
  );
}

// ─── Checksum Verifier ────────────────────────────────────────────────────────
function ChecksumView() {
  const [algo, setAlgo] = React.useState<'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256');
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
        else setError(r.error || 'Error');
      } else {
        const r = await SecurityEngine.hashFile(buffer, algo);
        if (r.success && r.data) setResult({ match: false, actualHash: r.data.hex });
        else setError(r.error || 'Error');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setComputing(false);
    }
  };

  return (
    <SecCard title="File Checksum Verifier">
      <div className="control-group">
        <label className="control-label">Algorithm:</label>
        <select className="control-select" value={algo} onChange={e => setAlgo(e.target.value as typeof algo)}>
          <option>SHA-1</option>
          <option>SHA-256</option>
          <option>SHA-384</option>
          <option>SHA-512</option>
        </select>
      </div>
      <div className="control-group">
        <label className="control-label">Expected Hash (optional – to verify):</label>
        <input className="control-input" value={expectedHash} onChange={e => setExpectedHash(e.target.value)}
          placeholder="Paste expected hash here to compare" style={{ fontFamily: 'var(--font-mono)' }} />
      </div>
      <div className="sec-file-drop">
        <input type="file" id="checksum-file" style={{ display: 'none' }} onChange={handleFileChange} />
        <label htmlFor="checksum-file" className="sec-file-label">
          {computing ? 'Computing hash…' : fileName ? `File: ${fileName}` : '📂 Click to select a file'}
        </label>
      </div>
      {error && <div className="sec-error">{error}</div>}
      {result && (
        <div className={`sec-checksum-result ${expectedHash ? (result.match ? 'match' : 'mismatch') : ''}`}>
          {expectedHash && (
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: result.match ? '#4ade80' : '#f87171' }}>
              {result.match ? '✓ Checksum matches' : '✗ Checksum does NOT match'}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, wordBreak: 'break-all', flex: 1, color: 'var(--text-secondary)' }}>
              {result.actualHash}
            </code>
            <CopyButton text={result.actualHash} />
          </div>
        </div>
      )}
    </SecCard>
  );
}

// ─── Text Redaction ───────────────────────────────────────────────────────────
function TextRedactionView() {
  const [input, setInput] = React.useState('Contact John at john.doe@company.com or +1-555-123-4567.\nSSN: 123-45-6789, Card: 4532-1234-5678-9012\nServer: 192.168.1.1');
  const [maskStyle, setMaskStyle] = React.useState<'asterisk' | 'hash' | 'label'>('asterisk');
  const [maskEmails, setMaskEmails] = React.useState(true);
  const [maskPhones, setMaskPhones] = React.useState(true);
  const [maskSSN, setMaskSSN] = React.useState(true);
  const [maskCreditCards, setMaskCreditCards] = React.useState(true);
  const [maskIPs, setMaskIPs] = React.useState(true);

  const result = React.useMemo(() => {
    const r = SecurityEngine.redactText(input, { maskEmails, maskPhones, maskSSN, maskCreditCards, maskIPs, maskStyle });
    return r.success ? r.data : null;
  }, [input, maskStyle, maskEmails, maskPhones, maskSSN, maskCreditCards, maskIPs]);

  return (
    <div className="sec-redaction-layout">
      <div className="sec-redaction-controls">
        <h3 className="sec-card-title">Options</h3>
        <div className="control-group">
          <label className="control-label">Mask Style:</label>
          <select className="control-select" value={maskStyle} onChange={e => setMaskStyle(e.target.value as typeof maskStyle)}>
            <option value="asterisk">Asterisks (***)</option>
            <option value="hash">Hashes (###)</option>
            <option value="label">[LABEL]</option>
          </select>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 8, marginTop: 12 }}>DETECT & MASK</div>
        {[['Email addresses', maskEmails, setMaskEmails], ['Phone numbers', maskPhones, setMaskPhones], ['SSN (US)', maskSSN, setMaskSSN], ['Credit cards', maskCreditCards, setMaskCreditCards], ['IP addresses', maskIPs, setMaskIPs]].map(([label, val, setter]: any) => (
          <label key={label} className="sec-checkbox-label" style={{ marginBottom: 8, display: 'block' }}>
            <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} /> {label}
          </label>
        ))}
        {result && (
          <div style={{ marginTop: 16, padding: '8px 10px', background: 'var(--bg-raised)', borderRadius: 6, fontSize: 12 }}>
            <div style={{ color: 'var(--text-tertiary)' }}>Redactions</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{result.redactionCount}</div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Input:</label>
          <textarea className="code-editor" value={input} onChange={e => setInput(e.target.value)}
            style={{ flex: 1, minHeight: 200, resize: 'vertical' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label className="control-label">Redacted Output:</label>
            {result && <CopyButton text={result.redacted} />}
          </div>
          <textarea className="code-editor" readOnly value={result?.redacted || ''}
            style={{ width: '100%', minHeight: 200, resize: 'vertical', color: 'var(--text-secondary)' }} />
        </div>
      </div>
    </div>
  );
}
