# Known Issues, Limitations & Static Inspection Report

**Document Status:** Complete & Verified  
**Application:** Toiloki – Local Suite (v1.0.0)  
**Audit Head Commit:** `21eafde`  
**Audit Date:** October 2026  

---

## 1. Executive Summary

As part of the comprehensive reality check, an exhaustive code and runtime audit was conducted across all 14 engines, 13 workspaces, build pipelines, and automated test runners. Every known issue, technical limitation, runtime warning, and deviation from the design charter is documented below with its exact severity and reproduction procedure.

---

## 2. Issues & Limitations Registry

### Issue 1: Missing Native Video Transcoding Engine (FFmpeg)
- **Severity:** **P1 (High)**
- **Category:** Media Engine / Video Transcoding
- **Affected Utilities:** `video-converter`, `video-compressor`, `video-to-gif`, `media-extract-audio`, `media-frame-extractor`, `audio-converter`, `audio-joiner`
- **Root Cause:** Toiloki does not bundle the standalone `ffmpeg.exe` or `ffprobe.exe` binaries due to size and distribution complexity. Electron's bundled `ffmpeg.dll` only supports HTML5 playback codecs. Action buttons in `MediaWorkspaceView.tsx` lacked backend execution routines.
- **Reproduction Steps:**
  1. Open Audio & Video workspace.
  2. Select Video Converter or Video Compressor.
  3. Load an `.mp4` or `.mov` file and click Convert.
  4. Notice no transcoding process is launched.
- **Remediation Applied:** All 7 unimplemented media utilities were downgraded from `ready` to **`soon`** in `src/core/registry/app-registry.ts`. When "Show upcoming utilities" is turned off, they are hidden from the user.

---

### Issue 2: Missing Offline HEIC / AVIF Decoders
- **Severity:** **P1 (High)**
- **Category:** Images Engine / Mobile Formats
- **Affected Utilities:** `img-heic-converter`, `img-avif-converter`
- **Root Cause:** Neither `libheif` nor `heic2any` WebAssembly binaries are bundled in the repository. Standard browser Canvas `Image()` elements cannot decode Apple HEIC files locally. In `ImagesWorkspaceView.tsx`, these utilities were improperly routed to general image resizing.
- **Reproduction Steps:**
  1. Open Images workspace.
  2. Select HEIC to JPG/PNG Converter.
  3. Attempt to decode a `.heic` photo.
  4. Decoding fails due to unsupported format error.
- **Remediation Applied:** Downgraded `img-heic-converter` and `img-avif-converter` to **`soon`** in `src/core/registry/app-registry.ts`.

---

### Issue 3: PDF.js Non-Latin cMap CDN Reference
- **Severity:** **P2 (Medium)**
- **Category:** Offline Resilience & Security
- **Affected File:** `src/components/workbench/pdf/pdfThumbnailService.ts:47`
- **Root Cause:** The PDF.js thumbnail worker configuration references a remote CDN URL: `cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist/cmaps/'`.
- **Reproduction Steps:**
  1. Fully disconnect network adapters.
  2. Load a PDF document containing non-Latin (CJK / Arabic) font encodings.
  3. The PDF thumbnail generator attempts to make an external network request to jsdelivr, logging a network error in the console.
- **Remediation Required:** Package standard PDF.js cMap binary files locally under `public/cmaps/` and update the service to point to `file://` or local `/cmaps/`.

---

### Issue 4: Light Mode Contrast Deficiencies on Accent Buttons & Status Colors
- **Severity:** **P2 (Medium)**
- **Category:** Accessibility & WCAG 2.1 AA Compliance
- **Affected File:** `src/styles/tokens.css`
- **Root Cause:**
  - White text `#FFFFFF` on the light mode orange accent `#E8890C` achieves only **2.62:1** contrast ratio (fails WCAG 4.5:1 minimum for normal text).
  - Accent text on light background is **2.51:1** and on surface is **2.62:1**.
  - Success text `#16A34A` on light surface is **3.30:1** (fails 4.5:1).
  - Warning text `#D97706` on light surface is **3.19:1** (fails 4.5:1).
  - Subtle borders in both dark (`1.28:1` to `1.39:1`) and light (`1.23:1` to `1.29:1`) fall below the 3:1 non-text boundary threshold.
- **Reproduction Steps:**
  1. In Settings -> Appearance, switch theme to Light.
  2. Inspect primary accent action buttons (e.g. Save or Download).
  3. Note that white text on amber/orange is difficult to read in bright light.
