/**
 * TOILOKI — Automated Compliance Guard Tests (Phase 4)
 * Enforces Design Charter and strict static analysis rules:
 * 1. Zero hex or rgb colors outside tokens.css (minus allowed data/drawing exceptions)
 * 2. Zero text-transform: uppercase rules
 * 3. Zero sparkle icons (Wand2, Sparkles)
 * 4. Zero runtime remote network fetch/API calls
 * 5. Zero legacy token aliases in src/
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TOILOKI AUTOMATED COMPLIANCE GUARDS ---');

function getAllFiles(dir, exts = ['.ts', '.tsx', '.css', '.html']) {
  let files = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(getAllFiles(full, exts));
    else if (exts.includes(path.extname(e.name))) files.push(full);
  }
  return files;
}

const allSrcFiles = getAllFiles('src');
console.log(`Auditing ${allSrcFiles.length} source files under src/...`);

// Allowed exception files (from docs/reports/color-exceptions.md)
const allowedColorExceptions = [
  'src/assets/art-pack/default-art-pack.ts',
  'src/assets/logo/toiloki-app-icon-dark.svg',
  'src/assets/logo/toiloki-app-icon-light.svg',
  'src/assets/logo/toiloki-horizontal-dark.svg',
  'src/assets/logo/toiloki-horizontal-light.svg',
  'src/assets/logo/toiloki-symbol.svg',
  'src/assets/logo/favicon.svg',
  'src/components/common/ToilokiLogo.tsx',
  'src/core/theme/theme-presets.ts',
  'src/core/theme/theme.types.ts',
  'src/core/theme/wcag-contrast.ts',
  'src/core/theme/ThemeContext.tsx',
  'src/core/services/smart-paste.service.ts',
  'src/engines/design/design.engine.ts',
  'src/engines/images/image.engine.ts',
  'src/engines/pdf/pdf.engine.ts',
  'src/workspaces/design/DesignWorkspaceView.tsx',
  'src/components/workbench/WorkbenchShell.tsx',
  'src/components/workbench/pdf/PdfAnnotateCanvas.tsx',
  'src/components/workbench/media/MediaCanvas.tsx',
  'src/components/workbench/documents/DocumentCanvas.tsx',
  'src/components/views/settings/sections/ThemeEditorModal.tsx',
  'src/components/views/settings/sections/AppearanceSection.tsx',
  'src/workspaces/developer/DeveloperWorkspaceView.tsx',
  'src/workspaces/images/ImagesWorkspaceView.tsx',
  'src/components/workbench/pdf/pdfThumbnailService.ts',
  'src/core/services/settings.service.ts'
].map(f => path.normalize(f));

// ─── GUARD 1: Sparkle Icons ──────────────────────────────────────────────────
console.log('\n[Guard 1/5] Checking for sparkle / hype icons (Wand2, Sparkles)...');
let sparkleViolations = [];
allSrcFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  content.split('\n').forEach((line, i) => {
    if (/(<Sparkles|<Wand2|<Sparkle|\bSparkles\b|\bWand2\b)/.test(line)) {
      sparkleViolations.push(`${f}:${i + 1}: ${line.trim()}`);
    }
  });
});

if (sparkleViolations.length > 0) {
  console.error('FAIL: Found sparkle icons in codebase:');
  sparkleViolations.forEach(v => console.error('  ', v));
  process.exit(1);
} else {
  console.log('PASS: 0 sparkle icons found.');
}

// ─── GUARD 2: text-transform: uppercase ───────────────────────────────────────
console.log('\n[Guard 2/5] Checking for text-transform: uppercase...');
let uppercaseViolations = [];
allSrcFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  content.split('\n').forEach((line, i) => {
    if (/text-transform:\s*uppercase/i.test(line)) {
      uppercaseViolations.push(`${f}:${i + 1}: ${line.trim()}`);
    }
  });
});

if (uppercaseViolations.length > 0) {
  console.error('FAIL: Found text-transform: uppercase rules:');
  uppercaseViolations.forEach(v => console.error('  ', v));
  process.exit(1);
} else {
  console.log('PASS: 0 text-transform: uppercase rules found.');
}

// ─── GUARD 3: Legacy Token Aliases ───────────────────────────────────────────
console.log('\n[Guard 3/5] Checking for legacy token aliases outside tokens.css...');
const legacyAliases = [
  '--bg-app',
  '--bg-sidebar',
  '--bg-panel',
  '--bg-surface',
  '--bg-raised',
  '--bg-hover',
  '--bg-selected',
  '--border-subtle',
  '--border-default',
  '--border-medium',
  '--text-primary',
  '--text-secondary',
  '--text-tertiary',
  '--accent-amber',
  '--accent-primary',
  '--color-success',
  '--color-warning',
  '--color-danger'
];

let aliasViolations = [];
allSrcFiles.forEach(f => {
  if (f.endsWith('tokens.css')) return;
  const content = fs.readFileSync(f, 'utf8');
  content.split('\n').forEach((line, i) => {
    legacyAliases.forEach(alias => {
      if (line.includes(alias)) {
        aliasViolations.push(`${f}:${i + 1}: [${alias}] in ${line.trim()}`);
      }
    });
  });
});

if (aliasViolations.length > 0) {
  console.error('FAIL: Found legacy token aliases in active code:');
  aliasViolations.forEach(v => console.error('  ', v));
  process.exit(1);
} else {
  console.log('PASS: 0 legacy token aliases found outside tokens.css.');
}

// ─── GUARD 4: Remote URLs in Runtime Code ─────────────────────────────────────
console.log('\n[Guard 4/5] Checking for runtime network requests / APIs...');
let networkApiViolations = [];
allSrcFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  content.split('\n').forEach((line, i) => {
    if (/\b(fetch\(|XMLHttpRequest|axios|cdnjs\.cloudflare\.com|unpkg\.com|cdn\.jsdelivr\.net)\b/.test(line)) {
      networkApiViolations.push(`${f}:${i + 1}: ${line.trim()}`);
    }
  });
});

if (networkApiViolations.length > 0) {
  console.error('FAIL: Found runtime network API calls:');
  networkApiViolations.forEach(v => console.error('  ', v));
  process.exit(1);
} else {
  console.log('PASS: 0 runtime network API references found.');
}

// ─── GUARD 5: Hardcoded Colors Outside tokens.css (Minus Exceptions) ──────────
console.log('\n[Guard 5/5] Checking for hardcoded hex or rgb colors outside tokens.css (minus allowed exceptions)...');
const hexRegex = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const rgbRegex = /rgba?\([^)]+\)|hsla?\([^)]+\)/g;

let colorViolations = [];
allSrcFiles.forEach(f => {
  if (f.endsWith('tokens.css')) return;
  const norm = path.normalize(f);
  if (allowedColorExceptions.includes(norm)) return;

  const content = fs.readFileSync(f, 'utf8');
  content.split('\n').forEach((line, i) => {
    if (line.includes('http://') || line.includes('https://')) return;
    const trimmed = line.trim();
    if (trimmed.includes('box-shadow:') || trimmed.includes('boxShadow:') || trimmed.includes('text-shadow:') || trimmed.includes('mask-image:') || trimmed.includes('-webkit-mask-image:')) return;
    if (/(background-color|backgroundColor|background):\s*['"]?rgba\(0,\s*0,\s*0,/i.test(trimmed)) return;
    if (trimmed.includes('rgba(var(--surface-rgb)')) return;
    if (trimmed.includes('rgba(0, 0, 0, 1)')) return;

    const hexes = line.match(hexRegex);
    if (hexes) {
      hexes.forEach(h => {
        // filter out comments or html entities
        if (!line.trim().startsWith('//') && !line.trim().startsWith('/*') && !line.includes('&#')) {
          colorViolations.push(`${f}:${i + 1}: ${h} in ${line.trim()}`);
        }
      });
    }

    const rgbs = line.match(rgbRegex);
    if (rgbs) {
      rgbs.forEach(r => {
        // Allow rgba(var(--surface-rgb), ...)
        if (!r.includes('var(--surface-rgb)') && !line.trim().startsWith('//') && !line.trim().startsWith('/*')) {
          colorViolations.push(`${f}:${i + 1}: ${r} in ${line.trim()}`);
        }
      });
    }
  });
});

if (colorViolations.length > 0) {
  console.error(`FAIL: Found ${colorViolations.length} hardcoded color violations outside tokens.css and allowed exceptions:`);
  colorViolations.slice(0, 15).forEach(v => console.error('  ', v));
  process.exit(1);
} else {
  console.log('PASS: 0 hardcoded color violations found outside allowed exceptions.');
}

console.log('\nALL 5 AUTOMATED COMPLIANCE GUARDS PASSED SUCCESSFULLY!\n');
