/**
 * TOILOKI — Default Art Pack
 * Original abstract illustrations for all 8 categories + Hero + Button skin.
 * Fully offline, zero brand logos/trademarks, resolution-independent SVG data-URIs,
 * crafted with dark and light variants under 120KB each.
 */

// Helper to convert an SVG string to a clean data-URI
export function svgToDataUri(svg: string): string {
  const cleaned = svg
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}

// ─────────────────────────────────────────────────────────────
// 1. PDF WORKSPACE ARTWORK (#EF4444)
// ─────────────────────────────────────────────────────────────
const PDF_DARK = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <defs>
    <linearGradient id="pdfGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#7F1D1D" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="sheetGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#262626" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#171717" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <!-- Background glow -->
  <circle cx="550" cy="200" r="180" fill="url(#pdfGradD)"/>
  
  <!-- Back sheet -->
  <g transform="translate(420, 60) rotate(8)">
    <rect x="0" y="0" width="220" height="280" rx="12" fill="url(#sheetGradD)" stroke="#EF4444" stroke-opacity="0.3" stroke-width="1.5"/>
    <line x1="24" y1="40" x2="160" y2="40" stroke="#EF4444" stroke-opacity="0.4" stroke-width="3" stroke-linecap="round"/>
    <line x1="24" y1="70" x2="190" y2="70" stroke="#EDEDED" stroke-opacity="0.1" stroke-width="2"/>
    <line x1="24" y1="95" x2="180" y2="95" stroke="#EDEDED" stroke-opacity="0.1" stroke-width="2"/>
  </g>

  <!-- Front Sheet with folded corner -->
  <g transform="translate(360, 45) rotate(-3)">
    <rect x="0" y="0" width="240" height="310" rx="14" fill="#1C1C1C" stroke="#EF4444" stroke-opacity="0.5" stroke-width="2"/>
    <!-- Folded corner tab -->
    <path d="M 180 0 L 240 60 L 180 60 Z" fill="#EF4444" fill-opacity="0.25" stroke="#EF4444" stroke-opacity="0.6"/>
    <!-- Document content simulation -->
    <rect x="28" y="36" width="64" height="20" rx="4" fill="#EF4444" fill-opacity="0.3"/>
    <line x1="28" y1="80" x2="200" y2="80" stroke="#EDEDED" stroke-opacity="0.25" stroke-width="3" stroke-linecap="round"/>
    <line x1="28" y1="110" x2="190" y2="110" stroke="#EDEDED" stroke-opacity="0.15" stroke-width="2"/>
    <line x1="28" y1="130" x2="170" y2="130" stroke="#EDEDED" stroke-opacity="0.15" stroke-width="2"/>
    <line x1="28" y1="150" x2="195" y2="150" stroke="#EDEDED" stroke-opacity="0.15" stroke-width="2"/>
    <!-- Geometric PDF stamp -->
    <circle cx="160" cy="230" r="32" fill="#EF4444" fill-opacity="0.12" stroke="#EF4444" stroke-opacity="0.5" stroke-width="1.5"/>
    <path d="M 150 220 L 170 230 L 150 240 Z" fill="#EF4444" fill-opacity="0.8"/>
  </g>
</svg>
`);

const PDF_LIGHT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <defs>
    <linearGradient id="pdfGradL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCA5A5" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#FEE2E2" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <circle cx="550" cy="200" r="180" fill="url(#pdfGradL)"/>
  <g transform="translate(420, 60) rotate(8)">
    <rect x="0" y="0" width="220" height="280" rx="12" fill="#FFFFFF" stroke="#EF4444" stroke-opacity="0.2" stroke-width="1.5"/>
    <line x1="24" y1="40" x2="160" y2="40" stroke="#EF4444" stroke-opacity="0.4" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g transform="translate(360, 45) rotate(-3)">
    <rect x="0" y="0" width="240" height="310" rx="14" fill="#FFFFFF" stroke="#EF4444" stroke-opacity="0.35" stroke-width="2"/>
    <path d="M 180 0 L 240 60 L 180 60 Z" fill="#FEE2E2" stroke="#EF4444" stroke-opacity="0.4"/>
    <rect x="28" y="36" width="64" height="20" rx="4" fill="#FEE2E2"/>
    <line x1="28" y1="80" x2="200" y2="80" stroke="#171717" stroke-opacity="0.2" stroke-width="3" stroke-linecap="round"/>
    <line x1="28" y1="110" x2="190" y2="110" stroke="#171717" stroke-opacity="0.1" stroke-width="2"/>
    <circle cx="160" cy="230" r="32" fill="#FEE2E2" stroke="#EF4444" stroke-opacity="0.4" stroke-width="1.5"/>
  </g>
</svg>
`);

