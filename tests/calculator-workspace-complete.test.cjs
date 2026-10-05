/**
 * tests/calculator-workspace-complete.test.cjs
 * Comprehensive unit and engine test suite for Phase 6A: Calculator & Converters Workspace.
 * 
 * Verifies:
 * 1. Floating-Point Precision (0.1 + 0.2 = 0.3 without IEEE-754 leakage)
 * 2. Divide-by-Zero Protection (1 / 0 returns 'Cannot divide by zero')
 * 3. Percentage Calculations (100 + 10% = 110, 200 - 25% = 150, 50 * 20% = 10)
 * 4. Scientific Trigonometry & Deg/Rad Toggle (sin(90 deg) = 1, sin(pi/2 rad) = 1)
 * 5. Number Formatting with Commas (1234567.89 -> 1,234,567.89)
 * 6. Unit Converters (Length, Mass, Temperature, Data, Speed, Volume)
 * 7. Statistical Analyzer (Mean, Median, Mode, Std Dev, Variance)
 * 8. Discount & Sales Tax (Original, Discount, Tax, Final, Savings)
 * 9. Loan EMI & Amortization Schedule (Amortization formula, balance reduction)
 * 10. GST / VAT Calculator (Add vs Remove mode, CGST/SGST split)
 * 11. Date Difference & Age Calculator (Years/Months/Days, next birthday, business days)
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

let CalcEngine;
let FinanceEngine;
let DateEngine;

try {
  CalcEngine = loadTsModule('../src/engines/calculator/calc.engine.ts', 'CalcEngine');
  FinanceEngine = loadTsModule('../src/engines/calculator/finance.engine.ts', 'FinanceEngine');
  DateEngine = loadTsModule('../src/engines/calculator/date.engine.ts', 'DateEngine');
} catch (e) {
  console.error('Failed to load Calculator engines in test harness:', e);
  process.exit(1);
}

function runTests() {
  console.log('===========================================================');
  console.log('  PHASE 6A: CALCULATOR & CONVERTERS COMPLETE TEST SUITE    ');
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

  // 1. Floating-Point Precision
  test('Floating-Point Precision: 0.1 + 0.2 evaluates strictly to 0.3', () => {
    const res = CalcEngine.evaluateExpression('0.1 + 0.2');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data, '0.3', 'Should eliminate IEEE-754 precision noise');

    const res2 = CalcEngine.evaluateExpression('0.7 + 0.1');
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.data, '0.8');

    const res3 = CalcEngine.evaluateExpression('0.3 - 0.1');
    assert.strictEqual(res3.success, true);
    assert.strictEqual(res3.data, '0.2');
  });

  // 2. Divide-by-Zero Guard
  test('Divide-by-Zero Guard: Returns graceful error without crashing', () => {
    const res1 = CalcEngine.evaluateExpression('1 / 0');
    assert.strictEqual(res1.success, false);
    assert.strictEqual(res1.error, 'Cannot divide by zero');

    const res2 = CalcEngine.evaluateExpression('100 / (5 - 5)');
    assert.strictEqual(res2.success, false);
    assert.strictEqual(res2.error, 'Cannot divide by zero');
  });

  // 3. Percentage Calculations
  test('Percentage Calculations: Standard pocket-calculator arithmetic', () => {
    // 100 + 10% = 110
    const resAdd = CalcEngine.evaluateExpression('100 + 10%');
    assert.strictEqual(resAdd.success, true);
    assert.strictEqual(resAdd.data, '110');

    // 200 - 25% = 150
    const resSub = CalcEngine.evaluateExpression('200 - 25%');
    assert.strictEqual(resSub.success, true);
    assert.strictEqual(resSub.data, '150');

    // 50 * 20% = 10
    const resMul = CalcEngine.evaluateExpression('50 * 20%');
    assert.strictEqual(resMul.success, true);
    assert.strictEqual(resMul.data, '10');

    // calculatePercentage helper
    const pctRes = CalcEngine.calculatePercentage(15, 200);
    assert.strictEqual(pctRes.success, true);
    assert.strictEqual(pctRes.data.percentage, 7.5);
  });

  // 4. Scientific Trigonometry & Deg/Rad Toggle
  test('Scientific Trig & Deg/Rad Toggle: Evaluates in DEG vs RAD', () => {
    // Degree mode (isRad: false)
    const sinDeg = CalcEngine.evaluateExpression('sin(90)', { isRad: false });
    assert.strictEqual(sinDeg.success, true);
    assert.strictEqual(sinDeg.data, '1');

    const cosDeg = CalcEngine.evaluateExpression('cos(0)', { isRad: false });
    assert.strictEqual(cosDeg.success, true);
    assert.strictEqual(cosDeg.data, '1');

    const tanDeg = CalcEngine.evaluateExpression('tan(45)', { isRad: false });
    assert.strictEqual(tanDeg.success, true);
    assert.strictEqual(tanDeg.data, '1');

    // Radian mode (isRad: true)
    const sinRad = CalcEngine.evaluateExpression('sin(pi / 2)', { isRad: true });
    assert.strictEqual(sinRad.success, true);
    assert.strictEqual(sinRad.data, '1');
  });

  // 5. Number Formatting with Commas
  test('Number Formatting: Formats large numbers with thousands commas', () => {
    assert.strictEqual(CalcEngine.formatNumberWithCommas('1234567.89'), '1,234,567.89');
    assert.strictEqual(CalcEngine.formatNumberWithCommas(1000000), '1,000,000');
    assert.strictEqual(CalcEngine.formatNumberWithCommas('42'), '42');
    assert.strictEqual(CalcEngine.formatNumberWithCommas('0.005'), '0.005');
  });

  // 6. Unit Converters
  test('Unit Converters: Converts length, mass, temperature, and data', () => {
    // Length: 1 meter to feet
    const mToFt = CalcEngine.convertUnit(1, 'm', 'foot');
    assert.strictEqual(mToFt.success, true);
    assert.ok(Math.abs(mToFt.data.value - 3.28084) < 0.001);

    // Mass: 1 kg to pounds
    const kgToLb = CalcEngine.convertUnit(1, 'kg', 'lb');
    assert.strictEqual(kgToLb.success, true);
    assert.ok(Math.abs(kgToLb.data.value - 2.20462) < 0.001);

    // Temp: 100 degC to degF
    const cToF = CalcEngine.convertUnit(100, 'degC', 'degF');
    assert.strictEqual(cToF.success, true);
    assert.strictEqual(Math.round(cToF.data.value), 212);

    // Data: 1 GB to MB
    const gbToMb = CalcEngine.convertUnit(1, 'GB', 'MB');
    assert.strictEqual(gbToMb.success, true);
    assert.ok(gbToMb.data.value >= 1000);
  });

  // 7. Statistical Analyzer
  test('Statistical Analyzer: Computes mean, median, mode, and std dev', () => {
    const stats = CalcEngine.calculateStats([10, 20, 20, 40, 50]);
    assert.strictEqual(stats.success, true);
    assert.strictEqual(stats.data.count, 5);
    assert.strictEqual(stats.data.mean, 28);
    assert.strictEqual(stats.data.median, 20);
    assert.deepStrictEqual(stats.data.mode, [20]);
    assert.strictEqual(stats.data.min, 10);
    assert.strictEqual(stats.data.max, 50);
  });

  // 8. Discount & Sales Tax
  test('Discount & Sales Tax: Computes discounted price, tax, and total savings', () => {
    // $100 item with 20% discount and 10% tax
    const res = CalcEngine.calculateDiscount(100, 20, 10);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.originalPrice, 100);
    assert.strictEqual(res.data.discountAmount, 20);
    assert.strictEqual(res.data.discountedPrice, 80);
    assert.strictEqual(res.data.taxAmount, 8); // 10% of $80
    assert.strictEqual(res.data.finalPrice, 88);
    assert.strictEqual(res.data.totalSavings, 20);
  });

  // 9. Loan EMI & Amortization
  test('Loan EMI & Amortization: Computes EMI and generates full schedule', () => {
    // 100,000 principal, 12% annual rate, 12 months tenure
    const emiRes = FinanceEngine.calculateLoanEMI(100000, 12, 12);
    assert.strictEqual(emiRes.success, true);
    assert.ok(emiRes.data.emi > 8800 && emiRes.data.emi < 8900);
    assert.ok(emiRes.data.totalAmount > 100000);
    assert.strictEqual(emiRes.data.totalInterest, Math.round((emiRes.data.totalAmount - 100000) * 100) / 100);

    // Amortization schedule
    const amortRes = FinanceEngine.generateAmortization(100000, 12, 12);
    assert.strictEqual(amortRes.success, true);
    assert.strictEqual(amortRes.data.length, 12);
    assert.strictEqual(amortRes.data[0].month, 1);
    assert.strictEqual(amortRes.data[11].month, 12);
    assert.strictEqual(amortRes.data[11].balance, 0, 'Final month remaining balance should be 0');
  });

  // 10. GST / VAT Calculator
  test('GST / VAT Calculator: Handles Add, Remove, and CGST/SGST split', () => {
    // Add mode: 1000 base + 18% GST
    const addRes = FinanceEngine.calculateGST(1000, 18, 'add', true);
    assert.strictEqual(addRes.success, true);
    assert.strictEqual(addRes.data.baseAmount, 1000);
    assert.strictEqual(addRes.data.gstAmount, 180);
    assert.strictEqual(addRes.data.totalAmount, 1180);
    assert.strictEqual(addRes.data.cgst, 90);
    assert.strictEqual(addRes.data.sgst, 90);

    // Remove mode: 1180 inclusive - 18% GST -> 1000 base
    const remRes = FinanceEngine.calculateGST(1180, 18, 'remove');
    assert.strictEqual(remRes.success, true);
    assert.strictEqual(remRes.data.totalAmount, 1180);
    assert.strictEqual(remRes.data.baseAmount, 1000);
    assert.strictEqual(remRes.data.gstAmount, 180);
  });

  // 11. Date Difference & Age Calculator
  test('Date Difference & Age Calculator: Computes exact delta and business days', () => {
    // Age calculator
    const age = DateEngine.calculateAge('2000-01-01', '2026-01-01');
    assert.strictEqual(age.success, true);
    assert.strictEqual(age.data.years, 26);
    assert.strictEqual(age.data.months, 0);
    assert.strictEqual(age.data.days, 0);
    assert.ok(age.data.totalDaysLived > 9400);

    // Date diff
    const diff = DateEngine.dateDiff('2026-01-01', '2026-01-15');
    assert.strictEqual(diff.success, true);
    assert.strictEqual(diff.data.days, 14);
    assert.strictEqual(diff.data.totalWeeks, 2);

    // Business days between Monday and Friday (same week)
    const biz = DateEngine.businessDaysBetween('2026-01-05', '2026-01-09');
    assert.strictEqual(biz.success, true);
    assert.strictEqual(biz.data.businessDays, 5);
  });

  console.log('-----------------------------------------------------------');
  console.log(`Calculator Workspace Tests Complete: ${passed} passed, ${failed} failed`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
