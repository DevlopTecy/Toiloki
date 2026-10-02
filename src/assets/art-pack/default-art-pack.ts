/**
 * TOILOKI — Default Art Pack
 * Original abstract illustrations for all 8 categories + Hero + Button skin.
 * Fully offline, zero brand logos/trademarks, resolution-independent SVG data-URIs,
 * crafted with dark and light variants under 120KB each.
 */

// Helper to convert an SVG string to a clean data-URI
function svgToDataUri(svg: string): string {
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
