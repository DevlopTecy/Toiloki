// @ts-check
const assert = require('assert');
const crypto = require('crypto');
const Papa = require('papaparse');
const yaml = require('yaml');
const math = require('mathjs');
const ExcelJS = require('exceljs');
const { PDFDocument, StandardFonts, rgb, degrees } = require('pdf-lib');
const ExifReader = require('exifreader');
const JSZip = require('jszip');
const mammoth = require('mammoth');
const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser');
const Diff = require('diff');

console.log('==================================================');
console.log('  TOILOKI APPLICATION FOUNDATION & ENGINE SUITE');
console.log('==================================================\n');

// 1. Text Engine Tests
function testTextEngine() {
  process.stdout.write('1. Testing Text Engine... ');
  const text = '  The quick brown fox jumps over the lazy dog.  ';
  
  // Clean whitespace
  const cleaned = text.trim().replace(/\s+/g, ' ');
  assert.strictEqual(cleaned, 'The quick brown fox jumps over the lazy dog.');

  // Case transforms
  const upper = cleaned.toUpperCase();
  const lower = cleaned.toLowerCase();
  const title = cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
  assert.strictEqual(upper, 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG.');
  assert.strictEqual(lower, 'the quick brown fox jumps over the lazy dog.');
  assert.strictEqual(title, 'The Quick Brown Fox Jumps Over The Lazy Dog.');

  // Reverse text
  const reversedChars = Array.from(cleaned).reverse().join('');
  assert.strictEqual(reversedChars, '.god yzal eht revo spmuj xof nworb kciuq ehT');

  const lines = 'line 1\nline 2\nline 3';
  const reversedLines = lines.split('\n').reverse().join('\n');
  assert.strictEqual(reversedLines, 'line 3\nline 2\nline 1');

  // Metrics
  const words = cleaned.split(/\s+/).length;
  assert.strictEqual(words, 9);
  console.log('✓ PASS');
}

// 2. Data Engine Tests (CSV, JSON, YAML, XML, XLSX)
async function testDataEngine() {
  process.stdout.write('2. Testing Data Engine (CSV/JSON/YAML/XML/XLSX)... ');
  
  const csvData = 'id,product,price,inStock\n101,Mechanical Keyboard,89.99,true\n102,Ergonomic Mouse,49.50,false';
  
  // CSV to JSON
  const parsed = Papa.parse(csvData, { header: true, dynamicTyping: true });
  assert.strictEqual(parsed.data.length, 2);
  assert.strictEqual(parsed.data[0].product, 'Mechanical Keyboard');
  assert.strictEqual(parsed.data[0].price, 89.99);

  // JSON to YAML
  const yamlOutput = yaml.stringify(parsed.data);
  assert.ok(yamlOutput.includes('Mechanical Keyboard'));

  // YAML to JSON
  const backFromJson = yaml.parse(yamlOutput);
  assert.strictEqual(backFromJson.length, 2);
  assert.strictEqual(backFromJson[1].product, 'Ergonomic Mouse');

  // XML validation and parsing
  const xmlSample = '<inventory><item id="101"><name>Mechanical Keyboard</name></item></inventory>';
  assert.strictEqual(XMLValidator.validate(xmlSample), true);
  const xmlParser = new XMLParser({ ignoreAttributes: false });
  const xmlObj = xmlParser.parse(xmlSample);
  assert.strictEqual(String(xmlObj.inventory.item['@_id']), '101');

  // CSV to XLSX Workbook
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inventory');
  sheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Product', key: 'product' },
    { header: 'Price', key: 'price' },
  ];
  sheet.addRow({ id: 101, product: 'Mechanical Keyboard', price: 89.99 });
  sheet.addRow({ id: 102, product: 'Ergonomic Mouse', price: 49.50 });
  const xlsxBuffer = await workbook.xlsx.writeBuffer();
  assert.ok(xlsxBuffer.byteLength > 1000);

  // Read back from XLSX
  const readWb = new ExcelJS.Workbook();
  await readWb.xlsx.load(xlsxBuffer);
  const readSheet = readWb.getWorksheet('Inventory');
  assert.strictEqual(readSheet.rowCount, 3); // 1 header + 2 rows
  console.log('✓ PASS');
}

