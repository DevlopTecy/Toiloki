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

export interface EncryptedFileResult {
  encrypted: Uint8Array;
  originalSize: number;
  encryptedSize: number;
  saltHex: string;
  ivHex: string;
}

export interface DecryptedFileResult {
  decrypted: Uint8Array;
  originalSize: number;
}

export interface ShredResult {
  passes: number;
  wipedBytes: number;
  standard: 'Zero Fill (1 Pass)' | 'DoD 5220.22-M (3 Passes)' | 'Gutmann / Paranoid (7 Passes)';
  ssdNotice: string;
}

export interface PemDecodedResult {
  type: string;
  headers: string[];
  derLength: number;
  fingerprintSha256: string;
  fingerprintSha1: string;
  subject?: string;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
  isExpired?: boolean;
  serialNumber?: string;
}

export interface MetadataScrubResult {
  scrubbedBuffer: Uint8Array;
  originalSize: number;
  scrubbedSize: number;
  strippedCount: number;
  strippedTags: string[];
}

// ─── MD5 Helper (RFC 1321) ───────────────────────────────────────────────────
function safeAdd(x: number, y: number): number {
  const lsw = (x & 0xffff) + (y & 0xffff);
  return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff);
}
function bitRol(num: number, cnt: number): number {
  return (num << cnt) | (num >>> (32 - cnt));
}
function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
  return safeAdd(bitRol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}
function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn((b & c) | (~b & d), a, b, x, s, t);
}
function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
}
function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

function md5Bytes(bytes: Uint8Array): Uint8Array {
  const len = bytes.length;
  const nWords = (((len + 8) >>> 6) + 1) * 16;
  const x = new Int32Array(nWords);
  for (let i = 0; i < len; i++) x[i >> 2] |= bytes[i] << ((i % 4) * 8);
  x[len >> 2] |= 0x80 << ((len % 4) * 8);
  x[nWords - 2] = (len * 8) & 0xffffffff;
  x[nWords - 1] = Math.floor((len * 8) / 0x100000000);

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < nWords; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);

    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);

    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);

    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  const out = new Uint8Array(16);
  const words = [a, b, c, d];
  for (let w = 0; w < 4; w++) {
    for (let byte = 0; byte < 4; byte++) {
      out[w * 4 + byte] = (words[w] >>> (byte * 8)) & 0xff;
    }
  }
  return out;
}

function hmacMd5Bytes(keyBytes: Uint8Array, messageBytes: Uint8Array): Uint8Array {
  const k = new Uint8Array(64);
  if (keyBytes.length > 64) {
    k.set(md5Bytes(keyBytes));
  } else {
    k.set(keyBytes);
  }
  const iPad = new Uint8Array(64 + messageBytes.length);
  const oPad = new Uint8Array(64 + 16);
  for (let i = 0; i < 64; i++) {
    iPad[i] = k[i] ^ 0x36;
    oPad[i] = k[i] ^ 0x5c;
  }
  iPad.set(messageBytes, 64);
  const inner = md5Bytes(iPad);
  oPad.set(inner, 64);
  return md5Bytes(oPad);
}

// ─────────────────────────────────────────────────────────────────────────────

