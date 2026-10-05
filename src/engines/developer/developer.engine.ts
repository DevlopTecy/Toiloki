import { EngineResult } from '../../core/types/engine';

export interface CronExplanation {
  human: string;
  nextRuns: string[];
  parts: {
    minute: string;
    hour: string;
    dom: string;
    month: string;
    dow: string;
  };
  isValid: boolean;
}

export class DeveloperEngine {
  /**
   * Explain a cron expression and list next N scheduled runs (supports standard aliases)
   */
  static explainCron(expr: string, nextN: number = 10): EngineResult<CronExplanation> {
    const start = performance.now();
    try {
      const aliasMap: Record<string, string> = {
        '@yearly': '0 0 1 1 *',
        '@annually': '0 0 1 1 *',
        '@monthly': '0 0 1 * *',
        '@weekly': '0 0 * * 0',
        '@daily': '0 0 * * *',
        '@midnight': '0 0 * * *',
        '@hourly': '0 * * * *',
      };

      const normalized = aliasMap[expr.trim().toLowerCase()] || expr.trim();
      const parts = normalized.split(/\s+/);
      if (parts.length !== 5) throw new Error('Cron expression must have 5 fields (minute hour dom month dow)');

      const [minute, hour, dom, month, dow] = parts;

      // Human-readable explanation for common patterns
      const human = DeveloperEngine._describeCron(minute, hour, dom, month, dow);

      // Generate next N runs
      const nextRuns = DeveloperEngine._getNextRuns(normalized, nextN);

      return {
        success: true,
        data: {
          human,
          nextRuns,
          parts: { minute, hour, dom, month, dow },
          isValid: true,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  private static _describeCron(minute: string, hour: string, dom: string, month: string, dow: string): string {
    // Common patterns
    if (minute === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') return 'Every minute';
    if (minute === '0' && hour === '*' && dom === '*' && month === '*' && dow === '*') return 'Every hour (at :00)';
    if (minute === '0' && hour === '0' && dom === '*' && month === '*' && dow === '*') return 'Every day at midnight';
    if (minute === '0' && hour === '12' && dom === '*' && month === '*' && dow === '*') return 'Every day at noon';
    if (minute === '0' && hour === '0' && dom === '*' && month === '*' && dow === '0') return 'Every Sunday at midnight';
    if (minute === '0' && hour === '0' && dom === '1' && month === '*' && dow === '*') return 'First day of every month at midnight';
    if (minute === '0' && hour === '0' && dom === '1' && month === '1' && dow === '*') return 'January 1st at midnight (yearly)';

    const minuteDesc = minute === '*' ? 'every minute' : minute.startsWith('*/') ? `every ${minute.slice(2)} minutes` : `at minute ${minute}`;
    const hourDesc = hour === '*' ? 'every hour' : hour.startsWith('*/') ? `every ${hour.slice(2)} hours` : `at ${hour}:00`;
    const domDesc = dom === '*' ? '' : `on day ${dom} of the month`;
    const monthDesc = month === '*' ? '' : `in month ${month}`;
    const dowDesc = dow === '*' ? '' : `on day ${dow} of the week`;

    const parts = [minuteDesc, hourDesc, domDesc, monthDesc, dowDesc].filter(Boolean);
    return parts.join(', ');
  }

  private static _getNextRuns(expr: string, n: number): string[] {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return [];

    const [minPart, hourPart, domPart, monthPart, dowPart] = parts;

    const parseField = (field: string, max: number, min: number = 0): number[] => {
      if (field === '*') return Array.from({ length: max - min + 1 }, (_, i) => i + min);
      const result: number[] = [];
      for (const part of field.split(',')) {
        if (part.includes('/')) {
          const [range, step] = part.split('/');
          const s = parseInt(step);
          const rangeStart = range === '*' ? min : parseInt(range.split('-')[0]);
          const rangeEnd = range === '*' ? max : (range.includes('-') ? parseInt(range.split('-')[1]) : max);
          for (let i = rangeStart; i <= rangeEnd; i += s) result.push(i);
        } else if (part.includes('-')) {
          const [lo, hi] = part.split('-').map(Number);
          for (let i = lo; i <= hi; i++) result.push(i);
        } else {
          result.push(parseInt(part));
        }
      }
      return [...new Set(result)].sort((a, b) => a - b);
    };

    const validMins = parseField(minPart, 59);
    const validHours = parseField(hourPart, 23);
    const validMonths = parseField(monthPart, 12, 1);
    const validDoms = parseField(domPart, 31, 1);
    const validDows = parseField(dowPart, 6);

    const runs: string[] = [];
    const now = new Date();
    now.setSeconds(0, 0);
    const cursor = new Date(now.getTime() + 60000); // start 1 minute ahead

    let iterations = 0;
    while (runs.length < n && iterations < 50000) {
      iterations++;
      const mo = cursor.getMonth() + 1;
      const d = cursor.getDate();
      const h = cursor.getHours();
      const mi = cursor.getMinutes();
      const dw = cursor.getDay();

      if (
        validMonths.includes(mo) &&
        (domPart === '*' || validDoms.includes(d)) &&
        (dowPart === '*' || validDows.includes(dw)) &&
        validHours.includes(h) &&
        validMins.includes(mi)
      ) {
        runs.push(
          cursor.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        );
        cursor.setMinutes(cursor.getMinutes() + 1);
      } else {
        cursor.setMinutes(cursor.getMinutes() + 1);
      }
    }

    return runs;
  }

  /**
   * Convert px to rem and vice versa
   */
  static convertPxRem(
    value: number,
    direction: 'pxToRem' | 'remToPx',
    baseFontSize: number = 16
  ): EngineResult<{ result: number; formula: string; scale: Array<{ px: number; rem: number }> }> {
    const start = performance.now();
    try {
      if (baseFontSize <= 0) throw new Error('Base font size must be positive');
      if (value < 0) throw new Error('Value cannot be negative');

      const result = direction === 'pxToRem' ? value / baseFontSize : value * baseFontSize;

      // Common scale values
      const scale = [1, 2, 4, 6, 8, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64].map((px) => ({
        px,
        rem: Math.round((px / baseFontSize) * 10000) / 10000,
      }));

      const formula =
        direction === 'pxToRem'
          ? `${value}px ÷ ${baseFontSize}px = ${Math.round(result * 10000) / 10000}rem`
          : `${value}rem × ${baseFontSize}px = ${Math.round(result * 100) / 100}px`;

      return {
        success: true,
        data: { result: Math.round(result * 10000) / 10000, formula, scale },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Parse chmod numeric mode to symbolic and permissions table
   */
  static parseChmod(mode: string): EngineResult<{
    octal: string;
    symbolic: string;
    owner: { read: boolean; write: boolean; execute: boolean };
    group: { read: boolean; write: boolean; execute: boolean };
    others: { read: boolean; write: boolean; execute: boolean };
    bitmask: string;
  }> {
    const start = performance.now();
    try {
      let octal: string;

      // Accept octal (e.g. 755) or symbolic (rwxr-xr-x)
      if (/^[0-7]{1,4}$/.test(mode.trim())) {
        octal = mode.trim().padStart(3, '0').slice(-3);
      } else if (/^[rwx-]{9}$/.test(mode.trim())) {
        // Parse symbolic to octal
        const sym = mode.trim();
        const toOctet = (rwx: string) => {
          return (
            (rwx[0] !== '-' ? 4 : 0) +
            (rwx[1] !== '-' ? 2 : 0) +
            (rwx[2] !== '-' ? 1 : 0)
          );
        };
        octal = `${toOctet(sym.slice(0, 3))}${toOctet(sym.slice(3, 6))}${toOctet(sym.slice(6, 9))}`;
      } else {
        throw new Error('Enter a 3-digit octal (e.g. 755) or 9-char symbolic (e.g. rwxr-xr-x)');
      }

      const bits = octal.split('').map(Number);
      const describe = (bit: number) => ({
        read: !!(bit & 4),
        write: !!(bit & 2),
        execute: !!(bit & 1),
      });

      const toSym = (bit: number) =>
        `${bit & 4 ? 'r' : '-'}${bit & 2 ? 'w' : '-'}${bit & 1 ? 'x' : '-'}`;

      const symbolic = bits.map(toSym).join('');

      return {
        success: true,
        data: {
          octal,
          symbolic,
          owner: describe(bits[0]),
          group: describe(bits[1]),
          others: describe(bits[2]),
          bitmask: parseInt(octal, 8).toString(2).padStart(9, '0'),
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Parse User-Agent string
   */
  static parseUserAgent(ua: string): EngineResult<{
    browser: string;
    os: string;
    device: string;
    engine: string;
    raw: string;
    isMobile: boolean;
  }> {
    const start = performance.now();
    try {
      if (!ua.trim()) throw new Error('User-Agent string is required');
      const raw = ua.trim();

      // Browser detection
      let browser = 'Unknown';
      if (raw.includes('Edg/') || raw.includes('Edge/')) browser = `Edge ${raw.match(/Edg[e]?\/([^\s]+)/)?.[1] || ''}`;
      else if (raw.includes('OPR/') || raw.includes('Opera/')) browser = `Opera ${raw.match(/OPR\/([^\s]+)/)?.[1] || ''}`;
      else if (raw.includes('Chrome/') && !raw.includes('Chromium/')) browser = `Chrome ${raw.match(/Chrome\/([^\s]+)/)?.[1] || ''}`;
      else if (raw.includes('Firefox/')) browser = `Firefox ${raw.match(/Firefox\/([^\s]+)/)?.[1] || ''}`;
      else if (raw.includes('Safari/') && raw.includes('Version/')) browser = `Safari ${raw.match(/Version\/([^\s]+)/)?.[1] || ''}`;

      // OS detection
      let os = 'Unknown';
      if (raw.includes('Windows NT 10')) os = 'Windows 10/11';
      else if (raw.includes('Windows NT 6.3')) os = 'Windows 8.1';
      else if (raw.includes('Windows NT 6.1')) os = 'Windows 7';
      else if (raw.includes('Mac OS X')) os = `macOS ${raw.match(/Mac OS X ([^)]+)/)?.[1]?.replace(/_/g, '.') || ''}`;
      else if (raw.includes('Android')) os = `Android ${raw.match(/Android ([^;)]+)/)?.[1] || ''}`;
      else if (raw.includes('iPhone') || raw.includes('iPad')) os = `iOS ${raw.match(/OS ([^)]+)/)?.[1]?.replace(/_/g, '.') || ''}`;
      else if (raw.includes('Linux')) os = 'Linux';

      // Engine
      let engine = 'Unknown';
      if (raw.includes('Gecko/')) engine = 'Gecko';
      if (raw.includes('AppleWebKit/')) engine = `WebKit ${raw.match(/AppleWebKit\/([^\s]+)/)?.[1] || ''}`;
      if (raw.includes('Blink')) engine = 'Blink';

      // Device
      const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(raw);
      const device = isMobile ? (raw.includes('iPad') ? 'Tablet' : 'Mobile') : 'Desktop';

      return {
        success: true,
        data: { browser: browser.trim(), os: os.trim(), device, engine: engine.trim(), raw, isMobile },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Generate .gitignore content for a given tech stack
   */
  static generateGitignore(technologies: string[]): EngineResult<string> {
    const start = performance.now();
    try {
      const templates: Record<string, string> = {
        node: `# Node.js\nnode_modules/\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n.npm\n.env\n.env.local\n.env.*.local\n`,
        python: `# Python\n__pycache__/\n*.py[cod]\n*$py.class\n*.so\n.Python\nvenv/\nenv/\n.venv\ndist/\nbuild/\n*.egg-info/\n.pytest_cache/\n`,
        react: `# React\nbuild/\ndist/\n.cache/\n.parcel-cache/\n`,
        vite: `# Vite\ndist/\ndist-ssr/\n*.local\n`,
        nextjs: `# Next.js\n.next/\nout/\nbuild/\n`,
        java: `# Java\n*.class\n*.jar\n*.war\n*.ear\ntarget/\n.classpath\n.project\n.settings/\n`,
        dotnet: `# .NET\n*.user\n*.suo\n.vs/\nbin/\nobj/\n*.nupkg\n`,
        macos: `# macOS\n.DS_Store\n.AppleDouble\n.LSOverride\n._*\n.Spotlight-V100\n.Trashes\n`,
        windows: `# Windows\nThumbs.db\nehthumbs.db\nDesktop.ini\n$RECYCLE.BIN/\n`,
        linux: `# Linux\n*~\n.nfs*\n`,
        ide: `# IDEs\n.idea/\n.vscode/\n*.swp\n*.swo\n`,
        docker: `# Docker\n.dockerignore\ndocker-compose.override.yml\n`,
        rust: `# Rust\ntarget/\nCargo.lock\n`,
        go: `# Go\n*.exe\n*.dll\n*.so\n*.dylib\n/vendor/\n`,
        swift: `# Swift\n.build/\nPackage.resolved\n.swiftpm/\n`,
      };

      const sections: string[] = [];
      for (const tech of technologies) {
        const key = tech.toLowerCase();
        if (templates[key]) sections.push(templates[key]);
        else sections.push(`# ${tech}\n# Add your ${tech} ignores here\n`);
      }

      if (sections.length === 0) throw new Error('Please select at least one technology');

      const content = `# .gitignore generated by Toiloki\n# https://toiloki.app\n\n${sections.join('\n')}`;

      return { success: true, data: content, elapsedMs: Math.round(performance.now() - start) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Diff two .env files and report missing keys with secret masking
   */
  static diffEnvFiles(
    env1Content: string,
    env2Content: string,
    label1: string = '.env',
    label2: string = '.env.example',
    options: { maskSecrets?: boolean } = { maskSecrets: true }
  ): EngineResult<{
    missingInFirst: string[];
    missingInSecond: string[];
    commonKeys: string[];
    differing: Array<{ key: string; val1: string; val2: string }>;
  }> {
    const start = performance.now();
    try {
      const isSecretKey = (k: string) =>
        /(secret|password|key|token|auth|credential|cert|private)/i.test(k);

      const parseEnv = (content: string): Map<string, string> => {
        const map = new Map<string, string>();
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx === -1) continue;
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (options.maskSecrets && isSecretKey(key) && val.length > 0) {
            val = '••••••••';
          }
          map.set(key, val);
        }
        return map;
      };

      const map1 = parseEnv(env1Content);
      const map2 = parseEnv(env2Content);

      const keys1 = new Set(map1.keys());
      const keys2 = new Set(map2.keys());

      const missingInFirst = [...keys2].filter((k) => !keys1.has(k));
      const missingInSecond = [...keys1].filter((k) => !keys2.has(k));
      const commonKeys = [...keys1].filter((k) => keys2.has(k));
      const differing = commonKeys
        .filter((k) => map1.get(k) !== map2.get(k))
        .map((k) => ({ key: k, val1: map1.get(k) || '', val2: map2.get(k) || '' }));

      return {
        success: true,
        data: { missingInFirst, missingInSecond, commonKeys, differing },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }
}
