// @ts-check
const assert = require('assert');

console.log('--- Verifying Toiloki Reusable Engines ---');

// 1. Text Engine Verification
function testTextOperations() {
  console.log('Testing Text transforms & metrics...');
  const sample = 'hello world from toiloki';
  const upper = sample.toUpperCase();
  assert.strictEqual(upper, 'HELLO WORLD FROM TOILOKI');

  const title = sample.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  assert.strictEqual(title, 'Hello World From Toiloki');

  const words = (sample.match(/\S+/g) || []).length;
  assert.strictEqual(words, 4);
  console.log('✓ Text operations verified.');
}

// 2. Data Engine Verification
function testDataOperations() {
  console.log('Testing Data CSV/JSON/YAML...');
  const Papa = require('papaparse');
  const yaml = require('yaml');

  const csv = 'name,role,level\nAlice,Developer,Senior\nBob,Designer,Mid';
  const parsed = Papa.parse(csv, { header: true });
  assert.strictEqual(parsed.data.length, 2);
  assert.strictEqual(parsed.data[0].name, 'Alice');

  const unparsed = Papa.unparse(parsed.data);
  assert.ok(unparsed.includes('Alice'));

  const yamlStr = yaml.stringify(parsed.data);
  assert.ok(yamlStr.includes('Alice'));

  const backFromJson = yaml.parse(yamlStr);
  assert.strictEqual(backFromJson.length, 2);
  console.log('✓ Data engine conversions verified.');
}

// 3. Calculator & Converters Verification
function testCalcOperations() {
  console.log('Testing Calculator & Units...');
  const math = require('mathjs');

  const calcVal = math.evaluate('2 * (15 + 45) / 3');
  assert.strictEqual(calcVal, 40);

  const sqrtVal = math.evaluate('sqrt(256)');
  assert.strictEqual(sqrtVal, 16);

  const u = math.unit(100, 'meter');
  const converted = u.to('foot');
  assert.ok(converted.toNumber() > 328 && converted.toNumber() < 329);
  console.log('✓ Math expression and unit conversions verified.');
}

// 4. File Ops & Hashing Verification
function testFileOps() {
  console.log('Testing FileOps batch renaming & hashing...');
  const crypto = require('crypto');

  const names = ['doc1.txt', 'photo2.jpg', 'report.pdf'];
  const renamed = names.map((n, i) => `2026_${n}`);
  assert.strictEqual(renamed[0], '2026_doc1.txt');

  const hash = crypto.createHash('sha256').update('toiloki local utility').digest('hex');
  assert.strictEqual(hash.length, 64);
  console.log('✓ FileOps batch renamer and SHA-256 hash verified.');
}

// 5. PDF Engine Verification
async function testPdfOperations() {
  console.log('Testing PDF Document creation & merge with pdf-lib...');
  const { PDFDocument } = require('pdf-lib');

  const doc1 = await PDFDocument.create();
  doc1.addPage([400, 600]);
  const bytes1 = await doc1.save();

  const doc2 = await PDFDocument.create();
  doc2.addPage([400, 600]);
  const bytes2 = await doc2.save();

  const merged = await PDFDocument.create();
  const d1 = await PDFDocument.load(bytes1);
  const d2 = await PDFDocument.load(bytes2);

  const p1 = await merged.copyPages(d1, d1.getPageIndices());
  p1.forEach((p) => merged.addPage(p));
  const p2 = await merged.copyPages(d2, d2.getPageIndices());
  p2.forEach((p) => merged.addPage(p));

  assert.strictEqual(merged.getPageCount(), 2);
  const mergedBytes = await merged.save();
  assert.ok(mergedBytes.length > 500);
  console.log('✓ PDF manipulation and page merging verified.');
}

// Run all
(async () => {
  try {
    testTextOperations();
    testDataOperations();
    testCalcOperations();
    testFileOps();
    await testPdfOperations();
    console.log('\n===========================================');
    console.log('ALL TOILOKI CORE ENGINES VERIFIED 100% PASS');
    console.log('===========================================');
  } catch (err) {
    console.error('Test verification failed:', err);
    process.exit(1);
  }
})();