// ─────────────────────────────────────────────────────────────
// 2. DOCUMENTS WORKSPACE ARTWORK (#3B82F6)
// ─────────────────────────────────────────────────────────────
const DOCS_DARK = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <defs>
    <linearGradient id="docGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#1E3A8A" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <circle cx="560" cy="210" r="190" fill="url(#docGradD)"/>
  <g transform="translate(380, 50)">
    <rect x="0" y="0" width="260" height="300" rx="14" fill="#1C1C1C" stroke="#3B82F6" stroke-opacity="0.45" stroke-width="2"/>
    <!-- Editorial columns -->
    <rect x="24" y="30" width="80" height="14" rx="3" fill="#3B82F6" fill-opacity="0.4"/>
    <line x1="24" y1="65" x2="236" y2="65" stroke="#3B82F6" stroke-opacity="0.25" stroke-width="2"/>
    <line x1="24" y1="95" x2="120" y2="95" stroke="#EDEDED" stroke-opacity="0.2" stroke-width="2"/>
    <line x1="24" y1="115" x2="115" y2="115" stroke="#EDEDED" stroke-opacity="0.12" stroke-width="2"/>
    <line x1="24" y1="135" x2="125" y2="135" stroke="#EDEDED" stroke-opacity="0.12" stroke-width="2"/>
    <line x1="140" y1="95" x2="236" y2="95" stroke="#EDEDED" stroke-opacity="0.2" stroke-width="2"/>
    <line x1="140" y1="115" x2="230" y2="115" stroke="#EDEDED" stroke-opacity="0.12" stroke-width="2"/>
    <line x1="140" y1="135" x2="225" y2="135" stroke="#EDEDED" stroke-opacity="0.12" stroke-width="2"/>
    <rect x="24" y="170" width="212" height="90" rx="8" fill="#3B82F6" fill-opacity="0.08" stroke="#3B82F6" stroke-opacity="0.2"/>
  </g>
</svg>
`);

const DOCS_LIGHT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <circle cx="560" cy="210" r="190" fill="#DBEAFE" fill-opacity="0.4"/>
  <g transform="translate(380, 50)">
    <rect x="0" y="0" width="260" height="300" rx="14" fill="#FFFFFF" stroke="#3B82F6" stroke-opacity="0.3" stroke-width="2"/>
    <rect x="24" y="30" width="80" height="14" rx="3" fill="#BFDBFE"/>
    <line x1="24" y1="65" x2="236" y2="65" stroke="#3B82F6" stroke-opacity="0.3" stroke-width="2"/>
    <line x1="24" y1="95" x2="120" y2="95" stroke="#171717" stroke-opacity="0.15" stroke-width="2"/>
    <rect x="24" y="170" width="212" height="90" rx="8" fill="#EFF6FF" stroke="#3B82F6" stroke-opacity="0.2"/>
  </g>
</svg>
`);

// ─────────────────────────────────────────────────────────────
// 3. IMAGES WORKSPACE ARTWORK (#22C55E)
// ─────────────────────────────────────────────────────────────
const IMAGES_DARK = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <defs>
    <linearGradient id="imgGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22C55E" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#14532D" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <circle cx="560" cy="200" r="190" fill="url(#imgGradD)"/>
  <!-- Aperture ring / camera framing -->
  <g transform="translate(400, 60)">
    <rect x="0" y="0" width="250" height="280" rx="16" fill="#1C1C1C" stroke="#22C55E" stroke-opacity="0.4" stroke-width="2"/>
    <circle cx="125" cy="120" r="70" fill="#22C55E" fill-opacity="0.08" stroke="#22C55E" stroke-opacity="0.5" stroke-width="2"/>
    <circle cx="125" cy="120" r="40" fill="#22C55E" fill-opacity="0.15" stroke="#22C55E" stroke-opacity="0.7" stroke-width="1.5"/>
    <!-- Geometric landscape polygon inside aperture -->
    <path d="M 85 145 L 125 90 L 165 145 Z" fill="#22C55E" fill-opacity="0.35"/>
    <circle cx="145" cy="100" r="10" fill="#22C55E" fill-opacity="0.8"/>
    <!-- Grid nodes -->
    <line x1="30" y1="230" x2="220" y2="230" stroke="#EDEDED" stroke-opacity="0.1" stroke-width="2"/>
    <rect x="30" y="245" width="40" height="12" rx="3" fill="#22C55E" fill-opacity="0.3"/>
    <rect x="80" y="245" width="60" height="12" rx="3" fill="#EDEDED" fill-opacity="0.1"/>
  </g>
</svg>
`);

const IMAGES_LIGHT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <circle cx="560" cy="200" r="190" fill="#DCFCE7" fill-opacity="0.5"/>
  <g transform="translate(400, 60)">
    <rect x="0" y="0" width="250" height="280" rx="16" fill="#FFFFFF" stroke="#22C55E" stroke-opacity="0.35" stroke-width="2"/>
    <circle cx="125" cy="120" r="70" fill="#F0FDF4" stroke="#22C55E" stroke-opacity="0.4" stroke-width="2"/>
    <path d="M 85 145 L 125 90 L 165 145 Z" fill="#86EFAC" fill-opacity="0.6"/>
    <circle cx="145" cy="100" r="10" fill="#22C55E"/>
  </g>
</svg>
`);

// ─────────────────────────────────────────────────────────────
// 4. DATA WORKSPACE ARTWORK (#F59E0B)
// ─────────────────────────────────────────────────────────────
const DATA_DARK = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <defs>
    <linearGradient id="dataGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#78350F" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <circle cx="550" cy="200" r="190" fill="url(#dataGradD)"/>
  <!-- Isometric chart plane -->
  <g transform="translate(370, 70)">
    <rect x="0" y="0" width="270" height="260" rx="14" fill="#1C1C1C" stroke="#F59E0B" stroke-opacity="0.4" stroke-width="2"/>
    <!-- Metric columns -->
    <rect x="30" y="160" width="30" height="70" rx="4" fill="#F59E0B" fill-opacity="0.35" stroke="#F59E0B" stroke-opacity="0.6"/>
    <rect x="75" y="120" width="30" height="110" rx="4" fill="#F59E0B" fill-opacity="0.5" stroke="#F59E0B" stroke-opacity="0.8"/>
    <rect x="120" y="90" width="30" height="140" rx="4" fill="#F59E0B" fill-opacity="0.75"/>
    <rect x="165" y="140" width="30" height="90" rx="4" fill="#F59E0B" fill-opacity="0.45"/>
    <rect x="210" y="70" width="30" height="160" rx="4" fill="#F59E0B" fill-opacity="0.9"/>
    <!-- Trend curve -->
    <path d="M 45 150 Q 90 100 135 80 T 225 60" fill="none" stroke="#EDEDED" stroke-width="2.5" stroke-dasharray="4 4"/>
  </g>
