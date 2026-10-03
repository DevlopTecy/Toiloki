import { WorkspaceId } from '../types/workspace';

export interface UtilityPreset {
  id: string;
  utilityId: string;
  name: string;
  description?: string;
  isBuiltin?: boolean;
  createdAt: string;
  values: Record<string, any>;
}

export interface ChainStep {
  utilityId: string;
  utilityName: string;
  workspaceId: WorkspaceId;
  groupId: string;
  presetId?: string;
  presetValues?: Record<string, any>;
}

export interface UtilityChain {
  id: string;
  name: string;
  description: string;
  isBuiltin?: boolean;
  createdAt: string;
  steps: ChainStep[];
}

const PRESETS_STORAGE_KEY = 'toiloki_utility_presets';
const CHAINS_STORAGE_KEY = 'toiloki_utility_chains';

export class PresetsService {
  /**
   * Built-in default presets for high-frequency utilities
   */
  private static readonly BUILTIN_PRESETS: UtilityPreset[] = [
    // JSON Formatter
    {
      id: 'json-2space',
      utilityId: 'format-json-code',
      name: 'Pretty (2 Spaces)',
      description: 'Standard 2-space indentation with preserved key order',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { indent: 2, sortKeys: false },
    },
    {
      id: 'json-4space',
      utilityId: 'format-json-code',
      name: 'Pretty (4 Spaces)',
      description: 'Classical 4-space tab indentation',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { indent: 4, sortKeys: false },
    },
    {
      id: 'json-compact',
      utilityId: 'format-json-code',
      name: 'Compact / Minified',
      description: 'Zero whitespace, single line payload for production',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { indent: 0, sortKeys: false },
    },
    {
      id: 'json-sorted',
      utilityId: 'format-json-code',
      name: 'Alphabetical Sorted Keys',
      description: '2 spaces with recursively sorted object keys',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { indent: 2, sortKeys: true },
    },

    // Image Resize
    {
      id: 'resize-thumb',
      utilityId: 'img-resize',
      name: 'Square Thumbnail (150×150)',
      description: 'Compact preview icon size',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { width: 150, height: 150, maintainAspect: true, unit: 'px' },
    },
    {
      id: 'resize-fhd',
      utilityId: 'img-resize',
      name: 'Full HD (1920×1080)',
      description: 'Standard 1080p desktop/display resolution',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { width: 1920, height: 1080, maintainAspect: true, unit: 'px' },
    },
    {
      id: 'resize-avatar',
      utilityId: 'img-resize',
      name: 'Profile Avatar (400×400)',
      description: 'Square dimensions for user avatars',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { width: 400, height: 400, maintainAspect: true, unit: 'px' },
    },
    {
      id: 'resize-social',
      utilityId: 'img-resize',
      name: 'Social Banner (1200×630)',
      description: 'Standard Open Graph preview size',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { width: 1200, height: 630, maintainAspect: true, unit: 'px' },
    },

    // Image Compress
    {
      id: 'compress-hq',
      utilityId: 'compress-image',
      name: 'High Quality (85%)',
      description: 'Subtle compression with no perceptual loss',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { quality: 85, stripMeta: false },
    },
    {
      id: 'compress-web',
      utilityId: 'compress-image',
      name: 'Balanced Web (70%)',
      description: 'Ideal balance of bandwidth savings and clarity',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { quality: 70, stripMeta: true },
    },
    {
      id: 'compress-max',
      utilityId: 'compress-image',
      name: 'Maximum Reduction (45%)',
      description: 'Aggressive compression for low-bandwidth scenarios',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { quality: 45, stripMeta: true },
    },

    // Compress PDF
    {
      id: 'pdf-screen',
      utilityId: 'compress-pdf',
      name: 'Screen Quality (72 DPI)',
      description: 'Smallest file size for email attachments and web preview',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { dpi: 72, quality: 65 },
    },
    {
      id: 'pdf-ebook',
      utilityId: 'compress-pdf',
      name: 'E-Book / Document (150 DPI)',
      description: 'Sharp text and clean diagrams for reading',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { dpi: 150, quality: 80 },
    },
    {
      id: 'pdf-print',
      utilityId: 'compress-pdf',
      name: 'Print Ready (300 DPI)',
      description: 'High-definition raster graphics for physical printing',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { dpi: 300, quality: 92 },
    },

    // Case Conversion
    {
      id: 'case-camel',
      utilityId: 'case-conversion',
      name: 'camelCase',
      description: 'Standard JavaScript/TypeScript variable casing',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { targetCase: 'camel' },
    },
    {
      id: 'case-snake',
      utilityId: 'case-conversion',
      name: 'snake_case',
      description: 'Standard Python and database column casing',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { targetCase: 'snake' },
    },
    {
      id: 'case-upper',
      utilityId: 'case-conversion',
      name: 'UPPERCASE',
      description: 'All letters capitalized for constants and headers',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      values: { targetCase: 'upper' },
    },
  ];

