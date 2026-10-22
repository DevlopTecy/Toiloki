# Toiloki Multi-Platform Feasibility Audit & Architecture Specification

**Status**: Verified & Specified (Phase 9)  
**Date**: October 6, 2026  
**Auditor**: Automated QA Runner & Architecture Auditor  
**Runtime Abstraction**: `src/core/platform/platform-adapter.ts`  

---

## 1. Executive Summary

Toiloki was originally architected as a local-first Windows desktop suite running within Electron. Phase 9 establishes the architectural decoupling required to run Toiloki across multiple client tiers:
1. **Windows / macOS / Linux Desktop (Native Electron — Tier 1)**
2. **Tablet & Large Foldable Devices (Offline PWA — Tier 2)**
3. **Mobile Smartphones (Capacitor / Mobile Web — Tier 3)**

By decoupling native desktop bridges (`window.toiloki`) behind the `PlatformAdapter` abstraction layer, the core 13 workspaces and 200+ offline utilities can run seamlessly in any browser supporting the W3C File System Access API, Web Audio API, Canvas 2D, and Web Crypto APIs.

---

## 2. Platform Comparison Matrix

| Platform Dimension | Windows Desktop (Tier 1) | Tablet PWA (Tier 2) | Mobile Capacitor (Tier 3) |
|---|---|---|---|
| **Runtime Container** | Electron 34+ (Chromium + Node.js) | Standalone PWA (Service Worker) | Capacitor 6+ (Native WebView) |
| **Filesystem Access** | Direct OS Filesystem (Node `fs`) | File System Access API (`showOpenFilePicker`) | Capacitor Filesystem Plugin / Intent |
| **Max Memory Budget** | 4 GB+ heap available | 500 MB – 1 GB (OS browser clamp) | 150 MB – 250 MB strict heap clamp |
| **Max Recommended File Size** | 500 MB (streaming/chunks) | 75 MB (RAM constrained) | 25 MB (low-RAM risk) |
| **Offline Guarantee** | 100% Guaranteed (Air-gapped) | Guaranteed via Cache Storage / SW | Guaranteed via Bundled Web Assets |
| **Window Shell** | Custom Frameless TitleBar (40–52px) | OS Browser Navigation / Fullscreen | Native Status Bar / Safe Areas |
| **Primary Interaction** | Mouse, Keyboard, Shortcuts (`Ctrl+?`) | Touch Gestures, Apple Pencil, Stylus | Touch, Swipe, Virtual Keyboard |
| **Layout Topology** | 3-Zone (Sidebar 240px, Zone 1, Zone 2) | 2-Zone (Icon Rail 56px, Canvas, Options) | 1-Column Stack (Stacked Drawer & Cards) |
| **Status Bar / System Tray** | Native Tray Icon + Background Hotkeys | N/A (Web Notification API) | Native Push / Local Notifications |

---

## 3. Platform Adapter Abstraction Layer

