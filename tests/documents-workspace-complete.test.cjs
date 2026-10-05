'use strict';

const assert = require('assert');
const JSZip = require('jszip');

// Import DocumentEngine from compiled or source via dynamic compilation or direct Node require
let DocumentEngine;
try {
  const ts = require('typescript');
  const fs = require('fs');
  const path = require('path');

  const engineFile = path.resolve(__dirname, '../src/engines/documents/document.engine.ts');
  const engineSource = fs.readFileSync(engineFile, 'utf8');

  // Strip external dependencies if running in simple node environment or mock mammoth/jszip/pdf
  JSZip.default = JSZip;
  const transpiled = ts.transpileModule(engineSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });

  const moduleEnv = { exports: {} };
  const mockMammoth = {
    convertToHtml: async () => ({ value: '<h1>Mock DOCX Title</h1><p>Test paragraph</p>', messages: [] }),
    extractRawText: async () => ({ value: 'Mock DOCX Title\nTest paragraph', messages: [] }),
  };
  const mockPdfEngine = {
    extractText: async () => ({ success: true, data: 'Extracted PDF document text' }),
  };

  const fn = new Function('require', 'module', 'exports', transpiled.outputText);
  const customRequire = (name) => {
    if (name === 'mammoth') return mockMammoth;
    if (name === 'jszip') return JSZip;
    if (name.includes('pdf.engine')) return { PdfEngine: mockPdfEngine };
    return require(name);
  };

  fn(customRequire, moduleEnv, moduleEnv.exports);
  DocumentEngine = moduleEnv.exports.DocumentEngine;
} catch (e) {
  console.error('Failed to load DocumentEngine in test:', e);
  process.exit(1);
}

console.log('===========================================================');
console.log(' PHASE 4C: DOCUMENTS WORKSPACE COMPLETE TEST SUITE        ');
console.log('===========================================================\n');

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failedCount++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failedCount++;
  }
}

