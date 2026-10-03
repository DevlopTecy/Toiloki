import { EngineResult } from '../../core/types/engine';

export interface HashResult {
  algorithm: string;
  hex: string;
  base64: string;
  input: string;
}

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  exclude: string;
  ambiguous: boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0-4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  entropy: number;
  suggestions: string[];
  crackTime: string;
}

export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
}

export class SecurityEngine {
  // A built-in wordlist (200 common words) for passphrase generation
  private static readonly WORDLIST = [
    'apple','bridge','cloud','dragon','eagle','forest','garden','harbor','island','jungle',
    'kitten','lemon','mango','north','ocean','palace','queen','river','silver','tiger',
    'ultra','valley','winter','yellow','zombie','bright','castle','dance','engine','flame',
    'grass','honey','image','jelly','kneel','lucky','magic','night','orbit','peace',
    'quick','radar','storm','trust','unity','voice','water','xenon','yacht','zebra',
    'amber','blaze','coral','drift','earth','faith','giant','heart','inner','jewel',
    'karma','lunar','maple','nerve','ozone','pilot','quest','ridge','solar','tower',
    'urban','vivid','wheat','xylem','youth','azure','blend','crisp','depth','ember',
    'flint','grace','haste','inlet','joint','krill','laser','merit','novel','olive',
    'phase','quota','radar','scent','tempo','ultra','vapor','waste','xenon','yield',
    'agile','blank','charm','delta','elite','flock','gleam','hedge','index','joust',
    'knave','lance','mirth','nudge','onset','plumb','quill','raven','shrine','token',
    'umbra','visor','whorl','xerox','yearn','abyss','braid','cleft','dowel','eerie',
    'frond','groan','helix','irony','knack','lapel','manor','notch','optic','prism',
    'quirk','rivet','swath','trout','unset','verge','wafer','xylem','yodel','zonal',
    'adorn','brisk','civic','dwarf','exert','finch','gavel','hover','impel','joker',
    'kudos','latch','mourn','notch','ovoid','prowl','quaff','robin','snare','theft',
  ];

