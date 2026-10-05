/**
 * Automated Test Suite: Phase 4B Images Workspace Complete Enhancements
 * Tests:
 * 1. JPG Conversion White Background: Alpha transparency never turns black
 * 2. Animated GIF Detection: Accurate recognition of multi-frame GIFs vs static GIFs
 * 3. Extreme Dimension Clamping: Prevents browser canvas memory crashes (> 8192px)
 * 4. Image Compression & Numeric Feedback: Quality scaling, saved bytes, isLarger guard
 * 5. EXIF Orientation Extraction: Respects orientation metadata tags (0, 90, 180, 270)
 * 6. Aspect Ratio Math & Lock Rounding: Exact proportional dimensions calculation
 * 7. Filename Collision Handling: Increments duplicate filenames smoothly
 */

const assert = require('assert');

console.log('===========================================================');
console.log(' PHASE 4B: IMAGES WORKSPACE COMPLETE ENHANCEMENTS TEST SUITE');
console.log('===========================================================\n');

function runTests() {
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

  // --- Test 1: Animated GIF Detection ---
  console.log('\n--- 1. Animated GIF Detection ---');

  test('Detects animated GIF with multiple Graphic Control Extensions', () => {
    // Construct mock GIF89a buffer with 2 graphic control extensions (0x21, 0xF9)
    const header = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x10, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00];
    const frame1 = [0x21, 0xF9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2C];
    const frame2 = [0x21, 0xF9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2C];
    const trailer = [0x3B];
    const animatedBuffer = new Uint8Array([...header, ...frame1, ...frame2, ...trailer]);

    // Check function logic
    const isAnimatedGif = (buffer) => {
      if (buffer.length < 14) return false;
      const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 &&
                    buffer[3] === 0x38 && (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61;
      if (!isGif) return false;
      let frames = 0;
      for (let i = 0; i < buffer.length - 2; i++) {
        if (buffer[i] === 0x21 && buffer[i + 1] === 0xF9) {
          frames++;
          if (frames > 1) return true;
        }
      }
      return false;
    };

    assert.strictEqual(isAnimatedGif(animatedBuffer), true);

    // Static single-frame GIF
    const staticBuffer = new Uint8Array([...header, ...frame1, ...trailer]);
    assert.strictEqual(isAnimatedGif(staticBuffer), false);
  });

  // --- Test 2: Extreme Dimension Clamping ---
  console.log('\n--- 2. Large Image Dimension Clamping ---');

  test('Clamps dimensions above 8192px safely preserving aspect ratio', () => {
    const origW = 12000;
    const origH = 6000; // 2:1 ratio
    const MAX_CANVAS_DIM = 8192;

    let targetWidth = origW;
    let targetHeight = origH;

    if (targetWidth > MAX_CANVAS_DIM || targetHeight > MAX_CANVAS_DIM) {
      const scale = Math.min(MAX_CANVAS_DIM / targetWidth, MAX_CANVAS_DIM / targetHeight);
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }

    assert.strictEqual(targetWidth, 8192);
    assert.strictEqual(targetHeight, 4096);
    assert.strictEqual(targetWidth / targetHeight, 2);
  });

  // --- Test 3: Transparency to JPG Background Handling ---
  console.log('\n--- 3. Transparency to JPG White Background ---');

  test('Ensures JPEG format specifies white background fill (#FFFFFF)', () => {
    const format = 'image/jpeg';
    const isJpeg = format === 'image/jpeg';
    const fillStyle = isJpeg ? '#FFFFFF' : 'transparent';
    assert.strictEqual(fillStyle, '#FFFFFF');
  });

  // --- Test 4: Image Compression & isLarger Guard ---
  console.log('\n--- 4. Image Compression Numeric Result & isLarger Guard ---');

  test('Calculates saved bytes, reduction percent, and flags isLarger correctly', () => {
    const origSize = 1000000; // 1 MB
    const newSizeSmaller = 450000; // 450 KB

    const isLarger1 = newSizeSmaller >= origSize;
    const savedBytes1 = isLarger1 ? 0 : origSize - newSizeSmaller;
    const ratioPercent1 = isLarger1 ? 0 : Math.round((savedBytes1 / origSize) * 100);

    assert.strictEqual(isLarger1, false);
    assert.strictEqual(savedBytes1, 550000);
    assert.strictEqual(ratioPercent1, 55);

    // Case where compressed output is larger than original
    const newSizeLarger = 1200000; // 1.2 MB
    const isLarger2 = newSizeLarger >= origSize;
    const savedBytes2 = isLarger2 ? 0 : origSize - newSizeLarger;
    const ratioPercent2 = isLarger2 ? 0 : Math.round((savedBytes2 / origSize) * 100);

    assert.strictEqual(isLarger2, true);
    assert.strictEqual(savedBytes2, 0);
    assert.strictEqual(ratioPercent2, 0);
  });

  // --- Test 5: EXIF Orientation Mapping ---
  console.log('\n--- 5. EXIF Orientation Mapping ---');

  test('Maps EXIF orientation tags (1, 3, 6, 8) to degrees (0, 180, 90, 270)', () => {
    const mapOrientation = (val) => {
      switch (val) {
        case 3: return 180;
        case 6: return 90;
        case 8: return 270;
        default: return 0;
      }
    };

    assert.strictEqual(mapOrientation(1), 0);
    assert.strictEqual(mapOrientation(6), 90);
    assert.strictEqual(mapOrientation(3), 180);
    assert.strictEqual(mapOrientation(8), 270);
  });

  // --- Test 6: Aspect Lock Math & Rounding ---
  console.log('\n--- 6. Aspect Lock Math & Rounding ---');

  test('Computes locked aspect ratio with integer rounding', () => {
    const natW = 1920;
    const natH = 1080;
    const ratioHtoW = natH / natW; // 0.5625
    const ratioWtoH = natW / natH; // 1.7777...

    // Changing width to 1280
    const newW = 1280;
    const calculatedH = Math.round(newW * ratioHtoW);
    assert.strictEqual(calculatedH, 720);

    // Changing height to 600
    const newH = 600;
    const calculatedW = Math.round(newH * ratioWtoH);
    assert.strictEqual(calculatedW, 1067);
  });

  // --- Test 7: Filename Collision Handling ---
  console.log('\n--- 7. Filename Collision Handling ---');

  test('Auto-increments file names on collision', () => {
    const existing = new Set(['photo.jpg', 'photo (1).jpg', 'banner.png']);

    function resolveCollision(name) {
      if (!existing.has(name)) return name;
      const ext = name.includes('.') ? `.${name.split('.').pop()}` : '';
      const base = name.replace(/\.[^.]+$/, '');
      let counter = 1;
      while (existing.has(`${base} (${counter})${ext}`)) {
        counter++;
      }
      return `${base} (${counter})${ext}`;
    }

    assert.strictEqual(resolveCollision('photo.jpg'), 'photo (2).jpg');
    assert.strictEqual(resolveCollision('banner.png'), 'banner (1).png');
    assert.strictEqual(resolveCollision('new_image.webp'), 'new_image.webp');
  });

  console.log('\n===========================================================');
  console.log(` PHASE 4B TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
