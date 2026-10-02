import { AppTheme, ThemeTokens } from './theme.types';

const MAX_THEME_FILE_SIZE = 2 * 1024 * 1024; // 2MB limit

export interface ValidationResult {
  valid: boolean;
  theme?: AppTheme;
  error?: string;
}

/**
 * Sanitizes SVG string to guarantee zero script injection or remote calls
 */
export function sanitizeSvg(svgContent: string): string {
  if (!svgContent) return '';

  return svgContent
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove foreignObject
    .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
    // Remove event handlers (onclick, onload, onerror, etc.)
    .replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    // Remove javascript: and data:text/html URIs
    .replace(/href\s*=\s*['"]\s*(?:javascript:|data:text\/html)[^'"]*['"]/gi, '')
    .replace(/xlink:href\s*=\s*['"]\s*(?:javascript:|data:text\/html)[^'"]*['"]/gi, '')
    // Remove external network references
    .replace(/https?:\/\/[^\s"'<>]+/gi, '');
}

/**
 * Validates a token set object
 */
function validateTokenSet(tokens: any, label: string): { valid: boolean; error?: string } {
  if (!tokens || typeof tokens !== 'object') {
    return { valid: false, error: `Invalid tokens for ${label}: expected an object.` };
  }

  const requiredFields: (keyof ThemeTokens)[] = [
    'bg', 'sidebar', 'surface', 'surfaceHover', 'input', 'overlay',
    'text', 'text2', 'textMuted', 'onAccent',
    'border', 'borderHover', 'focusRing', 'divider',
    'accent', 'accentHover', 'accentActive', 'accentSoft',
    'success', 'warning', 'danger', 'info',
    'radiusXs', 'radiusSm', 'radiusMd', 'radiusLg', 'radiusDropzone'
  ];

  for (const field of requiredFields) {
    if (typeof tokens[field] !== 'string') {
      return { valid: false, error: `Missing or invalid token in ${label}: "${String(field)}".` };
    }
  }

  return { valid: true };
}

/**
 * Validates and parses raw JSON string into an AppTheme
 */
export function validateThemeJson(jsonString: string): ValidationResult {
  if (!jsonString) {
    return { valid: false, error: 'Empty file contents.' };
  }

  if (new Blob([jsonString]).size > MAX_THEME_FILE_SIZE) {
    return { valid: false, error: 'Theme file exceeds the maximum allowed size of 2MB.' };
  }

  // Check for suspicious remote script or external asset references
  if (/<script\b/i.test(jsonString) || /javascript:/i.test(jsonString)) {
    return { valid: false, error: 'Security violation: Theme file contains forbidden script tags or javascript URI.' };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return { valid: false, error: `Invalid JSON format: ${err?.message || 'Syntax error'}` };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'Theme payload must be a JSON object.' };
  }

  // Check root fields
  if (!parsed.id || typeof parsed.id !== 'string') {
    return { valid: false, error: 'Missing or invalid theme "id".' };
  }
  if (!parsed.name || typeof parsed.name !== 'string') {
    return { valid: false, error: 'Missing or invalid theme "name".' };
  }
  if (parsed.version === undefined || typeof parsed.version !== 'number') {
    return { valid: false, error: 'Missing or invalid theme "version".' };
  }
  if (!['light', 'dark', 'both'].includes(parsed.base)) {
    return { valid: false, error: 'Invalid theme "base": must be "light", "dark", or "both".' };
  }

  // Check tokens
  if (!parsed.tokens || typeof parsed.tokens !== 'object') {
    return { valid: false, error: 'Missing "tokens" definition.' };
  }

  const lightCheck = validateTokenSet(parsed.tokens.light, 'light');
  if (!lightCheck.valid) return lightCheck;

  const darkCheck = validateTokenSet(parsed.tokens.dark, 'dark');
  if (!darkCheck.valid) return darkCheck;

  // Sanitize background assets
  if (parsed.background && typeof parsed.background === 'object') {
    if (parsed.background.imageUrl && typeof parsed.background.imageUrl === 'string') {
      if (/^https?:\/\//i.test(parsed.background.imageUrl)) {
        return { valid: false, error: 'Security violation: Remote background image URLs are not allowed. Use local files only.' };
      }
    }
  }

  // Sanitize custom action icons
  if (parsed.buttons?.customActionIcons && typeof parsed.buttons.customActionIcons === 'object') {
    const cleanIcons: Record<string, string> = {};
    for (const [key, iconVal] of Object.entries(parsed.buttons.customActionIcons)) {
      if (typeof iconVal === 'string') {
        if (/^https?:\/\//i.test(iconVal)) {
          return { valid: false, error: `Security violation: Remote icon URL in "${key}" is forbidden.` };
        }
        cleanIcons[key] = sanitizeSvg(iconVal);
      }
    }
    parsed.buttons.customActionIcons = cleanIcons;
  }

  // Ensure default structures
  const theme: AppTheme = {
    id: String(parsed.id).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
    name: String(parsed.name).trim(),
    version: Number(parsed.version) || 1,
    base: parsed.base,
    isPreset: false,
    tokens: parsed.tokens,
    background: parsed.background || { type: 'solid' },
    buttons: parsed.buttons || {
      preset: 'filled',
      iconMode: 'both',
      iconPosition: 'left',
      iconSize: 16,
      iconPack: 'lucide',
    },
    assets: Array.isArray(parsed.assets) ? parsed.assets : [],
  };

  return { valid: true, theme };
}
