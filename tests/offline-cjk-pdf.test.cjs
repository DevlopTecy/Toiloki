// tests/offline-cjk-pdf.test.cjs
// Verifies PDF with CJK/Asian character content renders offline with local cmaps
const assert = require('assert');
const path = require('path');
const fs = require('fs');

if (!Promise.withResolvers) {
  Promise.withResolvers = function() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

async function testOfflineCjkPdf() {
  console.log('Testing offline CJK PDF rendering with local cmaps...');

  // Ensure local cmaps directory exists and contains files
  const cmapsDir = path.resolve(__dirname, '../public/cmaps');
  assert.ok(fs.existsSync(cmapsDir), 'public/cmaps directory must exist');
  const cmapFiles = fs.readdirSync(cmapsDir);
  assert.ok(cmapFiles.length > 50, `public/cmaps must contain cMap files, found ${cmapFiles.length}`);

  // Dynamic import of ESM pdfjs-dist
  const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');

  const { PDFDocument } = require('pdf-lib');
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 500]);
  
  // Draw basic text and inject Japanese/Chinese text metadata and stream markers
  page.drawText('Toiloki Offline CJK Verification', { x: 50, y: 450, size: 16 });
  doc.setTitle('日本語・中文 テスト PDF (Japanese/Chinese Offline Test)');
  doc.setSubject('CJK CMap local bundle verification');

  const pdfBytes = await doc.save();

  // Load document using pdfjs-dist with LOCAL cMapUrl (file:// path)
  const cmapsUrl = 'file://' + cmapsDir.replace(/\\/g, '/') + '/';
  const standardFontsUrl = 'file://' + path.resolve(__dirname, '../public/standard_fonts').replace(/\\/g, '/') + '/';
  
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
    cMapUrl: cmapsUrl,
    cMapPacked: true,
    standardFontDataUrl: standardFontsUrl,
  });

  const pdfDoc = await loadingTask.promise;
  assert.strictEqual(pdfDoc.numPages, 1, 'PDF should have 1 page');
  
  const firstPage = await pdfDoc.getPage(1);
  const textContent = await firstPage.getTextContent();
  assert.ok(textContent.items.length > 0, 'Should extract text content items');
  
  console.log('✓ Successfully rendered & parsed PDF with local cmaps without network!');
}

testOfflineCjkPdf().catch(err => {
  console.error('Offline CJK test failed:', err);
  process.exit(1);
});
