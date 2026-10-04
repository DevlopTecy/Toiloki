import React, { useState } from 'react';
import { Info, Download, ShieldCheck, Check, FileText } from 'lucide-react';
import { Button } from '../../../common/Button';

interface LibraryNotice {
  name: string;
  version: string;
  license: string;
  description: string;
}

const BUNDLED_LIBRARIES: LibraryNotice[] = [
  { name: 'React', version: '^18.3.1', license: 'MIT', description: 'Declarative component framework' },
  { name: 'Electron', version: '^34.2.0', license: 'MIT', description: 'Desktop window and native shell environment' },
  { name: 'Vite', version: '^6.0.7', license: 'MIT', description: 'Frontend bundler and build engine' },
  { name: 'Lucide React', version: '^0.468.0', license: 'ISC', description: 'Clean geometric icon set' },
  { name: 'PDF-Lib', version: '^1.17.9', license: 'MIT', description: 'Client-side PDF document manipulation' },
  { name: 'JSZip', version: '^3.10.1', license: 'MIT', description: 'Local ZIP archive compression and extraction' },
  { name: 'PapaParse', version: '^5.4.1', license: 'MIT', description: 'In-browser tabular CSV parser' },
];

export const AboutSection: React.FC = () => {
  const [exportedDiagnostic, setExportedDiagnostic] = useState(false);

  const handleExportDiagnostics = () => {
    const diagnosticsData = {
      app: 'Toiloki',
      version: '1.0.0',
      buildDate: 'October 2026',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'win32',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '1920x1080',
      devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      offlinePledge: 'Everything runs on this device. No telemetry.',
      networkTraffic: 'None (100% offline local utility)',
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(diagnosticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toiloki-diagnostics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportedDiagnostic(true);
    setTimeout(() => setExportedDiagnostic(false), 4000);
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">About Toiloki</h2>
          <p className="settings-section-desc">
            Local-first desktop utility suite designed for speed, privacy, and precision.
          </p>
        </div>
      </div>

      {/* ─── 1. Core Trust Notice ─── */}
      <div className="settings-shield-line" style={{ marginBottom: '24px' }}>
        <ShieldCheck size={16} />
        <span>Everything runs on this device. No telemetry, no accounts, no AI, no cloud dependencies.</span>
      </div>

      {/* ─── 2. Build Information ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Version</label>
          <span className="settings-helper">Desktop release build</span>
        </div>
        <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          v1.0.0 (October 2026)
        </span>
      </div>

      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Architecture</label>
          <span className="settings-helper">Local Electron sandbox with strict context isolation</span>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Offline desktop bundle
        </span>
      </div>

      {/* ─── 3. Help & Problem Reporting (Local Only) ─── */}
      <div className="settings-row" style={{ marginTop: '16px' }}>
        <div className="settings-row-info">
          <label className="settings-label">Report a problem</label>
          <span className="settings-helper">
            Create a local diagnostic file (app version, OS, runtime parameters; no file contents or personal data) to attach to an email manually.
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportDiagnostics}
        >
          {exportedDiagnostic ? (
            <>
              <Check size={13} style={{ marginRight: '6px', color: 'var(--success)' }} />
              Saved diagnostic file
            </>
          ) : (
            <>
              <Download size={13} style={{ marginRight: '6px' }} />
              Export diagnostics
            </>
          )}
        </Button>
      </div>

      {/* ─── 4. Open-Source Bundled Libraries ─── */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <FileText size={15} style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
            Open-source notices and bundled software
          </h3>
        </div>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
          Toiloki is built with modern, reliable open-source libraries. Each library retains its respective copyright notices and permissive licensing:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {BUNDLED_LIBRARIES.map((lib) => (
            <div
              key={lib.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)', marginRight: '8px' }}>
                  {lib.name}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {lib.description}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-2)',
                }}
              >
                {lib.license}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
