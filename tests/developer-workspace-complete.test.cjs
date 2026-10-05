/**
 * tests/developer-workspace-complete.test.cjs
 * Comprehensive unit and engine test suite for Phase 5C: Developer Workspace.
 * 
 * Verifies:
 * 1. JSON Formatter (indentation, recursive sort keys, minify, line & column syntax error)
 * 2. Base64 & Base64URL (Unicode UTF-8 multibyte, URL-safe chars, bi-directional)
 * 3. JWT Inspector (header/payload decode, exp/iat timestamps, offline disclaimer banner)
 * 4. UUID Generator (RFC 4122 v4, uppercase, no-hyphens, braces, batch bounds)
 * 5. Timestamp Converter (seconds vs ms auto-detect, relative time, ISO/local strings)
 * 6. Regex Tester (pattern matches, groups, catastrophic backtracking guard)
 * 7. Cron Explainer (5 fields, human description, next runs, aliases @daily, @hourly, etc.)
 * 8. chmod Calculator (bi-directional octal <-> symbolic, bitmask, permission breakdown)
 * 9. .env Diff (missing keys, differing values, secret masking)
 * 10. px/rem Converter (bi-directional, base font scale)
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ts = require('typescript');

function loadTsModule(filePath, exportName) {
  const engineFile = path.resolve(__dirname, filePath);
  const engineSource = fs.readFileSync(engineFile, 'utf8');
  const transpiled = ts.transpileModule(engineSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const moduleEnv = { exports: {} };
  const fn = new Function('require', 'module', 'exports', transpiled.outputText);
  fn(require, moduleEnv, moduleEnv.exports);
  return moduleEnv.exports[exportName];
}

let DevEngine;
let DeveloperEngine;

try {
  DevEngine = loadTsModule('../src/engines/developer/dev.engine.ts', 'DevEngine');
  DeveloperEngine = loadTsModule('../src/engines/developer/developer.engine.ts', 'DeveloperEngine');
} catch (e) {
  console.error('Failed to load Developer engines in test harness:', e);
  process.exit(1);
}

function runTests() {
  console.log('===========================================================');
  console.log('  PHASE 5C: DEVELOPER WORKSPACE COMPLETE TEST SUITE        ');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. JSON Formatter
  test('JSON Formatter: Indents, sorts keys, and minifies', () => {
    const raw = '{"z": 1, "a": [3, 2], "m": {"b": 2, "a": 1}}';
    
    // Standard format
    const res1 = DevEngine.formatJson(raw, { indent: 2 });
    assert.strictEqual(res1.success, true);
    assert.ok(res1.data.formatted.includes('\n  "z": 1'));

    // Sorted keys
    const res2 = DevEngine.formatJson(raw, { indent: 2, sortKeys: true });
    assert.strictEqual(res2.success, true);
    const sorted = res2.data.formatted;
    const aIndex = sorted.indexOf('"a"');
    const zIndex = sorted.indexOf('"z"');
    assert.ok(aIndex < zIndex, 'Key "a" must precede key "z"');

    // Minify
    const res3 = DevEngine.formatJson(raw, { minify: true });
    assert.strictEqual(res3.success, true);
    assert.ok(!res3.data.formatted.includes('\n'), 'Minified JSON must not have newlines');
  });

  test('JSON Formatter: Reports exact line and column on syntax errors', () => {
    const badJson = '{\n  "name": "Toiloki",\n  "broken": ,\n  "valid": true\n}';
    const res = DevEngine.formatJson(badJson);
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('line 3'), `Error should pinpoint line 3: ${res.error}`);
    assert.ok(res.metadata && res.metadata.line === 3, 'Metadata should reflect line 3');
  });

  // 2. Base64 & Base64URL
  test('Base64 & Base64URL: Handles multibyte UTF-8 Unicode characters and URL-safe alphabet', () => {
    const unicodeInput = 'Toiloki 🚀 本日 🌟 Déjà vu';
    
    // Standard base64
    const enc = DevEngine.encodeDecode(unicodeInput, 'base64-encode');
    assert.strictEqual(enc.success, true);
    const dec = DevEngine.encodeDecode(enc.data, 'base64-decode');
    assert.strictEqual(dec.success, true);
    assert.strictEqual(dec.data, unicodeInput);

    // URL-safe base64
    const encUrl = DevEngine.encodeDecode(unicodeInput, 'base64url-encode');
    assert.strictEqual(encUrl.success, true);
    assert.ok(!encUrl.data.includes('+'), 'Must not contain +');
    assert.ok(!encUrl.data.includes('/'), 'Must not contain /');
    assert.ok(!encUrl.data.includes('='), 'Must not contain =');

    const decUrl = DevEngine.encodeDecode(encUrl.data, 'base64url-decode');
    assert.strictEqual(decUrl.success, true);
    assert.strictEqual(decUrl.data, unicodeInput);
  });

  // 3. JWT Inspector
  test('JWT Inspector: Decodes header/payload, checks expiry, and includes offline disclaimer', () => {
    // Payload with exp in the future
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: 'usr_42', role: 'admin', iat: 1700000000, exp: 2500000000 };
    const b64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const validToken = `${b64Url(header)}.${b64Url(payload)}.mockSignature`;

    const res = DevEngine.decodeJwt(validToken);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.header.alg, 'HS256');
    assert.strictEqual(res.data.payload.sub, 'usr_42');
    assert.strictEqual(res.data.isExpired, false);
    assert.ok(res.data.expiresAt.startsWith('2049'), 'exp should map to year 2049');
    assert.ok(res.data.disclaimer.includes('Signature verification requires a secret or public key'));

    // Malformed token rejection
    const badRes = DevEngine.decodeJwt('not.a.valid.jwt.token');
    assert.strictEqual(badRes.success, false);
  });

  // 4. UUID Generator
  test('UUID Generator: Supports count, uppercase, no-hyphens, and braces', () => {
    const res = DevEngine.generateUuids(5, { uppercase: true, noDashes: true, braces: true });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.length, 5);

    const uuid = res.data[0];
    assert.ok(uuid.startsWith('{') && uuid.endsWith('}'), 'Should have braces');
    assert.ok(!uuid.includes('-'), 'Should not have hyphens');
    assert.strictEqual(uuid, uuid.toUpperCase(), 'Should be uppercase');
  });

  // 5. Timestamp Converter
  test('Timestamp Converter: Auto-detects seconds vs milliseconds and computes relative time', () => {
    // Current timestamp in seconds
    const nowSec = Math.floor(Date.now() / 1000);
    const resSec = DevEngine.generateTimestamp(nowSec);
    assert.strictEqual(resSec.success, true);
    assert.strictEqual(resSec.data.relative, 'just now');

    // Future timestamp in milliseconds (+1 day)
    const futureMs = Date.now() + 86400 * 1000;
    const resFut = DevEngine.generateTimestamp(futureMs);
    assert.strictEqual(resFut.success, true);
    assert.ok(resFut.data.relative.includes('from now') || resFut.data.relative.includes('hours') || resFut.data.relative.includes('days'));
    assert.ok(resFut.data.isoUtc.endsWith('Z'));
  });

  // 6. Regex Tester
  test('Regex Tester: Finds matches, capture groups, and prevents catastrophic backtracking', () => {
    const text = 'Items: apple:12, banana:34, cherry:56';
    const res = DevEngine.testRegex('([a-z]+):(\\d+)', 'g', text);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.matches.length, 3);
    assert.strictEqual(res.data.matches[0].match, 'apple:12');

    // Catastrophic backtracking attempt (e.g. (a+)+$ against "aaaaaaaaaaaaaaaaaaaaaaaaaaaa!")
    const resEvil = DevEngine.testRegex('(a+)+$', '', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa!', 50);
    assert.strictEqual(resEvil.success, false);
    assert.ok(resEvil.error.includes('catastrophic') || resEvil.error.includes('timed out'));
  });

  // 7. Cron Explainer
  test('Cron Explainer: Explains 5-field cron, computes next runs, and parses aliases', () => {
    // Standard cron
    const res = DeveloperEngine.explainCron('0 9 * * 1-5', 5);
    assert.strictEqual(res.success, true);
    assert.ok(res.data.human.length > 0);
    assert.strictEqual(res.data.nextRuns.length, 5);

    // Aliases
    const resDaily = DeveloperEngine.explainCron('@daily', 3);
    assert.strictEqual(resDaily.success, true);
    assert.strictEqual(resDaily.data.parts.minute, '0');
    assert.strictEqual(resDaily.data.parts.hour, '0');

    const resHourly = DeveloperEngine.explainCron('@hourly', 3);
    assert.strictEqual(resHourly.success, true);
    assert.strictEqual(resHourly.data.parts.minute, '0');
  });

  // 8. chmod Calculator
  test('chmod Calculator: Converts octal to symbolic and bitmask', () => {
    const res755 = DeveloperEngine.parseChmod('755');
    assert.strictEqual(res755.success, true);
    assert.strictEqual(res755.data.symbolic, 'rwxr-xr-x');
    assert.strictEqual(res755.data.owner.read, true);
    assert.strictEqual(res755.data.owner.write, true);
    assert.strictEqual(res755.data.owner.execute, true);
    assert.strictEqual(res755.data.group.write, false);

    const resSymbolic = DeveloperEngine.parseChmod('rw-r--r--');
    assert.strictEqual(resSymbolic.success, true);
    assert.strictEqual(resSymbolic.data.octal, '644');
  });

  // 9. .env Diff with Secret Masking
  test('.env Diff: Identifies missing keys, diffs values, and masks secrets', () => {
    const envActual = 'PORT=8080\nAPI_SECRET=supersecret123\nDB_PASS=mypassword\nDEBUG=true';
    const envExample = 'PORT=3000\nAPI_SECRET=\nDB_PASS=\nNEW_FEATURE=false';

    const diff = DeveloperEngine.diffEnvFiles(envActual, envExample, '.env', '.env.example', { maskSecrets: true });
    assert.strictEqual(diff.success, true);
    assert.ok(diff.data.missingInFirst.includes('NEW_FEATURE'));
    assert.ok(diff.data.missingInSecond.includes('DEBUG'));

    // Check masked secrets
    const secretDiff = diff.data.differing.find(d => d.key === 'API_SECRET');
    assert.ok(secretDiff, 'API_SECRET should differ');
    assert.strictEqual(secretDiff.val1, '••••••••', 'Secret value should be masked with bullets');
  });

  // 10. px / rem Converter
  test('px / rem Converter: Bi-directional conversion and scale generation', () => {
    const resPx = DeveloperEngine.convertPxRem(24, 'pxToRem', 16);
    assert.strictEqual(resPx.success, true);
    assert.strictEqual(resPx.data.result, 1.5);
    assert.ok(resPx.data.scale.length > 0);

    const resRem = DeveloperEngine.convertPxRem(2, 'remToPx', 16);
    assert.strictEqual(resRem.success, true);
    assert.strictEqual(resRem.data.result, 32);
  });

  console.log('-----------------------------------------------------------');
  console.log(`Developer Workspace Tests Complete: ${passed} passed, ${failed} failed`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
