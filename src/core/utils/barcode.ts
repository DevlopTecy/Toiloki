/**
 * 1D Barcode Generator (Code 128 & Code 39)
 * Pure TypeScript, zero external dependencies, renders standard vector SVG.
 */

// Code 128 Table (patterns of bar/space widths, each totaling 11 modules)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 is STOP)
];

// Code 39 Table
const CODE39_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
const CODE39_PATTERNS = [
  '000110100','100100001','001100001','101100000','000110001','100110000','001110000','000100101','100100100','001100100',
  '100001001','001001001','101001000','000011001','100011000','001011000','000001101','100001100','001001100','000011100',
  '100000011','001000011','101000010','000010011','100010010','001010010','000000111','100000110','001000110','000010110',
  '110000001','011000001','111000000','010010001','110010000','011010000',
  '010000101','010000011','010010100','010101000','010100010','010001010','000101010'
];
const CODE39_START_STOP = '010010100'; // * pattern

export interface BarcodeOptions {
  format?: 'CODE128' | 'CODE39';
  height?: number;
  barWidth?: number;
  showText?: boolean;
  background?: string;
  color?: string;
}

/**
 * Generate a Code 128-B SVG barcode string
 */
export function generateCode128Svg(text: string, options: BarcodeOptions = {}): string {
  const height = options.height || 80;
  const barWidth = options.barWidth || 2;
  const showText = options.showText ?? true;
  const color = options.color || 'black';
  const background = options.background || 'white';

  // Start with Start Code B (index 104)
  const indices: number[] = [104];
  let checkSum = 104;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Code 128 Set B covers ASCII 32 to 127
    const idx = code >= 32 && code <= 127 ? code - 32 : 0;
    indices.push(idx);
    checkSum += idx * (i + 1);
  }

  // Check digit
  const checkDigit = checkSum % 103;
  indices.push(checkDigit);
  // Stop symbol (106)
  indices.push(106);

  // Convert pattern to modules (bars & spaces)
  let modules = '';
  for (const idx of indices) {
    const pat = CODE128_PATTERNS[idx] || CODE128_PATTERNS[0];
    let isBar = true;
    for (let j = 0; j < pat.length; j++) {
      const w = parseInt(pat[j], 10);
      modules += (isBar ? '1' : '0').repeat(w);
      isBar = !isBar;
    }
  }

  const quietZone = 10 * barWidth;
  const barcodeContentWidth = modules.length * barWidth;
  const totalWidth = barcodeContentWidth + quietZone * 2;
  const totalHeight = height + (showText ? 24 : 0);

  let rects = '';
  for (let i = 0; i < modules.length; i++) {
    if (modules[i] === '1') {
      const x = quietZone + i * barWidth;
      rects += `<rect x="${x}" y="10" width="${barWidth}" height="${height - 10}" fill="${color}" />`;
    }
  }

  const textElement = showText
    ? `<text x="${totalWidth / 2}" y="${totalHeight - 4}" font-family="monospace" font-size="12" font-weight="600" text-anchor="middle" fill="${color}">${escapeXml(text)}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
    <rect width="${totalWidth}" height="${totalHeight}" fill="${background}" />
    ${rects}
    ${textElement}
  </svg>`;
}

/**
 * Generate a Code 39 SVG barcode string
 */
export function generateCode39Svg(rawText: string, options: BarcodeOptions = {}): string {
  const height = options.height || 80;
  const barWidth = options.barWidth || 2;
  const showText = options.showText ?? true;
  const color = options.color || 'black';
  const background = options.background || 'white';

  const text = rawText.toUpperCase().replace(/[^0-9A-Z\-.\s$/+%]/g, '-');
  const wideRatio = 2.5;

  let totalModules = 0;
  // Start + text + stop
  const chars = ['*', ...text.split(''), '*'];

  // Calculate width
  for (const c of chars) {
    const pat = c === '*' ? CODE39_START_STOP : (CODE39_PATTERNS[CODE39_CHARS.indexOf(c)] || CODE39_START_STOP);
    for (const b of pat) {
      totalModules += b === '1' ? wideRatio : 1;
    }
    totalModules += 1; // Inter-character gap
  }

  const quietZone = 15;
  const totalWidth = Math.ceil(totalModules * barWidth + quietZone * 2);
  const totalHeight = height + (showText ? 24 : 0);

  let curX = quietZone;
  let rects = '';

  for (const c of chars) {
    const pat = c === '*' ? CODE39_START_STOP : (CODE39_PATTERNS[CODE39_CHARS.indexOf(c)] || CODE39_START_STOP);
    for (let i = 0; i < pat.length; i++) {
      const isBar = i % 2 === 0;
      const isWide = pat[i] === '1';
      const w = isWide ? barWidth * wideRatio : barWidth;
      if (isBar) {
        rects += `<rect x="${curX.toFixed(1)}" y="10" width="${w.toFixed(1)}" height="${(height - 10).toFixed(1)}" fill="${color}" />`;
      }
      curX += w;
    }
    curX += barWidth; // gap
  }

  const textElement = showText
    ? `<text x="${totalWidth / 2}" y="${totalHeight - 4}" font-family="monospace" font-size="12" font-weight="600" text-anchor="middle" fill="${color}">${escapeXml(text)}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
    <rect width="${totalWidth}" height="${totalHeight}" fill="${background}" />
    ${rects}
    ${textElement}
  </svg>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