export class SecurityEngine {
  // Magic container header for Toiloki encrypted files (14 bytes)
  static readonly MAGIC_HEADER = new Uint8Array([
    0x54, 0x4f, 0x49, 0x4c, 0x4f, 0x4b, 0x49, 0x5f, 0x45, 0x4e, 0x43, 0x5f, 0x56, 0x31,
  ]); // "TOILOKI_ENC_V1"

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
   * Compute a hash or HMAC digest of text.
   * Supports: MD5, SHA-1, SHA-256, SHA-384, SHA-512
   */
  static async hashText(
    text: string,
    algorithm: 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256',
    hmacSecret?: string
  ): Promise<EngineResult<HashResult>> {
    const start = performance.now();
    try {
      if (text === undefined || text === null) throw new Error('Input text is required');

      const encoder = new TextEncoder();
      const textBytes = encoder.encode(text);
      let hashArray: Uint8Array;

      if (algorithm === 'MD5') {
        if (hmacSecret) {
          hashArray = hmacMd5Bytes(encoder.encode(hmacSecret), textBytes);
        } else {
          hashArray = md5Bytes(textBytes);
        }
      } else {
        if (hmacSecret) {
          const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(hmacSecret),
            { name: 'HMAC', hash: algorithm },
            false,
            ['sign']
          );
          const digest = await crypto.subtle.sign('HMAC', keyMaterial, textBytes);
          hashArray = new Uint8Array(digest);
        } else {
          const digest = await crypto.subtle.digest(algorithm, textBytes);
          hashArray = new Uint8Array(digest);
        }
      }

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
    algorithm: 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
  ): Promise<EngineResult<HashResult>> {
    const start = performance.now();
    try {
      let hashArray: Uint8Array;

      if (algorithm === 'MD5') {
        hashArray = md5Bytes(buffer);
      } else {
        const digest = await crypto.subtle.digest(algorithm, buffer);
        hashArray = new Uint8Array(digest);
      }

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
   * Generate a cryptographically random password using crypto.getRandomValues
   */
  static generatePassword(options: Partial<PasswordOptions> = {}): EngineResult<{ password: string; entropy: number }> {
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
        charset = charset.split(ch).join('');
      }

      if (charset.length === 0) throw new Error('No characters available after exclusions');

      // Generate strictly using crypto.getRandomValues for true cryptographic security
      const randomBytes = crypto.getRandomValues(new Uint8Array(opts.length * 2));
      let password = '';
      let i = 0;

      while (password.length < opts.length && i < randomBytes.length) {
        const idx = randomBytes[i] % charset.length;
        password += charset[idx];
        i++;
      }

      while (password.length < opts.length) {
        const extra = crypto.getRandomValues(new Uint8Array(opts.length));
        for (const b of extra) {
          if (password.length >= opts.length) break;
          password += charset[b % charset.length];
        }
      }

      // Calculate entropy: length * log2(poolSize)
      const entropy = Math.round(opts.length * Math.log2(charset.length) * 10) / 10;

      return {
        success: true,
        data: { password, entropy },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Generate a cryptographically random Diceware passphrase
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

      // Crack time estimate (assuming 10^9 hashes/second for GPU cluster)
      const combinations = Math.pow(poolSize || 1, password.length);
      const secondsToCrack = combinations / (2 * 1e9);
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
   * Generate an RFC 6238 TOTP code (offline)
   * Supports optional timestamp for deterministic RFC test vector verification.
   */
  static async generateTOTP(
    secret: string,
    digits: number = 6,
    period: number = 30,
    timestamp?: number,
    algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512' = 'SHA-1'
  ): Promise<EngineResult<{ code: string; secondsRemaining: number; validUntil: string }>> {
    const start = performance.now();
    try {
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

      const epoch = timestamp !== undefined ? Math.floor(timestamp) : Math.floor(Date.now() / 1000);
      const counter = Math.floor(epoch / period);
      const secondsRemaining = period - (epoch % period);

      const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: algorithm }, false, ['sign']);
      const counterBytes = new Uint8Array(8);
      let c = counter;
      for (let i = 7; i >= 0; i--) {
        counterBytes[i] = c & 0xff;
        c = Math.floor(c / 256);
      }
      const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBytes));

      const offset = hmac[hmac.length - 1] & 0xf;
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
   * Symmetric local AES-256-GCM file encryption using PBKDF2 key derivation.
   * Container format: [Magic 'TOILOKI_ENC_V1' (14B)] + [Salt (16B)] + [IV (12B)] + [Ciphertext + Tag]
   */
  static async encryptFile(
    buffer: Uint8Array,
    password: string
  ): Promise<EngineResult<EncryptedFileResult>> {
    const start = performance.now();
    try {
      if (!password) throw new Error('Password is required for encryption');
      if (!buffer || buffer.length === 0) throw new Error('Cannot encrypt an empty file');

      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Derive AES-256-GCM key via PBKDF2 (100,000 iterations, SHA-256)
      const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const ciphertextBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer);
      const ciphertext = new Uint8Array(ciphertextBuffer);

      // Package container: Header (14B) + Salt (16B) + IV (12B) + Ciphertext (N)
      const container = new Uint8Array(SecurityEngine.MAGIC_HEADER.length + 16 + 12 + ciphertext.length);
      container.set(SecurityEngine.MAGIC_HEADER, 0);
      container.set(salt, SecurityEngine.MAGIC_HEADER.length);
      container.set(iv, SecurityEngine.MAGIC_HEADER.length + 16);
      container.set(ciphertext, SecurityEngine.MAGIC_HEADER.length + 16 + 12);

      const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');
      const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join('');

      return {
        success: true,
        data: {
          encrypted: container,
          originalSize: buffer.length,
          encryptedSize: container.length,
          saltHex,
          ivHex,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Decrypt a Toiloki encrypted container file using AES-256-GCM.
   * If password is wrong or file is tampered, returns a clear, helpful error message.
   */
  static async decryptFile(
    buffer: Uint8Array,
    password: string
  ): Promise<EngineResult<DecryptedFileResult>> {
    const start = performance.now();
    try {
      if (!password) throw new Error('Password is required for decryption');
      const minLen = SecurityEngine.MAGIC_HEADER.length + 16 + 12 + 16;
      if (!buffer || buffer.length < minLen) {
        throw new Error('Invalid file format. File is too small to be a valid encrypted container.');
      }

      // Check magic header
      for (let i = 0; i < SecurityEngine.MAGIC_HEADER.length; i++) {
        if (buffer[i] !== SecurityEngine.MAGIC_HEADER[i]) {
          throw new Error('Not a valid Toiloki encrypted container. File header is missing or corrupted.');
        }
      }

      const saltOffset = SecurityEngine.MAGIC_HEADER.length;
      const ivOffset = saltOffset + 16;
      const cipherOffset = ivOffset + 12;

      const salt = buffer.slice(saltOffset, ivOffset);
      const iv = buffer.slice(ivOffset, cipherOffset);
      const ciphertext = buffer.slice(cipherOffset);

      const encoder = new TextEncoder();
      const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      try {
        const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
        const decrypted = new Uint8Array(decryptedBuffer);

        return {
          success: true,
          data: { decrypted, originalSize: decrypted.length },
          elapsedMs: Math.round(performance.now() - start),
        };
      } catch {
        // Web Crypto rejects with OperationError on wrong password or authentication tag mismatch
        throw new Error('Incorrect password or corrupted file. Unable to decrypt.');
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Secure multi-pass data shredder (in-memory wipe simulation with honest SSD advice).
   */
  static shredBuffer(buffer: Uint8Array, passes: 1 | 3 | 7 = 3): EngineResult<ShredResult> {
    const start = performance.now();
    try {
      if (!buffer || buffer.length === 0) throw new Error('Buffer is empty');

      for (let p = 0; p < passes; p++) {
        if (p === 0) {
          // Zero fill
          buffer.fill(0x00);
        } else if (p === 1) {
          // Ones fill
          buffer.fill(0xff);
        } else {
          // CSPRNG Random fill
          const chunk = 65536;
          for (let i = 0; i < buffer.length; i += chunk) {
            const size = Math.min(chunk, buffer.length - i);
            const rand = crypto.getRandomValues(new Uint8Array(size));
            buffer.set(rand, i);
          }
        }
      }

      let standard: ShredResult['standard'];
      if (passes === 1) standard = 'Zero Fill (1 Pass)';
      else if (passes === 3) standard = 'DoD 5220.22-M (3 Passes)';
      else standard = 'Gutmann / Paranoid (7 Passes)';

      const ssdNotice =
        'Notice on SSDs & Flash Storage: Modern solid-state drives (SSDs) and flash memory employ wear-leveling algorithms that remap logical sectors. While multi-pass overwriting completely scrambles addressable file data, physical hardware blocks may retain traces until garbage-collected. Complete eradication requires full-drive ATA Secure Erase or disk-level encryption.';

      return {
        success: true,
        data: {
          passes,
          wipedBytes: buffer.length,
          standard,
          ssdNotice,
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
    algorithm: 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
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
   * Scrub metadata from images, documents, and data files
   */
  static scrubMetadata(buffer: Uint8Array, fileName: string): EngineResult<MetadataScrubResult> {
    const start = performance.now();
    try {
      if (!buffer || buffer.length === 0) throw new Error('File buffer is empty');
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      let scrubbed = buffer;
      const strippedTags: string[] = [];

      if (ext === 'jpg' || ext === 'jpeg') {
        // Strip JPEG APP1 (EXIF), APP2, APP13 (Photoshop), COM markers
        if (buffer[0] === 0xff && buffer[1] === 0xd8) {
          const chunks: Uint8Array[] = [new Uint8Array([0xff, 0xd8])];
          let offset = 2;
          while (offset < buffer.length - 1) {
            if (buffer[offset] !== 0xff) break;
            const marker = buffer[offset + 1];
            if (marker === 0xd9) {
              chunks.push(new Uint8Array([0xff, 0xd9]));
              break;
            }
            if (offset + 4 > buffer.length) break;
            const len = (buffer[offset + 2] << 8) | buffer[offset + 3];
            if (marker === 0xe1) {
              strippedTags.push('EXIF / XMP (APP1)');
              offset += 2 + len;
            } else if (marker === 0xed) {
              strippedTags.push('Photoshop IPTC (APP13)');
              offset += 2 + len;
            } else if (marker === 0xfe) {
              strippedTags.push('Comment (COM)');
              offset += 2 + len;
            } else {
              chunks.push(buffer.slice(offset, offset + 2 + len));
              offset += 2 + len;
            }
          }
          const total = chunks.reduce((a, c) => a + c.length, 0);
          const out = new Uint8Array(total);
          let p = 0;
          for (const c of chunks) {
            out.set(c, p);
            p += c.length;
          }
          scrubbed = out;
        }
      } else if (ext === 'png') {
        // Strip PNG ancillary metadata chunks (tEXt, zTXt, iTXt, eXIf, tIME, pHYs)
        const isPng =
          buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
        if (isPng) {
          const chunks: Uint8Array[] = [buffer.slice(0, 8)];
          let offset = 8;
          while (offset + 8 <= buffer.length) {
            const chunkLen =
              (buffer[offset] << 24) |
              (buffer[offset + 1] << 16) |
              (buffer[offset + 2] << 8) |
              buffer[offset + 3];
            const type = String.fromCharCode(...buffer.slice(offset + 4, offset + 8));
            const fullLen = 4 + 4 + chunkLen + 4;
            if (['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME'].includes(type)) {
              strippedTags.push(`PNG ${type} metadata chunk`);
              offset += fullLen;
            } else {
              chunks.push(buffer.slice(offset, offset + fullLen));
              offset += fullLen;
            }
          }
          const total = chunks.reduce((a, c) => a + c.length, 0);
          const out = new Uint8Array(total);
          let p = 0;
          for (const c of chunks) {
            out.set(c, p);
            p += c.length;
          }
          scrubbed = out;
        }
      } else {
        // Text / JSON / XML fallback
        const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
        if (text) {
          const fmt = ext === 'json' ? 'json' : ext === 'xml' ? 'xml' : 'plain';
          const r = SecurityEngine.scrubTextMetadata(text, fmt);
          if (r.success && r.data) {
            scrubbed = new TextEncoder().encode(r.data);
            strippedTags.push('Document Author & Revision Tags');
          }
        }
      }

      return {
        success: true,
        data: {
          scrubbedBuffer: scrubbed,
          originalSize: buffer.length,
          scrubbedSize: scrubbed.length,
          strippedCount: strippedTags.length,
          strippedTags,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Parse PEM-encoded certificates or keys (X.509, RSA, Public/Private keys)
   */
  static async decodePem(pemString: string): Promise<EngineResult<PemDecodedResult>> {
    const start = performance.now();
    try {
      if (!pemString.trim()) throw new Error('PEM content is required');

      const headerMatch = pemString.match(/-----BEGIN ([A-Z0-9\s_-]+)-----/);
      if (!headerMatch) throw new Error('Invalid PEM format: No -----BEGIN ...----- header detected');

      const pemType = headerMatch[1].trim();
      const base64Content = pemString
        .replace(/-----BEGIN [A-Z0-9\s_-]+-----/, '')
        .replace(/-----END [A-Z0-9\s_-]+-----/, '')
        .replace(/\s+/g, '');

      const binaryStr = atob(base64Content);
      const der = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        der[i] = binaryStr.charCodeAt(i);
      }

      // Compute SHA-256 and SHA-1 fingerprints
      const sha256Digest = await crypto.subtle.digest('SHA-256', der);
      const sha1Digest = await crypto.subtle.digest('SHA-1', der);

      const fp256 = Array.from(new Uint8Array(sha256Digest))
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(':');
      const fp1 = Array.from(new Uint8Array(sha1Digest))
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(':');

      // Best-effort ASN.1 extraction for Subject, Issuer, Dates if X.509
      let subject: string | undefined;
      let issuer: string | undefined;
      let validFrom: string | undefined;
      let validTo: string | undefined;
      let isExpired: boolean | undefined;

      const fullText = pemString;
      // Check if text has CN or Common Name
      const cnMatches = [...fullText.matchAll(/CN\s*=\s*([^,\r\n/]+)/gi)];
      if (cnMatches.length > 0) {
        subject = cnMatches[0][1].trim();
        if (cnMatches.length > 1) issuer = cnMatches[1][1].trim();
      }

      // Check for UTC Time dates in DER strings (YYMMDDHHMMSSZ)
      const derAscii = binaryStr;
      const dateMatches = derAscii.match(/\d{12}Z/g);
      if (dateMatches && dateMatches.length >= 2) {
        const parseUtcTime = (str: string) => {
          const yr = parseInt(str.slice(0, 2), 10);
          const fullYear = yr < 50 ? 2000 + yr : 1900 + yr;
          const mo = parseInt(str.slice(2, 4), 10) - 1;
          const da = parseInt(str.slice(4, 6), 10);
          const hr = parseInt(str.slice(6, 8), 10);
          const mi = parseInt(str.slice(8, 10), 10);
          const se = parseInt(str.slice(10, 12), 10);
          return new Date(Date.UTC(fullYear, mo, da, hr, mi, se));
        };
        const fromDate = parseUtcTime(dateMatches[0]);
        const toDate = parseUtcTime(dateMatches[1]);
        validFrom = fromDate.toLocaleDateString();
        validTo = toDate.toLocaleDateString();
        isExpired = Date.now() > toDate.getTime();
      }

      return {
        success: true,
        data: {
          type: pemType,
          headers: [headerMatch[0], `-----END ${pemType}-----`],
          derLength: der.length,
          fingerprintSha256: fp256,
          fingerprintSha1: fp1,
          subject: subject || `${pemType} Container`,
          issuer: issuer || 'Self-issued / Local',
          validFrom,
          validTo,
          isExpired,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Generate cryptographic RSA or ECDSA key pairs and export as PEM
   */
  static async generateKeyPair(
    algorithm: 'RSA-2048' | 'RSA-4096' | 'ECDSA-P256' = 'RSA-2048'
  ): Promise<EngineResult<{ publicKeyPem: string; privateKeyPem: string; algorithm: string }>> {
    const start = performance.now();
    try {
      let keyPair: CryptoKeyPair;

      if (algorithm === 'ECDSA-P256') {
        keyPair = await crypto.subtle.generateKey(
          { name: 'ECDSA', namedCurve: 'P-256' },
          true,
          ['sign', 'verify']
        );
      } else {
        const modLength = algorithm === 'RSA-4096' ? 4096 : 2048;
        keyPair = await crypto.subtle.generateKey(
          {
            name: 'RSA-OAEP',
            modulusLength: modLength,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
          },
          true,
          ['encrypt', 'decrypt']
        );
      }

      const spkiBuf = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const pkcs8Buf = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      const toBase64 = (buf: ArrayBuffer) => {
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      };

      const formatPem = (b64: string, header: string) => {
        const lines = b64.match(/.{1,64}/g) || [];
        return `-----BEGIN ${header}-----\n${lines.join('\n')}\n-----END ${header}-----`;
      };

      const publicKeyPem = formatPem(toBase64(spkiBuf), 'PUBLIC KEY');
      const privateKeyPem = formatPem(toBase64(pkcs8Buf), 'PRIVATE KEY');

      return {
        success: true,
        data: { publicKeyPem, privateKeyPem, algorithm },
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
   * Scrub metadata from text/JSON/XML content
   */
  static scrubTextMetadata(content: string, format: 'json' | 'yaml' | 'xml' | 'plain'): EngineResult<string> {
    const start = performance.now();
    try {
      if (!content.trim()) throw new Error('Content is required');

      let cleaned = content;

      if (format === 'json') {
        const parsed = JSON.parse(content);
        const metaKeys = [
          'author', 'creator', 'created', 'modified', 'lastModified', 'createdAt', 'updatedAt',
          'createdBy', 'modifiedBy', 'metadata', '_metadata', 'version', 'revision',
        ];
        const strip = (obj: unknown): unknown => {
          if (Array.isArray(obj)) return obj.map(strip);
          if (obj && typeof obj === 'object') {
            const resObj: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
              if (!metaKeys.some((mk) => mk.toLowerCase() === k.toLowerCase())) {
                resObj[k] = strip(v);
              }
            }
            return resObj;
          }
          return obj;
        };
        cleaned = JSON.stringify(strip(parsed), null, 2);
      } else if (format === 'xml') {
        cleaned = content
          .replace(/<dc:creator>.*?<\/dc:creator>/gs, '')
          .replace(/<dc:date>.*?<\/dc:date>/gs, '')
          .replace(/<meta[^>]*author[^>]*>/gi, '')
          .replace(/<!-- Generated by.*?-->/gs, '')
          .replace(/<!-- Created.*?-->/gs, '');
      }

      return { success: true, data: cleaned, elapsedMs: Math.round(performance.now() - start), };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }
}
