import { ContrastResult } from './theme.types';

export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
  a?: number;
}

/**
 * Parses Hex, RGB, or HSL color string into RGB object
 */
export function parseColorToRgb(colorStr: string): RGB {
  if (!colorStr) return { r: 0, g: 0, b: 0, a: 1 };
  const str = colorStr.trim().toLowerCase();

  // Hex (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  // RGB / RGBA
  const rgbMatch = str.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    return {
      r: Math.min(255, Math.max(0, parseFloat(rgbMatch[1]))),
      g: Math.min(255, Math.max(0, parseFloat(rgbMatch[2]))),
      b: Math.min(255, Math.max(0, parseFloat(rgbMatch[3]))),
      a: rgbMatch[4] !== undefined ? Math.min(1, Math.max(0, parseFloat(rgbMatch[4]))) : 1,
    };
  }

  // HSL / HSLA
  const hslMatch = str.match(/hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?(?:\s*,\s*([\d.]+))?\s*\)/);
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]);
    const s = parseFloat(hslMatch[2]) / 100;
    const l = parseFloat(hslMatch[3]) / 100;
    const a = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1;
    return { ...hslToRgb({ h, s, l }), a };
  }

  // Fallback
  return { r: 0, g: 0, b: 0, a: 1 };
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  if (rgb.a !== undefined && rgb.a < 1) {
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}${toHex(Math.round(rgb.a * 255))}`;
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s, l, a: rgb.a };
}

export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
    a: hsl.a,
  };
}

/**
 * Calculates WCAG relative luminance
 */
export function getLuminance(rgb: RGB): number {
  const srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * Calculates WCAG contrast ratio between text and background
 */
export function getContrastRatio(textColor: string, bgColor: string): number {
  const textRgb = parseColorToRgb(textColor);
  const bgRgb = parseColorToRgb(bgColor);

  // If background has alpha, blend over #FFFFFF or #000000 depending on background brightness
  let effectiveBg = bgRgb;
  if (bgRgb.a !== undefined && bgRgb.a < 1) {
    const assumedBase = getLuminance(textRgb) > 0.5 ? 0 : 255;
    effectiveBg = {
      r: Math.round(bgRgb.r * bgRgb.a + assumedBase * (1 - bgRgb.a)),
      g: Math.round(bgRgb.g * bgRgb.a + assumedBase * (1 - bgRgb.a)),
      b: Math.round(bgRgb.b * bgRgb.a + assumedBase * (1 - bgRgb.a)),
      a: 1,
    };
  }

  const lum1 = getLuminance(textRgb);
  const lum2 = getLuminance(effectiveBg);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  const ratio = (brightest + 0.05) / (darkest + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Full WCAG evaluation of a color pair
 */
export function evaluateContrast(textColor: string, bgColor: string): ContrastResult {
  const ratio = getContrastRatio(textColor, bgColor);
  const isAccessible = ratio >= 4.5;
  const isLargeAccessible = ratio >= 3.0;

  let score: 'AAA' | 'AA' | 'AA-large' | 'FAIL' = 'FAIL';
  if (ratio >= 7.0) score = 'AAA';
  else if (ratio >= 4.5) score = 'AA';
  else if (ratio >= 3.0) score = 'AA-large';

  return {
    ratio,
    score,
    isAccessible,
    isLargeAccessible,
    textColor,
    bgColor,
  };
}

/**
 * Auto-fix text color to pass WCAG AA (>= 4.5:1) against given background
 */
export function autoFixContrast(textColor: string, bgColor: string, targetRatio: number = 4.55): string {
  const bgRgb = parseColorToRgb(bgColor);
  const bgLum = getLuminance(bgRgb);
  const textHsl = rgbToHsl(parseColorToRgb(textColor));

  // Determine whether to nudge towards light or dark
  const shouldLighten = bgLum < 0.5;

  let bestColor = textColor;
  let currentRatio = getContrastRatio(textColor, bgColor);

  if (currentRatio >= targetRatio) return textColor;

  // Step lightness towards target
  for (let step = 0; step <= 100; step++) {
    const newL = shouldLighten
      ? Math.min(1.0, textHsl.l + step * 0.01)
      : Math.max(0.0, textHsl.l - step * 0.01);

    const candidateRgb = hslToRgb({ ...textHsl, l: newL });
    const candidateHex = rgbToHex(candidateRgb);
    const candidateRatio = getContrastRatio(candidateHex, bgColor);

    if (candidateRatio > currentRatio) {
      currentRatio = candidateRatio;
      bestColor = candidateHex;
    }

    if (candidateRatio >= targetRatio) {
      return candidateHex;
    }
  }

  // If still below target (e.g. background mid-tone), flip direction
  const fallbackL = shouldLighten ? 0.96 : 0.05;
  return rgbToHex(hslToRgb({ ...textHsl, l: fallbackL }));
}

/**
 * Auto-generate harmonious related colors from a base accent color
 */
export function deriveAccentPalette(baseHex: string, isDark: boolean = true) {
  const hsl = rgbToHsl(parseColorToRgb(baseHex));

  const hoverL = isDark ? Math.min(0.9, hsl.l + 0.08) : Math.max(0.1, hsl.l - 0.08);
  const activeL = isDark ? Math.max(0.1, hsl.l - 0.06) : Math.min(0.9, hsl.l + 0.06);

  const accentHover = rgbToHex(hslToRgb({ ...hsl, l: hoverL }));
  const accentActive = rgbToHex(hslToRgb({ ...hsl, l: activeL }));
  const accentSoft = `rgba(${parseColorToRgb(baseHex).r}, ${parseColorToRgb(baseHex).g}, ${parseColorToRgb(baseHex).b}, ${isDark ? '0.12' : '0.10'})`;

  // On-accent text: choose black or white depending on contrast
  const whiteRatio = getContrastRatio('#FFFFFF', baseHex);
  const blackRatio = getContrastRatio('#111111', baseHex);
  const onAccent = whiteRatio >= blackRatio ? '#FFFFFF' : '#111111';

  return {
    accent: baseHex,
    accentHover,
    accentActive,
    accentSoft,
    onAccent,
  };
}

/**
 * Auto-generate surface, surface-hover, border, and divider from background
 */
export function deriveNeutralPalette(bgHex: string, isDark: boolean = true) {
  const hsl = rgbToHsl(parseColorToRgb(bgHex));

  const surfaceL = isDark ? Math.min(0.8, hsl.l + 0.04) : Math.max(0.2, hsl.l - 0.03);
  const surfaceHoverL = isDark ? Math.min(0.85, hsl.l + 0.07) : Math.max(0.15, hsl.l - 0.05);
  const borderL = isDark ? Math.min(0.85, hsl.l + 0.10) : Math.max(0.1, hsl.l - 0.10);

  const surface = rgbToHex(hslToRgb({ ...hsl, l: surfaceL }));
  const surfaceHover = rgbToHex(hslToRgb({ ...hsl, l: surfaceHoverL }));
  const border = rgbToHex(hslToRgb({ ...hsl, l: borderL }));
  const borderHover = rgbToHex(hslToRgb({ ...hsl, l: isDark ? borderL + 0.05 : borderL - 0.05 }));

  const text = isDark ? '#EDEDED' : '#171717';
  const text2 = isDark ? '#A3A3A3' : '#5C5C57';
  const textMuted = isDark ? '#858585' : '#70706B';

  return {
    bg: bgHex,
    sidebar: isDark ? rgbToHex(hslToRgb({ ...hsl, l: Math.max(0.02, hsl.l + 0.02) })) : rgbToHex(hslToRgb({ ...hsl, l: Math.min(0.98, hsl.l - 0.02) })),
    surface,
    surfaceHover,
    input: surface,
    overlay: isDark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(0, 0, 0, 0.25)',
    border,
    borderHover,
    divider: border,
    text,
    text2,
    textMuted,
  };
}