</svg>
`);

const DATA_LIGHT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <circle cx="550" cy="200" r="190" fill="#FEF3C7" fill-opacity="0.5"/>
  <g transform="translate(370, 70)">
    <rect x="0" y="0" width="270" height="260" rx="14" fill="#FFFFFF" stroke="#F59E0B" stroke-opacity="0.3" stroke-width="2"/>
    <rect x="30" y="160" width="30" height="70" rx="4" fill="#FDE68A"/>
    <rect x="75" y="120" width="30" height="110" rx="4" fill="#FCD34D"/>
    <rect x="120" y="90" width="30" height="140" rx="4" fill="#FBBF24"/>
    <rect x="165" y="140" width="30" height="90" rx="4" fill="#FCD34D"/>
    <rect x="210" y="70" width="30" height="160" rx="4" fill="#F59E0B"/>
  </g>
</svg>
`);

// ─────────────────────────────────────────────────────────────
// 5. TEXT WORKSPACE ARTWORK (#8B5CF6)
// ─────────────────────────────────────────────────────────────
const TEXT_DARK = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <defs>
    <linearGradient id="textGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#4C1D95" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <circle cx="560" cy="200" r="180" fill="url(#textGradD)"/>
  <g transform="translate(390, 60)">
    <rect x="0" y="0" width="250" height="280" rx="14" fill="#1C1C1C" stroke="#8B5CF6" stroke-opacity="0.45" stroke-width="2"/>
    <!-- Large serif typographic letter 'T' / glyph abstraction -->
    <path d="M 60 70 L 190 70 L 190 95 L 140 95 L 140 230 L 110 230 L 110 95 L 60 95 Z" fill="#8B5CF6" fill-opacity="0.25" stroke="#8B5CF6" stroke-opacity="0.8" stroke-width="2"/>
    <circle cx="160" cy="180" r="28" fill="#8B5CF6" fill-opacity="0.2"/>
    <line x1="30" y1="250" x2="220" y2="250" stroke="#8B5CF6" stroke-opacity="0.4" stroke-width="2"/>
  </g>
</svg>
`);

const TEXT_LIGHT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <circle cx="560" cy="200" r="180" fill="#EDE9FE" fill-opacity="0.5"/>
  <g transform="translate(390, 60)">
    <rect x="0" y="0" width="250" height="280" rx="14" fill="#FFFFFF" stroke="#8B5CF6" stroke-opacity="0.3" stroke-width="2"/>
    <path d="M 60 70 L 190 70 L 190 95 L 140 95 L 140 230 L 110 230 L 110 95 L 60 95 Z" fill="#DDD6FE" stroke="#8B5CF6" stroke-opacity="0.6" stroke-width="2"/>
  </g>
</svg>
`);

// ─────────────────────────────────────────────────────────────
// 6. DEVELOPER WORKSPACE ARTWORK (#F97316)
// ─────────────────────────────────────────────────────────────
const DEV_DARK = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <defs>
    <linearGradient id="devGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F97316" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#7C2D12" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <circle cx="560" cy="200" r="190" fill="url(#devGradD)"/>
  <g transform="translate(380, 50)">
    <rect x="0" y="0" width="270" height="300" rx="14" fill="#1C1C1C" stroke="#F97316" stroke-opacity="0.45" stroke-width="2"/>
    <!-- Terminal header -->
    <rect x="0" y="0" width="270" height="32" rx="14" fill="#262626"/>
    <circle cx="20" cy="16" r="4" fill="#EF4444"/>
    <circle cx="34" cy="16" r="4" fill="#F59E0B"/>
    <circle cx="48" cy="16" r="4" fill="#22C55E"/>
    <!-- Code syntax abstraction -->
    <text x="24" y="65" font-family="monospace" font-size="14" fill="#F97316" font-weight="bold">&lt;/&gt;</text>
    <line x1="60" y1="60" x2="160" y2="60" stroke="#F97316" stroke-opacity="0.6" stroke-width="3" stroke-linecap="round"/>
    <line x1="44" y1="95" x2="180" y2="95" stroke="#EDEDED" stroke-opacity="0.25" stroke-width="2"/>
    <line x1="44" y1="120" x2="220" y2="120" stroke="#F97316" stroke-opacity="0.35" stroke-width="2"/>
    <line x1="64" y1="145" x2="190" y2="145" stroke="#EDEDED" stroke-opacity="0.15" stroke-width="2"/>
    <line x1="64" y1="170" x2="150" y2="170" stroke="#EDEDED" stroke-opacity="0.15" stroke-width="2"/>
    <text x="24" y="215" font-family="monospace" font-size="28" fill="#F97316" fill-opacity="0.3">{ }</text>
  </g>
</svg>
`);

const DEV_LIGHT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <circle cx="560" cy="200" r="190" fill="#FFEDD5" fill-opacity="0.5"/>
  <g transform="translate(380, 50)">
    <rect x="0" y="0" width="270" height="300" rx="14" fill="#FFFFFF" stroke="#F97316" stroke-opacity="0.3" stroke-width="2"/>
    <rect x="0" y="0" width="270" height="32" rx="14" fill="#F3F4F6"/>
    <text x="24" y="65" font-family="monospace" font-size="14" fill="#EA580C" font-weight="bold">&lt;/&gt;</text>
    <line x1="60" y1="60" x2="160" y2="60" stroke="#F97316" stroke-width="3" stroke-linecap="round"/>
    <text x="24" y="215" font-family="monospace" font-size="28" fill="#F97316" fill-opacity="0.5">{ }</text>
  </g>
</svg>
`);

