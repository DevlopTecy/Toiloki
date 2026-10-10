// tests/tauri-architecture.test.cjs
// Automated verification suite for Toiloki Rust + Tauri v2 migration

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TOILOKI TAURI & RUST ARCHITECTURE VERIFICATION ---');

const projectRoot = path.resolve(__dirname, '..');
const tauriDir = path.join(projectRoot, 'src-tauri');

// 1. Cargo.toml exists and has correct dependencies
const cargoPath = path.join(tauriDir, 'Cargo.toml');
assert(fs.existsSync(cargoPath), 'Cargo.toml must exist');
const cargoContent = fs.readFileSync(cargoPath, 'utf8');
assert(cargoContent.includes('name = "toiloki"'), 'Cargo.toml package name must be toiloki');
assert(cargoContent.includes('tauri ='), 'Cargo.toml must include tauri dependency');
assert(cargoContent.includes('rfd ='), 'Cargo.toml must include rfd dependency');
assert(cargoContent.includes('sha2 ='), 'Cargo.toml must include sha2 dependency');
assert(cargoContent.includes('rayon ='), 'Cargo.toml must include rayon dependency');
assert(cargoContent.includes('sysinfo ='), 'Cargo.toml must include sysinfo dependency');
console.log('✓ Cargo.toml dependencies and manifest validated');

// 2. tauri.conf.json exists and is valid JSON
const tauriConfPath = path.join(tauriDir, 'tauri.conf.json');
assert(fs.existsSync(tauriConfPath), 'tauri.conf.json must exist');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
assert.strictEqual(tauriConf.productName, 'Toiloki', 'Product name must be Toiloki');
assert.strictEqual(tauriConf.identifier, 'com.toiloki.app', 'Identifier must match com.toiloki.app');
assert(tauriConf.app && tauriConf.app.windows && tauriConf.app.windows.length > 0, 'Window configuration must exist');
const mainWindow = tauriConf.app.windows[0];
assert.strictEqual(mainWindow.decorations, false, 'Window decorations must be false for custom titlebar');
assert.strictEqual(mainWindow.width, 1280, 'Window default width must be 1280');
assert.strictEqual(mainWindow.height, 840, 'Window default height must be 840');
assert(tauriConf.app.security && tauriConf.app.security.csp, 'Offline CSP policy must be configured');
console.log('✓ tauri.conf.json configuration validated');

// 3. Rust Source Files & Commands
const srcDir = path.join(tauriDir, 'src');
assert(fs.existsSync(path.join(srcDir, 'main.rs')), 'main.rs must exist');
assert(fs.existsSync(path.join(srcDir, 'lib.rs')), 'lib.rs must exist');

const commandsDir = path.join(srcDir, 'commands');
assert(fs.existsSync(commandsDir), 'commands module must exist');
const expectedModules = ['window.rs', 'dialog.rs', 'fs.rs', 'shell.rs', 'wallpaper.rs', 'engine.rs', 'mod.rs'];
for (const mod of expectedModules) {
  assert(fs.existsSync(path.join(commandsDir, mod)), `Command module ${mod} must exist`);
}

const libContent = fs.readFileSync(path.join(srcDir, 'lib.rs'), 'utf8');
assert(libContent.includes('window_minimize'), 'lib.rs must register window_minimize');
assert(libContent.includes('dialog_open_file'), 'lib.rs must register dialog_open_file');
assert(libContent.includes('fs_read_file_buffer'), 'lib.rs must register fs_read_file_buffer');
assert(libContent.includes('engine_compute_sha256'), 'lib.rs must register engine_compute_sha256');
assert(libContent.includes('engine_batch_hash_files'), 'lib.rs must register engine_batch_hash_files');
assert(libContent.includes('engine_get_system_stats'), 'lib.rs must register engine_get_system_stats');
console.log('✓ Rust modules and Tauri commands registration validated');

// 4. Frontend Bridge & Adapter
const tauriBridgePath = path.join(projectRoot, 'src', 'core', 'platform', 'tauri-bridge.ts');
assert(fs.existsSync(tauriBridgePath), 'tauri-bridge.ts must exist');
const tauriBridgeContent = fs.readFileSync(tauriBridgePath, 'utf8');
assert(tauriBridgeContent.includes('export function isTauriEnvironment'), 'isTauriEnvironment must be exported');
assert(tauriBridgeContent.includes('export function initTauriBridge'), 'initTauriBridge must be exported');
assert(tauriBridgeContent.includes('createTauriRustEngine'), 'createTauriRustEngine must be implemented');

const platformAdapterPath = path.join(projectRoot, 'src', 'core', 'platform', 'platform-adapter.ts');
const platformAdapterContent = fs.readFileSync(platformAdapterPath, 'utf8');
assert(platformAdapterContent.includes('export class TauriPlatformAdapter'), 'TauriPlatformAdapter must be defined');
assert(platformAdapterContent.includes("'tauri'"), "PlatformType must include 'tauri'");
console.log('✓ Frontend Tauri bridge and platform adapter validated');

// 5. Package.json scripts
const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
assert(pkg.scripts['dev:tauri'], 'dev:tauri script must exist');
assert(pkg.scripts['build:tauri'], 'build:tauri script must exist');
assert(pkg.dependencies['@tauri-apps/api'], '@tauri-apps/api dependency must exist');
console.log('✓ package.json scripts and dependencies validated');

console.log('\n[ALL CHECKS PASSED] Rust + Tauri architecture is successfully integrated and verified!');
