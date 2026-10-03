import { EngineResult } from '../../core/types/engine';

export interface SystemInfo {
  platform: string;
  osName: string;
  architecture: string;
  logicalCores: number;
  memoryEstimateGb: number;
  screenResolution: string;
  colorDepth: number;
  pixelRatio: number;
  language: string;
  timezone: string;
  userAgent: string;
  online: boolean;
  timestamp: string;
}

export interface EnvVarItem {
  key: string;
  value: string;
  comment?: string;
  isSecret: boolean;
}

export interface HostsEntry {
  ip: string;
  host: string;
  comment?: string;
  enabled: boolean;
}

export class SystemEngine {
  /**
   * Gather offline local system environment parameters
   */
  static getSystemInfo(): EngineResult<SystemInfo> {
    const start = performance.now();
    try {
      const nav = typeof navigator !== 'undefined' ? navigator : ({} as any);
      const scr = typeof screen !== 'undefined' ? screen : ({} as any);

      // Estimate RAM in GB
      const memoryEstimateGb = (nav as any).deviceMemory || 8;
      const logicalCores = nav.hardwareConcurrency || 4;

      const ua = nav.userAgent || '';
      let osName = 'Windows';
      if (/Macintosh|Mac OS X/i.test(ua)) osName = 'macOS';
      else if (/Linux/i.test(ua)) osName = 'Linux';
      else if (/Windows NT 10.0/i.test(ua)) osName = 'Windows 10/11';

      const info: SystemInfo = {
        platform: nav.platform || 'Win32',
        osName,
        architecture: ua.includes('x64') || ua.includes('Win64') ? 'x64 (64-bit)' : 'x86 (32-bit)',
        logicalCores,
        memoryEstimateGb,
        screenResolution: `${scr.width || 1920} × ${scr.height || 1080}`,
        colorDepth: scr.colorDepth || 24,
        pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
        language: nav.language || 'en-US',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        userAgent: ua,
        online: nav.onLine !== undefined ? nav.onLine : true,
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        data: info,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Parse .env environment file contents
   */
  static parseEnv(content: string): EngineResult<EnvVarItem[]> {
    const start = performance.now();
    try {
      const lines = content.split(/\r?\n/);
      const items: EnvVarItem[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;

        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();

        // Check if value is wrapped in quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        const isSecret = /secret|password|key|token|auth|pwd|hash|private/i.test(key);
        items.push({ key, value, isSecret });
      }

      return {
        success: true,
        data: items,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Parse Windows/Unix /etc/hosts file format
   */
  static parseHostsFile(content: string): EngineResult<HostsEntry[]> {
    const start = performance.now();
    try {
      const lines = content.split(/\r?\n/);
      const entries: HostsEntry[] = [];

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const isCommented = line.startsWith('#');
        const clean = isCommented ? line.replace(/^#+\s*/, '') : line;

        const parts = clean.split(/\s+/);
        if (parts.length >= 2 && /^[\d.:a-fA-F]+$/.test(parts[0])) {
          entries.push({
            ip: parts[0],
            host: parts[1],
            comment: parts.slice(2).join(' ') || undefined,
            enabled: !isCommented,
          });
        }
      }

      return {
        success: true,
        data: entries,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Generate simulated disk storage tree for file lists
   */
  static formatStorageTree(files: Array<{ path: string; size: number }>): EngineResult<string> {
    const start = performance.now();
    try {
      // Build directory hierarchy
      const tree: Record<string, any> = {};

      files.forEach((f) => {
        const parts = f.path.split(/[/\\]/);
        let curr = tree;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (i === parts.length - 1) {
            curr[part] = f.size;
          } else {
            curr[part] = curr[part] || {};
            curr = curr[part];
          }
        }
      });

      const formatNode = (node: any, prefix: string = ''): string[] => {
        const lines: string[] = [];
        const keys = Object.keys(node);
        keys.forEach((key, idx) => {
          const isLast = idx === keys.length - 1;
          const branch = isLast ? '└── ' : '├── ';
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');

          if (typeof node[key] === 'number') {
            const sizeStr = (node[key] / 1024).toFixed(1) + ' KB';
            lines.push(`${prefix}${branch}${key} (${sizeStr})`);
          } else {
            lines.push(`${prefix}${branch}${key}/`);
            lines.push(...formatNode(node[key], nextPrefix));
          }
        });
        return lines;
      };

      const treeStr = formatNode(tree).join('\n');
      return {
        success: true,
        data: treeStr,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }
}