// ─────────────────────────────────────────────────────────────
// 7. CALCULATOR & CONVERTERS ARTWORK (#EAB308)
// ─────────────────────────────────────────────────────────────
const CALC_DARK = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <defs>
    <linearGradient id="calcGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EAB308" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#713F12" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <circle cx="560" cy="200" r="190" fill="url(#calcGradD)"/>
  <g transform="translate(380, 60)">
    <rect x="0" y="0" width="260" height="280" rx="14" fill="#1C1C1C" stroke="#EAB308" stroke-opacity="0.45" stroke-width="2"/>
    <!-- Coordinate dial / conversion wheel -->
    <circle cx="130" cy="120" r="64" fill="none" stroke="#EAB308" stroke-opacity="0.4" stroke-width="2" stroke-dasharray="6 6"/>
    <circle cx="130" cy="120" r="32" fill="#EAB308" fill-opacity="0.15" stroke="#EAB308" stroke-opacity="0.7"/>
    <!-- Math operators -->
    <text x="45" y="240" font-family="sans-serif" font-size="20" fill="#EAB308" font-weight="bold">+</text>
    <text x="95" y="240" font-family="sans-serif" font-size="20" fill="#EAB308" font-weight="bold">−</text>
    <text x="145" y="240" font-family="sans-serif" font-size="20" fill="#EAB308" font-weight="bold">×</text>
    <text x="195" y="240" font-family="sans-serif" font-size="20" fill="#EAB308" font-weight="bold">=</text>
  </g>
</svg>
`);

const CALC_LIGHT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <circle cx="560" cy="200" r="190" fill="#FEF9C3" fill-opacity="0.5"/>
  <g transform="translate(380, 60)">
    <rect x="0" y="0" width="260" height="280" rx="14" fill="#FFFFFF" stroke="#EAB308" stroke-opacity="0.3" stroke-width="2"/>
    <circle cx="130" cy="120" r="64" fill="none" stroke="#CA8A04" stroke-opacity="0.4" stroke-width="2" stroke-dasharray="6 6"/>
    <text x="45" y="240" font-family="sans-serif" font-size="20" fill="#CA8A04" font-weight="bold">+</text>
    <text x="195" y="240" font-family="sans-serif" font-size="20" fill="#CA8A04" font-weight="bold">=</text>
  </g>
</svg>
`);

// ─────────────────────────────────────────────────────────────
// 8. FILES & ARCHIVES ARTWORK (#3B82F6)
// ─────────────────────────────────────────────────────────────
const FILES_DARK = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <defs>
    <linearGradient id="filesGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#1E3A8A" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <circle cx="560" cy="200" r="190" fill="url(#filesGradD)"/>
  <g transform="translate(380, 50)">
    <rect x="0" y="0" width="260" height="300" rx="14" fill="#1C1C1C" stroke="#3B82F6" stroke-opacity="0.45" stroke-width="2"/>
    <!-- Filing drawer compartments -->
    <rect x="25" y="30" width="210" height="60" rx="8" fill="#3B82F6" fill-opacity="0.1" stroke="#3B82F6" stroke-opacity="0.5"/>
    <rect x="95" y="55" width="70" height="10" rx="3" fill="#3B82F6" fill-opacity="0.4"/>
    <rect x="25" y="110" width="210" height="60" rx="8" fill="#3B82F6" fill-opacity="0.15" stroke="#3B82F6" stroke-opacity="0.6"/>
    <rect x="95" y="135" width="70" height="10" rx="3" fill="#3B82F6" fill-opacity="0.5"/>
    <rect x="25" y="190" width="210" height="60" rx="8" fill="#3B82F6" fill-opacity="0.2" stroke="#3B82F6" stroke-opacity="0.7"/>
    <rect x="95" y="215" width="70" height="10" rx="3" fill="#3B82F6" fill-opacity="0.6"/>
  </g>
</svg>
`);

const FILES_LIGHT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <circle cx="560" cy="200" r="190" fill="#DBEAFE" fill-opacity="0.5"/>
  <g transform="translate(380, 50)">
    <rect x="0" y="0" width="260" height="300" rx="14" fill="#FFFFFF" stroke="#3B82F6" stroke-opacity="0.3" stroke-width="2"/>
    <rect x="25" y="30" width="210" height="60" rx="8" fill="#EFF6FF" stroke="#3B82F6" stroke-opacity="0.3"/>
    <rect x="25" y="110" width="210" height="60" rx="8" fill="#EFF6FF" stroke="#3B82F6" stroke-opacity="0.3"/>
  </g>
</svg>
`);

// ─────────────────────────────────────────────────────────────
// 9. HOME HERO BANNER ARTWORK
// ─────────────────────────────────────────────────────────────
const HERO_DARK = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" width="1200" height="400">
  <defs>
    <linearGradient id="heroGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5A524" stop-opacity="0.18"/>
      <stop offset="50%" stop-color="#3B82F6" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#111111" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="400" fill="url(#heroGradD)"/>
  <!-- Perspective horizon lines -->
  <line x1="0" y1="360" x2="1200" y2="360" stroke="#EDEDED" stroke-opacity="0.06"/>
  <line x1="0" y1="380" x2="1200" y2="380" stroke="#EDEDED" stroke-opacity="0.04"/>
  <!-- Isometric geometric floating tiles -->
  <g transform="translate(820, 40) rotate(-6)">
    <rect x="0" y="0" width="180" height="120" rx="12" fill="#1E1E1E" stroke="#F5A524" stroke-opacity="0.4" stroke-width="1.5"/>
    <circle cx="30" cy="30" r="14" fill="#F5A524" fill-opacity="0.3"/>
  </g>
  <g transform="translate(950, 100) rotate(12)">
    <rect x="0" y="0" width="170" height="110" rx="12" fill="#1C1C1C" stroke="#3B82F6" stroke-opacity="0.4" stroke-width="1.5"/>
    <circle cx="30" cy="30" r="14" fill="#3B82F6" fill-opacity="0.3"/>
  </g>
