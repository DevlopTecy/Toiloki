/**
 * Toiloki WCAG Contrast & Token Pair Verification Script
 * Validates contrast ratios across all core color pairs in both light & dark themes.
 */

// Relative luminance calculation per WCAG 2.1
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map(val => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const lum1 = relativeLuminance(hexToRgb(hex1));
  const lum2 = relativeLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Token values defined by Design Charter
const lightTokens = {
  bg: '#FAFAF9',
  sidebar: '#F3F3F1',
  surface: '#FFFFFF',
  surfaceHover: '#F3F3F0',
  border: '#E3E3DE',
  text: '#171717',
  text2: '#54544F',
  textMuted: '#6B6B65',
  accent: '#E8890C',
  onAccent: '#1A1100',
  accentText: '#9A5B00',
};

const darkTokens = {
  bg: '#111111',
  sidebar: '#151515',
  surface: '#1A1A1A',
  surfaceHover: '#222222',
  border: '#2E2E2E',
  text: '#EDEDED',
  text2: '#B0B0B0',
  textMuted: '#8E8E8E',
  accent: '#F5A524',
  onAccent: '#1A1100',
  accentText: '#F5A524',
};

const tests = [
  // Dark mode pairs
  { name: 'Dark: text on surface', c1: darkTokens.text, c2: darkTokens.surface, min: 7.0 },
  { name: 'Dark: text2 on surface', c1: darkTokens.text2, c2: darkTokens.surface, min: 4.5 },
  { name: 'Dark: text on bg', c1: darkTokens.text, c2: darkTokens.bg, min: 7.0 },
  { name: 'Dark: onAccent on accent button', c1: darkTokens.onAccent, c2: darkTokens.accent, min: 4.5 },
  { name: 'Dark: accent on bg (UI non-text/indicator)', c1: darkTokens.accent, c2: darkTokens.bg, min: 3.0 },

  // Light mode pairs
  { name: 'Light: text on surface', c1: lightTokens.text, c2: lightTokens.surface, min: 7.0 },
  { name: 'Light: text2 on surface', c1: lightTokens.text2, c2: lightTokens.surface, min: 4.5 },
  { name: 'Light: text on bg', c1: lightTokens.text, c2: lightTokens.bg, min: 7.0 },
  { name: 'Light: onAccent on accent button', c1: lightTokens.onAccent, c2: lightTokens.accent, min: 4.5 },
  { name: 'Light: accentText on surface', c1: lightTokens.accentText, c2: lightTokens.surface, min: 4.5 },
];

console.log('=== TOILOKI DESIGN CHARTER WCAG CONTRAST AUDIT ===\n');
let failed = 0;

for (const t of tests) {
  const ratio = contrastRatio(t.c1, t.c2);
  const pass = ratio >= t.min;
  const grade = ratio >= 7.0 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3.0 ? 'AA Large/UI' : 'FAIL';
  console.log(
    `[${pass ? 'PASS' : 'FAIL'}] ${t.name}: ${ratio.toFixed(2)}:1 (Min: ${t.min}:1, Grade: ${grade})`
  );
  if (!pass) failed++;
}

console.log('\nAudit complete.');
if (failed > 0) {
  console.error(`FAILED: ${failed} contrast checks failed.`);
  process.exit(1);
} else {
  console.log('SUCCESS: All 10 core color pairs pass WCAG standards!');
  process.exit(0);
}