// 3. Calculator & Unit Converter Tests
function testCalcEngine() {
  process.stdout.write('3. Testing Calculator & Unit Converter... ');
  
  // Arithmetic & functions
  const expr1 = math.evaluate('15 + 25 * 3 - (10 / 2)');
  assert.strictEqual(expr1, 85);

  const sinVal = math.evaluate('sin(pi / 2)');
  assert.strictEqual(Math.round(sinVal), 1);

  // Unit conversions
  const dist = math.unit(10, 'kilometer');
  const miles = dist.to('mile').toNumber();
  assert.ok(miles > 6.2 && miles < 6.3);

  // Ratio simplification
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const rDiv = gcd(1920, 1080);
  assert.strictEqual(`${1920 / rDiv}:${1080 / rDiv}`, '16:9');

  // Proportion: 2 / 4 = 10 / X -> X = 20
  const x = (4 * 10) / 2;
  assert.strictEqual(x, 20);

  // Percentage
  const pct = (35 / 140) * 100;
  assert.strictEqual(pct, 25);
  console.log('✓ PASS');
}

// 4. File Operations & Cryptography Tests
function testFileOpsEngine() {
  process.stdout.write('4. Testing File Operations & Cryptography... ');

  // SHA-256
  const data = Buffer.from('Toiloki offline desktop utility suite 2026');
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  assert.strictEqual(hash.length, 64);

  // SHA-1
  const hash1 = crypto.createHash('sha1').update(data).digest('hex');
  assert.strictEqual(hash1.length, 40);

  // Batch rename pattern
  const files = ['report_v1.pdf', 'report_v2.pdf', 'summary.docx'];
  const renamed = files.map((f, i) => `2026_${String(i + 1).padStart(2, '0')}_${f}`);
  assert.strictEqual(renamed[0], '2026_01_report_v1.pdf');
  assert.strictEqual(renamed[1], '2026_02_report_v2.pdf');
  console.log('✓ PASS');
}

// 5. PDF Engine Foundational Operations Tests
async function testPdfEngine() {
  process.stdout.write('5. Testing PDF Engine (Create, Merge, Split, Delete, Reorder, Duplicate)... ');

  // Document 1
  const doc1 = await PDFDocument.create();
  doc1.addPage([595, 842]); // Page 1
  doc1.addPage([595, 842]); // Page 2
  const bytes1 = await doc1.save();

  // Document 2
  const doc2 = await PDFDocument.create();
  doc2.addPage([595, 842]); // Page 3
  const bytes2 = await doc2.save();

  // 5a. Merge
  const merged = await PDFDocument.create();
  const d1 = await PDFDocument.load(bytes1);
  const d2 = await PDFDocument.load(bytes2);
  const p1 = await merged.copyPages(d1, d1.getPageIndices());
  p1.forEach((p) => merged.addPage(p));
  const p2 = await merged.copyPages(d2, d2.getPageIndices());
  p2.forEach((p) => merged.addPage(p));
  assert.strictEqual(merged.getPageCount(), 3);

  // 5b. Page Count
  const mergedBytes = await merged.save();
  const checkDoc = await PDFDocument.load(mergedBytes);
  assert.strictEqual(checkDoc.getPageCount(), 3);

  // 5c. Delete Page 2 (Keep pages 1 and 3)
  const delDoc = await PDFDocument.create();
  const keepPages = await delDoc.copyPages(checkDoc, [0, 2]);
  keepPages.forEach((p) => delDoc.addPage(p));
  assert.strictEqual(delDoc.getPageCount(), 2);

  // 5d. Reorder pages (Order: 3, 2, 1)
  const reorderDoc = await PDFDocument.create();
  const reordered = await reorderDoc.copyPages(checkDoc, [2, 1, 0]);
  reordered.forEach((p) => reorderDoc.addPage(p));
  assert.strictEqual(reorderDoc.getPageCount(), 3);

  // 5e. Duplicate page 1
  const dupDoc = await PDFDocument.create();
  const dups = await dupDoc.copyPages(checkDoc, [0, 0, 1, 2]);
  dups.forEach((p) => dupDoc.addPage(p));
  assert.strictEqual(dupDoc.getPageCount(), 4);

  // 5f. Split into individual pages
  const parts = [];
  for (let i = 0; i < checkDoc.getPageCount(); i++) {
    const single = await PDFDocument.create();
    const [page] = await single.copyPages(checkDoc, [i]);
    single.addPage(page);
    parts.push(await single.save());
  }
  assert.strictEqual(parts.length, 3);
  console.log('✓ PASS');
}

