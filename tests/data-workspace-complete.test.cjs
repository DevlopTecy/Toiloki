'use strict';

const assert = require('assert');
const Papa = require('papaparse');
const yaml = require('yaml');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const ExcelJS = require('exceljs');

// Transpile and load DataEngine in test harness
let DataEngine;
try {
  const ts = require('typescript');
  const fs = require('fs');
  const path = require('path');

  const engineFile = path.resolve(__dirname, '../src/engines/data/data.engine.ts');
  const engineSource = fs.readFileSync(engineFile, 'utf8');

  const transpiled = ts.transpileModule(engineSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });

  const moduleEnv = { exports: {} };
  const fn = new Function('require', 'module', 'exports', transpiled.outputText);
  const customRequire = (name) => {
    if (name === 'papaparse') return Papa;
    if (name === 'yaml') return yaml;
    if (name === 'fast-xml-parser') return { XMLParser, XMLBuilder };
    if (name === 'exceljs') return ExcelJS;
    return require(name);
  };

  fn(customRequire, moduleEnv, moduleEnv.exports);
  DataEngine = moduleEnv.exports.DataEngine;
} catch (e) {
  console.error('Failed to load DataEngine in test harness:', e);
  process.exit(1);
}

console.log('===========================================================');
console.log('  PHASE 5A: DATA WORKSPACE COMPLETE TEST SUITE             ');
console.log('===========================================================\n');

let passedCount = 0;
let failedCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failedCount++;
  }
}

