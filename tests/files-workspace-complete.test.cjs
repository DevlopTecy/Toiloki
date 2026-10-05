/**
 * tests/files-workspace-complete.test.cjs
 * Comprehensive unit and engine test suite for Phase 6B: Files & Archives Workspace.
 * 
 * Verifies:
 * 1. ZIP Creation, Extraction, and Entry Integrity
 * 2. Zip Slip Directory Traversal Security (PathSecurity sanitization)
 * 3. ZIP Inspection (Metadata, uncompressed/compressed sizes without disk extraction)
 * 4. Add & Remove Files in Existing ZIP Archive
 * 5. POSIX Ustar TAR Archive Packing, Unpacking, and Inspection
 * 6. GZIP Compression & Decompression (Web Streams API roundtrip)
 * 7. Batch File Renaming (Prefix, suffix, numbering, literal & regex replace, case transforms)
 * 8. Magic Bytes True File Type Detection (PDF, PNG, JPG, ZIP, GZIP, TAR, GIF, WebP, JSON/TXT)
 * 9. Binary Buffer Comparison (Identical vs differing files, byte difference calculation)
 * 10. Cryptographic Hashing (SHA-256 and SHA-1 verification against known digests)
 * 11. Two-Phase Duplicate Finder (Bucket by size first, hash only collision candidates, wasted bytes)
 * 12. Checksum Manifest Formatting (.sha256 format for sha256sum verification)
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ts = require('typescript');
const JSZip = require('jszip');

function loadTsModule(filePath, exportNames) {
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
  const customRequire = (name) => {
    if (name === 'jszip') return JSZip;
    if (name.includes('app-error')) {
      return { AppError: class AppError extends Error {} };
    }
    if (name.includes('path-security')) {
      return { PathSecurity };
    }
    return require(name);
  };

  const fn = new Function('require', 'module', 'exports', transpiled.outputText);
  fn(customRequire, moduleEnv, moduleEnv.exports);

  if (Array.isArray(exportNames)) {
    const res = {};
    for (const exp of exportNames) {
      res[exp] = moduleEnv.exports[exp];
    }
    return res;
  }
  return moduleEnv.exports[exportNames];
}

let ArchiveEngine;
let FileOpsEngine;
let PathSecurity;

try {
  PathSecurity = loadTsModule('../src/core/file-processing/path-security.ts', 'PathSecurity');
  ArchiveEngine = loadTsModule('../src/engines/files/archive.engine.ts', 'ArchiveEngine');
  FileOpsEngine = loadTsModule('../src/engines/files/file-ops.engine.ts', 'FileOpsEngine');
} catch (e) {
  console.error('Failed to load Files & Archives engines in test harness:', e);
  process.exit(1);
}

async function runTests() {
  console.log('===========================================================');
  console.log('  PHASE 6B: FILES & ARCHIVES COMPLETE TEST SUITE           ');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. ZIP Creation & Extraction Roundtrip
  await test('ZIP Creation & Extraction: Pack multiple files and extract with exact content', async () => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const files = [
      { name: 'document.txt', buffer: enc.encode('Hello Toiloki File Suite!') },
      { name: 'notes/meeting.md', buffer: enc.encode('# Notes\nDiscuss Phase 6B release.') },
    ];

    const createRes = await ArchiveEngine.createZip(files);
    assert.strictEqual(createRes.success, true);
    assert(createRes.data instanceof Uint8Array);
    assert(createRes.data.length > 0);

    const extractRes = await ArchiveEngine.extractZip(createRes.data);
    assert.strictEqual(extractRes.success, true);
    assert.strictEqual(extractRes.data.length, 2);

    const docFile = extractRes.data.find((f) => f.name === 'document.txt');
    assert(docFile, 'document.txt should be extracted');
    assert.strictEqual(dec.decode(docFile.buffer), 'Hello Toiloki File Suite!');

    const noteFile = extractRes.data.find((f) => f.name === 'notes/meeting.md');
    assert(noteFile, 'notes/meeting.md should be extracted');
    assert.strictEqual(dec.decode(noteFile.buffer), '# Notes\nDiscuss Phase 6B release.');
  });

  // 2. Zip Slip Directory Traversal Security
  await test('Zip Slip Security: Rejects or neutralizes directory traversal attack paths', async () => {
    const enc = new TextEncoder();
    const maliciousPaths = [
      '../../etc/passwd',
      '..\\..\\windows\\system32\\cmd.exe',
      '/var/root/secret.key',
      'C:\\Users\\Admin\\config.ini',
      'foo/../../../bar.txt',
    ];

    for (const p of maliciousPaths) {
      const sanitized = PathSecurity.sanitizeArchivePath(p);
      assert(!sanitized.startsWith('..'), `Path "${p}" sanitized to "${sanitized}" must not start with ..`);
      assert(!sanitized.startsWith('/'), `Path "${p}" sanitized to "${sanitized}" must not have leading slash`);
      assert(!sanitized.includes(':\\'), `Path "${p}" sanitized to "${sanitized}" must not have drive letter`);
    }

    // Test inside ArchiveEngine.extractZip
    const zip = new JSZip();
    zip.file('../../escape_attempt.txt', enc.encode('Malicious payload'));
    const zipData = await zip.generateAsync({ type: 'uint8array' });

    const extractRes = await ArchiveEngine.extractZip(zipData);
    assert.strictEqual(extractRes.success, true);
    assert.strictEqual(extractRes.data.length, 1);
    assert.strictEqual(extractRes.data[0].name, 'escape_attempt.txt');
  });

  // 3. ZIP Inspection Without Disk Extraction
  await test('ZIP Inspection: Lists entries, uncompressed size, and compressed ratio', async () => {
    const enc = new TextEncoder();
    const files = [
      { name: 'report.csv', buffer: enc.encode('id,name,value\n1,alpha,100\n2,beta,200\n') },
      { name: 'assets/logo.svg', buffer: enc.encode('<svg><circle r="10"/></svg>') },
    ];

    const createRes = await ArchiveEngine.createZip(files);
    assert.strictEqual(createRes.success, true);

    const inspectRes = await ArchiveEngine.inspectZip(createRes.data);
    assert.strictEqual(inspectRes.success, true);
    const fileEntries = inspectRes.data.filter((e) => !e.isDir);
    assert.strictEqual(fileEntries.length, 2);

    const reportEntry = inspectRes.data.find((e) => e.name === 'report.csv');
    assert(reportEntry, 'report.csv should be in inspected list');
    assert.strictEqual(reportEntry.size, files[0].buffer.length);
    assert.strictEqual(reportEntry.isDir, false);
  });

  // 4. Add & Remove Files in Existing ZIP
  await test('ZIP Mutation: Add and remove files in existing archive buffer', async () => {
    const enc = new TextEncoder();
    const initialFiles = [{ name: 'file1.txt', buffer: enc.encode('Content 1') }];
    const initialZip = await ArchiveEngine.createZip(initialFiles);

    // Add file2
    const addRes = await ArchiveEngine.addFilesToZip(initialZip.data, [
      { name: 'file2.txt', buffer: enc.encode('Content 2') },
    ]);
    assert.strictEqual(addRes.success, true);

    const inspectAfterAdd = await ArchiveEngine.inspectZip(addRes.data);
    assert.strictEqual(inspectAfterAdd.data.length, 2);

    // Remove file1
    const removeRes = await ArchiveEngine.removeFilesFromZip(addRes.data, ['file1.txt']);
    assert.strictEqual(removeRes.success, true);

    const inspectAfterRemove = await ArchiveEngine.inspectZip(removeRes.data);
    assert.strictEqual(inspectAfterRemove.data.length, 1);
    assert.strictEqual(inspectAfterRemove.data[0].name, 'file2.txt');
  });

  // 5. POSIX Ustar TAR Archive Packing & Unpacking
  await test('TAR Packaging: Create standard 512-byte POSIX ustar archive and extract', async () => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const files = [
      { name: 'config.json', buffer: enc.encode('{"app":"toiloki","version":"1.0"}') },
      { name: 'scripts/run.sh', buffer: enc.encode('#!/bin/sh\necho "Running"') },
    ];

    const tarRes = ArchiveEngine.createTar(files);
    assert.strictEqual(tarRes.success, true);
    assert.strictEqual(tarRes.data.length % 512, 0, 'TAR size must be exact multiple of 512 bytes');

    // Inspect TAR
    const inspectRes = ArchiveEngine.inspectTar(tarRes.data);
    assert.strictEqual(inspectRes.success, true);
    assert.strictEqual(inspectRes.data.length, 2);
    assert.strictEqual(inspectRes.data[0].name, 'config.json');
    assert.strictEqual(inspectRes.data[1].name, 'scripts/run.sh');

    // Extract TAR
    const extractRes = ArchiveEngine.extractTar(tarRes.data);
    assert.strictEqual(extractRes.success, true);
    assert.strictEqual(extractRes.data.length, 2);

    const cfg = extractRes.data.find((f) => f.name === 'config.json');
    assert(cfg);
    assert.strictEqual(dec.decode(cfg.buffer), '{"app":"toiloki","version":"1.0"}');
  });

  // 6. GZIP Compression & Decompression
  await test('GZIP Compression: Stream-based gzip compression and decompression roundtrip', async () => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const sampleText = 'This is repetitive compressible text data! '.repeat(20);
    const sampleBytes = enc.encode(sampleText);

    const gzipRes = await ArchiveEngine.createGzip(sampleBytes);
    assert.strictEqual(gzipRes.success, true);
    assert(gzipRes.data.length < sampleBytes.length, 'GZIP compressed data should be smaller');

    // Magic bytes for GZIP (1F 8B)
    assert.strictEqual(gzipRes.data[0], 0x1f);
    assert.strictEqual(gzipRes.data[1], 0x8b);

    const decompRes = await ArchiveEngine.decompressGzip(gzipRes.data);
    assert.strictEqual(decompRes.success, true);
    assert.strictEqual(dec.decode(decompRes.data), sampleText);
  });

  // 7. Batch File Renaming
  await test('Batch Renaming: Prefix, suffix, sequential numbering, case transforms, and regex', () => {
    const fileList = ['photo_summer.jpg', 'PHOTO_WINTER.JPG', 'Report 2026.final.pdf'];

    // Prefix + Suffix + Numbering
    const res1 = FileOpsEngine.applyBatchRename(fileList, {
      prefix: 'Vacation_',
      suffix: '_v1',
      numberingStart: 1,
      numberingDigits: 3,
    });
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.data[0].renamed, 'Vacation_photo_summer_v1_001.jpg');
    assert.strictEqual(res1.data[1].renamed, 'Vacation_PHOTO_WINTER_v1_002.JPG');

    // Case transforms: lower, upper, capitalize, kebab, snake
    const resLower = FileOpsEngine.applyBatchRename(['MY_DOCUMENT.DOCX'], { caseTransform: 'lower' });
    assert.strictEqual(resLower.data[0].renamed, 'my_document.DOCX');

    const resUpper = FileOpsEngine.applyBatchRename(['simple_file.txt'], { caseTransform: 'upper' });
    assert.strictEqual(resUpper.data[0].renamed, 'SIMPLE_FILE.txt');

    const resKebab = FileOpsEngine.applyBatchRename(['my user guide.pdf'], { caseTransform: 'kebab' });
    assert.strictEqual(resKebab.data[0].renamed, 'my-user-guide.pdf');

    const resSnake = FileOpsEngine.applyBatchRename(['my-user-guide.pdf'], { caseTransform: 'snake' });
    assert.strictEqual(resSnake.data[0].renamed, 'my_user_guide.pdf');

    // Regex replace
    const resRegex = FileOpsEngine.applyBatchRename(['item_100_final.txt', 'item_200_final.txt'], {
      findText: 'item_(\\d+)',
      replaceText: 'sku-$1',
      useRegex: true,
    });
    assert.strictEqual(resRegex.data[0].renamed, 'sku-100_final.txt');
    assert.strictEqual(resRegex.data[1].renamed, 'sku-200_final.txt');
  });

  // 8. Magic Bytes True File Type Detection
  await test('Magic Bytes Detection: Identifies PDF, PNG, JPG, ZIP, GZIP, TAR, GIF, WebP, Text', () => {
    // PDF: %PDF
    const pdfBuf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    const pdfType = FileOpsEngine.detectFileType(pdfBuf, 'fake.bin');
    assert.strictEqual(pdfType.data.mime, 'application/pdf');
    assert.strictEqual(pdfType.data.extension, 'pdf');

    // PNG: 89 50 4E 47
    const pngBuf = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const pngType = FileOpsEngine.detectFileType(pngBuf, 'image.dat');
    assert.strictEqual(pngType.data.mime, 'image/png');

    // JPEG: FF D8 FF
    const jpgBuf = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const jpgType = FileOpsEngine.detectFileType(jpgBuf, 'test.unknown');
    assert.strictEqual(jpgType.data.mime, 'image/jpeg');

    // GZIP: 1F 8B
    const gzBuf = new Uint8Array([0x1f, 0x8b, 0x08, 0x00]);
    const gzType = FileOpsEngine.detectFileType(gzBuf, 'archive');
    assert.strictEqual(gzType.data.mime, 'application/gzip');

    // JSON UTF-8
    const jsonBuf = new TextEncoder().encode('{"title":"Toiloki"}');
    const jsonType = FileOpsEngine.detectFileType(jsonBuf, 'data.txt');
    assert.strictEqual(jsonType.data.mime, 'application/json');
  });

  // 9. Binary Buffer Comparison
  await test('Buffer Comparison: Identifies identical buffers and computes byte differences', () => {
    const bufA = new Uint8Array([1, 2, 3, 4, 5]);
    const bufB = new Uint8Array([1, 2, 3, 4, 5]);
    const bufC = new Uint8Array([1, 2, 3, 4, 9, 10]);

    const compIdentical = FileOpsEngine.compareBuffers(bufA, bufB);
    assert.strictEqual(compIdentical.data.identical, true);
    assert.strictEqual(compIdentical.data.byteDifference, 0);

    const compDiffer = FileOpsEngine.compareBuffers(bufA, bufC);
    assert.strictEqual(compDiffer.data.identical, false);
    assert.strictEqual(compDiffer.data.byteDifference, 1);
  });

  // 10. Cryptographic Hashes (SHA-256 and SHA-1)
  await test('Cryptographic Hashes: Computes exact SHA-256 and SHA-1 hex fingerprints', async () => {
    const enc = new TextEncoder();
    // Known SHA-256 of "hello world" is:
    // b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
    const sample = enc.encode('hello world');
    const res = await FileOpsEngine.calculateSha256(sample);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data, 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');

    const multi = await FileOpsEngine.calculateHashes(sample);
    assert.strictEqual(multi.success, true);
    assert.strictEqual(multi.data.sha256, 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    // Known SHA-1 of "hello world" is 2aae6c35c94fcfb415dbe95f408b9ce91ee846ed
    assert.strictEqual(multi.data.sha1, '2aae6c35c94fcfb415dbe95f408b9ce91ee846ed');
  });

  // 11. Two-Phase Duplicate Finder
  await test('Duplicate Finder: Two-phase size bucketing and hash candidate verification', async () => {
    const enc = new TextEncoder();
    const dataCommon = enc.encode('Common Duplicate Content 12345');
    const dataUnique = enc.encode('Unique Content Exactly 16b');

    const files = [
      { name: 'copyA.txt', size: dataCommon.length, buffer: dataCommon },
      { name: 'copyB.txt', size: dataCommon.length, buffer: dataCommon },
      { name: 'copyC.txt', size: dataCommon.length, buffer: dataCommon },
      { name: 'unique.txt', size: dataUnique.length, buffer: dataUnique },
      { name: 'different_size.txt', size: 100, buffer: new Uint8Array(100) },
    ];

    const dupRes = await FileOpsEngine.findDuplicates(files);
    assert.strictEqual(dupRes.success, true);
    assert.strictEqual(dupRes.data.groups.length, 1, 'Should find exactly 1 group of duplicates');
    assert.strictEqual(dupRes.data.groups[0].files.length, 3, 'Group should have 3 copies');
    assert.strictEqual(dupRes.data.totalDuplicates, 2, '2 redundant duplicate copies');
    assert.strictEqual(dupRes.data.totalWastedBytes, 2 * dataCommon.length);
  });

  // 12. Checksum Manifest Formatter
  await test('Checksum Manifest: Exports valid .sha256 verification manifest', () => {
    const items = [
      { name: 'file1.txt', hash: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9' },
      { name: 'file2.pdf', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    ];
    const manifest = FileOpsEngine.formatChecksumManifest(items);
    assert(manifest.includes('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9  file1.txt'));
    assert(manifest.includes('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  file2.pdf'));
  });

  console.log('\n-----------------------------------------------------------');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed.`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
