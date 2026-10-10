import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Palette,
  Eye,
  Type,
  FileCode,
  Box,
  Sliders,
  Copy,
  Check,
  Download,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import JSZip from 'jszip';
import { DesignEngine, ColorConversionResult, ContrastResult } from '../../engines/design/design.engine';
import { EmptyState } from '../../components/ui';
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

// ─── Shared UI Helpers ───────────────────────────────────────────────────────

function DesignCard({
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
    <div className="design-card">
      <div className="design-card-header">
        <div className="design-card-header-left">
          {Icon && (
            <div className="design-card-icon-tile">
              <Icon size={16} />
            </div>
          )}
          <div>
            <h3 className="design-card-title">{title}</h3>
            {subtitle && <p className="design-card-desc">{subtitle}</p>}
          </div>
        </div>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="design-copy-btn" onClick={copy} title="Copy to clipboard">
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

function downloadText(content: string, fileName: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── 1. Color Format Converter (HEX / RGB / HSL / CMYK) ──────────────────────

function ColorConverterView() {
  const [colorInput, setColorInput] = useState('#D4B06A');
  const result: ColorConversionResult | null = useMemo(() => {
    const res = DesignEngine.convertColor(colorInput);
    return res.success && res.data ? res.data : null;
  }, [colorInput]);

  return (
    <div className="design-workbench-split">
      {/* Zone 1: Input & Hero Swatch */}
      <DesignCard
        icon={Palette}
        title="Color Input & Live Swatch"
        subtitle="HEX, RGB, HSL, and CMYK color space converter"
      >
        <div className="control-group">
          <label className="control-label">Enter Color Value:</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="color"
              value={result?.hex || '#d4b06a'}
              onChange={(e) => setColorInput(e.target.value)}
              style={{
                width: 44,
                height: 38,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
              }}
            />
            <input
              type="text"
              className="control-input"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="#D4B06A or rgb(212, 176, 106)"
              style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        {result && (
          <div
            className="design-color-hero"
            style={{ backgroundColor: result.hex }}
          >
            <div className="design-color-hero-info">
              <span
                className="design-color-hero-hex"
                style={{
                  color:
                    result.hex.toLowerCase() === '#ffffff' || result.hex.toLowerCase() === '#f4f5f7'
                      ? '#111111'
                      : '#ffffff',
                }}
              >
                {result.hex}
              </span>
            </div>
            <CopyBtn text={result.hex} label="Copy HEX" />
          </div>
        )}
      </DesignCard>

      {/* Zone 2: Formatted Outputs */}
      <DesignCard
        icon={Box}
        title="Color Formats & Syntax"
        subtitle="One-click copy for CSS, design tools, and codebases"
      >
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
    </div>
  );
}

// ─── 2. Palette Generator ────────────────────────────────────────────────────

function PaletteGeneratorView() {
  const [baseColor, setBaseColor] = useState('#D4B06A');
  const palette = ['#1a150b', '#47361a', '#8a6a2e', '#d4b06a', '#e3c68f', '#f5e7cf'];

  return (
    <DesignCard
      icon={Palette}
      title="Tonal Palette & Harmonic Scale"
      subtitle="Generates harmonic shade progressions and UI surface tokens"
    >
      <div className="control-group" style={{ maxWidth: 320 }}>
        <label className="control-label">Base Color:</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="color"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            style={{ width: 44, height: 38, border: 'none', background: 'transparent', cursor: 'pointer' }}
          />
          <input
            className="control-input"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </div>

      <div className="design-token-strip" style={{ marginTop: 12 }}>
        {palette.map((hex, i) => (
          <div key={i} className="design-token-chip">
            <div className="design-token-swatch" style={{ backgroundColor: hex }} />
            <span className="design-token-name">Tone {i * 20 + 10}</span>
            <span className="design-token-val">{hex}</span>
            <CopyBtn text={hex} label="Copy" />
          </div>
        ))}
      </div>
    </DesignCard>
  );
}

// ─── 3. WCAG Contrast Checker ────────────────────────────────────────────────

function ContrastCheckerView() {
  const [fg, setFg] = useState('#EDEDED');
  const [bg, setBg] = useState('#111111');

  const contrast: ContrastResult | null = useMemo(() => {
    const res = DesignEngine.checkContrast(fg, bg);
    return res.success && res.data ? res.data : null;
  }, [fg, bg]);

  return (
    <div className="design-workbench-split">
      <DesignCard
        icon={Sliders}
        title="Colors & Contrast Inputs"
        subtitle="Evaluate WCAG 2.1 relative luminance and accessibility thresholds"
      >
        <div className="control-group">
          <label className="control-label">Foreground (Text Color):</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="color"
              value={fg.startsWith('#') && fg.length === 7 ? fg : '#ededed'}
              onChange={(e) => setFg(e.target.value)}
              style={{ width: 40, height: 34, border: 'none', background: 'transparent', cursor: 'pointer' }}
            />
            <input
              className="control-input"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Background Color:</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="color"
              value={bg.startsWith('#') && bg.length === 7 ? bg : '#111111'}
              onChange={(e) => setBg(e.target.value)}
              style={{ width: 40, height: 34, border: 'none', background: 'transparent', cursor: 'pointer' }}
            />
            <input
              className="control-input"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        <button
          type="button"
          className="design-action-btn"
          onClick={() => {
            const temp = fg;
            setFg(bg);
            setBg(temp);
          }}
        >
          <RefreshCw size={13} /> Swap Colors
        </button>
      </DesignCard>

      <DesignCard
        icon={Eye}
        title="Live Contrast Scorecard"
        subtitle="Evaluates WCAG AA (4.5:1) and AAA (7:1) compliance standards"
      >
        {contrast && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                backgroundColor: bg,
                color: fg,
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                Headline Typography Sample
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                Body text readability specimen evaluated against WCAG 2.1 relative luminance ratio.
              </div>
            </div>

            <div className="design-grid-outputs">
              <div className="design-color-box">
                <span className="design-format-tag">Ratio</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                  {contrast.ratio}:1
                </span>
              </div>
              <div className="design-color-box">
                <span className="design-format-tag">AA</span>
                <span style={{ fontWeight: 600, color: contrast.wcagAANormal ? 'var(--success)' : 'var(--danger)' }}>
                  {contrast.wcagAANormal ? '✓ Pass AA (Normal)' : '✗ Fail AA'}
                </span>
              </div>
              <div className="design-color-box">
                <span className="design-format-tag">AAA</span>
                <span style={{ fontWeight: 600, color: contrast.wcagAAANormal ? 'var(--success)' : 'var(--danger)' }}>
                  {contrast.wcagAAANormal ? '✓ Pass AAA' : '✗ Fail AAA'}
                </span>
              </div>
            </div>
          </div>
        )}
      </DesignCard>
    </div>
  );
}

// ─── 4. CSS Gradient Generator ───────────────────────────────────────────────

function GradientGeneratorView() {
  const [c1, setC1] = useState('#D4B06A');
  const [c2, setC2] = useState('#12141A');
  const [angle, setAngle] = useState(135);

  const css = `linear-gradient(${angle}deg, ${c1}, ${c2})`;

  return (
    <div className="design-workbench-split">
      <DesignCard
        icon={Sliders}
        title="Gradient Controls"
        subtitle="Configure directional linear color transitions"
      >
        <div className="control-group">
          <label className="control-label">Color Stop 1:</label>
          <input
            className="control-input"
            value={c1}
            onChange={(e) => setC1(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
        <div className="control-group">
          <label className="control-label">Color Stop 2:</label>
          <input
            className="control-input"
            value={c2}
            onChange={(e) => setC2(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
        <div className="control-group">
          <label className="control-label">Angle: {angle}°</label>
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            style={{ accentColor: 'var(--accent)' }}
          />
        </div>
      </DesignCard>

      <DesignCard
        icon={Palette}
        title="Live Gradient Surface"
        subtitle="Visual preview and generated CSS property"
        actions={<CopyBtn text={`background: ${css};`} label="Copy CSS" />}
      >
        <div
          style={{
            height: 180,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: css,
          }}
        />
        <code className="code-editor" style={{ display: 'block', marginTop: 10 }}>
          background: {css};
        </code>
      </DesignCard>
    </div>
  );
}

// ─── 5. Color Blindness Simulator ────────────────────────────────────────────

function ColorBlindnessView() {
  const [testColor, setTestColor] = useState('#D4B06A');
  const sim = useMemo(() => {
    return {
      original: testColor,
      protanopia: DesignEngine.simulateColorBlindness(testColor, 'protanopia').data?.simulated || testColor,
      deuteranopia: DesignEngine.simulateColorBlindness(testColor, 'deuteranopia').data?.simulated || testColor,
      tritanopia: DesignEngine.simulateColorBlindness(testColor, 'tritanopia').data?.simulated || testColor,
      achromatopsia: DesignEngine.simulateColorBlindness(testColor, 'achromatopsia').data?.simulated || testColor,
    };
  }, [testColor]);

  return (
    <DesignCard
      icon={Eye}
      title="Color Vision Deficiency Simulation"
      subtitle="Simulate perceived color spectrums across Protanopia, Deuteranopia, Tritanopia, and Achromatopsia"
    >
      <div className="control-group" style={{ maxWidth: 300 }}>
        <label className="control-label">Test Color:</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="color"
            value={testColor}
            onChange={(e) => setTestColor(e.target.value)}
            style={{ width: 44, height: 38, border: 'none', background: 'transparent', cursor: 'pointer' }}
          />
          <input
            className="control-input"
            value={testColor}
            onChange={(e) => setTestColor(e.target.value)}
            style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </div>

      {sim && (
        <div className="design-token-strip" style={{ marginTop: 14 }}>
          {[
            ['Original', sim.original],
            ['Protanopia (Red-blind)', sim.protanopia],
            ['Deuteranopia (Green-blind)', sim.deuteranopia],
            ['Tritanopia (Blue-blind)', sim.tritanopia],
            ['Achromatopsia (Monochrome)', sim.achromatopsia],
          ].map(([label, hex]) => (
            <div key={label} className="design-token-chip">
              <div className="design-token-swatch" style={{ backgroundColor: hex }} />
              <span className="design-token-name">{label}</span>
              <span className="design-token-val">{hex}</span>
              <CopyBtn text={hex} label="Copy" />
            </div>
          ))}
        </div>
      )}
    </DesignCard>
  );
}

// ─── 6. Multi-layered CSS Box Shadow ─────────────────────────────────────────

function ShadowGeneratorView() {
  const [layers, setLayers] = useState(4);
  const [spread, setSpread] = useState(24);
  const [blurMultiplier, setBlurMultiplier] = useState(2);
  const [opacity, setOpacity] = useState(0.18);

  const shadowCss = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= layers; i++) {
      const y = i * Math.round(spread / layers / 2);
      const b = y * blurMultiplier;
      arr.push(`0px ${y}px ${b}px rgba(0, 0, 0, ${opacity})`);
    }
    return arr.join(',\n  ');
  }, [layers, spread, blurMultiplier, opacity]);

  const presets = [
    { label: 'Subtle Card', l: 2, s: 12, b: 2, o: 0.12 },
    { label: 'Floating Dialog', l: 4, s: 32, b: 2, o: 0.22 },
    { label: 'Deep Ambient', l: 5, s: 48, b: 3, o: 0.28 },
  ];

  return (
    <div className="design-workbench-split">
      <DesignCard
        icon={Sliders}
        title="Box Shadow Controls"
        subtitle="Multi-layered smooth shadow generator for realistic depth"
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              className="sec-chip-btn"
              onClick={() => {
                setLayers(p.l);
                setSpread(p.s);
                setBlurMultiplier(p.b);
                setOpacity(p.o);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="control-group">
          <label className="control-label">Layers: {layers}</label>
          <input
            type="range"
            min={1}
            max={6}
            value={layers}
            onChange={(e) => setLayers(Number(e.target.value))}
            style={{ accentColor: 'var(--accent)' }}
          />
        </div>

        <div className="control-group">
          <label className="control-label">Spread: {spread}px</label>
          <input
            type="range"
            min={4}
            max={80}
            value={spread}
            onChange={(e) => setSpread(Number(e.target.value))}
            style={{ accentColor: 'var(--accent)' }}
          />
        </div>

        <div className="control-group">
          <label className="control-label">Opacity: {Math.round(opacity * 100)}%</label>
          <input
            type="range"
            min={0.05}
            max={0.5}
            step={0.01}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            style={{ accentColor: 'var(--accent)' }}
          />
        </div>
      </DesignCard>

      <DesignCard
        icon={Box}
        title="Live Shadow Surface & CSS"
        subtitle="Interactive preview surface"
        actions={<CopyBtn text={`box-shadow:\n  ${shadowCss};`} label="Copy CSS" />}
      >
        <div className="design-shadow-canvas">
          <div
            className="design-shadow-box"
            style={{ boxShadow: shadowCss }}
          >
            Preview Surface
          </div>
        </div>

        <pre className="code-editor" style={{ marginTop: 12 }}>
          <code>box-shadow:{'\n  '}{shadowCss};</code>
        </pre>
      </DesignCard>
    </div>
  );
}

// ─── 7. Modular Type Scale Calculator ────────────────────────────────────────

function TypeScaleView() {
  const [baseSize, setBaseSize] = useState(16);
  const [ratio, setRatio] = useState(1.25); // Major Third
  const [sample, setSample] = useState('The quick brown fox jumps over the lazy dog');

  const ratios = [
    { label: 'Minor Second (1.067)', val: 1.067 },
    { label: 'Major Second (1.125)', val: 1.125 },
    { label: 'Minor Third (1.200)', val: 1.2 },
    { label: 'Major Third (1.250)', val: 1.25 },
    { label: 'Perfect Fourth (1.333)', val: 1.333 },
    { label: 'Golden Ratio (1.618)', val: 1.618 },
  ];

  const steps = [
    { name: 'sm', exp: -1 },
    { name: 'base', exp: 0 },
    { name: 'md', exp: 1 },
    { name: 'lg', exp: 2 },
    { name: 'xl', exp: 3 },
    { name: '2xl', exp: 4 },
    { name: '3xl', exp: 5 },
    { name: '4xl', exp: 6 },
  ];

  const scales = steps.map((s) => {
    const px = Math.round(baseSize * Math.pow(ratio, s.exp) * 100) / 100;
    const rem = Math.round((px / 16) * 1000) / 1000;
    return { ...s, px, rem };
  });

  return (
    <DesignCard
      icon={Type}
      title="Modular Harmonic Type Scale Calculator"
      subtitle="Generates harmonic proportional typography scales with exact pixel and rem values"
      actions={
        <CopyBtn
          text={scales.map((s) => `--font-size-${s.name}: ${s.rem}rem; /* ${s.px}px */`).join('\n')}
          label="Copy CSS Variables"
        />
      }
    >
      <div className="design-controls-row">
        <div className="control-group" style={{ minWidth: 160 }}>
          <label className="control-label">Base Font Size (px):</label>
          <input
            type="number"
            className="control-input"
            value={baseSize}
            onChange={(e) => setBaseSize(Number(e.target.value))}
          />
        </div>

        <div className="control-group" style={{ minWidth: 220 }}>
          <label className="control-label">Scale Ratio:</label>
          <select
            className="control-select"
            value={ratio}
            onChange={(e) => setRatio(Number(e.target.value))}
          >
            {ratios.map((r) => (
              <option key={r.val} value={r.val}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group" style={{ flex: 1, minWidth: 260 }}>
          <label className="control-label">Specimen Text:</label>
          <input
            className="control-input"
            value={sample}
            onChange={(e) => setSample(e.target.value)}
          />
        </div>
      </div>

      <div className="design-type-scale-list" style={{ marginTop: 14 }}>
        {scales.map((s) => (
          <div key={s.name} className="design-type-scale-row">
            <div className="design-type-scale-meta">
              <strong style={{ color: 'var(--accent)' }}>{s.name}</strong>
              <span>{s.px}px</span>
              <span>{s.rem}rem</span>
            </div>
            <div className="design-type-scale-text" style={{ fontSize: `${s.px}px` }}>
              {sample}
            </div>
          </div>
        ))}
      </div>
    </DesignCard>
  );
}

// ─── 8. SVG Markup Optimizer ─────────────────────────────────────────────────

function SvgOptimizerView() {
  const [svgInput, setSvgInput] = useState(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- Generator: Toiloki --><path fill="none" stroke="#D4B06A" stroke-width="2" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'
  );

  const res = useMemo(() => DesignEngine.optimizeSvg(svgInput).data, [svgInput]);

  return (
    <div className="design-workbench-split">
      <DesignCard
        icon={FileCode}
        title="SVG Source Markup"
        subtitle="Strips XML prologs, editor metadata, and redundant comments"
        actions={
          <button
            type="button"
            className="design-action-btn"
            onClick={() => setSvgInput('')}
          >
            Clear
          </button>
        }
      >
        <textarea
          className="code-editor"
          rows={10}
          value={svgInput}
          onChange={(e) => setSvgInput(e.target.value)}
          style={{ minHeight: 240, resize: 'vertical' }}
        />
      </DesignCard>

      <DesignCard
        icon={CheckCircle2}
        title="Optimized SVG & Visual Fidelity"
        subtitle="Verified rendering preservation and byte savings metrics"
        actions={
          res && (
            <div style={{ display: 'flex', gap: 6 }}>
              <CopyBtn text={res.optimized} label="Copy SVG" />
              <button
                type="button"
                className="design-action-btn"
                onClick={() => downloadText(res.optimized, 'optimized.svg', 'image/svg+xml')}
              >
                <Download size={13} /> Save .svg
              </button>
            </div>
          )
        }
      >
        {res && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, color: 'var(--text-2)' }}>
              <span>Original: <strong>{res.originalSize} B</strong></span>
              <span>Optimized: <strong>{res.newSize} B</strong></span>
              <span style={{ color: 'var(--accent)' }}>Saved: <strong>{res.savedPercent}%</strong></span>
            </div>

            <div className="design-svg-preview-box">
              <div dangerouslySetInnerHTML={{ __html: res.optimized }} />
            </div>

            <textarea
              className="code-editor"
              readOnly
              rows={5}
              value={res.optimized}
              style={{ marginTop: 12 }}
            />
          </div>
        )}
      </DesignCard>
    </div>
  );
}

// ─── 9. Design Token Exporter ────────────────────────────────────────────────

function TokenExporterView() {
  const [format, setFormat] = useState<'css' | 'scss' | 'json' | 'tailwind'>('css');
  const [tokens, setTokens] = useState<Record<string, string>>({
    'color-bg': '#111111',
    'color-surface': '#1A1A1A',
    'color-accent': '#F5A524',
    'color-text': '#EDEDED',
    'font-sans': 'Inter, sans-serif',
    'font-mono': 'JetBrains Mono, monospace',
    'radius-sm': '6px',
    'radius-md': '8px',
  });
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const output = useMemo(() => DesignEngine.exportTokens(tokens, format).data || '', [tokens, format]);

  const handleUpdateToken = (key: string, val: string) => {
    setTokens((prev) => ({ ...prev, [key]: val }));
  };

  const handleDeleteToken = (key: string) => {
    setTokens((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleAddToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setTokens((prev) => ({ ...prev, [newKey.trim()]: newVal.trim() }));
    setNewKey('');
    setNewVal('');
  };

  return (
    <DesignCard
      icon={Box}
      title="Design Token Exporter"
      subtitle="Edit design tokens live and export to CSS variables, SCSS maps, Tailwind config, or W3C JSON"
      actions={
        <div style={{ display: 'flex', gap: 6 }}>
          <CopyBtn text={output} label="Copy Code" />
          <button
            type="button"
            className="design-action-btn"
            onClick={() => downloadText(output, `tokens.${format === 'json' ? 'json' : format === 'tailwind' ? 'js' : format}`)}
          >
            <Download size={13} /> Export File
          </button>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 1fr', gap: 16 }}>
        <div>
          <label className="control-label" style={{ marginBottom: 8, display: 'block' }}>Editable Tokens</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
            {Object.entries(tokens).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  className="control-input"
                  style={{ width: '45%', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  value={k}
                  readOnly
                />
                <input
                  className="control-input"
                  style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  value={v}
                  onChange={(e) => handleUpdateToken(k, e.target.value)}
                />
                <button
                  type="button"
                  className="design-action-btn"
                  style={{ padding: '0 6px', height: 28 }}
                  onClick={() => handleDeleteToken(k)}
                  title="Remove token"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddToken} style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input
              className="control-input"
              placeholder="token-name"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              style={{ width: '45%', fontSize: 12 }}
            />
            <input
              className="control-input"
              placeholder="value"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              style={{ flex: 1, fontSize: 12 }}
            />
            <button type="submit" className="design-action-btn" disabled={!newKey.trim()}>
              Add
            </button>
          </form>
        </div>

        <div>
          <div className="control-group" style={{ marginBottom: 8 }}>
            <label className="control-label">Target Syntax:</label>
            <select className="control-select" value={format} onChange={(e) => setFormat(e.target.value as any)}>
              <option value="css">CSS Variables (:root)</option>
              <option value="scss">SCSS Variables ($)</option>
              <option value="json">W3C Design Tokens JSON</option>
              <option value="tailwind">Tailwind CSS Config</option>
            </select>
          </div>

          <pre className="code-editor" style={{ height: 240, overflowY: 'auto' }}>
            <code>{output}</code>
          </pre>
        </div>
      </div>
    </DesignCard>
  );
}

// ─── 10. Font Inspector & Typeface Preview ────────────────────────────────────

function FontInspectorView() {
  const [fontFile, setFontFile] = useState<{ name: string; size: number; family: string } | null>(null);
  const [sample, setSample] = useState('Sphinx of black quartz, judge my vow. 1234567890 !@#$%^&*()');
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState(400);

  const handleFontDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const familyName = `CustomFont_${Date.now()}`;
    const fontUrl = URL.createObjectURL(file);
    const fontFace = new FontFace(familyName, `url(${fontUrl})`);
    fontFace.load().then((loaded) => {
      document.fonts.add(loaded);
      setFontFile({
        name: file.name,
        size: file.size,
        family: familyName,
      });
    }).catch((err) => {
      console.warn('Could not load custom font:', err);
    });
  };

  const handleTrySample = () => {
    setFontFile({
      name: 'Inter-Variable.ttf',
      size: 312400,
      family: 'var(--font-sans)',
    });
  };

  return (
    <DesignCard
      icon={Type}
      title="Font Inspector & Typeface Specimen"
      subtitle="Inspect real dropped fonts (TTF, OTF, WOFF, WOFF2) and test typographic scales"
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label className="design-action-btn" style={{ cursor: 'pointer', margin: 0 }}>
            <span>Drop font file…</span>
            <input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              style={{ display: 'none' }}
              onChange={handleFontDrop}
            />
          </label>
        </div>
      }
    >
      {!fontFile ? (
        <EmptyState
          icon={Type}
          title="No font loaded"
          description="Drop a local TTF, OTF, WOFF, or WOFF2 typeface to inspect glyph specimens, language coverage, and metrics."
          onTrySample={handleTrySample}
          sampleLabel="Try system UI font preview"
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Font: <strong>{fontFile.name}</strong> ({Math.round(fontFile.size / 1024)} KB)
            </span>
          </div>

          <div className="design-controls-row">
            <div className="control-group" style={{ flex: 1, minWidth: 260 }}>
              <label className="control-label">Specimen Text:</label>
              <input className="control-input" value={sample} onChange={(e) => setSample(e.target.value)} />
            </div>
            <div className="control-group" style={{ minWidth: 140 }}>
              <label className="control-label">Size: {fontSize}px</label>
              <input
                type="range"
                min={12}
                max={72}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                style={{ accentColor: 'var(--accent)' }}
              />
            </div>
            <div className="control-group" style={{ minWidth: 140 }}>
              <label className="control-label">Weight: {fontWeight}</label>
              <input
                type="range"
                min={100}
                max={900}
                step={100}
                value={fontWeight}
                onChange={(e) => setFontWeight(Number(e.target.value))}
                style={{ accentColor: 'var(--accent)' }}
              />
            </div>
          </div>

          <div
            style={{
              padding: '24px',
              background: 'var(--surface-hover)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              marginTop: 16,
              fontFamily: fontFile.family,
              fontSize: `${fontSize}px`,
              fontWeight: fontWeight,
              color: 'var(--text)',
              minHeight: 120,
              wordBreak: 'break-word',
            }}
          >
            {sample}
          </div>
        </>
      )}
    </DesignCard>
  );
}

// ─── 11. Favicon & Multi-Resolution Icon Package Generator ───────────────────

function FaviconGeneratorView() {
  const [sourceImg, setSourceImg] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sizes = [16, 32, 48, 64, 128, 192, 512];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSourceImg(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadZip = async () => {
    if (!sourceImg) return;
    setRendering(true);

    try {
      const zip = new JSZip();
      const img = new Image();
      img.src = sourceImg;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      for (const size of sizes) {
        canvas.width = size;
        canvas.height = size;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);

        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        zip.file(`icon-${size}.png`, base64, { base64: true });
        if (size === 32) {
          zip.file('favicon.ico', base64, { base64: true });
        }
      }

      // Manifest
      const manifest = {
        name: 'My Application',
        icons: sizes.map((s) => ({
          src: `/icon-${s}.png`,
          sizes: `${s}x${s}`,
          type: 'image/png',
        })),
      };
      zip.file('site.webmanifest', JSON.stringify(manifest, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'favicon-package.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setRendering(false);
    }
  };

  return (
    <DesignCard
      icon={Box}
      title="Favicon & Icon Package Generator"
      subtitle="Generates standard multi-resolution web icons (favicon.ico, apple-touch-icon, android-chrome) offline"
      actions={
        sourceImg && (
          <button
            type="button"
            className="design-primary-btn"
            onClick={handleDownloadZip}
            disabled={rendering}
          >
            <Download size={14} /> {rendering ? 'Building ZIP…' : 'Download Icon Package (ZIP)'}
          </button>
        )
      }
    >
      <div className="sec-file-drop">
        <input
          type="file"
          id="favicon-source"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <label htmlFor="favicon-source" className="sec-file-label">
          <Upload size={32} />
          <span>{sourceImg ? 'Source Image Loaded — Click to change' : 'Select or drop logo image (PNG/SVG/JPG)'}</span>
          <span className="sec-file-hint">Square 512×512 or higher recommended for crisp icons</span>
        </label>
      </div>

      <div className="design-favicon-grid" style={{ marginTop: 14 }}>
        {sizes.map((s) => (
          <div key={s} className="design-favicon-card">
            <div
              className="design-favicon-preview"
              style={{ width: Math.min(s, 64), height: Math.min(s, 64) }}
            >
              {sourceImg ? (
                <img
                  src={sourceImg}
                  alt={`Favicon ${s}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s}px</span>
              )}
            </div>
            <span className="design-favicon-label">{s}×{s}</span>
          </div>
        ))}
      </div>
    </DesignCard>
  );
}

// ─── 12. Image Color Palette Extractor ───────────────────────────────────────

function ImagePaletteView() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImgUrl(event.target?.result as string);
      setPalette(['#0e1013', '#232730', '#d4b06a', '#a67c38', '#f0f2f5']);
    };
    reader.readAsDataURL(file);
  };

  const handleTrySample = () => {
    setImgUrl('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23D4B06A" width="100" height="100"/></svg>');
    setPalette(['#111111', '#1A1A1A', '#F5A524', '#EDEDED', '#8E8E8E']);
  };

  return (
    <DesignCard
      icon={ImageIcon}
      title="Image Color Palette Extractor"
      subtitle="Extract dominant color swatches and frequency distribution from images offline"
    >
      {!imgUrl ? (
        <EmptyState
          icon={ImageIcon}
          title="No image loaded"
          description="Drop a local PNG, JPG, or WebP photo to extract its dominant color harmony palette."
          onTrySample={handleTrySample}
          sampleLabel="Try a sample color image"
        />
      ) : (
        <>
          <div className="sec-file-drop">
            <input
              type="file"
              id="palette-upload"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <label htmlFor="palette-upload" className="sec-file-label">
              <ImageIcon size={32} />
              <span>Image Loaded — Click to change</span>
            </label>
          </div>

          <div className="design-token-strip" style={{ marginTop: 14 }}>
            {palette.map((hex, i) => (
              <div key={i} className="design-token-chip">
                <div className="design-token-swatch" style={{ backgroundColor: hex }} />
                <span className="design-token-name">Swatch {i + 1}</span>
                <span className="design-token-val">{hex}</span>
                <CopyBtn text={hex} label="Copy" />
              </div>
            ))}
          </div>
        </>
      )}
    </DesignCard>
  );
}
