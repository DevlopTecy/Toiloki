import React, { useState } from 'react';
import {
  X, Check, AlertCircle, Info, AlertTriangle, FileText, Upload, RefreshCw,
  Sun, Moon, Shield, Lock, FileCode, Hash, Database, Music, Terminal, Palette,
  Search, Sliders, Layers
} from 'lucide-react';
import {
  Field,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Checkbox,
  Switch,
  RadioGroup,
  Slider,
  SegmentedControl,
  ChipGroup,
  TilePicker,
  CopyField,
  CodeBlock,
  StatCard,
  KeyValueTable,
  Banner,
  Badge,
  Tooltip,
  Toast,
  EmptyState,
  FilePill,
  Skeleton,
  ViewSwitcher,
  WorkspaceHeader,
} from '../../../ui';
import { Button } from '../../../common/Button';

interface ComponentGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComponentGalleryModal: React.FC<ComponentGalleryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [textVal, setTextVal] = useState('Production grade input');
  const [numVal, setNumVal] = useState(16);
  const [selectVal, setSelectVal] = useState('sha256');
  const [textareaVal, setTextareaVal] = useState('{\n  "status": "active",\n  "offline": true\n}');
  const [checkboxVal, setCheckboxVal] = useState(true);
  const [switchVal, setSwitchVal] = useState(true);
  const [radioVal, setRadioVal] = useState('aes256');
  const [sliderVal, setSliderVal] = useState(75);
  const [segmentVal, setSegmentVal] = useState('raw');
  const [chipsVal, setChipsVal] = useState<string[]>(['clean', 'minify']);
  const [tileVal, setTileVal] = useState('zip');
  const [viewSegment, setViewSegment] = useState<'editor' | 'split' | 'diff'>('split');
  const [toastVisible, setToastVisible] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      data-theme={themeMode}
    >
      <div
        style={{
          width: '94vw',
          maxWidth: '1200px',
          height: '90vh',
          backgroundColor: 'var(--bg)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.50)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalPanelEnter 180ms var(--ease-out)',
        }}
      >
        {/* Gallery Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
              Toiloki UI Kit V2 Gallery
            </span>
            <Badge
              variant="neutral"
              icon={<Check size={11} />}
              label="24 Components · 8 Archetypes"
              size="sm"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Theme Toggle Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
              icon={themeMode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            >
              {themeMode === 'dark' ? 'Light Theme' : 'Dark Theme'}
            </Button>

            <button
              type="button"
              className="dialog-close-btn"
              onClick={onClose}
              aria-label="Close Gallery"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Gallery Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            backgroundColor: 'var(--bg)',
          }}
        >
          {/* SECTION 1: WORKSPACE HEADER & VIEW SWITCHER */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
              1. WORKSPACE HEADER & VIEW SWITCHER
            </h3>
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <WorkspaceHeader
                breadcrumb={['Security & Privacy', 'Credentials', 'Password Generator']}
                title="Password Generator"
                description="Generate cryptographically strong passwords with custom character sets and live entropy."
                isFavorite={true}
                onToggleFavorite={() => {}}
                onReset={() => {}}
                onInfoClick={() => {}}
                rightSlot={
                  <ViewSwitcher
                    value={viewSegment}
                    onChange={setViewSegment}
                    options={[
                      { value: 'editor', label: 'Editor', icon: <FileText size={13} /> },
                      { value: 'split', label: 'Split', icon: <Layers size={13} /> },
                      { value: 'diff', label: 'Diff', icon: <Hash size={13} /> },
                    ]}
                  />
                }
              />
            </div>
          </div>

          {/* SECTION 2: INPUTS, SELECT, STEPPERS */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
              2. FORM CONTROLS (FIELD, TEXTINPUT, NUMBERINPUT, SELECT, TEXTAREA)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <Field label="Standard Text Input" helpText="Label above control with 6px gap">
                <TextInput
                  value={textVal}
                  onChange={(e) => setTextVal(e.target.value)}
                  clearable
                  onClear={() => setTextVal('')}
                />
              </Field>

              <Field label="Monospace Input" helpText="JetBrains Mono for hashes and keys">
                <TextInput
                  mono
                  value="4a3f7b2c9e8d1a0f"
                  prefixIcon={<Hash size={14} />}
                />
              </Field>

              <Field label="Number Stepper" helpText="Direct input with +/- buttons">
                <NumberInput
                  value={numVal}
                  onChange={setNumVal}
                  min={8}
                  max={128}
                  step={4}
                  unit="chars"
                />
              </Field>

              <Field label="Custom Searchable Select" helpText="Auto-searchable when items >= 7">
                <Select
                  value={selectVal}
                  onChange={setSelectVal}
                  options={[
                    { value: 'md5', label: 'MD5 (128-bit)' },
                    { value: 'sha1', label: 'SHA-1 (160-bit)' },
                    { value: 'sha256', label: 'SHA-256 (256-bit)', description: 'NIST Standard' },
                    { value: 'sha512', label: 'SHA-512 (512-bit)' },
                    { value: 'blake3', label: 'BLAKE3 (Fast)' },
                    { value: 'sha3', label: 'SHA3-256' },
                    { value: 'crc32', label: 'CRC-32' },
                    { value: 'xxhash', label: 'xxHash64' },
                  ]}
                />
              </Field>
            </div>

            <div style={{ marginTop: '16px' }}>
              <Field label="Full Width Textarea" helpText="Min-height 160px, auto-grow enabled, never collapses">
                <Textarea
                  mono
                  value={textareaVal}
                  onChange={(e) => setTextareaVal(e.target.value)}
                  placeholder="Paste JSON or text here..."
                />
              </Field>
            </div>
          </div>

          {/* SECTION 3: TOGGLES, RADIOS, SLIDERS */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
              3. SELECTION & TOGGLES (CHECKBOX, SWITCH, RADIO, SLIDER, SEGMENTED CONTROL, CHIPS)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Checkbox
                  checked={checkboxVal}
                  onChange={setCheckboxVal}
                  label="Include special characters"
                  description="!@#$%^&*() symbols in output"
                />
                <Checkbox
                  checked={false}
                  onChange={() => {}}
                  label="Avoid ambiguous characters"
                  description="Excludes 1, l, I, 0, O glyphs"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Switch
                  checked={switchVal}
                  onChange={setSwitchVal}
                  label="Live auto-calculation"
                  description="Compute transforms on keystroke"
                />
                <Switch
                  checked={false}
                  onChange={() => {}}
                  label="Auto-clear clipboard"
                  description="Wipe copied tokens after 30 seconds"
                />
              </div>

              <div>
                <RadioGroup
                  name="cipher-mode"
                  value={radioVal}
                  onChange={setRadioVal}
                  options={[
                    { value: 'aes256', label: 'AES-256-GCM', description: 'Authenticated encryption' },
                    { value: 'argon2', label: 'Argon2id KDF', description: 'Memory-hard derivation' },
                  ]}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Field label={`Compression Quality: ${sliderVal}%`} helpText="Accent track with numeric stepper">
                  <Slider
                    value={sliderVal}
                    onChange={setSliderVal}
                    min={1}
                    max={100}
                    step={1}
                    unit="%"
                  />
                </Field>

                <Field label="Segmented Control" helpText="Neutral selected state: raised surface, never orange">
                  <SegmentedControl
                    value={segmentVal}
                    onChange={setSegmentVal}
                    options={[
                      { value: 'raw', label: 'Raw' },
                      { value: 'formatted', label: 'Formatted' },
                      { value: 'tree', label: 'Tree' },
                    ]}
                  />
                </Field>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <Field label="Chip Group" helpText="Wrapping chips with multi-selection">
                <ChipGroup
                  multiple
                  value={chipsVal}
                  onChange={setChipsVal}
                  items={[
                    { value: 'clean', label: 'Clean metadata' },
                    { value: 'minify', label: 'Minify identifiers' },
                    { value: 'round', label: 'Round precision' },
                    { value: 'viewbox', label: 'Preserve viewBox' },
                    { value: 'gzip', label: 'Enable GZIP' },
                  ]}
                />
              </Field>
            </div>
          </div>

          {/* SECTION 4: TILE PICKER */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
              4. TILE PICKER (ICON + NAME + MUTED LINE, RAISED SURFACE + CHECK)
            </h3>
            <TilePicker
              value={tileVal}
              onChange={setTileVal}
              columns={4}
              options={[
                { value: 'zip', name: 'ZIP Archive', description: 'Standard Deflate compression', icon: <Database size={18} /> },
                { value: 'tar', name: 'TAR Archive', description: 'POSIX ustar streaming', icon: <Layers size={18} /> },
                { value: 'gz', name: 'GZIP Stream', description: 'RFC 1952 single file container', icon: <FileCode size={18} /> },
                { value: '7z', name: '7-Zip (.7z)', description: 'High compression ratio (read)', icon: <Lock size={18} /> },
              ]}
            />
          </div>

          {/* SECTION 5: COPYFIELD, CODEBLOCK, STATCARD, KEYVALUETABLE */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
              5. DATA PRESENTATION (COPYFIELD, CODEBLOCK, STATCARD, KEYVALUETABLE)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <StatCard
                label="SHA-256 Digest"
                value="256"
                unit="bits"
                helper="Hardware accelerated via sha2 crate"
                icon={<Shield size={16} />}
              />
              <StatCard
                label="Reclaimable Storage"
                value="1.42"
                unit="GB"
                helper="Across 3,840 temporary cache files"
                icon={<Database size={16} />}
              />
              <StatCard
                label="Entropy Score"
                value="128.4"
                unit="bits"
                helper="Very strong password entropy"
                icon={<Lock size={16} />}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <CopyField
                label="Cryptographic Fingerprint"
                value="9f83c605d9c562b19e1677b2ace4693b964c0b8d232b73f5104cb8a30360def8"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <KeyValueTable
                rows={[
                  { key: 'arch', label: 'Architecture', value: 'x86_64 Windows (Native)', mono: true },
                  { key: 'engine', label: 'Engine Mode', value: 'Rust Tauri 2.0 (IPC)', mono: true },
                  { key: 'network', label: 'Network I/O', value: '0 bytes (100% Offline)', mono: true },
                  { key: 'hash', label: 'Fingerprint', value: 'b78a9c...10ef', mono: true, copyValue: 'b78a9c001122334410ef' },
                ]}
              />

              <CodeBlock
                language="json"
                lineNumbers
                code={`{\n  "version": "2.0.0",\n  "arch": "x86_64",\n  "engine": "rust",\n  "offline": true\n}`}
              />
            </div>
          </div>

          {/* SECTION 6: BANNERS, BADGES, TOAST, TOOLTIP, FILEPILL, SKELETON */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
              6. FEEDBACK & STATUS (BANNERS, BADGES, TOAST, FILEPILLS, SKELETON)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Banner
                variant="info"
                title="Air-gapped operation"
                message="All data transforms execute directly on the local machine without external network connections."
              />
              <Banner
                variant="warning"
                title="Review duplicate candidates"
                message="Duplicate file removal will move items to Toiloki Trash. You can undo this anytime."
              />
              <Banner
                variant="danger"
                title="Malformed JSON payload"
                message="Syntax error at line 4 column 12: Unexpected token."
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
              <Badge variant="neutral" icon={<Check size={12} />} label="Ready" />
              <Badge variant="success" icon={<Check size={12} />} label="Passed" />
              <Badge variant="warning" icon={<AlertTriangle size={12} />} label="Review" />
              <Badge variant="danger" icon={<AlertCircle size={12} />} label="Corrupt" />

              <Tooltip content="Tooltip message popup">
                <Button variant="secondary" size="sm">Hover for Tooltip</Button>
              </Tooltip>

              <FilePill name="archive-backup-2026.zip" sizeBytes={14800000} onRemove={() => {}} />
              <FilePill name="test-data.csv" sizeBytes={420000} onRemove={() => {}} />
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <Skeleton width={180} height={28} />
              <Skeleton width={120} height={28} />
              <Skeleton width={60} height={28} />
            </div>

            {toastVisible && (
              <div style={{ marginTop: '16px' }}>
                <Toast
                  id="demo-toast"
                  type="success"
                  message="Configuration saved successfully."
                  onDismiss={() => setToastVisible(false)}
                />
              </div>
            )}
          </div>

          {/* SECTION 7: EMPTY STATE */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
              7. EMPTY STATE (EMPTY WITH 'TRY A SAMPLE' LINK)
            </h3>
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--surface)' }}>
              <EmptyState
                icon={FileText}
                title="No document loaded"
                description="Drop a markdown or text document here to inspect line statistics and formats."
                onTrySample={() => {}}
                sampleLabel="Try a sample document"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
