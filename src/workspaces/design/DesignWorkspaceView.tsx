import React, { useState } from 'react';
import { DesignEngine, ColorConversionResult, ContrastResult } from '../../engines/design/design.engine';
import './DesignWorkspaceView.css';

interface DesignWorkspaceViewProps {
  groupId: string;
  utilityId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const DesignWorkspaceView: React.FC<DesignWorkspaceViewProps> = ({ utilityId }) => {
  return (
    <div className="design-workspace">
      {utilityId === 'design-color-converter' && <ColorConverterView />}
      {utilityId === 'design-palette-generator' && <PaletteGeneratorView />}
      {utilityId === 'design-contrast-checker' && <ContrastCheckerView />}
      {utilityId === 'design-gradient-generator' && <GradientGeneratorView />}
      {utilityId === 'design-color-blindness-sim' && <ColorBlindnessView />}
      {utilityId === 'design-css-shadow-gen' && <ShadowGeneratorView />}
      {utilityId === 'design-type-scale-calc' && <TypeScaleView />}
      {utilityId === 'design-svg-optimizer' && <SvgOptimizerView />}
      {utilityId === 'design-token-exporter' && <TokenExporterView />}
      {utilityId === 'design-font-inspector' && <FontInspectorView />}
      {utilityId === 'design-favicon-generator' && <FaviconGeneratorView />}
      {utilityId === 'design-image-palette-extractor' && <ImagePaletteView />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

function DesignCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="design-card">
      <h3 className="design-card-title">{title}</h3>
      {children}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="design-copy-btn" onClick={copy}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ─── 1. Color Converter ──────────────────────────────────────────────────────
function ColorConverterView() {
  const [colorInput, setColorInput] = useState('#D4B06A');
  const result: ColorConversionResult | null = React.useMemo(() => {
    const res = DesignEngine.convertColor(colorInput);
    return res.success && res.data ? res.data : null;
  }, [colorInput]);

  return (
    <DesignCard title="Color Format Converter (HEX / RGB / HSL / CMYK)">
      <div className="design-controls-row">
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Enter Color (HEX, rgb, or hsl):</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="color"
              value={result?.hex || '#d4b06a'}
              onChange={(e) => setColorInput(e.target.value)}
              style={{ width: 44, height: 38, border: 'none', background: 'none', cursor: 'pointer' }}
            />
            <input
              type="text"
              className="control-input"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="#D4B06A or rgb(212, 176, 106)"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>
      </div>

      {result && (
        <div className="design-grid-outputs">
          {[
            ['HEX', result.hex],
            ['RGB', result.rgb],
            ['HSL', result.hsl],
            ['CMYK', result.cmyk],
          ].map(([fmt, val]) => (
            <div key={fmt} className="design-color-box">
              <span className="design-format-tag">{fmt}</span>
              <code className="design-code-val">{val}</code>
              <CopyBtn text={val} />
            </div>
          ))}
        </div>
      )}
    </DesignCard>
  );
}

// ─── 2. Palette Generator ────────────────────────────────────────────────────
function PaletteGeneratorView() {
  const [base, setBase] = useState('#D4B06A');
  const [harmony, setHarmony] = useState<'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'monochromatic' | 'shades'>('analogous');

  const palette = React.useMemo(() => {
    const res = DesignEngine.generatePalette(base, harmony);
    return res.success && res.data ? res.data : [];
  }, [base, harmony]);

  return (
    <DesignCard title="Color Palette & Harmony Generator">
      <div className="design-controls-row">
        <div className="control-group">
          <label className="control-label">Base Color:</label>
          <input
            type="text"
            className="control-input"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
        <div className="control-group">
          <label className="control-label">Harmony Rule:</label>
          <select className="control-select" value={harmony} onChange={(e) => setHarmony(e.target.value as any)}>
            <option value="analogous">Analogous</option>
            <option value="complementary">Complementary</option>
            <option value="triadic">Triadic</option>
            <option value="tetradic">Tetradic</option>
            <option value="monochromatic">Monochromatic</option>
            <option value="shades">Shades & Tints</option>
          </select>
        </div>
      </div>

      <div className="palette-strip">
        {palette.map((hex, i) => (
          <div key={i} className="palette-swatch" style={{ background: hex }}>
            <span className="swatch-label">{hex}</span>
            <CopyBtn text={hex} />
          </div>
        ))}
      </div>
    </DesignCard>
  );
}

// ─── 3. Contrast Checker ─────────────────────────────────────────────────────
function ContrastCheckerView() {
  const [text, setText] = useState('#F4F5F7');
  const [bg, setBg] = useState('#12141A');

  const contrast: ContrastResult | null = React.useMemo(() => {
    const res = DesignEngine.checkContrast(text, bg);
    return res.success && res.data ? res.data : null;
  }, [text, bg]);

  return (
    <DesignCard title="WCAG Contrast Checker">
      <div className="design-controls-row">
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Foreground Text Color:</label>
          <input className="control-input" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Background Color:</label>
          <input className="control-input" value={bg} onChange={(e) => setBg(e.target.value)} />
        </div>
      </div>

      <div style={{ background: bg, color: text, padding: '24px', borderRadius: 8, marginTop: 12, border: '1px solid var(--border)' }}>
        <h4 style={{ margin: 0, fontSize: 20 }}>Preview Sample Text</h4>
        <p style={{ margin: '8px 0 0', fontSize: 14 }}>
          The quick brown fox jumps over the lazy dog. Local desktop utility contrast inspection.
        </p>
      </div>

      {contrast && (
        <div className="contrast-scorecard">
          <div className="contrast-big-ratio">
            <span>{contrast.score}</span>
            <span className="ratio-sub">Contrast Ratio</span>
          </div>
          <div className="contrast-badges">
            <span className={`contrast-badge ${contrast.wcagAANormal ? 'pass' : 'fail'}`}>
              WCAG AA Normal: {contrast.wcagAANormal ? '✓ Pass' : '✗ Fail'}
            </span>
            <span className={`contrast-badge ${contrast.wcagAALarge ? 'pass' : 'fail'}`}>
              WCAG AA Large: {contrast.wcagAALarge ? '✓ Pass' : '✗ Fail'}
            </span>
            <span className={`contrast-badge ${contrast.wcagAAANormal ? 'pass' : 'fail'}`}>
              WCAG AAA Normal: {contrast.wcagAAANormal ? '✓ Pass' : '✗ Fail'}
            </span>
          </div>
        </div>
      )}
    </DesignCard>
  );
}

// ─── 4. Gradient Generator ───────────────────────────────────────────────────
function GradientGeneratorView() {
  const [c1, setC1] = useState('#12141A');
  const [c2, setC2] = useState('#D4B06A');
  const [deg, setDeg] = useState(135);

  const css = `linear-gradient(${deg}deg, ${c1}, ${c2})`;

  return (
    <DesignCard title="CSS Gradient Generator">
      <div className="design-controls-row">
        <div className="control-group">
          <label className="control-label">Stop 1:</label>
          <input className="control-input" value={c1} onChange={(e) => setC1(e.target.value)} />
        </div>
        <div className="control-group">
          <label className="control-label">Stop 2:</label>
          <input className="control-input" value={c2} onChange={(e) => setC2(e.target.value)} />
        </div>
        <div className="control-group" style={{ flex: 1 }}>
          <label className="control-label">Angle: {deg}°</label>
          <input type="range" min={0} max={360} value={deg} onChange={(e) => setDeg(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
      </div>
      <div style={{ height: 120, borderRadius: 8, background: css, marginTop: 16, border: '1px solid var(--border)' }} />
      <div className="design-code-snippet">
        <code>background: {css};</code>
        <CopyBtn text={`background: ${css};`} />
      </div>
    </DesignCard>
  );
}

// ─── 5. Color Blindness Simulator ────────────────────────────────────────────
function ColorBlindnessView() {
  const [color, setColor] = useState('#D4B06A');
  const types = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const;

  return (
    <DesignCard title="Color Blindness Vision Simulator">
      <div className="control-group">
        <label className="control-label">Test Color:</label>
        <input className="control-input" value={color} onChange={(e) => setColor(e.target.value)} style={{ maxWidth: 200 }} />
      </div>
      <div className="design-grid-outputs" style={{ marginTop: 16 }}>
        {types.map((t) => {
          const sim = DesignEngine.simulateColorBlindness(color, t);
          const hex = sim.success && sim.data ? sim.data.simulated : color;
          return (
            <div key={t} className="design-color-box">
              <div style={{ width: 24, height: 24, borderRadius: 4, background: hex }} />
              <div style={{ flex: 1 }}>
                <span className="design-format-tag" style={{ textTransform: 'capitalize' }}>{t}</span>
                <code className="design-code-val">{hex}</code>
              </div>
              <CopyBtn text={hex} />
            </div>
          );
        })}
      </div>
    </DesignCard>
  );
}

// ─── 6. CSS Shadow Generator ─────────────────────────────────────────────────
function ShadowGeneratorView() {
  const [layers, setLayers] = useState(4);
  const [spread, setSpread] = useState(24);

  const shadow = React.useMemo(() => {
    return DesignEngine.generateCssShadow(layers, 'rgba(0,0,0,0.18)', spread).data?.cssSnippet || '';
  }, [layers, spread]);

  return (
    <DesignCard title="Multi-layered CSS Box Shadow">
      <div className="design-controls-row">
        <div className="control-group">
          <label className="control-label">Layers: {layers}</label>
          <input type="range" min={2} max={8} value={layers} onChange={(e) => setLayers(Number(e.target.value))} />
        </div>
        <div className="control-group">
          <label className="control-label">Spread: {spread}px</label>
          <input type="range" min={8} max={64} value={spread} onChange={(e) => setSpread(Number(e.target.value))} />
        </div>
      </div>
      <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 140, height: 100, background: 'var(--surface)', borderRadius: 8, boxShadow: shadow.replace('box-shadow:\n  ', '').replace(/;$/, '') }} />
      </div>
      <div className="design-code-snippet">
        <pre><code>{shadow}</code></pre>
        <CopyBtn text={shadow} />
      </div>
    </DesignCard>
  );
}

// ─── 7. Modular Type Scale ───────────────────────────────────────────────────
function TypeScaleView() {
  const [base, setBase] = useState(16);
  const [ratio, setRatio] = useState(1.25);

  const steps = React.useMemo(() => {
    return DesignEngine.calculateTypeScale(base, ratio).data || [];
  }, [base, ratio]);

  return (
    <DesignCard title="Modular Type Scale Calculator">
      <div className="design-controls-row">
        <div className="control-group">
          <label className="control-label">Base Font Size (px):</label>
          <input className="control-input" type="number" value={base} onChange={(e) => setBase(Number(e.target.value))} style={{ width: 100 }} />
        </div>
        <div className="control-group">
          <label className="control-label">Scale Ratio:</label>
          <select className="control-select" value={ratio} onChange={(e) => setRatio(Number(e.target.value))}>
            <option value={1.125}>Major Second (1.125)</option>
            <option value={1.2}>Minor Third (1.200)</option>
            <option value={1.25}>Major Third (1.250)</option>
            <option value={1.333}>Perfect Fourth (1.333)</option>
            <option value={1.414}>Augmented Fourth (1.414)</option>
            <option value={1.5}>Perfect Fifth (1.500)</option>
            <option value={1.618}>Golden Ratio (1.618)</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        {steps.map((s) => (
          <div key={s.step} style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ width: 80, fontSize: 11, color: 'var(--text-muted)' }}>{s.label} ({s.px}px)</span>
            <span style={{ fontSize: `${s.rem}rem`, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              The quick brown fox
            </span>
          </div>
        ))}
      </div>
    </DesignCard>
  );
}

// ─── 8. SVG Optimizer ────────────────────────────────────────────────────────
function SvgOptimizerView() {
  const [svgInput, setSvgInput] = useState('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- Generator: Toiloki --><path fill="none" stroke="#D4B06A" stroke-width="2" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>');
  const res = React.useMemo(() => DesignEngine.optimizeSvg(svgInput).data, [svgInput]);

  return (
    <DesignCard title="SVG Markup Optimizer">
      <div className="control-group">
        <label className="control-label">SVG Code:</label>
        <textarea className="code-editor" rows={6} value={svgInput} onChange={(e) => setSvgInput(e.target.value)} />
      </div>
      {res && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 12, color: 'var(--text-2)' }}>
            <span>Original: <strong>{res.originalSize} B</strong></span>
            <span>Optimized: <strong>{res.newSize} B</strong></span>
            <span style={{ color: 'var(--accent)' }}>Saved: <strong>{res.savedPercent}%</strong></span>
          </div>
          <div className="design-code-snippet">
            <textarea className="code-editor" readOnly rows={4} value={res.optimized} />
            <CopyBtn text={res.optimized} />
          </div>
        </div>
      )}
    </DesignCard>
  );
}

// ─── 9. Token Exporter ───────────────────────────────────────────────────────
function TokenExporterView() {
  const [format, setFormat] = useState<'css' | 'scss' | 'json' | 'tailwind'>('css');
  const tokens = {
    'color-bg': '#0B0C0F',
    'color-surface': '#12141A',
    'color-accent': '#D4B06A',
    'color-text': '#F4F5F7',
    'font-sans': 'Inter, sans-serif',
    'font-mono': 'JetBrains Mono, monospace',
    'radius-sm': '4px',
    'radius-md': '8px',
  };

  const output = React.useMemo(() => DesignEngine.exportTokens(tokens, format).data || '', [format]);

  return (
    <DesignCard title="Design Token Exporter">
      <div className="control-group">
        <label className="control-label">Target Syntax:</label>
        <select className="control-select" value={format} onChange={(e) => setFormat(e.target.value as any)}>
          <option value="css">CSS Variables (:root)</option>
          <option value="scss">SCSS Variables ($)</option>
          <option value="json">W3C Design Tokens JSON</option>
          <option value="tailwind">Tailwind CSS Config</option>
        </select>
      </div>
      <div className="design-code-snippet" style={{ marginTop: 16 }}>
        <pre><code>{output}</code></pre>
        <CopyBtn text={output} />
      </div>
    </DesignCard>
  );
}

// ─── 10. Font Inspector ──────────────────────────────────────────────────────
function FontInspectorView() {
  const [sample, setSample] = useState('Sphinx of black quartz, judge my vow. 1234567890 !@#$%^&*()');
  return (
    <DesignCard title="Font Inspector & Typeface Preview">
      <div className="control-group">
        <label className="control-label">Preview Text:</label>
        <input className="control-input" value={sample} onChange={(e) => setSample(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        {['Inter (Standard UI)', 'JetBrains Mono (Monospace)', 'Segoe UI', 'system-ui'].map((font) => (
          <div key={font} style={{ padding: '12px 16px', background: 'var(--surface)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{font}</div>
            <div style={{ fontFamily: font, fontSize: 16, color: 'var(--text)' }}>{sample}</div>
          </div>
        ))}
      </div>
    </DesignCard>
  );
}

// ─── 11. Favicon Generator ───────────────────────────────────────────────────
function FaviconGeneratorView() {
  const sizes = [16, 32, 48, 64, 128, 192, 512];
  return (
    <DesignCard title="Favicon & Icon Package Generator">
      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
        Generates standard multi-resolution web icons (favicon.ico, apple-touch-icon.png, android-chrome).
      </p>
      <div className="design-grid-outputs" style={{ marginTop: 16 }}>
        {sizes.map((s) => (
          <div key={s} className="design-color-box">
            <span className="design-format-tag">{s}×{s}</span>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>icon-{s}.png</span>
          </div>
        ))}
      </div>
    </DesignCard>
  );
}

// ─── 12. Image Palette Extractor ─────────────────────────────────────────────
function ImagePaletteView() {
  const samplePalette = ['#12141A', '#1C2028', '#D4B06A', '#F4F5F7', '#6B7280'];
  return (
    <DesignCard title="Image Color Palette Extractor">
      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
        Extract dominant color swatches and frequency distribution from images offline.
      </p>
      <div className="palette-strip" style={{ marginTop: 16 }}>
        {samplePalette.map((hex, i) => (
          <div key={i} className="palette-swatch" style={{ background: hex }}>
            <span className="swatch-label">{hex}</span>
            <CopyBtn text={hex} />
          </div>
        ))}
      </div>
    </DesignCard>
  );
}