</svg>
`);

const HERO_LIGHT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" width="1200" height="400">
  <defs>
    <linearGradient id="heroGradL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FED7AA" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#BFDBFE" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#FAFAF9" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="400" fill="url(#heroGradL)"/>
</svg>
`);

// ─────────────────────────────────────────────────────────────
// 10. PRIMARY BUTTON SKIN TEXTURE
// ─────────────────────────────────────────────────────────────
const BUTTON_SKIN_DARK = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="300" height="80">
  <defs>
    <linearGradient id="btnSkinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F5A524" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#D97706" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <rect width="300" height="80" fill="url(#btnSkinGrad)"/>
  <!-- Subtle diagonal micro texture lines -->
  <line x1="20" y1="0" x2="60" y2="80" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1.5"/>
  <line x1="60" y1="0" x2="100" y2="80" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1.5"/>
  <line x1="100" y1="0" x2="140" y2="80" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1.5"/>
  <line x1="140" y1="0" x2="180" y2="80" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1.5"/>
  <line x1="180" y1="0" x2="220" y2="80" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1.5"/>
  <line x1="220" y1="0" x2="260" y2="80" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1.5"/>
</svg>
`);

export interface DefaultArtPackMap {
  [key: string]: {
    dark: string;
    light: string;
    label: string;
    categoryColor: string;
  };
}

export const DEFAULT_ART_PACK: DefaultArtPackMap = {
  pdf: {
    dark: PDF_DARK,
    light: PDF_LIGHT,
    label: 'PDF Workspace',
    categoryColor: '#EF4444',
  },
  documents: {
    dark: DOCS_DARK,
    light: DOCS_LIGHT,
    label: 'Documents',
    categoryColor: '#3B82F6',
  },
  images: {
    dark: IMAGES_DARK,
    light: IMAGES_LIGHT,
    label: 'Images',
    categoryColor: '#22C55E',
  },
  data: {
    dark: DATA_DARK,
    light: DATA_LIGHT,
    label: 'Data & Spreadsheets',
    categoryColor: '#F59E0B',
  },
  text: {
    dark: TEXT_DARK,
    light: TEXT_LIGHT,
    label: 'Text & Typography',
    categoryColor: '#8B5CF6',
  },
  developer: {
    dark: DEV_DARK,
    light: DEV_LIGHT,
    label: 'Developer Utilities',
    categoryColor: '#F97316',
  },
  calculator: {
    dark: CALC_DARK,
    light: CALC_LIGHT,
    label: 'Calculators & Units',
    categoryColor: '#EAB308',
  },
  files: {
    dark: FILES_DARK,
    light: FILES_LIGHT,
    label: 'Files & Archives',
    categoryColor: '#3B82F6',
  },
  hero: {
    dark: HERO_DARK,
    light: HERO_LIGHT,
    label: 'Home Hero Banner',
    categoryColor: '#F5A524',
  },
  'button-skin': {
    dark: BUTTON_SKIN_DARK,
    light: BUTTON_SKIN_DARK,
    label: 'Primary Button Skin',
    categoryColor: '#F5A524',
  },
};

/**
 * Get the default artwork for a workspace or module ID
 */
export function getDefaultArtwork(categoryId: string, mode: 'dark' | 'light' = 'dark'): string {
  const art = DEFAULT_ART_PACK[categoryId];
  if (!art) return DEFAULT_ART_PACK.pdf[mode];
  return art[mode];
}

// ─────────────────────────────────────────────────────────────
// CHIBIGI THEME ARTWORK & CHARACTER MASCOTS
// ─────────────────────────────────────────────────────────────

/**
 * Chibigi Bun-bun (Cute Chibi Bunny Mascot with sparkly eyes and heart)
 */
export const CHIBIGI_MASCOT_BUNNY = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <radialGradient id="bunnyBlush" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF6B9D" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#FF6B9D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Ears -->
  <ellipse cx="23" cy="18" rx="6" ry="15" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="2"/>
  <ellipse cx="23" cy="18" rx="3.5" ry="11" fill="#FFCCD5"/>
  <ellipse cx="41" cy="18" rx="6" ry="15" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="2"/>
  <ellipse cx="41" cy="18" rx="3.5" ry="11" fill="#FFCCD5"/>
  <!-- Head -->
  <ellipse cx="32" cy="38" rx="22" ry="19" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="2"/>
  <!-- Bow on ear -->
  <path d="M 36 17 C 33 15 33 21 36 19 C 39 21 39 15 36 17 Z" fill="#FF6B9D"/>
  <circle cx="36" cy="18" r="1.5" fill="#FFE4E6"/>
  <!-- Big Kawaii Eyes with Highlights -->
  <ellipse cx="24" cy="36" rx="3.5" ry="4.5" fill="#3B1422"/>
  <circle cx="23" cy="34.5" r="1.5" fill="#FFFFFF"/>
  <circle cx="25.5" cy="38" r="0.8" fill="#FFFFFF"/>
  <ellipse cx="40" cy="36" rx="3.5" ry="4.5" fill="#3B1422"/>
  <circle cx="39" cy="34.5" r="1.5" fill="#FFFFFF"/>
  <circle cx="41.5" cy="38" r="0.8" fill="#FFFFFF"/>
  <!-- Cheeks Blush -->
  <ellipse cx="17" cy="41" rx="4.5" ry="2.8" fill="url(#bunnyBlush)"/>
  <ellipse cx="47" cy="41" rx="4.5" ry="2.8" fill="url(#bunnyBlush)"/>
  <!-- Cute Mouth (w) and Nose -->
  <circle cx="32" cy="39" r="1" fill="#FF6B9D"/>
  <path d="M 29.5 41 Q 32 43.5 32 41 Q 32 43.5 34.5 41" fill="none" stroke="#3B1422" stroke-width="1.3" stroke-linecap="round"/>
  <!-- Little hands holding heart -->
  <path d="M 32 46 C 30 43 27 45 28 47.5 C 29 50 32 52.5 32 52.5 C 32 52.5 35 50 36 47.5 C 37 45 34 43 32 46 Z" fill="#FF6B9D"/>
  <ellipse cx="27" cy="48" rx="2.5" ry="2" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="1"/>
  <ellipse cx="37" cy="48" rx="2.5" ry="2" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="1"/>
</svg>
`);

