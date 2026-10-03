/**
 * Flip specific utility statuses in app-registry.ts from 'soon'/'beta' to 'ready'
 * Run: node scripts/flip_status.cjs
 */
const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '../src/core/registry/app-registry.ts');

const NEWLY_READY_IDS = [
  // PDF
  'compress-pdf',
  'optimize-images',
  'password-protect',
  'encrypt-pdf',
  'remove-password',
  'extract-text',
  'sign-pdf',
  'search-text',
  // Documents
  'pdf-to-docx',
  // Images
  'convert-bmp',
  'convert-tiff',
  'img-heic-converter',
  'img-avif-converter',
  // Files
  'files-organize-type-date',
  'files-split-join-large',
  'files-folder-text-tree',
  'files-folder-compare',
  'files-7z-extract',
  // Developer
  'dev-qr-scanner',
  'dev-barcode-generator',
  // Calculator
  'calc-time-duration',
  'calc-timezone-converter',
  'calc-timer-stopwatch',
  'calc-currency-manual',
  // Security
  'sec-cert-decoder',
  'sec-keypair-generator',
  'sec-file-encrypt',
  'sec-secure-shred',
  'sec-metadata-scrubber',
  // Color & Design (12)
  'design-color-converter',
  'design-palette-generator',
  'design-contrast-checker',
  'design-gradient-generator',
  'design-color-blindness-sim',
  'design-image-palette-extractor',
  'design-css-shadow-gen',
  'design-svg-optimizer',
  'design-favicon-generator',
  'design-font-inspector',
  'design-type-scale-calc',
  'design-token-exporter',
  // Network & Web (10)
  'net-url-builder',
  'net-mime-lookup',
  'net-curl-builder',
  'net-robots-sitemap-gen',
  'net-meta-og-gen',
  'net-subnet-cidr',
  'net-local-port-check',
  'net-dns-record-helper',
  'net-ip-converter',
  'net-mac-vendor-lookup',
  // System & Maintenance (10)
  'sys-disk-usage-tree',
  'sys-large-file-finder',
  'sys-temp-cache-cleaner',
  'sys-empty-folder-cleaner',
  'sys-system-info-report',
  'sys-env-vars-viewer',
  'sys-hosts-file-viewer',
  'sys-process-viewer',
  'sys-startup-items-viewer',
  'sys-clipboard-history',
  // Audio & Video (12)
  'audio-converter',
  'audio-trimmer',
  'audio-joiner',
  'audio-volume-fade',
  'audio-metadata-editor',
  'video-converter',
  'video-compressor',
  'video-trimmer',
  'video-to-gif',
  'media-extract-audio',
  'media-frame-extractor',
  'media-subtitle-shift',
];

let content = fs.readFileSync(REGISTRY_PATH, 'utf8');
let flippedCount = 0;

for (const id of NEWLY_READY_IDS) {
  const idPattern = new RegExp(
    `(id:\\s*['"]${id}['"][^}]{0,600}?status:\\s*['"])(soon|beta)(['"])`,
    'gs'
  );

  const before = content;
  content = content.replace(idPattern, (match, prefix, status, suffix) => {
    console.log(`  Flipping ${id}: ${status} → ready`);
    flippedCount++;
    return `${prefix}ready${suffix}`;
  });

  if (content === before) {
    console.warn(`  Note: Already ready or not found: ${id}`);
  }
}

fs.writeFileSync(REGISTRY_PATH, content, 'utf8');
console.log(`\n✓ Successfully flipped ${flippedCount} utilities to 'ready' in app-registry.ts`);
