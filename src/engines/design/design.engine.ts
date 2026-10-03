import { EngineResult } from '../../core/types/engine';

export interface RgbColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a?: number; // 0-1
}

export interface HslColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
  a?: number;
}

export interface CmykColor {
  c: number; // 0-100
  m: number; // 0-100
  y: number; // 0-100
  k: number; // 0-100
}

export interface ColorConversionResult {
  hex: string;
  rgb: string;
  hsl: string;
  cmyk: string;
  rgbaValues: RgbColor;
  hslaValues: HslColor;
  cmykValues: CmykColor;
  isDark: boolean;
}

export interface ContrastResult {
  ratio: number;
  score: string; // e.g. "4.5:1"
  wcagAANormal: boolean; // >= 4.5:1
  wcagAALarge: boolean;  // >= 3.0:1
  wcagAAANormal: boolean;// >= 7.0:1
  wcagAAALarge: boolean; // >= 4.5:1
  textColor: string;
  bgColor: string;
}

export class DesignEngine {
  /**
   * Parse any color string (HEX, RGB, HSL) into RGB
   */
  static parseColor(input: string): RgbColor | null {
    const str = input.trim();
    // HEX
    if (str.startsWith('#')) {
      let hex = str.slice(1);
      if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
      if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
          a: 1,
        };
      }
      if (hex.length === 8) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
          a: Math.round((parseInt(hex.slice(6, 8), 16) / 255) * 100) / 100,
        };
      }
    }

    // RGB / RGBA
    const rgbMatch = str.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\)/i);
    if (rgbMatch) {
      return {
        r: Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10))),
        g: Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10))),
        b: Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10))),
        a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
      };
    }

    // HSL / HSLA
    const hslMatch = str.match(/hsla?\((\d+)[,\s]+(\d+)%?[,\s]+(\d+)%?(?:[,\s/]+([\d.]+))?\)/i);
    if (hslMatch) {
      const h = parseInt(hslMatch[1], 10);
      const s = parseInt(hslMatch[2], 10);
      const l = parseInt(hslMatch[3], 10);
      const a = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1;
      return { ...this.hslToRgb({ h, s, l }), a };
    }

    return null;
  }

  static rgbToHex(rgb: RgbColor): string {
    const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  static rgbToHsl(rgb: RgbColor): HslColor {
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
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
      a: rgb.a,
    };
  }

  static hslToRgb(hsl: HslColor): RgbColor {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;
    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
      a: hsl.a,
    };
  }

  static rgbToCmyk(rgb: RgbColor): CmykColor {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const k = 1 - Math.max(r, g, b);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    return {
      c: Math.round(((1 - r - k) / (1 - k)) * 100),
      m: Math.round(((1 - g - k) / (1 - k)) * 100),
      y: Math.round(((1 - b - k) / (1 - k)) * 100),
      k: Math.round(k * 100),
    };
  }

  /**
   * Convert color to all formats
   */
  static convertColor(input: string): EngineResult<ColorConversionResult> {
    const start = performance.now();
    try {
      const rgb = this.parseColor(input);
      if (!rgb) throw new Error(`Invalid color format: "${input}"`);

      const hex = this.rgbToHex(rgb);
      const hsl = this.rgbToHsl(rgb);
      const cmyk = this.rgbToCmyk(rgb);
      const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

      return {
        success: true,
        data: {
          hex,
          rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
          cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
          rgbaValues: rgb,
          hslaValues: hsl,
          cmykValues: cmyk,
          isDark: luminance < 0.5,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Calculate WCAG 2.1 relative luminance
   */
  private static relativeLuminance(rgb: RgbColor): number {
    const a = [rgb.r, rgb.g, rgb.b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  /**
   * Calculate WCAG contrast ratio between text and background
   */
  static checkContrast(textColor: string, bgColor: string): EngineResult<ContrastResult> {
    const start = performance.now();
    try {
      const fg = this.parseColor(textColor);
      const bg = this.parseColor(bgColor);
      if (!fg || !bg) throw new Error('Invalid color input');

      const l1 = this.relativeLuminance(fg);
      const l2 = this.relativeLuminance(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const rounded = Math.round(ratio * 100) / 100;

      return {
        success: true,
        data: {
          ratio: rounded,
          score: `${rounded.toFixed(2)}:1`,
          wcagAANormal: rounded >= 4.5,
          wcagAALarge: rounded >= 3.0,
          wcagAAANormal: rounded >= 7.0,
          wcagAAALarge: rounded >= 4.5,
          textColor,
          bgColor,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Generate harmonic color palettes
   */
  static generatePalette(
    baseColor: string,
    harmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'shades'
  ): EngineResult<string[]> {
    const start = performance.now();
    try {
      const rgb = this.parseColor(baseColor);
      if (!rgb) throw new Error('Invalid base color');
      const hsl = this.rgbToHsl(rgb);

      const colors: string[] = [];

      switch (harmony) {
        case 'complementary': {
          colors.push(this.rgbToHex(rgb));
          colors.push(this.rgbToHex(this.hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 })));
          colors.push(this.rgbToHex(this.hslToRgb({ ...hsl, l: Math.min(90, hsl.l + 20) })));
          colors.push(this.rgbToHex(this.hslToRgb({ ...hsl, h: (hsl.h + 180) % 360, l: Math.max(15, hsl.l - 20) })));
          break;
        }
        case 'analogous': {
          [-30, -15, 0, 15, 30].forEach((shift) => {
            const h = (hsl.h + shift + 360) % 360;
            colors.push(this.rgbToHex(this.hslToRgb({ ...hsl, h })));
          });
          break;
        }
        case 'triadic': {
          [0, 120, 240].forEach((shift) => {
            const h = (hsl.h + shift) % 360;
            colors.push(this.rgbToHex(this.hslToRgb({ ...hsl, h })));
          });
          break;
        }
        case 'tetradic': {
          [0, 90, 180, 270].forEach((shift) => {
            const h = (hsl.h + shift) % 360;
            colors.push(this.rgbToHex(this.hslToRgb({ ...hsl, h })));
          });
          break;
        }
        case 'monochromatic': {
          [15, 30, 50, 70, 85].forEach((l) => {
            colors.push(this.rgbToHex(this.hslToRgb({ ...hsl, l })));
          });
          break;
        }
        case 'shades': {
          [10, 25, 40, 55, 70, 85, 95].forEach((l) => {
            colors.push(this.rgbToHex(this.hslToRgb({ ...hsl, l })));
          });
          break;
        }
      }

      return {
        success: true,
        data: colors,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Simulate color vision deficiency
   */
  static simulateColorBlindness(
    hexColor: string,
    type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'
  ): EngineResult<{ original: string; simulated: string; type: string }> {
    const start = performance.now();
    try {
      const rgb = this.parseColor(hexColor);
      if (!rgb) throw new Error('Invalid color');

      let r = rgb.r / 255;
      let g = rgb.g / 255;
      let b = rgb.b / 255;

      let simR = r;
      let simG = g;
      let simB = b;

      switch (type) {
        case 'protanopia': // Red-blind
          simR = 0.56667 * r + 0.43333 * g;
          simG = 0.55833 * r + 0.44167 * g;
          simB = 0.24167 * g + 0.75833 * b;
          break;
        case 'deuteranopia': // Green-blind
          simR = 0.625 * r + 0.375 * g;
          simG = 0.7 * r + 0.3 * g;
          simB = 0.3 * g + 0.7 * b;
          break;
        case 'tritanopia': // Blue-blind
          simR = 0.95 * r + 0.05 * g;
          simG = 0.43333 * g + 0.56667 * b;
          simB = 0.475 * g + 0.525 * b;
          break;
        case 'achromatopsia': // Total color blindness (monochrome)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          simR = simG = simB = gray;
          break;
      }

      const outHex = this.rgbToHex({
        r: Math.min(255, Math.max(0, Math.round(simR * 255))),
        g: Math.min(255, Math.max(0, Math.round(simG * 255))),
        b: Math.min(255, Math.max(0, Math.round(simB * 255))),
      });

      return {
        success: true,
        data: { original: hexColor, simulated: outHex, type },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Generate smooth multi-layered CSS box shadow
   */
  static generateCssShadow(
    layers: number = 4,
    color: string = 'rgba(0,0,0,0.12)',
    spread: number = 20
  ): EngineResult<{ cssSnippet: string; layersList: string[] }> {
    const start = performance.now();
    try {
      const layersList: string[] = [];
      for (let i = 1; i <= layers; i++) {
        const factor = i / layers;
        const y = Math.round(factor * spread);
        const blur = Math.round(factor * spread * 2);
        layersList.push(`0px ${y}px ${blur}px ${color}`);
      }
      const cssSnippet = `box-shadow:\n  ${layersList.join(',\n  ')};`;

      return {
        success: true,
        data: { cssSnippet, layersList },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Calculate harmonic modular type scale
   */
  static calculateTypeScale(
    basePx: number = 16,
    ratio: number = 1.25 // Major Third = 1.25, Perfect Fourth = 1.333, Golden = 1.618
  ): EngineResult<Array<{ step: number; px: number; rem: number; label: string }>> {
    const start = performance.now();
    try {
      const labels = ['sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
      const results = [];
      const steps = [-1, 0, 1, 2, 3, 4, 5, 6, 7];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const px = Math.round(basePx * Math.pow(ratio, step) * 100) / 100;
        const rem = Math.round((px / basePx) * 1000) / 1000;
        results.push({
          step,
          px,
          rem,
          label: labels[i] || `step-${step}`,
        });
      }

      return {
        success: true,
        data: results,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Minify and optimize SVG markup
   */
  static optimizeSvg(svgContent: string): EngineResult<{ optimized: string; originalSize: number; newSize: number; savedPercent: number }> {
    const start = performance.now();
    try {
      const origSize = new TextEncoder().encode(svgContent).length;
      let opt = svgContent
        // Remove XML declaration and DOCTYPE
        .replace(/<\?xml[^>]*\?>/gi, '')
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        // Remove HTML comments
        .replace(/<!--[\s\S]*?-->/g, '')
        // Remove redundant metadata & editor tags (inkscape, sodipodi, sketch, etc.)
        .replace(/<(?:metadata|inkscape|sodipodi)[^>]*>[\s\S]*?<\/(?:metadata|inkscape|sodipodi)[^>]*>/gi, '')
        .replace(/\s+(?:inkscape|sodipodi|xmlns:inkscape|xmlns:sodipodi):[a-z0-9_-]+="[^"]*"/gi, '')
        // Remove empty attributes
        .replace(/\s+[a-z0-9_-]+=""/gi, '')
        // Collapse whitespace
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();

      const newSize = new TextEncoder().encode(opt).length;
      const savedPercent = Math.max(0, Math.round(((origSize - newSize) / origSize) * 100));

      return {
        success: true,
        data: { optimized: opt, originalSize: origSize, newSize, savedPercent },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Export design tokens to various formats (CSS variables, SCSS, JSON, Tailwind)
   */
  static exportTokens(
    tokens: Record<string, string>,
    format: 'css' | 'scss' | 'json' | 'tailwind'
  ): EngineResult<string> {
    const start = performance.now();
    try {
      let output = '';
      switch (format) {
        case 'css':
          output = ':root {\n' + Object.entries(tokens).map(([k, v]) => `  --${k}: ${v};`).join('\n') + '\n}';
          break;
        case 'scss':
          output = Object.entries(tokens).map(([k, v]) => `$${k}: ${v};`).join('\n');
          break;
        case 'json':
          output = JSON.stringify(tokens, null, 2);
          break;
        case 'tailwind':
          output = 'module.exports = {\n  theme: {\n    extend: {\n      colors: ' + JSON.stringify(tokens, null, 6).slice(0, -1) + '    }\n  }\n};';
          break;
      }

      return {
        success: true,
        data: output,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }
}
