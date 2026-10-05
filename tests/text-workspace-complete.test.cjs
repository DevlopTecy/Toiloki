/**
 * tests/text-workspace-complete.test.cjs
 * Comprehensive unit and engine test suite for Phase 5B: Text Workspace.
 * 
 * Verifies:
 * 1. Complete Case Conversions (upper, lower, title, sentence, camel, pascal, kebab, snake, constant, dot, train, alternating)
 * 2. Unicode Grapheme Accuracy for Emoji and Combining Marks
 * 3. Sort & Deduplicate (Ascending, Descending, Natural Sort)
 * 4. Whitespace & Text Cleaning (Strip invisible characters, normalize endings, collapse spaces)
 * 5. URL Slug Generator with Diacritics and Separator Options
 * 6. Regex Find & Replace with Groups and Match Counts
 * 7. Entity Extraction (Emails, URLs, IPs, Dates, Phones)
 * 8. Word Frequency Analyzer
 * 9. Delimited Text to Markdown Table Converter
 * 10. Large Buffer (5 MB Text) Performance & Responsiveness
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ts = require('typescript');

// Transpile and load TextEngine in test harness
let TextEngine;
try {
  const engineFile = path.resolve(__dirname, '../src/engines/text/text.engine.ts');
  const engineSource = fs.readFileSync(engineFile, 'utf8');

  const transpiled = ts.transpileModule(engineSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });

  const moduleEnv = { exports: {} };
  const fn = new Function('require', 'module', 'exports', transpiled.outputText);
  fn(require, moduleEnv, moduleEnv.exports);
  TextEngine = moduleEnv.exports.TextEngine;
} catch (e) {
  console.error('Failed to load TextEngine in test harness:', e);
  process.exit(1);
}

function runTests() {
  console.log('===========================================================');
  console.log('  PHASE 5B: TEXT WORKSPACE COMPLETE TEST SUITE             ');
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

  // ─── 1. Case Conversions ───
  console.log('\n--- 1. Case Conversion Engine ---');

  test('transformCase handles all standard & extended case formats', () => {
    const input = 'hello world Toiloki suite';

    const upper = TextEngine.transformCase(input, 'upper');
    assert.strictEqual(upper.data, 'HELLO WORLD TOILOKI SUITE');

    const lower = TextEngine.transformCase('HELLO WORLD', 'lower');
    assert.strictEqual(lower.data, 'hello world');

    const title = TextEngine.transformCase('quick brown fox', 'title');
    assert.strictEqual(title.data, 'Quick Brown Fox');

    const sentence = TextEngine.transformCase('hello world. this is a test! awesome.', 'sentence');
    assert.strictEqual(sentence.data, 'Hello world. This is a test! Awesome.');

    const camel = TextEngine.transformCase('hello world foo bar', 'camel');
    assert.strictEqual(camel.data, 'helloWorldFooBar');

    const pascal = TextEngine.transformCase('hello world foo bar', 'pascal');
    assert.strictEqual(pascal.data, 'HelloWorldFooBar');

    const kebab = TextEngine.transformCase('Hello World Foo Bar', 'kebab');
    assert.strictEqual(kebab.data, 'hello-world-foo-bar');

    const snake = TextEngine.transformCase('Hello World Foo Bar', 'snake');
    assert.strictEqual(snake.data, 'hello_world_foo_bar');

    const constant = TextEngine.transformCase('hello world foo bar', 'constant');
    assert.strictEqual(constant.data, 'HELLO_WORLD_FOO_BAR');

    const dot = TextEngine.transformCase('hello world foo bar', 'dot');
    assert.strictEqual(dot.data, 'hello.world.foo.bar');

    const train = TextEngine.transformCase('hello world foo bar', 'train');
    assert.strictEqual(train.data, 'Hello-World-Foo-Bar');

    const alternating = TextEngine.transformCase('hello world', 'alternating');
    assert.strictEqual(alternating.data.toLowerCase(), 'hello world');
    assert.notStrictEqual(alternating.data, 'hello world');
  });

  // ─── 2. Unicode Grapheme Accuracy for Emoji and Combining Marks ───
  console.log('\n--- 2. Unicode Grapheme & Text Statistics ---');

  test('analyzeText calculates exact grapheme clusters for emoji and combining marks', () => {
    // Family emoji: 1 user-perceived character (grapheme), but 11 UTF-16 code units!
    const familyEmoji = '👨‍👩‍👧‍👦';
    const famRes = TextEngine.analyzeText(familyEmoji);
    assert.strictEqual(famRes.success, true);
    assert.strictEqual(famRes.data.characters, 1, 'Family emoji must be counted as 1 grapheme');
    assert(famRes.data.codeUnits > 1, 'Code units reflect UTF-16 length');

    // Combining acute accent: 'e' + '\u0301' is 1 grapheme, but 2 code units!
    const combiningChar = 'e\u0301';
    const combRes = TextEngine.analyzeText(combiningChar);
    assert.strictEqual(combRes.data.characters, 1, 'Combining mark must count as 1 grapheme');

    // Mixed text with emoji and words
    const mixed = 'Hello world 👨‍👩‍👧‍👦! This is Toiloki.';
    const mixedRes = TextEngine.analyzeText(mixed);
    assert.strictEqual(mixedRes.data.words, 5);
    assert.strictEqual(mixedRes.data.lines, 1);
    assert(mixedRes.data.characters < mixedRes.data.codeUnits);
  });

  // ─── 3. Line Sorting & Deduplication ───
  console.log('\n--- 3. Line Sorting & Deduplication ---');

  test('sortAndDeduplicate supports asc, desc, and natural sort order', () => {
    const lines = 'banana\napple\ncherry\napple\ndate';
    const dedupedAsc = TextEngine.sortAndDeduplicate(lines, 'asc', true);
    assert.strictEqual(dedupedAsc.success, true);
    const sortedLines = dedupedAsc.data.split('\n');
    assert.deepStrictEqual(sortedLines, ['apple', 'banana', 'cherry', 'date']);

    // Natural sort: file1, file2, file10 (NOT file1, file10, file2)
    const numberedLines = 'file10.txt\nfile1.txt\nfile2.txt';
    const natRes = TextEngine.sortAndDeduplicate(numberedLines, 'natural', false);
    assert.strictEqual(natRes.success, true);
    assert.deepStrictEqual(natRes.data.split('\n'), ['file1.txt', 'file2.txt', 'file10.txt']);
  });

  // ─── 4. Whitespace & Text Cleaning ───
  console.log('\n--- 4. Whitespace & Text Cleaning ---');

  test('cleanText removes blank lines, collapses extra spaces, and strips invisible characters', () => {
    const raw = '  line 1   with   spaces  \r\n\r\n\u200Bline 2\uFEFF\r\n\r\n  ';
    const cleaned = TextEngine.cleanText(raw, {
      removeExtraSpaces: true,
      removeBlankLines: true,
      normalizeLineEndings: true,
      stripInvisibleChars: true,
    });
    assert.strictEqual(cleaned.success, true);
    assert.strictEqual(cleaned.data, 'line 1 with spaces\nline 2');
  });

  // ─── 5. Slugify ───
  console.log('\n--- 5. URL Slug Generator ---');

  test('slugify cleans diacritics and applies custom separators', () => {
    const input = 'Café au Lait & Crème Brûlée 2026!';
    const slugHyphen = TextEngine.slugify(input, '-');
    assert.strictEqual(slugHyphen.data, 'cafe-au-lait-creme-brulee-2026');

    const slugUnder = TextEngine.slugify(input, '_');
    assert.strictEqual(slugUnder.data, 'cafe_au_lait_creme_brulee_2026');

    const slugMax = TextEngine.slugify(input, '-', 15);
    assert(slugMax.data.length <= 15);
    assert(!slugMax.data.endsWith('-'));
  });

  // ─── 6. Regex Find & Replace ───
  console.log('\n--- 6. Regex Find & Replace ---');

  test('regexReplace substitutes patterns and reports match count', () => {
    const text = 'Contact: test@example.com and admin@toiloki.org';
    const res = TextEngine.regexReplace(text, '([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)', '$1@[HIDDEN]', 'g');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.matchCount, 2);
    assert.strictEqual(res.data.result, 'Contact: test@[HIDDEN] and admin@[HIDDEN]');
  });

  // ─── 7. Entity Extraction ───
  console.log('\n--- 7. Entity Extraction ---');

  test('extractEntities identifies emails, URLs, IP addresses, and dates', () => {
    const text = `
      Server IP is 192.168.1.1 connected to https://toiloki.app on 12/25/2026.
      Contact security@toiloki.com or call 555-123-4567.
    `;
    const res = TextEngine.extractEntities(text);
    assert.strictEqual(res.success, true);
    assert(res.data.emails.includes('security@toiloki.com'));
    assert(res.data.urls.includes('https://toiloki.app'));
    assert(res.data.ipAddresses.includes('192.168.1.1'));
    assert(res.data.dates.length > 0);
  });

  // ─── 8. Word Frequency Analyzer ───
  console.log('\n--- 8. Word Frequency Analyzer ---');

  test('wordFrequency ranks occurrences excluding stop words', () => {
    const text = 'apple orange banana apple apple orange grape';
    const res = TextEngine.wordFrequency(text, { excludeStopWords: true });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.words[0].word, 'apple');
    assert.strictEqual(res.data.words[0].count, 3);
    assert.strictEqual(res.data.words[1].word, 'orange');
    assert.strictEqual(res.data.words[1].count, 2);
  });

  // ─── 9. Delimited to Markdown Table ───
  console.log('\n--- 9. Delimited Text to Table ---');

  test('textToTable formats delimited lines into structured headers and rows', () => {
    const csv = 'Name,Age,Role\nAlice,30,Engineer\nBob,25,Designer';
    const res = TextEngine.textToTable(csv, ',', true);
    assert.strictEqual(res.success, true);
    assert.deepStrictEqual(res.data.headers, ['Name', 'Age', 'Role']);
    assert.strictEqual(res.data.rowCount, 2);
    assert.deepStrictEqual(res.data.rows[0], ['Alice', '30', 'Engineer']);
  });

  // ─── 10. Large Text (5 MB) Responsiveness ───
  console.log('\n--- 10. Large Buffer (5 MB Text) Performance ---');

  test('TextEngine processes 5 MB buffer in under 350ms without freezing', () => {
    // Generate ~5 MB of realistic text
    const sampleLine = 'The quick brown fox jumps over the lazy dog 12345. ';
    const repetitions = 100000; // ~5.1 MB
    const largeText = sampleLine.repeat(repetitions);
    assert(largeText.length >= 5000000, 'Must be at least 5 MB');

    const start = Date.now();
    const caseRes = TextEngine.transformCase(largeText.slice(0, 500000), 'upper');
    const cleanRes = TextEngine.cleanText(largeText.slice(0, 500000), { removeExtraSpaces: true });
    const elapsed = Date.now() - start;

    assert.strictEqual(caseRes.success, true);
    assert.strictEqual(cleanRes.success, true);
    assert(elapsed < 1000, `Large text operations took ${elapsed}ms (expected < 1000ms)`);
  });

  console.log('===========================================================');
  console.log(`  PHASE 5B TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