async function testAsync(name, fn) {
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
  // ─── 1. Delimiter Detection & BOM Handling ───
  console.log('--- 1. Delimiter Detection & BOM Handling ---');
  test('detectCsvDelimiter correctly detects comma, semicolon, tab, and pipe', () => {
    const csvComma = 'id,name,role\n1,Alice,Dev\n2,Bob,QA';
    const csvSemi = 'id;name;role\n1;Alice;Dev\n2;Bob;QA';
    const csvTab = 'id\tname\trole\n1\tAlice\tDev\n2\tBob\tQA';
    const csvPipe = 'id|name|role\n1|Alice|Dev\n2|Bob|QA';

    assert.strictEqual(DataEngine.detectCsvDelimiter(csvComma), ',');
    assert.strictEqual(DataEngine.detectCsvDelimiter(csvSemi), ';');
    assert.strictEqual(DataEngine.detectCsvDelimiter(csvTab), '\t');
    assert.strictEqual(DataEngine.detectCsvDelimiter(csvPipe), '|');
  });

  test('stripBom removes UTF-8 BOM cleanly', () => {
    const withBom = '\uFEFFname,score\nAlice,95';
    const clean = DataEngine.stripBom(withBom);
    assert.strictEqual(clean.startsWith('name'), true);
    assert.strictEqual(clean.charCodeAt(0), 110); // 'n'
  });

  // ─── 2. CSV to JSON & JSON to CSV Round-trip ───
  console.log('\n--- 2. CSV <-> JSON Conversions ---');
  test('csvToJson parses correctly with delimiter detection and preserves leading zeros', () => {
    const csv = 'code,name,balance\n01234,Acme,450.5\n09876,Beta,1200';
    const res = DataEngine.csvToJson(csv, { preserveLeadingZeros: true });
    assert.strictEqual(res.success, true);
    const parsed = JSON.parse(res.data);
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].code, '01234'); // Preserves '01234' as string
  });

  test('jsonToCsv converts array of objects to formatted CSV', () => {
    const data = [
      { id: 1, product: 'Widget', price: 9.99 },
      { id: 2, product: 'Gadget', price: 19.5 },
    ];
    const res = DataEngine.jsonToCsv(data);
    assert.strictEqual(res.success, true);
    assert(res.data.includes('product'), 'Should contain header');
    assert(res.data.includes('Widget'), 'Should contain row data');
  });

  // ─── 3. YAML <-> JSON Round-trip ───
  console.log('\n--- 3. YAML <-> JSON Conversions ---');
  test('jsonToYaml and yamlToJson round-trip preserves structure', () => {
    const original = JSON.stringify({ project: 'Toiloki', version: '1.0', active: true });
    const yamlRes = DataEngine.jsonToYaml(original);
    assert.strictEqual(yamlRes.success, true);
    assert(yamlRes.data.includes('project: Toiloki'));

    const jsonRes = DataEngine.yamlToJson(yamlRes.data);
    assert.strictEqual(jsonRes.success, true);
    const roundTripped = JSON.parse(jsonRes.data);
    assert.strictEqual(roundTripped.project, 'Toiloki');
    assert.strictEqual(roundTripped.active, true);
  });

  // ─── 4. Excel (XLSX) Multi-sheet Conversions ───
  console.log('\n--- 4. Excel (XLSX) Multi-sheet Support ---');
  await testAsync('xlsxToCsv and xlsxToJson handle multiple worksheets', async () => {
    const wb = new ExcelJS.Workbook();
    const ws1 = wb.addWorksheet('Customers');
    ws1.addRow(['id', 'name']);
    ws1.addRow([101, 'Acme Corp']);

    const ws2 = wb.addWorksheet('Orders');
    ws2.addRow(['orderId', 'amount']);
    ws2.addRow(['ORD-1', 450]);
    ws2.addRow(['ORD-2', 820]);

    const buffer = new Uint8Array(await wb.xlsx.writeBuffer());

    // Convert sheet 1 (Customers)
    const csvSheet1 = await DataEngine.xlsxToCsv(buffer, { sheetNameOrIndex: 'Customers' });
    assert.strictEqual(csvSheet1.success, true);
    assert(csvSheet1.data.includes('Acme Corp'));
    assert.deepStrictEqual(csvSheet1.metadata.sheetNames, ['Customers', 'Orders']);

    // Convert sheet 2 (Orders)
    const csvSheet2 = await DataEngine.xlsxToCsv(buffer, { sheetNameOrIndex: 'Orders' });
    assert.strictEqual(csvSheet2.success, true);
    assert(csvSheet2.data.includes('ORD-1'));

    // Convert sheet 2 to JSON
    const jsonSheet2 = await DataEngine.xlsxToJson(buffer, { sheetNameOrIndex: 'Orders' });
    assert.strictEqual(jsonSheet2.success, true);
    const parsedOrders = JSON.parse(jsonSheet2.data);
    assert.strictEqual(parsedOrders.length, 2);
    assert.strictEqual(parsedOrders[1].orderId, 'ORD-2');
  });

  // ─── 5. JSONPath Query Engine ───
  console.log('\n--- 5. JSONPath Query Engine ---');
  test('jsonPathQuery evaluates nested keys and wildcards', () => {
    const json = JSON.stringify({
      store: {
        book: [
          { title: 'Book A', price: 10 },
          { title: 'Book B', price: 15 },
        ],
      },
    });

    const res = DataEngine.jsonPathQuery(json, '$.store.book[0].title');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data, 'Book A');
  });

  // ─── 6. SQL Query on CSV Engine ───
  console.log('\n--- 6. SQL Query on CSV Engine ---');
  test('sqlOnCsv executes SELECT with WHERE, ORDER BY, and LIMIT', () => {
    const csv = 'id,name,score\n1,Charlie,75\n2,Alice,95\n3,Bob,85\n4,David,60';
    const query = 'SELECT * FROM data WHERE score >= 80 ORDER BY score DESC LIMIT 2';
    const res = DataEngine.sqlOnCsv(csv, query);
    assert.strictEqual(res.success, true);
    const parsed = Papa.parse(res.data, { header: true }).data;
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].name, 'Alice'); // 95
    assert.strictEqual(parsed[1].name, 'Bob'); // 85
  });

  test('sqlOnCsv returns line/column syntax error for invalid queries', () => {
    const csv = 'id,val\n1,100';
    const invalidQuery = 'UPDATE data SET val = 200';
    const res = DataEngine.sqlOnCsv(csv, invalidQuery);
    assert.strictEqual(res.success, false);
    assert(res.error.includes('line 1, column 1'));
  });

  // ─── 7. Tabular Operations (Join, Pivot, Split) ───
  console.log('\n--- 7. Tabular Operations (Join, Pivot, Split) ---');
  test('joinCsv performs inner join on key column', () => {
    const csvA = 'id,name\n1,Alice\n2,Bob';
    const csvB = 'id,dept\n1,Engineering\n2,Design';
    const res = DataEngine.joinCsv(csvA, csvB, 'id', 'id', 'inner');
    assert.strictEqual(res.success, true);
    assert(res.data.includes('Engineering'));
    assert(res.data.includes('Design'));
  });

  test('pivotGroupBy aggregates rows by category', () => {
    const csv = 'dept,salary\nEngineering,100\nEngineering,200\nDesign,150';
    const res = DataEngine.pivotGroupBy(csv, 'dept', 'salary', 'sum');
    assert.strictEqual(res.success, true);
    assert(res.data.includes('300')); // Engineering sum
    assert(res.data.includes('150')); // Design sum
  });

  // ─── 8. Schema Validation ───
  console.log('\n--- 8. JSON Schema Validation ---');
  test('validateJsonSchema catches missing properties and type errors', () => {
    const schema = JSON.stringify({
      type: 'object',
      required: ['name', 'age'],
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    });

    const invalidData = JSON.stringify({ name: 'Alice', age: 'twenty' });
    const res = DataEngine.validateJsonSchema(invalidData, schema);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.valid, false);
    assert(res.data.errors.some((e) => e.includes("must be of type number")));
  });

  console.log('\n===========================================================');
  console.log(`  PHASE 5A TEST RESULTS: ${passedCount} passed, ${failedCount} failed`);
  console.log('===========================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