async function runAll() {
  // ─── 1. Markdown to HTML & HTML to Markdown ───
  console.log('--- 1. Markdown & HTML Bi-directional Conversion ---');
  runTest('Markdown to HTML converts headings, bold, code, and lists', () => {
    const md = '# Title\n\n**Bold text** and *italic*\n\n`inline code`\n\n- Item 1\n- Item 2';
    const res = DocumentEngine.markdownToHtml(md);
    assert.strictEqual(res.success, true);
    assert(res.data.includes('<h1>Title</h1>'), 'Should contain h1');
    assert(res.data.includes('<strong>Bold text</strong>'), 'Should contain strong');
    assert(res.data.includes('<code>inline code</code>'), 'Should contain code');
    assert(res.data.includes('<li>Item 1</li>'), 'Should contain li');
  });

  runTest('HTML to Markdown converts headers and formatting tags', () => {
    const html = '<h1>Main Heading</h1><p>A paragraph with <strong>bold words</strong>.</p>';
    const res = DocumentEngine.htmlToMarkdown(html);
    assert.strictEqual(res.success, true);
    assert(res.data.includes('# Main Heading'), 'Should convert to markdown heading');
    assert(res.data.includes('**bold words**'), 'Should convert to markdown bold');
  });

  // ─── 2. DOCX OpenXML Generation ───
  console.log('\n--- 2. DOCX OpenXML Creation ---');
  await runAsyncTest('createDocxFromText produces valid OpenXML container', async () => {
    const text = 'First Paragraph\nSecond Paragraph with special & < > characters';
    const res = await DocumentEngine.createDocxFromText(text, 'TestDoc');
    assert.strictEqual(res.success, true);
    assert(res.data instanceof Uint8Array, 'Output must be Uint8Array');
    assert(res.data.length > 500, 'DOCX package should have reasonable byte size');

    // Unpack ZIP to verify internal OpenXML structure
    const zip = await JSZip.loadAsync(res.data);
    assert(zip.file('[Content_Types].xml') !== null, 'Must contain [Content_Types].xml');
    assert(zip.file('word/document.xml') !== null, 'Must contain word/document.xml');

    const docXml = await zip.file('word/document.xml').async('text');
    assert(docXml.includes('First Paragraph'), 'Must contain text in document.xml');
    assert(docXml.includes('&amp;'), 'Must XML-escape ampersands');
  });

  // ─── 3. Table of Contents Generator ───
  console.log('\n--- 3. Table of Contents Generator ---');
  runTest('generateToc builds nested markdown and numbered heading index', () => {
    const md = '# Introduction\n\nSome text\n## Background\n\nMore text\n### Architecture\n\nDetails\n## Conclusion';
    const resMd = DocumentEngine.generateToc(md, { format: 'markdown', maxDepth: 3 });
    assert.strictEqual(resMd.success, true);
    assert(resMd.data.toc.includes('- [Introduction](#introduction)'), 'Markdown TOC link');
    assert(resMd.data.toc.includes('  - [Background](#background)'), 'Nested TOC link');

    const resNum = DocumentEngine.generateToc(md, { format: 'numbered', maxDepth: 2 });
    assert.strictEqual(resNum.success, true);
    assert(resNum.data.toc.includes('1. Introduction'), 'Numbered TOC root');
    assert(resNum.data.toc.includes('1.1. Background'), 'Numbered TOC subitem');
  });

  // ─── 4. Mail Merge & Delimiters ───
  console.log('\n--- 4. Mail Merge & Placeholder Extraction ---');
  runTest('extractPlaceholders detects {{mustache}}, ${dollar}, and [bracket] tokens', () => {
    const template = 'Dear {{recipient}},\nYour invoice #${invoiceNumber} is due on [dueDate].';
    const tokens = DocumentEngine.extractPlaceholders(template);
    assert.deepStrictEqual(tokens.sort(), ['dueDate', 'invoiceNumber', 'recipient'].sort());
  });

  runTest('mailMerge substitutes multiple records with clean output', () => {
    const template = 'Hello {{name}} from {{company}}!';
    const records = [
      { name: 'Alice', company: 'Acme' },
      { name: 'Bob', company: 'Globex' },
    ];
    const res = DocumentEngine.mailMerge(template, records);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.count, 2);
    assert.strictEqual(res.data.mergedDocs[0], 'Hello Alice from Acme!');
    assert.strictEqual(res.data.mergedDocs[1], 'Hello Bob from Globex!');
  });

  // ─── 5. Batch Find & Replace with Modifiers ───
  console.log('\n--- 5. Batch Find & Replace with Modifiers ---');
  runTest('batchFindReplace respects case-sensitivity, whole word, and regex', () => {
    const text = 'The cat sat on the Cat mat. Catalog of cats.';
    const rules = [
      { find: 'cat', replace: 'dog', matchCase: true, matchWholeWord: true },
      { find: 'Cat', replace: 'Feline', matchCase: true, matchWholeWord: true },
    ];
    const res = DocumentEngine.batchFindReplace(text, rules);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.replacementsCount, 2);
    assert(res.data.text.includes('The dog sat on the Feline mat.'), 'Replaced exact words');
    assert(res.data.text.includes('Catalog of cats.'), 'Whole-word avoided Catalog and cats');
  });

  // ─── 6. Two-Pane Diff with Line Numbers & Gutters ───
  console.log('\n--- 6. Two-Pane Document Diff ---');
  runTest('computeDiff calculates additions, deletions, and modifications', () => {
    const docA = 'Line 1\nLine 2 original\nLine 3 unchanged\nLine 4 will be removed';
    const docB = 'Line 1\nLine 2 modified\nLine 3 unchanged\nLine 5 brand new';

    const res = DocumentEngine.computeDiff(docA, docB);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.identical, false);
    assert.strictEqual(res.data.lines.length, 4);

    const l1 = res.data.lines[0];
    assert.strictEqual(l1.type, 'equal');

    const l2 = res.data.lines[1];
    assert.strictEqual(l2.type, 'modified');

    const l3 = res.data.lines[2];
    assert.strictEqual(l3.type, 'equal');

    const l4 = res.data.lines[3];
    assert.strictEqual(l4.type, 'modified');
  });

  runTest('computeDiff respects ignoreWhitespace toggle', () => {
    const docA = '  Header with spaces  \nContent';
    const docB = 'Header with spaces\nContent';

    const diffStrict = DocumentEngine.computeDiff(docA, docB, { ignoreWhitespace: false });
    assert.strictEqual(diffStrict.data.lines[0].type, 'modified');

    const diffLoose = DocumentEngine.computeDiff(docA, docB, { ignoreWhitespace: true });
    assert.strictEqual(diffLoose.data.lines[0].type, 'equal');
  });

  // ─── 7. Unicode & BOM Detection ───
  console.log('\n--- 7. Unicode & Multi-Encoding Decoding ---');
  runTest('decodeTextBuffer handles UTF-8 BOM, UTF-16LE, and plain UTF-8', () => {
    // 1. Plain UTF-8
    const plainUtf8 = new TextEncoder().encode('Hello World');
    assert.strictEqual(DocumentEngine.decodeTextBuffer(plainUtf8), 'Hello World');

    // 2. UTF-8 with BOM: EF BB BF
    const bomUtf8 = new Uint8Array([0xEF, 0xBB, 0xBF, ...new TextEncoder().encode('BOM Document')]);
    assert.strictEqual(DocumentEngine.decodeTextBuffer(bomUtf8), 'BOM Document');

    // 3. UTF-16 LE: FF FE
    const utf16leBuffer = new Uint8Array([0xFF, 0xFE, 0x54, 0x00, 0x65, 0x00, 0x73, 0x00, 0x74, 0x00]); // "Test"
    assert.strictEqual(DocumentEngine.decodeTextBuffer(utf16leBuffer), 'Test');
  });

  // ─── 8. Office Metadata Inspector & Scrubber ───
  console.log('\n--- 8. Office Metadata Inspector & Scrubber ---');
  await runAsyncTest('inspectOfficeMetadata and scrubOfficeMetadata sanitize author and company', async () => {
    const zip = new JSZip();
    zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>Confidential Financial Report</dc:title>
  <dc:creator>John Doe</dc:creator>
  <cp:lastModifiedBy>Jane Smith</cp:lastModifiedBy>
  <cp:revision>14</cp:revision>
</cp:coreProperties>`);

    zip.file('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Microsoft Office Word</Application>
  <Company>MegaCorp Global</Company>
</Properties>`);

    const mockOfficeBytes = await zip.generateAsync({ type: 'uint8array' });

    // Inspect
    const inspectRes = await DocumentEngine.inspectOfficeMetadata(mockOfficeBytes);
    assert.strictEqual(inspectRes.success, true);
    assert.strictEqual(inspectRes.data.title, 'Confidential Financial Report');
    assert.strictEqual(inspectRes.data.creator, 'John Doe');
    assert.strictEqual(inspectRes.data.company, 'MegaCorp Global');
    assert.strictEqual(inspectRes.data.hasMetadata, true);

    // Scrub
    const scrubRes = await DocumentEngine.scrubOfficeMetadata(mockOfficeBytes);
    assert.strictEqual(scrubRes.success, true);
    assert(scrubRes.data instanceof Uint8Array, 'Scrubbed output must be valid buffer');

    // Re-inspect scrubbed
    const scrubbedInspect = await DocumentEngine.inspectOfficeMetadata(scrubRes.data);
    assert.strictEqual(scrubbedInspect.success, true);
    assert.strictEqual(scrbedTitleOrEmpty(scrubbedInspect.data.title), '');
    assert.strictEqual(scrbedTitleOrEmpty(scrubbedInspect.data.creator), '');
    assert.strictEqual(scrbedTitleOrEmpty(scrubbedInspect.data.company), '');
    assert.strictEqual(scrubbedInspect.data.revision, '1');
    assert.strictEqual(scrubbedInspect.data.application, 'Toiloki Local Suite');
  });

  console.log('\n===========================================================');
  console.log(` PHASE 4C TEST RESULTS: ${passedCount} passed, ${failedCount} failed`);
  console.log('===========================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

function scrbedTitleOrEmpty(val) {
  return val ? val.trim() : '';
}

runAll().catch((e) => {
  console.error('Fatal test runner failure:', e);
  process.exit(1);
});