  /**
   * Built-in multi-step utility execution chains
   */
  private static readonly BUILTIN_CHAINS: UtilityChain[] = [
    {
      id: 'chain-web-image-opt',
      name: 'Web Image Optimizer',
      description: 'Scale down oversized camera images and apply web compression',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      steps: [
        {
          utilityId: 'img-resize',
          utilityName: 'Resize Image',
          workspaceId: 'images',
          groupId: 'img-editor',
          presetId: 'resize-fhd',
        },
        {
          utilityId: 'compress-image',
          utilityName: 'Compress Image',
          workspaceId: 'images',
          groupId: 'img-optimizer',
          presetId: 'compress-web',
        },
      ],
    },
    {
      id: 'chain-dev-token-inspect',
      name: 'Token & Auth Inspector',
      description: 'Decode JWT claims, verify payload structure, and check Base64 parts',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      steps: [
        {
          utilityId: 'dev-jwt',
          utilityName: 'JWT Inspector',
          workspaceId: 'developer',
          groupId: 'dev-encode',
        },
        {
          utilityId: 'dev-base64',
          utilityName: 'Base64 Decoder',
          workspaceId: 'developer',
          groupId: 'dev-encode',
        },
      ],
    },
    {
      id: 'chain-clean-text-pipeline',
      name: 'Text Standardization Pipeline',
      description: 'Normalize case, strip duplicate spaces, and generate word metrics',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      steps: [
        {
          utilityId: 'case-conversion',
          utilityName: 'Case Conversion',
          workspaceId: 'text',
          groupId: 'text-transformer',
        },
        {
          utilityId: 'remove-spaces',
          utilityName: 'Remove Extra Spaces',
          workspaceId: 'text',
          groupId: 'text-cleaner',
        },
        {
          utilityId: 'text-statistics',
          utilityName: 'Text Statistics',
          workspaceId: 'text',
          groupId: 'text-analyzer',
        },
      ],
    },
    {
      id: 'chain-pdf-protect-pack',
      name: 'PDF Compression & Protection',
      description: 'Compress document footprint and enforce user password encryption',
      isBuiltin: true,
      createdAt: '2026-01-01T00:00:00Z',
      steps: [
        {
          utilityId: 'compress-pdf',
          utilityName: 'Compress PDF',
          workspaceId: 'pdf',
          groupId: 'pdf-optimizer',
          presetId: 'pdf-ebook',
        },
        {
          utilityId: 'password-protect',
          utilityName: 'Password Protect PDF',
          workspaceId: 'pdf',
          groupId: 'pdf-security',
        },
      ],
    },
  ];

  // ─── PRESET METHODS ───

  /**
   * Get all presets for a utility (combines built-in + user custom)
   */
  static getPresetsForUtility(utilityId: string): UtilityPreset[] {
    const builtins = this.BUILTIN_PRESETS.filter((p) => p.utilityId === utilityId);
    const custom = this.getCustomPresets().filter((p) => p.utilityId === utilityId);
    return [...builtins, ...custom];
  }

  /**
   * Save a new custom preset for a utility
   */
  static saveCustomPreset(preset: Omit<UtilityPreset, 'id' | 'createdAt' | 'isBuiltin'>): UtilityPreset {
    const custom = this.getCustomPresets();
    const newPreset: UtilityPreset = {
      ...preset,
      id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      isBuiltin: false,
    };

    custom.push(newPreset);
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(custom));
    } catch (err) {
      console.error('Failed to save preset to localStorage:', err);
    }

    return newPreset;
  }

  /**
   * Delete a custom preset by ID
   */
  static deleteCustomPreset(presetId: string): boolean {
    const custom = this.getCustomPresets();
    const filtered = custom.filter((p) => p.id !== presetId);
    if (filtered.length !== custom.length) {
      try {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(filtered));
        return true;
      } catch (err) {
        console.error('Failed to update presets after delete:', err);
      }
    }
    return false;
  }

  private static getCustomPresets(): UtilityPreset[] {
    try {
      const data = localStorage.getItem(PRESETS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // ─── CHAIN METHODS ───

  /**
   * Get all available chains (built-in + user custom)
   */
  static getAllChains(): UtilityChain[] {
    const custom = this.getCustomChains();
    return [...this.BUILTIN_CHAINS, ...custom];
  }

  /**
   * Save a custom utility chain
   */
  static saveCustomChain(chain: Omit<UtilityChain, 'id' | 'createdAt' | 'isBuiltin'>): UtilityChain {
    const custom = this.getCustomChains();
    const newChain: UtilityChain = {
      ...chain,
      id: `chain_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      isBuiltin: false,
    };

    custom.push(newChain);
    try {
      localStorage.setItem(CHAINS_STORAGE_KEY, JSON.stringify(custom));
    } catch (err) {
      console.error('Failed to save chain to localStorage:', err);
    }

    return newChain;
  }

  /**
   * Delete a custom chain by ID
   */
  static deleteCustomChain(chainId: string): boolean {
    const custom = this.getCustomChains();
    const filtered = custom.filter((c) => c.id !== chainId);
    if (filtered.length !== custom.length) {
      try {
        localStorage.setItem(CHAINS_STORAGE_KEY, JSON.stringify(filtered));
        return true;
      } catch (err) {
        console.error('Failed to update chains after delete:', err);
      }
    }
    return false;
  }

  private static getCustomChains(): UtilityChain[] {
    try {
      const data = localStorage.getItem(CHAINS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