/**
 * Chibigi Kuma (Cute Teddy Bear Mascot waving)
 */
export const CHIBIGI_MASCOT_KUMA = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <radialGradient id="kumaBlush" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFAAA6" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#FFAAA6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Bear Ears -->
  <circle cx="17" cy="22" r="8" fill="#FFF2E0" stroke="#F6C492" stroke-width="2"/>
  <circle cx="17" cy="22" r="4.5" fill="#FFAAA6" opacity="0.6"/>
  <circle cx="47" cy="22" r="8" fill="#FFF2E0" stroke="#F6C492" stroke-width="2"/>
  <circle cx="47" cy="22" r="4.5" fill="#FFAAA6" opacity="0.6"/>
  <!-- Bear Head -->
  <ellipse cx="32" cy="38" rx="22" ry="19" fill="#FFF8F0" stroke="#F6C492" stroke-width="2"/>
  <!-- Snout Area -->
  <ellipse cx="32" cy="42" rx="7" ry="5.5" fill="#FFFFFF"/>
  <ellipse cx="32" cy="39.5" rx="2" ry="1.5" fill="#7C4A28"/>
  <path d="M 32 41 L 32 43" stroke="#7C4A28" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M 30 43 Q 32 44.8 34 43" fill="none" stroke="#7C4A28" stroke-width="1.2" stroke-linecap="round"/>
  <!-- Eyes -->
  <circle cx="23" cy="36" r="3" fill="#3E2723"/>
  <circle cx="22" cy="35" r="1.2" fill="#FFFFFF"/>
  <circle cx="41" cy="36" r="3" fill="#3E2723"/>
  <circle cx="40" cy="35" r="1.2" fill="#FFFFFF"/>
  <!-- Cheeks Blush -->
  <ellipse cx="17" cy="42" rx="4.5" ry="2.8" fill="url(#kumaBlush)"/>
  <ellipse cx="47" cy="42" rx="4.5" ry="2.8" fill="url(#kumaBlush)"/>
  <!-- Waving Paw -->
  <ellipse cx="51" cy="47" rx="3.5" ry="3" fill="#FFF8F0" stroke="#F6C492" stroke-width="1.5"/>
</svg>
`);

/**
 * Chibigi Neko (Cute Kitten Mascot with bell collar)
 */
export const CHIBIGI_MASCOT_NEKO = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <radialGradient id="nekoBlush" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF6B9D" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#FF6B9D" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Kitty Ears -->
  <path d="M 14 30 L 19 14 L 29 24 Z" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="2"/>
  <path d="M 17 27 L 20 18 L 26 24 Z" fill="#FFCCD5"/>
  <path d="M 50 30 L 45 14 L 35 24 Z" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="2"/>
  <path d="M 47 27 L 44 18 L 38 24 Z" fill="#FFCCD5"/>
  <!-- Kitty Head -->
  <ellipse cx="32" cy="38" rx="21" ry="18" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="2"/>
  <!-- Happy Eyes (smiling arcs) -->
  <path d="M 21 36 Q 25 31 28 36" fill="none" stroke="#3B1422" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M 36 36 Q 39 31 43 36" fill="none" stroke="#3B1422" stroke-width="2.2" stroke-linecap="round"/>
  <!-- Cheeks Blush -->
  <ellipse cx="17" cy="42" rx="4.5" ry="2.5" fill="url(#nekoBlush)"/>
  <ellipse cx="47" cy="42" rx="4.5" ry="2.5" fill="url(#nekoBlush)"/>
  <!-- Cute Whiskers -->
  <line x1="12" y1="39" x2="6" y2="38" stroke="#FFAAC9" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="12" y1="43" x2="7" y2="44" stroke="#FFAAC9" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="52" y1="39" x2="58" y2="38" stroke="#FFAAC9" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="52" y1="43" x2="57" y2="44" stroke="#FFAAC9" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Cute Nose & Mouth -->
  <ellipse cx="32" cy="40" rx="1.5" ry="1.2" fill="#FF6B9D"/>
  <path d="M 29.5 42 Q 32 44.5 32 42 Q 32 44.5 34.5 42" fill="none" stroke="#3B1422" stroke-width="1.3" stroke-linecap="round"/>
  <!-- Tiny Bell Collar -->
  <circle cx="32" cy="51" r="3.5" fill="#FBBF24" stroke="#F59E0B" stroke-width="1"/>
  <line x1="30.5" y1="52" x2="33.5" y2="52" stroke="#B45309" stroke-width="1"/>
</svg>
`);