  /**
   * Compute a hash digest of text using Web Crypto API
   * Supports: SHA-1, SHA-256, SHA-384, SHA-512
   */
  static async hashText(
    text: string,
    algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256',
    hmacSecret?: string
  ): Promise<EngineResult<HashResult>> {
    const start = performance.now();
    try {
      if (!text && !hmacSecret) throw new Error('Input text is required');

      const encoder = new TextEncoder();
      let digest: ArrayBuffer;

      if (hmacSecret) {
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          encoder.encode(hmacSecret),
          { name: 'HMAC', hash: algorithm },
          false,
          ['sign']
        );
        digest = await crypto.subtle.sign('HMAC', keyMaterial, encoder.encode(text));
      } else {
        digest = await crypto.subtle.digest(algorithm, encoder.encode(text));
      }

      const hashArray = new Uint8Array(digest);
      const hex = Array.from(hashArray)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const base64 = btoa(String.fromCharCode(...hashArray));

      return {
        success: true,
        data: { algorithm, hex, base64, input: text },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Compute hash digest of a file buffer
   */
  static async hashFile(
    buffer: Uint8Array,
    algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
  ): Promise<EngineResult<HashResult>> {
    const start = performance.now();
    try {
      const digest = await crypto.subtle.digest(algorithm, buffer);
      const hashArray = new Uint8Array(digest);
      const hex = Array.from(hashArray)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const base64 = btoa(String.fromCharCode(...hashArray));

      return {
        success: true,
        data: { algorithm, hex, base64, input: `[file, ${buffer.length} bytes]` },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Generate a cryptographically random password
   */
  static generatePassword(options: Partial<PasswordOptions> = {}): EngineResult<string> {
    const start = performance.now();
    try {
      const opts: PasswordOptions = {
        length: options.length ?? 16,
        uppercase: options.uppercase ?? true,
        lowercase: options.lowercase ?? true,
        numbers: options.numbers ?? true,
        symbols: options.symbols ?? true,
        exclude: options.exclude ?? '',
        ambiguous: options.ambiguous ?? true,
      };

      if (opts.length < 4 || opts.length > 256) throw new Error('Length must be between 4 and 256');
      if (!opts.uppercase && !opts.lowercase && !opts.numbers && !opts.symbols) {
        throw new Error('At least one character set must be selected');
      }

      let charset = '';
      if (opts.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
      if (opts.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (opts.numbers) charset += '0123456789';
      if (opts.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

      if (!opts.ambiguous) {
        // Remove ambiguous chars: O, 0, I, l, 1
        charset = charset.replace(/[O0Il1]/g, '');
      }

      // Remove user-excluded characters
      for (const ch of opts.exclude) {
        charset = charset.replace(ch, '');
      }

      if (charset.length === 0) throw new Error('No characters available after exclusions');

      // Generate using crypto.getRandomValues for cryptographic quality
      const randomBytes = crypto.getRandomValues(new Uint8Array(opts.length * 2));
      let password = '';
      let i = 0;

      while (password.length < opts.length && i < randomBytes.length) {
        const idx = randomBytes[i] % charset.length;
        password += charset[idx];
        i++;
      }

      // If we ran out of bytes, fill the rest
      while (password.length < opts.length) {
        const extra = crypto.getRandomValues(new Uint8Array(opts.length));
        for (const b of extra) {
          if (password.length >= opts.length) break;
          password += charset[b % charset.length];
        }
      }

      return { success: true, data: password, elapsedMs: Math.round(performance.now() - start) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Generate a cryptographically random passphrase
   */
  static generatePassphrase(options: Partial<PassphraseOptions> = {}): EngineResult<string> {
    const start = performance.now();
    try {
      const opts: PassphraseOptions = {
        wordCount: options.wordCount ?? 4,
        separator: options.separator ?? '-',
        capitalize: options.capitalize ?? true,
        includeNumber: options.includeNumber ?? false,
      };

      if (opts.wordCount < 2 || opts.wordCount > 10) throw new Error('Word count must be between 2 and 10');

      const randomBytes = crypto.getRandomValues(new Uint8Array(opts.wordCount));
      const words = Array.from(randomBytes).map((b) => {
        const word = SecurityEngine.WORDLIST[b % SecurityEngine.WORDLIST.length];
        return opts.capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
      });

      if (opts.includeNumber) {
        const numBytes = crypto.getRandomValues(new Uint8Array(1));
        words.push(String(numBytes[0] % 100));
      }

      return {
        success: true,
        data: words.join(opts.separator),
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Estimate password strength (entropy-based)
   */
  static checkPasswordStrength(password: string): EngineResult<PasswordStrengthResult> {
    const start = performance.now();
    try {
      if (!password) throw new Error('Password is required');

      let poolSize = 0;
      if (/[a-z]/.test(password)) poolSize += 26;
      if (/[A-Z]/.test(password)) poolSize += 26;
      if (/[0-9]/.test(password)) poolSize += 10;
      if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

      const entropy = Math.log2(Math.pow(poolSize || 1, password.length));

      let score: 0 | 1 | 2 | 3 | 4;
      let label: PasswordStrengthResult['label'];

      if (entropy < 28) { score = 0; label = 'Very Weak'; }
      else if (entropy < 36) { score = 1; label = 'Weak'; }
      else if (entropy < 60) { score = 2; label = 'Fair'; }
      else if (entropy < 80) { score = 3; label = 'Strong'; }
      else { score = 4; label = 'Very Strong'; }

      // Crack time estimate (assuming 10^12 hashes/second for offline PBKDF2)
      const combinations = Math.pow(poolSize || 1, password.length);
      const secondsToCrack = combinations / (2 * 1e6); // 1M hashes/sec (conservative)
      let crackTime: string;
      if (secondsToCrack < 1) crackTime = 'Instantly';
      else if (secondsToCrack < 60) crackTime = `${Math.round(secondsToCrack)} seconds`;
      else if (secondsToCrack < 3600) crackTime = `${Math.round(secondsToCrack / 60)} minutes`;
      else if (secondsToCrack < 86400) crackTime = `${Math.round(secondsToCrack / 3600)} hours`;
      else if (secondsToCrack < 2592000) crackTime = `${Math.round(secondsToCrack / 86400)} days`;
      else if (secondsToCrack < 31536000) crackTime = `${Math.round(secondsToCrack / 2592000)} months`;
      else if (secondsToCrack < 3153600000) crackTime = `${Math.round(secondsToCrack / 31536000)} years`;
      else crackTime = 'Centuries+';

      const suggestions: string[] = [];
      if (password.length < 12) suggestions.push('Use at least 12 characters');
      if (!/[A-Z]/.test(password)) suggestions.push('Add uppercase letters');
      if (!/[a-z]/.test(password)) suggestions.push('Add lowercase letters');
      if (!/[0-9]/.test(password)) suggestions.push('Add numbers');
      if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('Add special characters');
      if (/(.)\1{2,}/.test(password)) suggestions.push('Avoid repeated characters');
      if (/^(password|qwerty|123456|letmein|welcome)/i.test(password)) suggestions.push('Avoid common passwords');

      return {
        success: true,
        data: { score, label, entropy: Math.round(entropy * 10) / 10, suggestions, crackTime },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Generate a TOTP code (offline, RFC 6238)
   * NOTE: This is display-only. Never store or transmit secrets.
   */
  static async generateTOTP(
    secret: string,
    digits: number = 6,
    period: number = 30
  ): Promise<EngineResult<{ code: string; secondsRemaining: number; validUntil: string }>> {
    const start = performance.now();
    try {
      // Decode Base32 secret
      const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const cleanSecret = secret.toUpperCase().replace(/\s+/g, '').replace(/=/g, '');
      let bits = '';
      for (const ch of cleanSecret) {
        const idx = base32Chars.indexOf(ch);
        if (idx === -1) throw new Error(`Invalid Base32 character: ${ch}`);
        bits += idx.toString(2).padStart(5, '0');
      }
      const bytes = new Uint8Array(Math.floor(bits.length / 8));
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
      }

      // TOTP counter
      const epoch = Math.floor(Date.now() / 1000);
      const counter = Math.floor(epoch / period);
      const secondsRemaining = period - (epoch % period);

      // HMAC-SHA1
      const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
      const counterBytes = new Uint8Array(8);
      let c = counter;
      for (let i = 7; i >= 0; i--) {
        counterBytes[i] = c & 0xff;
        c >>= 8;
      }
      const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBytes));

      // Dynamic truncation
      const offset = hmac[19] & 0xf;
      const code =
        (((hmac[offset] & 0x7f) << 24) |
          ((hmac[offset + 1] & 0xff) << 16) |
          ((hmac[offset + 2] & 0xff) << 8) |
          (hmac[offset + 3] & 0xff)) %
        Math.pow(10, digits);

      const validUntil = new Date((counter + 1) * period * 1000).toLocaleTimeString();

      return {
        success: true,
        data: {
          code: String(code).padStart(digits, '0'),
          secondsRemaining,
          validUntil,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Verify a checksum against a file buffer
   */
  static async verifyChecksum(
    buffer: Uint8Array,
    expectedHash: string,
    algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
  ): Promise<EngineResult<{ match: boolean; actualHash: string; expectedHash: string }>> {
    const start = performance.now();
    try {
      const res = await SecurityEngine.hashFile(buffer, algorithm);
      if (!res.success || !res.data) throw new Error(res.error);

      const actual = res.data.hex.toLowerCase();
      const expected = expectedHash.trim().toLowerCase();

      return {
        success: true,
        data: { match: actual === expected, actualHash: actual, expectedHash: expected },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Redact sensitive patterns from text
   */
  static redactText(
    text: string,
    options: {
      maskEmails?: boolean;
      maskPhones?: boolean;
      maskSSN?: boolean;
      maskCreditCards?: boolean;
      maskIPs?: boolean;
      customPatterns?: string[];
      maskStyle?: 'asterisk' | 'hash' | 'label';
    }
  ): EngineResult<{ redacted: string; redactionCount: number; patterns: string[] }> {
    const start = performance.now();
    try {
      let result = text;
      let count = 0;
      const appliedPatterns: string[] = [];

      const mask = (match: string, label: string) => {
        count++;
        if (options.maskStyle === 'hash') return '#'.repeat(match.length);
        if (options.maskStyle === 'label') return `[${label}]`;
        return '*'.repeat(match.length);
      };

      if (options.maskEmails !== false) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const before = result;
        result = result.replace(emailRegex, (m) => mask(m, 'EMAIL'));
        if (result !== before) appliedPatterns.push('Email addresses');
      }

      if (options.maskPhones !== false) {
        const phoneRegex = /(\+?[\d]{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const before = result;
        result = result.replace(phoneRegex, (m) => mask(m, 'PHONE'));
        if (result !== before) appliedPatterns.push('Phone numbers');
      }

      if (options.maskSSN) {
        const ssnRegex = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g;
        const before = result;
        result = result.replace(ssnRegex, (m) => mask(m, 'SSN'));
        if (result !== before) appliedPatterns.push('SSN');
      }

      if (options.maskCreditCards) {
        const ccRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
        const before = result;
        result = result.replace(ccRegex, (m) => mask(m, 'CARD'));
        if (result !== before) appliedPatterns.push('Credit card numbers');
      }

      if (options.maskIPs) {
        const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
        const before = result;
        result = result.replace(ipRegex, (m) => mask(m, 'IP'));
        if (result !== before) appliedPatterns.push('IP addresses');
      }

      if (options.customPatterns) {
        for (const pattern of options.customPatterns) {
          try {
            const regex = new RegExp(pattern, 'g');
            const before = result;
            result = result.replace(regex, (m) => mask(m, 'REDACTED'));
            if (result !== before) appliedPatterns.push(`Custom: ${pattern}`);
          } catch {
            // Invalid regex, skip
          }
        }
      }

      return {
        success: true,
        data: { redacted: result, redactionCount: count, patterns: appliedPatterns },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Scrub metadata from a file (returns a clean copy with metadata fields zeroed)
   * This is a best-effort approach for text-based formats
   */
  static scrubTextMetadata(content: string, format: 'json' | 'yaml' | 'xml' | 'plain'): EngineResult<string> {
    const start = performance.now();
    try {
      if (!content.trim()) throw new Error('Content is required');

      let cleaned = content;

      if (format === 'json') {
        const parsed = JSON.parse(content);
        // Remove common metadata keys
        const metaKeys = ['author', 'creator', 'created', 'modified', 'lastModified', 'createdAt', 'updatedAt',
          'createdBy', 'modifiedBy', 'metadata', '_metadata', 'version', 'revision'];
        const strip = (obj: unknown): unknown => {
          if (Array.isArray(obj)) return obj.map(strip);
          if (obj && typeof obj === 'object') {
            const result: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
              if (!metaKeys.some((mk) => mk.toLowerCase() === k.toLowerCase())) {
                result[k] = strip(v);
              }
            }
            return result;
          }
          return obj;
        };
        cleaned = JSON.stringify(strip(parsed), null, 2);
      } else if (format === 'xml') {
        // Remove common XML metadata tags
        cleaned = content
          .replace(/<dc:creator>.*?<\/dc:creator>/gs, '')
          .replace(/<dc:date>.*?<\/dc:date>/gs, '')
          .replace(/<meta[^>]*author[^>]*>/gi, '')
          .replace(/<!-- Generated by.*?-->/gs, '')
          .replace(/<!-- Created.*?-->/gs, '');
      }

      return { success: true, data: cleaned, elapsedMs: Math.round(performance.now() - start) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }
}
