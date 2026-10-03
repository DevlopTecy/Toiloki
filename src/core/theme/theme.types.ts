export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeTokens {
  // Backgrounds
  bg: string;
  sidebar: string;
  surface: string;
  surfaceHover: string;
  input: string;
  overlay: string;

  // Text
  text: string;
  text2: string;
  textMuted: string;
  link?: string;
  onAccent: string;
  dangerText?: string;
  successText?: string;

  // Borders
  border: string;
  borderHover: string;
  focusRing: string;
  divider: string;
  borderWidth?: '0px' | '1px' | '2px';
  borderStyle?: 'solid' | 'dashed';

  // Accent
  accent: string;
  accentHover: string;
  accentActive: string;
  accentSoft: string;

  // Status
  success: string;
  warning: string;
  danger: string;
  info: string;

  // Shape and Depth
  radiusScale?: 'sharp' | 'default' | 'round';
  radiusXs: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusDropzone: string;
  shadowStrength?: 'none' | 'soft' | 'medium';
  surfaceOpacity?: number; // 0.5 to 1.0 (for translucent themes)
  backdropBlur?: string;   // e.g. '0px', '16px', '24px' (max 24px)

  // Typography Overrides
  fontSans?: string;
  fontMono?: string;
  fontSizeScale?: '90%' | '100%' | '110%' | '125%';
  headingWeight?: '500' | '600' | '700';
}

export type BackgroundType = 'solid' | 'pattern' | 'image' | 'material';
export type PatternType = 'dots' | 'grid' | 'noise';
export type ImageFit = 'cover' | 'contain' | 'tile';
export type ApplyBackgroundTo = 'window' | 'workspace' | 'sidebar';

export interface ThemeBackground {
  type: BackgroundType;
  patternType?: PatternType;
  imageUrl?: string;        // toiloki-bg://filename (served by custom protocol from appData/backgrounds/)
  imageFileName?: string;   // Base filename in appData/backgrounds/ for removal
  imageFit?: ImageFit;
  imagePosition?: string;   // e.g. 'center', 'top left'
  imageBlur?: number;       // 0 to 20px
  imageDim?: number;        // 0 to 80%
  applyTo?: ApplyBackgroundTo;
  scrimOpacity?: number;    // Mandatory >= 85% unless Translucent theme
  categoryOverrides?: Record<string, Partial<ThemeBackground>>; // Per-category overrides
}

export type ButtonPresetStyle = 'filled' | 'soft' | 'outline' | 'ghost' | 'pill' | 'square';
export type ButtonIconMode = 'both' | 'icon-only' | 'label-only';
export type ButtonIconPack = 'lucide' | 'lucide-filled';
export type ButtonCardStyle = 'flat' | 'image';

export interface CardPictureConfig {
  assetId?: string; // local asset key, content hash or data URL
  position?: 'left' | 'center' | 'right';
  scale?: number;   // 1.0 to 1.5
  opacity?: number; // 0.1 to 1.0 (10-100%)
  scrim?: number;   // 0.6 to 1.0 (60-100%)
  tint?: boolean;   // 8-12% overlay of category color
}

export interface ButtonVariantStyle {
  background?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: string;
  radius?: string;
  height?: string;
  shadow?: string;
  hoverBehavior?: 'lighten' | 'darken' | 'tint';
}

export interface ThemeButtons {
  preset: ButtonPresetStyle;
  cardStyle?: ButtonCardStyle; // 'flat' (default) | 'image'
  iconMode: ButtonIconMode;
  iconPosition: 'left' | 'right';
  iconSize: 14 | 16 | 18 | 20;
  iconPack: ButtonIconPack;
  customActionIcons?: Record<string, string>; // actionId -> SVG string or local data URL
  primaryButtonSkin?: string;                 // local image data URL
  toolCardImages?: Record<string, string>;    // moduleId -> image data URL
  pictures?: Record<string, CardPictureConfig>; // cardId -> picture customization
  heroBannerImage?: string;                   // optional hero banner image
  enableButtonSkins?: boolean;                // enable skin pictures on primary buttons
  variants?: {
    primary?: ButtonVariantStyle;
    secondary?: ButtonVariantStyle;
    ghost?: ButtonVariantStyle;
  };
}

export interface AppTheme {
  id: string;
  name: string;
  version: number;
  base: 'light' | 'dark' | 'both';
  isPreset?: boolean;
  tokens: {
    light: ThemeTokens;
    dark: ThemeTokens;
  };
  background: ThemeBackground;
  buttons: ThemeButtons;
  assets: string[]; // local content hashes / asset keys
}

export interface ContrastResult {
  ratio: number;
  score: 'AAA' | 'AA' | 'AA-large' | 'FAIL';
  isAccessible: boolean;
  isLargeAccessible: boolean;
  textColor: string;
  bgColor: string;
}

export interface AccentPreset {
  id: string;
  name: string;
  lightHex: string;
  darkHex: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'orange', name: 'Orange', lightHex: '#E8890C', darkHex: '#F5A524' },
  { id: 'blue', name: 'Blue', lightHex: '#2563EB', darkHex: '#3B82F6' },
  { id: 'teal', name: 'Teal', lightHex: '#0D9488', darkHex: '#14B8A6' },
  { id: 'green', name: 'Green', lightHex: '#16A34A', darkHex: '#22C55E' },
  { id: 'violet', name: 'Violet', lightHex: '#7C3AED', darkHex: '#8B5CF6' },
  { id: 'pink', name: 'Pink', lightHex: '#DB2777', darkHex: '#EC4899' },
  { id: 'red', name: 'Red', lightHex: '#DC2626', darkHex: '#EF4444' },
  { id: 'neutral', name: 'Neutral', lightHex: '#525252', darkHex: '#737373' },
];