/**
 * Chibigi Wallpaper (Light Mode: Strawberry Milk Pastel Pattern)
 */
export const CHIBIGI_WALLPAPER_LIGHT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360" width="360" height="360">
  <rect width="360" height="360" fill="#FFF5F8"/>
  <!-- Floating clouds -->
  <path d="M 50 60 C 42 60 38 52 46 45 C 46 36 60 34 65 41 C 72 36 82 39 80 48 C 88 51 84 60 75 60 Z" fill="#FFE2EC" opacity="0.6"/>
  <path d="M 230 220 C 222 220 218 212 226 205 C 226 196 240 194 245 201 C 252 196 262 199 260 208 C 268 211 264 220 255 220 Z" fill="#FFE2EC" opacity="0.6"/>
  <!-- Chibi Bunny at (60, 160) -->
  <g transform="translate(45, 145) scale(0.6)" opacity="0.28">
    <ellipse cx="23" cy="18" rx="6" ry="14" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="2"/>
    <ellipse cx="41" cy="18" rx="6" ry="14" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="2"/>
    <ellipse cx="32" cy="38" rx="22" ry="18" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="2"/>
    <circle cx="24" cy="36" r="3" fill="#3B1422"/>
    <circle cx="40" cy="36" r="3" fill="#3B1422"/>
    <ellipse cx="17" cy="41" rx="4" ry="2.5" fill="#FF8FA3"/>
    <ellipse cx="47" cy="41" rx="4" ry="2.5" fill="#FF8FA3"/>
    <path d="M 30 42 Q 32 44 34 42" stroke="#3B1422" stroke-width="1.2" fill="none"/>
  </g>
  <!-- Chibi Bear at (230, 60) -->
  <g transform="translate(215, 45) scale(0.6)" opacity="0.25">
    <circle cx="17" cy="22" r="7" fill="#FFF2E0" stroke="#F6C492" stroke-width="2"/>
    <circle cx="47" cy="22" r="7" fill="#FFF2E0" stroke="#F6C492" stroke-width="2"/>
    <ellipse cx="32" cy="38" rx="21" ry="18" fill="#FFF8F0" stroke="#F6C492" stroke-width="2"/>
    <circle cx="23" cy="36" r="2.8" fill="#3E2723"/>
    <circle cx="41" cy="36" r="2.8" fill="#3E2723"/>
    <ellipse cx="17" cy="41" rx="4" ry="2.5" fill="#FFAAA6"/>
    <ellipse cx="47" cy="41" rx="4" ry="2.5" fill="#FFAAA6"/>
    <path d="M 30 43 Q 32 45 34 43" stroke="#7C4A28" stroke-width="1.2" fill="none"/>
  </g>
  <!-- Chibi Neko at (180, 270) -->
  <g transform="translate(165, 255) scale(0.6)" opacity="0.28">
    <path d="M 14 30 L 19 14 L 29 24 Z" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="2"/>
    <path d="M 50 30 L 45 14 L 35 24 Z" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="2"/>
    <ellipse cx="32" cy="38" rx="20" ry="17" fill="#FFFFFF" stroke="#FFAAC9" stroke-width="2"/>
    <path d="M 22 36 Q 25 32 28 36" stroke="#3B1422" stroke-width="2" fill="none"/>
    <path d="M 36 36 Q 39 32 42 36" stroke="#3B1422" stroke-width="2" fill="none"/>
    <ellipse cx="17" cy="41" rx="4" ry="2.2" fill="#FF8FA3"/>
    <ellipse cx="47" cy="41" rx="4" ry="2.2" fill="#FF8FA3"/>
  </g>
  <!-- Floating Hearts -->
  <path d="M 160 110 C 156 104 150 106 152 112 C 154 117 160 122 160 122 C 160 122 166 117 168 112 C 170 106 164 104 160 110 Z" fill="#FF8FA3" opacity="0.35"/>
  <path d="M 310 160 C 306 154 300 156 302 162 C 304 167 310 172 310 172 C 310 172 316 167 318 162 C 320 156 314 154 310 160 Z" fill="#FF8FA3" opacity="0.35"/>
  <path d="M 90 310 C 86 304 80 306 82 312 C 84 317 90 322 90 322 C 90 322 96 317 98 312 C 100 306 94 304 90 310 Z" fill="#FF8FA3" opacity="0.35"/>
  <!-- Twinkling Stars -->
  <path d="M 120 40 Q 120 48 112 48 Q 120 48 120 56 Q 120 48 128 48 Q 120 48 120 40 Z" fill="#FBBF24" opacity="0.45"/>
  <path d="M 280 120 Q 280 128 272 128 Q 280 128 280 136 Q 280 128 288 128 Q 280 128 280 120 Z" fill="#FBBF24" opacity="0.45"/>
  <path d="M 330 280 Q 330 288 322 288 Q 330 288 330 296 Q 330 288 338 288 Q 330 288 330 280 Z" fill="#FBBF24" opacity="0.45"/>
  <path d="M 40 280 Q 40 288 32 288 Q 40 288 40 296 Q 40 288 48 288 Q 40 288 40 280 Z" fill="#FBBF24" opacity="0.45"/>
  <circle cx="150" cy="190" r="2" fill="#FFB6C1" opacity="0.4"/>
  <circle cx="210" cy="150" r="1.5" fill="#C084FC" opacity="0.4"/>
  <circle cx="110" cy="130" r="1.5" fill="#C084FC" opacity="0.4"/>
  <circle cx="290" cy="40" r="2" fill="#FFB6C1" opacity="0.4"/>
