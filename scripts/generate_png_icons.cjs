const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();

const sizes = [16, 32, 48, 64, 128, 256, 512];

const svgPath = path.join(__dirname, '..', 'src', 'assets', 'logo', 'toiloki-app-icon-dark.svg');
const svgRaw = fs.readFileSync(svgPath, 'utf8');

async function run() {
  await app.whenReady();

  const win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: { offscreen: true }
  });

  const html = '<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">' +
    '<div style="width:512px;height:512px;">' + svgRaw + '</div>' +
    '</body></html>';

  const tmpHtml = path.join(__dirname, 'tmp_icon_512.html');
  fs.writeFileSync(tmpHtml, html);

  await win.loadFile(tmpHtml);
  await new Promise((r) => setTimeout(r, 600));

  const masterImage = await win.webContents.capturePage();
  if (fs.existsSync(tmpHtml)) {
    fs.unlinkSync(tmpHtml);
  }

  for (const size of sizes) {
    const resized = size === 512 ? masterImage : masterImage.resize({ width: size, height: size, quality: 'best' });
    const pngBuffer = resized.toPNG();

    const publicOut = path.join(__dirname, '..', 'public', 'icon-' + size + '.png');
    fs.writeFileSync(publicOut, pngBuffer);

    if (size === 256) {
      fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon.png'), pngBuffer);
      fs.writeFileSync(path.join(__dirname, '..', 'src', 'assets', 'logo', 'icon-256.png'), pngBuffer);
    }
    if (size === 32) {
      fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.png'), pngBuffer);
      fs.writeFileSync(path.join(__dirname, '..', 'src', 'assets', 'logo', 'favicon-32.png'), pngBuffer);
    }
  }

  console.log('Successfully generated all icon sizes in public/ and src/assets/logo/ via high-quality Lanczos downsampling.');
  win.destroy();
  app.quit();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