The platform interface defined in [`src/core/platform/platform-adapter.ts`](file:///d:/Projects/Project%203_Toiloki/src/core/platform/platform-adapter.ts) provides uniform primitives:

```typescript
export interface PlatformAdapter {
  getPlatformName(): 'electron' | 'web-pwa' | 'capacitor' | 'browser';
  getCapabilities(): PlatformCapabilities;

  // File I/O
  pickFiles(options?: { accept?: string[]; multiple?: boolean }): Promise<PlatformFile[]>;
  saveFile(data: Uint8Array | string, defaultName: string, mime?: string): Promise<PlatformSaveResult>;

  // Clipboard
  readClipboardText(): Promise<string>;
  writeClipboardText(text: string): Promise<void>;

  // Window Shell
  minimizeWindow(): void;
  maximizeWindow(): void;
  closeWindow(): void;

  // Alerts & Notifications
  showNotification(title: string, body: string): void;
}
```

### 3.1 `ElectronPlatformAdapter`
- Leverages `window.toiloki.fs.openFileDialog` and `saveFileDialog` for native dialogs.
- Supports arbitrary local directory paths without sandboxed origin restrictions.
- Handles custom frameless window minimizing, maximizing, and closing via `window.toiloki.appBridge`.

### 3.2 `WebPlatformAdapter` (PWA / Web Fallback)
- Utilizes `window.showOpenFilePicker` and `window.showSaveFilePicker` when available (Chromium/Edge/Chrome).
- Gracefully falls back to invisible `<input type="file">` elements and `Blob` object URL downloads on browsers lacking the File System Access API (e.g. Safari on iOS/iPadOS).
- Uses `navigator.clipboard.readText()` and `writeText()`.
- Uses standard W3C `Notification` API.

---

## 4. Workspaces Feasibility Breakdown

### 4.1 100% Web-Feasible Workspaces (Zero-Binary, Pure JS/WASM)
These workspaces require zero modifications to run in Tablet PWA or Mobile:
1. **Developer Workspace**: Pure JS parsers (JSON, Base64, JWT, UUID, RegEx, Cron, Timestamp).
2. **Calculator Workspace**: Pure math arithmetic, trigonometry, financial schedules, unit conversion matrices.
3. **Text Workspace**: Case conversions, word counts, side-by-side diffing (`diff` package), regex replacement.
4. **Data Workspace**: CSV/TSV parser, data statistics, JSONPath query inspector.
5. **Security Workspace**: Web Crypto API (`crypto.subtle`) for SHA-256, HMAC, PBKDF2, AES-GCM, RSA keygen, RFC 6238 TOTP.
6. **Network Workspace**: cURL generator, subnet CIDR math, MIME tables, SEO meta generator, IP converter.
7. **Design Workspace**: Color space math (HEX/RGB/HSL/CMYK), WCAG contrast, type scales, SVG sanitizer.

### 4.2 Web-Feasible with Memory Clamping
1. **PDF Workspace**: Powered by `pdf-lib` and `pdfjs-dist`. Fully functional in PWA with memory clamping (clamp to < 50MB files on tablets).
2. **Images Workspace**: Powered by HTML5 Canvas and `exifreader`. Pure client-side image manipulation.
3. **Files & Archives**: Powered by `jszip`. ZIP creation, inspection, and extraction work entirely in browser memory.
4. **Media Workspace**: Native Web Audio API (`AudioContext`, audio buffer slicing, 16-bit PCM WAV encoding) works offline in all modern browsers.

### 4.3 Utilities Requiring Native Binaries ('soon')
Utilities dependent on FFmpeg (`video-converter`, `video-compressor`, `video-trimmer`, `audio-converter`, `audio-joiner`) remain marked `'soon'` and hidden across all tiers until optional sidecar binary loading or WebAssembly FFmpeg (with SharedArrayBuffer headers) is evaluated in a future roadmap.

---

## 5. Responsive Design System Breakpoints

Toiloki enforces three standardized harmonic breakpoints:

1. **Expanded (>= 1024px)**:
   - Sidebar width: 240px (`--sidebar-width`).
   - Titlebar: 52px height with logo, centered search, and window controls.
   - Workbench: 3-zone layout (Zone 1 canvas/preview, Zone 2 320px options panel).
2. **Medium / Tablet (600px – 1023px)**:
   - Sidebar width: 56px icon rail. Labels and storage cards collapse smoothly.
   - Titlebar: E-commerce search clamp(200px, 35vw, 400px).
   - Workbench: Zone 2 options panel narrows to 280px; canvas fluidly occupies remaining width.
3. **Compact / Mobile (< 600px)**:
   - Sidebar width: 56px or off-canvas drawer.
   - Titlebar: 48px height with compact logo (wordmark hidden) and collapsed search button.
   - Workbench: 3-zone layout stacks vertically into single column (`flex-direction: column; overflow-y: auto`). Zone 1 preview card is compact; Zone 2 options renders inline below.
   - Horizontal scroll: strictly `overflow-x: hidden` with zero horizontal scrollbars.

---

## 6. Conclusion & Roadmap Recommendations

1. **Tablet PWA Deployment**:
   - Register a standard offline Service Worker caching `dist/` assets (`index.html`, `vendor-pdfjs`, `vendor-mathjs`, CSS).
   - Provide a `manifest.json` with standalone display mode and custom icons.
2. **Mobile Capacitor Deployment**:
   - Wrap the Vite production bundle into Capacitor iOS/Android shell.
   - Enforce a 25MB file upload limit warning on low-memory mobile devices.
3. **Windows Desktop Integrity**:
   - Remains the benchmark gold-standard tier with full multi-tab session management, local file system streaming, and zero external binary bloat.