</svg>
`);

/**
 * Chibigi Wallpaper (Dark Mode: Magical Midnight Violet Pattern)
 */
export const CHIBIGI_WALLPAPER_DARK = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360" width="360" height="360">
  <rect width="360" height="360" fill="#181324"/>
  <!-- Floating clouds in deep lilac -->
  <path d="M 50 60 C 42 60 38 52 46 45 C 46 36 60 34 65 41 C 72 36 82 39 80 48 C 88 51 84 60 75 60 Z" fill="#2E2145" opacity="0.6"/>
  <path d="M 230 220 C 222 220 218 212 226 205 C 226 196 240 194 245 201 C 252 196 262 199 260 208 C 268 211 264 220 255 220 Z" fill="#2E2145" opacity="0.6"/>
  <!-- Chibi Bunny glowing -->
  <g transform="translate(45, 145) scale(0.6)" opacity="0.30">
    <ellipse cx="23" cy="18" rx="6" ry="14" fill="#312547" stroke="#F472B6" stroke-width="2"/>
    <ellipse cx="41" cy="18" rx="6" ry="14" fill="#312547" stroke="#F472B6" stroke-width="2"/>
    <ellipse cx="32" cy="38" rx="22" ry="18" fill="#312547" stroke="#F472B6" stroke-width="2"/>
    <circle cx="24" cy="36" r="3" fill="#FDF2F8"/>
    <circle cx="40" cy="36" r="3" fill="#FDF2F8"/>
    <ellipse cx="17" cy="41" rx="4" ry="2.5" fill="#F472B6"/>
    <ellipse cx="47" cy="41" rx="4" ry="2.5" fill="#F472B6"/>
    <path d="M 30 42 Q 32 44 34 42" stroke="#FDF2F8" stroke-width="1.2" fill="none"/>
  </g>
  <!-- Chibi Bear glowing -->
  <g transform="translate(215, 45) scale(0.6)" opacity="0.28">
    <circle cx="17" cy="22" r="7" fill="#312547" stroke="#FBBF24" stroke-width="2"/>
    <circle cx="47" cy="22" r="7" fill="#312547" stroke="#FBBF24" stroke-width="2"/>
    <ellipse cx="32" cy="38" rx="21" ry="18" fill="#312547" stroke="#FBBF24" stroke-width="2"/>
    <circle cx="23" cy="36" r="2.8" fill="#FDF2F8"/>
    <circle cx="41" cy="36" r="2.8" fill="#FDF2F8"/>
    <ellipse cx="17" cy="41" rx="4" ry="2.5" fill="#FBBF24"/>
    <ellipse cx="47" cy="41" rx="4" ry="2.5" fill="#FBBF24"/>
    <path d="M 30 43 Q 32 45 34 43" stroke="#FDF2F8" stroke-width="1.2" fill="none"/>
  </g>
  <!-- Chibi Neko glowing -->
  <g transform="translate(165, 255) scale(0.6)" opacity="0.30">
    <path d="M 14 30 L 19 14 L 29 24 Z" fill="#312547" stroke="#C084FC" stroke-width="2"/>
    <path d="M 50 30 L 45 14 L 35 24 Z" fill="#312547" stroke="#C084FC" stroke-width="2"/>
    <ellipse cx="32" cy="38" rx="20" ry="17" fill="#312547" stroke="#C084FC" stroke-width="2"/>
    <path d="M 22 36 Q 25 32 28 36" stroke="#FDF2F8" stroke-width="2" fill="none"/>
    <path d="M 36 36 Q 39 32 42 36" stroke="#FDF2F8" stroke-width="2" fill="none"/>
    <ellipse cx="17" cy="41" rx="4" ry="2.2" fill="#C084FC"/>
    <ellipse cx="47" cy="41" rx="4" ry="2.2" fill="#C084FC"/>
  </g>
  <!-- Glowing Floating Hearts -->
  <path d="M 160 110 C 156 104 150 106 152 112 C 154 117 160 122 160 122 C 160 122 166 117 168 112 C 170 106 164 104 160 110 Z" fill="#F472B6" opacity="0.4"/>
  <path d="M 310 160 C 306 154 300 156 302 162 C 304 167 310 172 310 172 C 310 172 316 167 318 162 C 320 156 314 154 310 160 Z" fill="#F472B6" opacity="0.4"/>
  <path d="M 90 310 C 86 304 80 306 82 312 C 84 317 90 322 90 322 C 90 322 96 317 98 312 C 100 306 94 304 90 310 Z" fill="#F472B6" opacity="0.4"/>
  <!-- Glowing Stars -->
  <path d="M 120 40 Q 120 48 112 48 Q 120 48 120 56 Q 120 48 128 48 Q 120 48 120 40 Z" fill="#FDE047" opacity="0.45"/>
  <path d="M 280 120 Q 280 128 272 128 Q 280 128 280 136 Q 280 128 288 128 Q 280 128 280 120 Z" fill="#FDE047" opacity="0.45"/>
  <path d="M 330 280 Q 330 288 322 288 Q 330 288 330 296 Q 330 288 338 288 Q 330 288 330 280 Z" fill="#FDE047" opacity="0.45"/>
  <path d="M 40 280 Q 40 288 32 288 Q 40 288 40 296 Q 40 288 48 288 Q 40 288 40 280 Z" fill="#FDE047" opacity="0.45"/>
  <circle cx="150" cy="190" r="2" fill="#F472B6" opacity="0.4"/>
  <circle cx="210" cy="150" r="1.5" fill="#C084FC" opacity="0.4"/>
  <circle cx="110" cy="130" r="1.5" fill="#C084FC" opacity="0.4"/>
  <circle cx="290" cy="40" r="2" fill="#F472B6" opacity="0.4"/>
</svg>
`);