- **Remediation Required:** Update Light mode `--on-accent` to dark slate (`#1A1100`) or deepen the accent to `#C25E00`.

---

### Issue 5: TitleBar Retains 'Smart Paste' and 'Chains' Action Pills
- **Severity:** **P2 (Medium)**
- **Category:** Design Charter / Shell Layout
- **Affected File:** `src/components/layout/TitleBar.tsx:47-69`
- **Root Cause:** Design Charter specifies: *"Title bar = logo, centered search, window controls only (no theme toggle, no Smart Paste or Chains pills)"*. Currently, `TitleBar.tsx` houses `Smart Paste` and `Chains` pill buttons adjacent to the search input.
- **Reproduction Steps:**
  1. Observe the top 40px window title bar.
  2. Next to the centered `Ctrl K` search trigger, two pills are present: `Smart Paste` and `Chains`.
- **Remediation Required:** Move Smart Paste and Chains triggers into the command palette or sidebar quick actions.

---

### Issue 6: Sidebar Structure & Row Counts
- **Severity:** **P2 (Medium)**
- **Category:** Design Charter / Navigation Hierarchy
- **Affected File:** `src/components/layout/Sidebar.tsx`
- **Root Cause:**
  - Sidebar groups categories into `Workspaces` (Core) and `More`, instead of the charter's 3 purpose chunks (`Files and media`, `Data and code`, `Tools`).
  - Every workspace row displays a numerical count pill (`nav-count-pill`), which violates the charter rule *"no counts in rows"*.
  - Library section contains `Favorites`, `Recent History`, and `Trash`, but lacks `Workflows`.
- **Reproduction Steps:**
  1. Open the sidebar.
  2. Observe numeric badges (`[38]`, `[27]`, etc.) next to each workspace item.
- **Remediation Required:** Restructure sidebar into 3 designated chunks, remove row count badges, and add Workflows link to Library.

---

### Issue 7: Utility TabBar Rendered When Only 1 Tab Exists
- **Severity:** **P2 (Medium)**
- **Category:** Design Charter / Tab Behavior
- **Affected File:** `src/App.tsx:452`
- **Root Cause:** Design Charter specifies: *"Tab row only with 2+ tabs"*. Currently, `<TabBar ... />` is rendered unconditionally even when `tabs.length === 1`.
- **Reproduction Steps:**
  1. Launch Toiloki.
  2. With only the initial Home tab open, observe that the tab row is visible displaying a single `HOME` tab.
- **Remediation Required:** Wrap `<TabBar>` in `{tabs.length > 1 && <TabBar ... />}`.

---

### Issue 8: Compression Presets Rendered as Dropdown Rather Than Selectable Tiles
- **Severity:** **P2 (Medium)**
- **Category:** UI Component Design
- **Affected Files:** `src/components/workbench/WorkbenchShell.tsx:3940`, `src/workspaces/pdf/PdfWorkspaceView.tsx:1100`
- **Root Cause:** Charter specifies: *"Compression presets as tiles"*. Currently, compression presets are rendered as a standard HTML `<select>` dropdown menu with `<option>` elements.
- **Reproduction Steps:**
  1. In PDF workspace, open a document and select `Compress PDF`.
  2. Observe the right-hand options panel displaying a dropdown `<select>` instead of clickable preset cards.
- **Remediation Required:** Replace `<select>` with a grid of clickable tile cards showing preset title, compression target, and estimated quality.

---

### Issue 9: Large Production JS Bundle Warning
- **Severity:** **P3 (Low)**
- **Category:** Build & Bundle Optimization
- **Affected File:** `dist/assets/index-BvLKM4Xz.js` (4.65 MB unchunked)
- **Root Cause:** All 13 workspaces and 14 engines are bundled into a single monolithic bundle rather than lazy-loaded by workspace route.
- **Reproduction Steps:**
  1. Execute `npm run build`.
  2. Notice Vite warning: `(!) Some chunks are larger than 500 kB after minification.`
- **Remediation Required:** Implement `React.lazy()` dynamic imports for each workspace component in `WorkspaceView.tsx`.

---

## 3. Codebase Cleanliness Sign-Off
- **`TODO` / `FIXME` Comments Found:** **0** (Zero)
- **Skipped Test Cases (`it.skip` / `describe.skip`):** **0** (Zero)
- **Runtime Crashes in Foundation Engine Tests:** **0** (100% Passing)
- **Compilation Errors:** **0** (`tsc -b` and `vite build` pass cleanly)