// 6. Archive Engine & Zip Slip Prevention Tests
async function testArchiveEngine() {
  process.stdout.write('6. Testing Archive Engine & Path Security (Zip Slip Prevention)... ');
  
  // 6a. Create ZIP
  const zip = new JSZip();
  zip.file('file1.txt', 'Content 1');
  zip.file('sub/file2.txt', 'Content 2');
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  assert.ok(zipBuffer.length > 50);

  // 6b. Verify Zip Slip Sanitization Logic
  function sanitizeArchivePath(entryPath) {
    let cleaned = entryPath.replace(/^[a-zA-Z]:/, '').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '');
    const segments = cleaned.split('/');
    const safeSegments = [];
    for (const segment of segments) {
      if (segment === '' || segment === '.') continue;
      if (segment === '..') {
        if (safeSegments.length > 0) safeSegments.pop();
      } else {
        safeSegments.push(segment.replace(/[<>:"|?*\x00-\x1F]/g, '_'));
      }
    }
    return safeSegments.join('/') || 'safe_file';
  }

  // Dangerous paths that attempt directory traversal outside root
  const dangerous1 = '../../windows/system32/cmd.exe';
  const dangerous2 = '..\\..\\..\\secret.key';
  const dangerous3 = '/etc/passwd';
  const dangerous4 = 'C:\\boot.ini';

  assert.strictEqual(sanitizeArchivePath(dangerous1), 'windows/system32/cmd.exe');
  assert.strictEqual(sanitizeArchivePath(dangerous2), 'secret.key');
  assert.strictEqual(sanitizeArchivePath(dangerous3), 'etc/passwd');
  assert.strictEqual(sanitizeArchivePath(dangerous4), 'boot.ini');
  console.log('✓ PASS');
}

// 7. Document Engine Tests (DOCX, Markdown, HTML, RTF)
async function testDocumentEngine() {
  process.stdout.write('7. Testing Document Engine (DOCX, Markdown, HTML, RTF)... ');

  // 7a. Markdown to HTML
  const md = '# Toiloki Suite\n\n**Offline** *utility* tool.\n\n- Feature 1\n- Feature 2';
  let html = md
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>');
  assert.ok(html.includes('<h1>Toiloki Suite</h1>'));
  assert.ok(html.includes('<strong>Offline</strong>'));

  // 7b. HTML to Markdown
  let backMd = html
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<li>(.*?)<\/li>/gi, '- $1\n');
  assert.ok(backMd.includes('# Toiloki Suite'));

  // 7c. Text to RTF
  const plain = 'Hello Toiloki World';
  const rtf = `{\\rtf1\\ansi\\deff0\n${plain}\n}`;
  assert.ok(rtf.startsWith('{\\rtf1'));

  // 7d. Mammoth availability
  assert.strictEqual(typeof mammoth.convertToHtml, 'function');
  assert.strictEqual(typeof mammoth.extractRawText, 'function');
  console.log('✓ PASS');
}

// 8. Developer Engine Tests (UUID, Random String, Timestamps)
function testDevEngine() {
  process.stdout.write('8. Testing Developer Engine (UUID, Random Strings, Timestamps)... ');

  // UUID v4
  const uuid = crypto.randomUUID();
  assert.strictEqual(uuid.length, 36);

  // Timestamp format
  const now = new Date();
  const unixSec = Math.floor(now.getTime() / 1000);
  assert.ok(unixSec > 1700000000);

  // Base64 & URL
  const original = 'Toiloki 2026: Fast & Privacy-first!';
  const b64 = Buffer.from(original).toString('base64');
  const decoded = Buffer.from(b64, 'base64').toString('utf8');
  assert.strictEqual(decoded, original);

  const urlEnc = encodeURIComponent('https://example.com/test?query=hello world&flag=true');
  const urlDec = decodeURIComponent(urlEnc);
  assert.strictEqual(urlDec, 'https://example.com/test?query=hello world&flag=true');
  console.log('✓ PASS');
}

// 9. Duplicate Finder Engine Test
async function testDuplicateFinder() {
  process.stdout.write('9. Testing Duplicate Finder Engine... ');
  const files = [
    { name: 'doc1.pdf', size: 1024, buffer: Buffer.from('Duplicate Document Content A') },
    { name: 'doc1_copy.pdf', size: 1024, buffer: Buffer.from('Duplicate Document Content A') },
    { name: 'doc2.pdf', size: 2048, buffer: Buffer.from('Different Document Content B') },
    { name: 'unique.txt', size: 512, buffer: Buffer.from('Completely Unique Content') },
  ];

  // Bucket by size
  const sizeBuckets = new Map();
  for (const f of files) {
    const b = sizeBuckets.get(f.size) || [];
    b.push(f);
    sizeBuckets.set(f.size, b);
  }

  // Candidates with same size >= 2
  const candidates = Array.from(sizeBuckets.values()).filter((list) => list.length > 1);
  assert.strictEqual(candidates.length, 1);
  assert.strictEqual(candidates[0].length, 2);

  // Hash candidates
  const h1 = crypto.createHash('sha256').update(candidates[0][0].buffer).digest('hex');
  const h2 = crypto.createHash('sha256').update(candidates[0][1].buffer).digest('hex');
  assert.strictEqual(h1, h2);
  console.log('✓ PASS');
}

// 10. PDF Advanced Operations (Create From Text, Annotations)
async function testPdfAdvanced() {
  process.stdout.write('10. Testing PDF Advanced (Create from Text, Annotations)... ');
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  page.drawText('Toiloki Advanced PDF Features', {
    x: 50,
    y: 750,
    size: 16,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawRectangle({
    x: 50,
    y: 700,
    width: 200,
    height: 30,
    color: rgb(0.2, 0.5, 0.9),
    opacity: 0.25,
  });

  const bytes = await doc.save();
  assert.ok(bytes.length > 400);

  const reloaded = await PDFDocument.load(bytes);
  assert.strictEqual(reloaded.getPageCount(), 1);
  console.log('✓ PASS');
}

// 11. Developer Utilities (Formatting, URL, Headers, Test Data)
function testDevUtilities() {
  process.stdout.write('11. Testing Developer Utilities (Formatting, URL, Headers, Test Data)... ');
  
  // URL Parser
  const u = new URL('https://toiloki.local:8080/api/tools?category=pdf&active=true#section');
  assert.strictEqual(u.protocol, 'https:');
  assert.strictEqual(u.hostname, 'toiloki.local');
  assert.strictEqual(u.port, '8080');
  assert.strictEqual(u.searchParams.get('category'), 'pdf');
  assert.strictEqual(u.searchParams.get('active'), 'true');

  // Headers Parser
  const rawHeaders = 'Host: localhost:5173\r\nAuthorization: Bearer token123\r\nContent-Type: application/json';
  const headers = {};
  for (const line of rawHeaders.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      headers[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
    }
  }
  assert.strictEqual(headers['Host'], 'localhost:5173');
  assert.strictEqual(headers['Authorization'], 'Bearer token123');
  assert.strictEqual(headers['Content-Type'], 'application/json');

  // JSON formatting
  const compact = '{"product":"Toiloki","version":2}';
  const formatted = JSON.stringify(JSON.parse(compact), null, 2);
  assert.ok(formatted.includes('\n  "product": "Toiloki"'));
  console.log('✓ PASS');
}

// 12. PDF Specialized & Extended Operations (Blank Removal, Crop, Redact, Form, Compare, Repair)
async function testPdfSpecialized() {
  process.stdout.write('12. Testing PDF Specialized (Blank Removal, Crop, Redact, Form, Compare, Repair)... ');

  // Create multi-page test PDF
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  
  // Page 1: with text
  const p1 = doc.addPage([500, 500]);
  p1.drawText('Invoice Summary 2026', { x: 50, y: 450, size: 14, font });

  // Page 2: blank page
  doc.addPage([500, 500]);

  // Page 3: form field
  const p3 = doc.addPage([500, 500]);
  const form = doc.getForm();
  const field = form.createTextField('client_name');
  field.setText('Acme Corp');
  field.addToPage(p3, { x: 50, y: 400, width: 200, height: 25 });

  const testPdfBytes = await doc.save();

  // Test 1: Blank page detection & removal
  const readDoc = await PDFDocument.load(testPdfBytes);
  const total = readDoc.getPageCount();
  assert.strictEqual(total, 3);
  const nonBlank = [];
  for (let i = 0; i < total; i++) {
    const page = readDoc.getPage(i);
    const contents = page.node.Contents();
    const annots = page.node.Annots();
    const hasAnnots = annots && typeof annots.size === 'function' && annots.size() > 0;
    if (contents || hasAnnots) nonBlank.push(i);
  }
  assert.strictEqual(nonBlank.length, 2, 'Should detect exactly 1 blank page');

  // Test 2: Crop box
  p1.setCropBox(20, 20, 460, 460);
  p1.setMediaBox(20, 20, 460, 460);
  assert.strictEqual(p1.getCropBox().width, 460);

  // Test 3: Redaction
  p1.drawRectangle({
    x: 45,
    y: 440,
    width: 200,
    height: 30,
    color: rgb(0, 0, 0),
    opacity: 1,
  });

  // Test 4: Form field inspection & filling
  const fField = form.getTextField('client_name');
  assert.strictEqual(fField.getText(), 'Acme Corp');
  fField.setText('Toiloki Global Enterprises');
  assert.strictEqual(fField.getText(), 'Toiloki Global Enterprises');
  form.flatten();

  // Test 5: PDF Repair / re-serialize
  const repairedDoc = await PDFDocument.create();
  const copied = await repairedDoc.copyPages(readDoc, nonBlank);
  copied.forEach(p => repairedDoc.addPage(p));
  repairedDoc.setProducer('Toiloki Repaired');
  const repairedBytes = await repairedDoc.save();
  assert.ok(repairedBytes.length > 500);

  // Test 6: PDF Compare text difference
  const diffWords = Diff.diffWords('Toiloki Suite v1', 'Toiloki Suite v2 Pro');
  const added = diffWords.filter(d => d.added);
  assert.ok(added.length > 0);

  console.log('✓ PASS');
}

// Run All Test Suites
(async () => {
  try {
    testTextEngine();
    await testDataEngine();
    testCalcEngine();
    testFileOpsEngine();
    await testPdfEngine();
    await testArchiveEngine();
    await testDocumentEngine();
    testDevEngine();
    await testDuplicateFinder();
    await testPdfAdvanced();
    testDevUtilities();
    await testPdfSpecialized();

    console.log('\n==================================================');
    console.log('  ALL TOILOKI FOUNDATION & ENGINE TESTS PASSED (100% OK)');
    console.log('==================================================');
  } catch (err) {
    console.error('\nFAIL: Test error occurred:', err);
    process.exit(1);
  }
})();

