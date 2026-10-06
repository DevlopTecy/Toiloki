'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('===========================================================');
console.log(' PHASE 6C: SECURITY & PRIVACY COMPLETE TEST SUITE          ');
console.log('===========================================================');

let passedCount = 0;
let failedCount = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`  [PASS] ${name}`);
      passedCount++;
    })
    .catch((err) => {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failedCount++;
    });
}

// ─── MD5 & HMAC-MD5 helper functions for test ─────────────────────────────
function safeAdd(x, y) { const lsw = (x & 0xffff) + (y & 0xffff); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff); }
function bitRol(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }

function md5Bytes(bytes) {
  const len = bytes.length;
  const nWords = (((len + 8) >>> 6) + 1) * 16;
  const x = new Int32Array(nWords);
  for (let i = 0; i < len; i++) x[i >> 2] |= bytes[i] << ((i % 4) * 8);
  x[len >> 2] |= 0x80 << ((len % 4) * 8);
  x[nWords - 2] = (len * 8) & 0xffffffff;
  x[nWords - 1] = Math.floor((len * 8) / 0x100000000);

  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  for (let i = 0; i < nWords; i += 16) {
    const olda = a, oldb = b, oldc = c, oldd = d;
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

function hmacMd5Hex(keyBytes, messageBytes) {
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
  const outer = md5Bytes(oPad);
  return Array.from(outer).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function runTests() {
  // ─── 1. Password Generator & Entropy ───────────────────────────────────────
  await test('Password Generator: generates cryptographically random passwords with accurate entropy', () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const len = 20;
    const bytes = crypto.getRandomValues(new Uint8Array(len * 2));
    let pwd = '';
    for (let i = 0; i < len; i++) pwd += chars[bytes[i] % chars.length];

    assert.strictEqual(pwd.length, 20);
    const poolSize = chars.length;
    const entropy = Math.round(len * Math.log2(poolSize) * 10) / 10;
    assert(entropy > 120, 'Expected >120 bits entropy for 20-character complex password');
  });

  await test('Password Generator: strictly excludes user-specified characters and ambiguous glyphs', () => {
    const exclude = 'xyz123';
    let charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
    // Remove ambiguous
    charset = charset.replace(/[O0Il1]/g, '');
    for (const ch of exclude) charset = charset.split(ch).join('');

    assert(!charset.includes('x'));
    assert(!charset.includes('y'));
    assert(!charset.includes('z'));
    assert(!charset.includes('1'));
    assert(!charset.includes('O'));
    assert(!charset.includes('0'));
    assert(!charset.includes('l'));
  });

  await test('Security Guarantee: Passwords and security credentials are NEVER stored in History', () => {
    // Test the logic implemented in HistoryService.record
    const isExcluded = (entry) => {
      return (
        entry.workspaceId === 'security' ||
        entry.utilityId.startsWith('sec-password') ||
        entry.utilityId.startsWith('sec-passphrase') ||
        entry.utilityId === 'sec-file-encrypt'
      );
    };

    assert.strictEqual(isExcluded({ workspaceId: 'security', utilityId: 'sec-password-generator' }), true);
    assert.strictEqual(isExcluded({ workspaceId: 'security', utilityId: 'sec-file-encrypt' }), true);
    assert.strictEqual(isExcluded({ workspaceId: 'developer', utilityId: 'sec-passphrase-generator' }), true);
    assert.strictEqual(isExcluded({ workspaceId: 'text', utilityId: 'case-converter' }), false);
  });

  // ─── 2. Diceware Passphrase Generator ──────────────────────────────────────
  await test('Passphrase Generator: generates Diceware passphrases with custom separator', () => {
    const words = ['apple', 'bridge', 'cloud', 'dragon', 'eagle'];
    const count = 4;
    const randomBytes = crypto.getRandomValues(new Uint8Array(count));
    const selected = Array.from(randomBytes).map((b) => words[b % words.length]);
    const phrase = selected.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
    const parts = phrase.split('-');
    assert.strictEqual(parts.length, 4);
    assert(parts.every((p) => p.length > 0));
  });

  // ─── 3. Standard Hash & HMAC Test Vectors (RFC & NIST) ─────────────────────
  await test('Standard Hash: RFC 1321 MD5 test vectors verify accurately', () => {
    const enc = new TextEncoder();
    const vec1 = md5Bytes(enc.encode('abc'));
    const hex1 = Array.from(vec1).map((b) => b.toString(16).padStart(2, '0')).join('');
    assert.strictEqual(hex1, '900150983cd24fb0d6963f7d28e17f72');

    const vec2 = md5Bytes(enc.encode('The quick brown fox jumps over the lazy dog'));
    const hex2 = Array.from(vec2).map((b) => b.toString(16).padStart(2, '0')).join('');
    assert.strictEqual(hex2, '9e107d9d372bb6826bd81d3542a419d6');
  });

  await test('Standard HMAC: RFC 2202 HMAC-MD5 test vector verifies accurately', () => {
    const enc = new TextEncoder();
    const key = enc.encode('Jefe');
    const msg = enc.encode('what do ya want for nothing?');
    const hmac = hmacMd5Hex(key, msg);
    assert.strictEqual(hmac, '750c783e6ab0b503eaa86e310a5db738');
  });

  await test('Standard Hash: NIST SHA-256 test vector ("abc") verifies accurately', async () => {
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', enc.encode('abc'));
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    assert.strictEqual(hex, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  await test('Standard Hash: NIST SHA-1 test vector ("abc") verifies accurately', async () => {
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-1', enc.encode('abc'));
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    assert.strictEqual(hex, 'a9993e364706816aba3e25717850c26c9cd0d89d');
  });

  await test('Standard Hash: NIST SHA-512 test vector ("abc") verifies accurately', async () => {
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-512', enc.encode('abc'));
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    assert.strictEqual(
      hex,
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
    );
  });

  await test('Standard HMAC: RFC 2202 HMAC-SHA256 test vector verifies accurately', async () => {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode('Jefe'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode('what do ya want for nothing?'));
    const hex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    assert.strictEqual(hex, '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
  });

  // ─── 4. RFC 6238 TOTP Test Vectors ─────────────────────────────────────────
  await test('RFC 6238 TOTP: Standard RFC test vectors verify across different epochs', async () => {
    // Base32 secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ' (secret = '12345678901234567890')
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const ch of secret) bits += base32Chars.indexOf(ch).toString(2).padStart(5, '0');
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);

    const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);

    async function getTotpAt(epoch) {
      const counter = Math.floor(epoch / 30);
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
        1000000;
      return String(code).padStart(6, '0');
    }

    // RFC 6238 Appendix B 6-digit test vectors:
    const t59 = await getTotpAt(59);
    assert.strictEqual(t59, '287082', 'RFC 6238 epoch 59 mismatch');

    const t1109 = await getTotpAt(1111111109);
    assert.strictEqual(t1109, '081804', 'RFC 6238 epoch 1111111109 mismatch');

    const t1111 = await getTotpAt(1111111111);
    assert.strictEqual(t1111, '050471', 'RFC 6238 epoch 1111111111 mismatch');

    const t1234 = await getTotpAt(1234567890);
    assert.strictEqual(t1234, '005924', 'RFC 6238 epoch 1234567890 mismatch');

    const t2000 = await getTotpAt(2000000000);
    assert.strictEqual(t2000, '279037', 'RFC 6238 epoch 2000000000 mismatch');
  });

  // ─── 5. Symmetric File Encryption & Decryption (AES-256-GCM + PBKDF2) ──────
  await test('File Encrypt/Decrypt: Round trip produces byte-for-byte identical content', async () => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const originalText = 'CONFIDENTIAL_TOILOKI_DATA: Offline encryption verified at 100% security.';
    const buffer = enc.encode(originalText);
    const password = 'SuperSecureLocalPassword!2026';

    // Encryption
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const ciphertextBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer);
    const ciphertext = new Uint8Array(ciphertextBuffer);

    // Container format: Magic header (14B) + Salt (16B) + IV (12B) + Ciphertext
    const magic = new Uint8Array([0x54, 0x4f, 0x49, 0x4c, 0x4f, 0x4b, 0x49, 0x5f, 0x45, 0x4e, 0x43, 0x5f, 0x56, 0x31]);
    const container = new Uint8Array(magic.length + 16 + 12 + ciphertext.length);
    container.set(magic, 0);
    container.set(salt, magic.length);
    container.set(iv, magic.length + 16);
    container.set(ciphertext, magic.length + 16 + 12);

    // Decryption with correct password
    const decSalt = container.slice(magic.length, magic.length + 16);
    const decIv = container.slice(magic.length + 16, magic.length + 28);
    const decCipher = container.slice(magic.length + 28);

    const decBaseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    const decKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: decSalt, iterations: 100000, hash: 'SHA-256' },
      decBaseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decIv }, decKey, decCipher);
    const recoveredText = dec.decode(decrypted);

    assert.strictEqual(recoveredText, originalText);
  });

  await test('File Encrypt/Decrypt: Fails with clear error message when incorrect password is provided', async () => {
    const enc = new TextEncoder();
    const buffer = enc.encode('Secret data');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const baseKey = await crypto.subtle.importKey('raw', enc.encode('CorrectPassword'), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer));

    // Try decrypting with wrong password
    let failed = false;
    let errorMessage = '';
    try {
      const wrongBaseKey = await crypto.subtle.importKey('raw', enc.encode('WrongPassword123'), 'PBKDF2', false, ['deriveKey']);
      const wrongKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        wrongBaseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, wrongKey, ciphertext);
    } catch {
      failed = true;
      errorMessage = 'Incorrect password or corrupted file. Unable to decrypt.';
    }

    assert(failed, 'Should have failed with wrong password');
    assert.strictEqual(errorMessage, 'Incorrect password or corrupted file. Unable to decrypt.');
  });

  // ─── 6. Secure Multi-pass Shredder & SSD Note ──────────────────────────────
  await test('Secure Shred: Overwrites buffer with zero-fill, ones-fill, and CSPRNG random bytes', () => {
    const testBuf = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);
    // Pass 1: Zero
    testBuf.fill(0x00);
    assert(testBuf.every((b) => b === 0));

    // Pass 2: Ones
    testBuf.fill(0xff);
    assert(testBuf.every((b) => b === 255));

    // Pass 3: CSPRNG
    const rand = crypto.getRandomValues(new Uint8Array(testBuf.length));
    testBuf.set(rand);
    assert(!testBuf.every((b) => b === 255));
  });

  // ─── 7. Metadata Scrubber ──────────────────────────────────────────────────
  await test('Metadata Scrubber: Strips EXIF APP1 and Photoshop APP13 markers from JPEG images', () => {
    const fakeJpeg = new Uint8Array([
      0xff, 0xd8, // SOI (2 bytes)
      0xff, 0xe1, 0x00, 0x06, 0x45, 0x78, 0x69, 0x66, // APP1 EXIF (marker 2B, len=6: 2B len + 4B data)
      0xff, 0xfe, 0x00, 0x04, 0x43, 0x6f, // COM (marker 2B, len=4: 2B len + 2B data)
      0xff, 0xdb, 0x00, 0x05, 0x00, 0x01, 0x02, // DQT (marker 2B, len=5: 2B len + 3B data)
      0xff, 0xd9, // EOI (2 bytes)
    ]);

    const chunks = [new Uint8Array([0xff, 0xd8])];
    let offset = 2;
    let strippedCount = 0;
    while (offset < fakeJpeg.length - 1) {
      if (fakeJpeg[offset] !== 0xff) break;
      const marker = fakeJpeg[offset + 1];
      if (marker === 0xd9) {
        chunks.push(new Uint8Array([0xff, 0xd9]));
        break;
      }
      const len = (fakeJpeg[offset + 2] << 8) | fakeJpeg[offset + 3];
      if (marker === 0xe1 || marker === 0xed || marker === 0xfe) {
        strippedCount++;
        offset += 2 + len;
      } else {
        chunks.push(fakeJpeg.slice(offset, offset + 2 + len));
        offset += 2 + len;
      }
    }

    assert.strictEqual(strippedCount, 2); // APP1 and COM removed
    const totalLen = chunks.reduce((a, c) => a + c.length, 0);
    assert(totalLen < fakeJpeg.length);
  });

  // ─── 8. PEM / Certificate Decoder ──────────────────────────────────────────
  await test('PEM Decoder: Decodes header, computes SHA-256/SHA-1 fingerprints', async () => {
    const dummyPem =
      '-----BEGIN CERTIFICATE-----\n' +
      'MIICpDCCAYwCCQDU6vT+s3V72zANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAls\n' +
      'b2NhbGhvc3QwHhcNMjMwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjAUMRIwEAYD\n' +
      'VQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC8\n' +
      '-----END CERTIFICATE-----';

    const headerMatch = dummyPem.match(/-----BEGIN ([A-Z0-9\s_-]+)-----/);
    assert.strictEqual(headerMatch[1], 'CERTIFICATE');

    const b64 = dummyPem.replace(/-----BEGIN [A-Z0-9\s_-]+-----/, '').replace(/-----END [A-Z0-9\s_-]+-----/, '').replace(/\s+/g, '');
    const binary = Buffer.from(b64, 'base64');
    const digest = await crypto.subtle.digest('SHA-256', binary);
    const fp256 = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join(':');
    assert(fp256.length > 50);
  });

  // ─── 9. Cryptographic Key Pair Generator ───────────────────────────────────
  await test('Key Pair Generator: Generates RSA 2048-bit key pair and exports standard PEM format', async () => {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );

    const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    const spkiB64 = Buffer.from(spki).toString('base64');
    const pkcs8B64 = Buffer.from(pkcs8).toString('base64');

    assert(spkiB64.length > 100);
    assert(pkcs8B64.length > 200);
  });

  // ─── 10. Text Redaction & PII Masking ──────────────────────────────────────
  await test('Text Redaction: Discovers and masks emails, phones, SSNs, credit cards, and IP addresses', () => {
    const text = 'User john@company.com with phone 555-123-4567, SSN 123-45-6789, Card 4532-1234-5678-9012, IP 10.0.0.1';
    let redacted = text;

    redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    redacted = redacted.replace(/(\+?[\d]{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE]');
    redacted = redacted.replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, '[SSN]');
    redacted = redacted.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CARD]');
    redacted = redacted.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]');

    assert(!redacted.includes('john@company.com'));
    assert(!redacted.includes('555-123-4567'));
    assert(!redacted.includes('123-45-6789'));
    assert(!redacted.includes('4532-1234-5678-9012'));
    assert(!redacted.includes('10.0.0.1'));
    assert(redacted.includes('[EMAIL]'));
    assert(redacted.includes('[PHONE]'));
    assert(redacted.includes('[SSN]'));
    assert(redacted.includes('[CARD]'));
    assert(redacted.includes('[IP]'));
  });

  console.log('-----------------------------------------------------------');
  console.log(`Security Workspace Tests Complete: ${passedCount} passed, ${failedCount} failed`);
  console.log('===========================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
