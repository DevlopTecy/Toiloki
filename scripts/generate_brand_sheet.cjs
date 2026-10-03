const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function getToilokiTSvg(width, height) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Vertical Stem: Warm Amber to Rich Deep Orange/Crimson -->
      <linearGradient id="tk-stem" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#FFA726" />
        <stop offset="35%" stop-color="#FB8C00" />
        <stop offset="70%" stop-color="#F4511E" />
        <stop offset="100%" stop-color="#BF360C" />
      </linearGradient>

      <!-- Left Pill Arm: Warm Burnt Orange/Amber -->
      <linearGradient id="tk-left" x1="0%" y1="20%" x2="100%" y2="80%">
        <stop offset="0%" stop-color="#BF360C" />
        <stop offset="30%" stop-color="#D84315" />
        <stop offset="100%" stop-color="#F4511E" />
      </linearGradient>

      <!-- Right Overlapping Pill Arm: Radiant Amber Gold -->
      <linearGradient id="tk-right" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFD54F" />
        <stop offset="40%" stop-color="#FFA726" />
        <stop offset="100%" stop-color="#F4511E" />
      </linearGradient>

      <!-- Overlapping Facet Crease Shadow -->
      <filter id="tk-crease" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="-2.5" dy="2" stdDeviation="2.5" flood-color="#3E1103" flood-opacity="0.55" />
      </filter>

      <!-- Crossbar Drop Shadow onto Stem -->
      <filter id="tk-stem-drop" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="3.5" stdDeviation="2.5" flood-color="#3E1103" flood-opacity="0.45" />
      </filter>

      <!-- Top Edge Rim Highlight -->
      <linearGradient id="tk-rim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.38" />
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
      </linearGradient>
    </defs>

    <!-- 1. Vertical Stem -->
    <rect x="37" y="24" width="26" height="64" rx="13" fill="url(#tk-stem)" />

    <!-- 2. Ambient Occlusion under crossbar -->
    <path d="M 37 39 L 63 39 L 63 49 C 63 45 50 43 37 46 Z" fill="#2E0E03" opacity="0.45" />

    <!-- 3. Left Pill Arm -->
    <path d="M 24 13 L 50 13 L 50 39 L 24 39 C 16.8 39 11 33.2 11 26 C 11 18.8 16.8 13 24 13 Z" fill="url(#tk-left)" filter="url(#tk-stem-drop)" />

    <!-- 4. Right Overlapping Pill Arm with curved inner boundary -->
    <path d="M 47 13 L 76 13 C 83.2 13 89 18.8 89 26 C 89 33.2 83.2 39 76 39 L 39 39 C 47.5 32 48 20 47 13 Z" fill="url(#tk-right)" filter="url(#tk-crease)" />

    <!-- 5. Subtle Top Rim Highlight -->
    <path d="M 24 13.5 L 76 13.5 C 82.8 13.5 88.5 19 88.5 26 C 88.5 27 88.3 27.9 88 28.8 C 86.3 20 81 15 74.5 15 L 25.5 15 C 19 15 13.7 20 12 28.8 C 11.7 27.9 11.5 27 11.5 26 C 11.5 19 17.2 13.5 24 13.5 Z" fill="url(#tk-rim)" />
  </svg>
  `;
}

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TOILOKI Brand Showcase</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
      user-select: none;
      display: flex;
      flex-direction: column;
    }

    .half-section {
      width: 100%;
      height: 50vh;
      padding: 3.5vh 5vw;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .half-section.light {
      background: #FFFFFF;
      color: #0A0D14;
    }

    .half-section.dark {
      background: #0B0D11;
      color: #FFFFFF;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* ─── Top Row ─── */
    .top-row {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 3.5vw;
      height: 18vh;
    }

    .brand-hero {
      display: flex;
      align-items: center;
      gap: 1.8vw;
    }

    .brand-wordmark-wrap {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .brand-title {
      font-size: 48px;
      font-weight: 800;
      letter-spacing: 0.03em;
      line-height: 1;
    }
    .light .brand-title { color: #000000; }
    .dark .brand-title { color: #FFFFFF; }

    .brand-subtitle {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.22em;
      margin-top: 8px;
      text-transform: uppercase;
    }
    .light .brand-subtitle { color: #58606E; }
    .dark .brand-subtitle { color: #8E96A4; }

    .v-divider {
      width: 1px;
      height: 80px;
    }
    .light .v-divider { background: rgba(0, 0, 0, 0.12); }
    .dark .v-divider { background: rgba(255, 255, 255, 0.12); }

    /* Squircles */
    .squircle {
      border-radius: 22.5%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      flex-shrink: 0;
    }

    .squircle.light-card {
      background: #FFFFFF;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.06);
    }

    .squircle.dark-card {
      background: #121419;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.09);
    }

    .squircle.dark-ambient-glow {
      background: #121419;
      box-shadow: 0 0 54px rgba(245, 158, 11, 0.18), 0 10px 30px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.09);
    }

    .labeled-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .item-caption {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.01em;
      text-align: center;
      white-space: nowrap;
    }
    .light .item-caption { color: #5B6370; }
    .dark .item-caption { color: #8F97A6; }

    /* ─── Bottom Row ─── */
    .bottom-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 2vw;
      height: 18vh;
      padding-bottom: 1vh;
    }

    .scale-strip {
      display: flex;
      align-items: flex-end;
      gap: 2vw;
    }

    .scale-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .scale-size-tag {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .light .scale-size-tag { color: #717885; }
    .dark .scale-size-tag { color: #8B92A0; }

    /* Right Lockups (Horizontal Logo + Favicon) */
    .right-lockups {
      display: flex;
      align-items: flex-end;
      gap: 2.5vw;
    }

    .horizontal-logo-card {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      padding: 12px 24px 12px 16px;
      border-radius: 9999px;
    }

    .light .horizontal-logo-card {
      background: #FFFFFF;
      border: 1px solid rgba(0, 0, 0, 0.09);
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
    }

    .dark .horizontal-logo-card {
      background: #14161C;
      border: 1px solid rgba(255, 255, 255, 0.09);
      box-shadow: 0 4px 22px rgba(0, 0, 0, 0.4);
    }

    .horizontal-text {
      display: flex;
      flex-direction: column;
    }

    .horizontal-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.02em;
      line-height: 1;
    }
    .light .horizontal-title { color: #000000; }
    .dark .horizontal-title { color: #FFFFFF; }

    .horizontal-sub {
      font-size: 7.5px;
      font-weight: 600;
      letter-spacing: 0.22em;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .light .horizontal-sub { color: #58606E; }
    .dark .horizontal-sub { color: #8E96A4; }

  </style>
</head>
<body>

  <!-- ════════════════════════════════════════════════════════
       LIGHT THEME PRESENTATION (TOP)
       ════════════════════════════════════════════════════════ -->
  <section class="half-section light">
    <div class="top-row">
      <!-- 1. Main Squircle + Wordmark -->
      <div class="brand-hero">
        <div class="squircle light-card" style="width: 126px; height: 126px;">
          ${getToilokiTSvg(82, 82)}
        </div>
        <div class="brand-wordmark-wrap">
          <div class="brand-title">TOILOKI</div>
          <div class="brand-subtitle">LOCAL UTILITY SUITE</div>
        </div>
      </div>

      <div class="v-divider"></div>

      <!-- 2. Standalone Symbol -->
      <div style="display: flex; align-items: center; justify-content: center; width: 90px;">
        ${getToilokiTSvg(84, 84)}
      </div>

      <!-- 3. App Icon (Light) -->
      <div class="labeled-item" style="margin-left: 1.5vw;">
        <div class="squircle light-card" style="width: 76px; height: 76px;">
          ${getToilokiTSvg(48, 48)}
        </div>
        <span class="item-caption">App Icon (Light)</span>
      </div>

      <!-- 4. App Icon (Dark) -->
      <div class="labeled-item">
        <div class="squircle dark-card" style="width: 76px; height: 76px;">
          ${getToilokiTSvg(48, 48)}
        </div>
        <span class="item-caption">App Icon (Dark)</span>
      </div>
    </div>

    <!-- Bottom Row (Light) -->
    <div class="bottom-row">
      <!-- Scale Benchmarks: 256px, 128px, 64px, 32px, 16px -->
      <div class="scale-strip">
        <div class="scale-box">
          <div class="squircle light-card" style="width: 74px; height: 74px;">
            ${getToilokiTSvg(46, 46)}
          </div>
          <span class="scale-size-tag">256px</span>
        </div>

        <div class="scale-box">
          <div class="squircle light-card" style="width: 56px; height: 56px;">
            ${getToilokiTSvg(36, 36)}
          </div>
          <span class="scale-size-tag">128px</span>
        </div>

        <div class="scale-box">
          <div class="squircle light-card" style="width: 42px; height: 42px;">
            ${getToilokiTSvg(26, 26)}
          </div>
          <span class="scale-size-tag">64px</span>
        </div>

        <div class="scale-box">
          <div class="squircle light-card" style="width: 32px; height: 32px;">
            ${getToilokiTSvg(20, 20)}
          </div>
          <span class="scale-size-tag">32px</span>
        </div>

        <div class="scale-box">
          <div class="squircle light-card" style="width: 22px; height: 22px;">
            ${getToilokiTSvg(14, 14)}
          </div>
          <span class="scale-size-tag">16px</span>
        </div>
      </div>

      <!-- Horizontal Logo + Favicon -->
      <div class="right-lockups">
        <div class="labeled-item">
          <div class="horizontal-logo-card">
            ${getToilokiTSvg(32, 32)}
            <div class="horizontal-text">
              <span class="horizontal-title">TOILOKI</span>
              <span class="horizontal-sub">LOCAL UTILITY SUITE</span>
            </div>
          </div>
          <span class="item-caption">Horizontal Logo (Light)</span>
        </div>

        <!-- Favicon (Light) -->
        <div class="labeled-item">
          <div class="squircle light-card" style="width: 40px; height: 40px;">
            ${getToilokiTSvg(24, 24)}
          </div>
          <span class="item-caption">Favicon (Light)<br>32px</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════
       DARK THEME PRESENTATION (BOTTOM)
       ════════════════════════════════════════════════════════ -->
  <section class="half-section dark">
    <div class="top-row">
      <!-- 1. Main Squircle + Wordmark with Amber Glow -->
      <div class="brand-hero">
        <div class="squircle dark-ambient-glow" style="width: 126px; height: 126px;">
          ${getToilokiTSvg(82, 82)}
        </div>
        <div class="brand-wordmark-wrap">
          <div class="brand-title">TOILOKI</div>
          <div class="brand-subtitle">LOCAL UTILITY SUITE</div>
        </div>
      </div>

      <div class="v-divider"></div>

      <!-- 2. Standalone Symbol -->
      <div style="display: flex; align-items: center; justify-content: center; width: 90px;">
        ${getToilokiTSvg(84, 84)}
      </div>

      <!-- 3. App Icon (Dark) -->
      <div class="labeled-item" style="margin-left: 1.5vw;">
        <div class="squircle dark-ambient-glow" style="width: 76px; height: 76px; box-shadow: 0 0 24px rgba(245, 158, 11, 0.16), 0 8px 24px rgba(0,0,0,0.5);">
          ${getToilokiTSvg(48, 48)}
        </div>
        <span class="item-caption">App Icon (Dark)</span>
      </div>

      <!-- 4. App Icon (Light) -->
      <div class="labeled-item">
        <div class="squircle light-card" style="width: 76px; height: 76px;">
          ${getToilokiTSvg(48, 48)}
        </div>
        <span class="item-caption">App Icon (Light)</span>
      </div>
    </div>

    <!-- Bottom Row (Dark) -->
    <div class="bottom-row">
      <!-- Scale Benchmarks: 256px, 128px, 64px, 32px, 16px -->
      <div class="scale-strip">
        <div class="scale-box">
          <div class="squircle dark-card" style="width: 74px; height: 74px;">
            ${getToilokiTSvg(46, 46)}
          </div>
          <span class="scale-size-tag">256px</span>
        </div>

        <div class="scale-box">
          <div class="squircle dark-card" style="width: 56px; height: 56px;">
            ${getToilokiTSvg(36, 36)}
          </div>
          <span class="scale-size-tag">128px</span>
        </div>

        <div class="scale-box">
          <div class="squircle dark-card" style="width: 42px; height: 42px;">
            ${getToilokiTSvg(26, 26)}
          </div>
          <span class="scale-size-tag">64px</span>
        </div>

        <div class="scale-box">
          <div class="squircle dark-card" style="width: 32px; height: 32px;">
            ${getToilokiTSvg(20, 20)}
          </div>
          <span class="scale-size-tag">32px</span>
        </div>

        <div class="scale-box">
          <div class="squircle dark-card" style="width: 22px; height: 22px;">
            ${getToilokiTSvg(14, 14)}
          </div>
          <span class="scale-size-tag">16px</span>
        </div>
      </div>

      <!-- Horizontal Logo + Favicon -->
      <div class="right-lockups">
        <div class="labeled-item">
          <div class="horizontal-logo-card">
            ${getToilokiTSvg(32, 32)}
            <div class="horizontal-text">
              <span class="horizontal-title">TOILOKI</span>
              <span class="horizontal-sub">LOCAL UTILITY SUITE</span>
            </div>
          </div>
          <span class="item-caption">Horizontal Logo (Dark)</span>
        </div>

        <!-- Favicon (Dark) -->
        <div class="labeled-item">
          <div class="squircle dark-card" style="width: 40px; height: 40px;">
            ${getToilokiTSvg(24, 24)}
          </div>
          <span class="item-caption">Favicon (Dark)<br>32px</span>
        </div>
      </div>
    </div>
  </section>
</body>
</html>`;

const outHtml = path.join(__dirname, 'brand_showcase.html');
fs.writeFileSync(outHtml, htmlContent);

app.disableHardwareAcceleration();

async function run() {
  await app.whenReady();
  const win = new BrowserWindow({
    width: 1440,
    height: 720,
    show: false,
    frame: false,
    webPreferences: { offscreen: true }
  });

  await win.loadFile(outHtml);
  await new Promise((r) => setTimeout(r, 1400));

  const image = await win.webContents.capturePage();
  const outPath = path.join(__dirname, '..', 'screenshots', 'toiloki-logo-showcase.png');
  fs.writeFileSync(outPath, image.toPNG());
  console.log('Saved brand showcase to:', outPath);

  win.destroy();
  app.quit();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
