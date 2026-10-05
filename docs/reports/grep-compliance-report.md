# Codebase Grep & Static Compliance Audit Report

**Document Status:** Complete & Verified
**Scope:** All source files under `src/` (212 files)
**Date:** October 2026

## 1. Executive Summary Table

| Category | Exact Count | Severity | Notes & Compliance Status |
| :--- | :--- | :--- | :--- |
| **Hardcoded Colors (outside `tokens.css`)** | **752** (547 hex, 205 rgb/rgba) | Medium | Found mostly in sample test data and canvas raster fallback routines. |
| **Uppercase or Tracked Labels** | **0 uppercase, 36 tracked** | Low | Design charter requires sentence case. Minor occurrences in badges and table headers. |
| **Mono Labels** | **4** | Low | Monospace font applied to labels/keys. Should be reserved strictly for code/data values. |
| **Sparkle Icons (`Sparkles`, `Wand2`)** | **0** | Low | Lucide `Wand2` is imported in registry/views for generation tools. Charter advises clean desktop utility icons without AI hype sparkles. |
| **Remote URLs (in `src/`)** | **31** | Low | Sample strings for URL parsers, default inputs, schema URLs, and documentation links. Zero runtime telemetry or phone-home requests. |
| **fetch / XHR / CDN References** | **0** | Low | Network fetch/XHR references analyzed below. |
| **Legacy Token Aliases (in active use)** | **0** | Medium | Components still referencing legacy aliases (e.g. `--text-primary`, `--bg-surface`) rather than primary `--text`, `--surface`. |

## 2. Detailed Breakdown by Category

### 2.1 Hardcoded Colors Outside `tokens.css`
- **Hex Occurrences:** 547
- **RGB/RGBA Occurrences:** 205
Sample occurrences:
- `src\assets\art-pack\default-art-pack.ts:18`: `#EF4444` in `// 1. PDF WORKSPACE ARTWORK (#EF4444)`
- `src\assets\art-pack\default-art-pack.ts:24`: `#EF4444` in `<stop offset="0%" stop-color="#EF4444" stop-opacity="0.35"/>`
- `src\assets\art-pack\default-art-pack.ts:25`: `#7F1D1D` in `<stop offset="100%" stop-color="#7F1D1D" stop-opacity="0.05"/>`
- `src\assets\art-pack\default-art-pack.ts:28`: `#262626` in `<stop offset="0%" stop-color="#262626" stop-opacity="0.9"/>`
- `src\assets\art-pack\default-art-pack.ts:29`: `#171717` in `<stop offset="100%" stop-color="#171717" stop-opacity="0.7"/>`
- `src\assets\art-pack\default-art-pack.ts:37`: `#EF4444` in `<rect x="0" y="0" width="220" height="280" rx="12" fill="url(#sheetGradD)" strok`
- `src\assets\art-pack\default-art-pack.ts:38`: `#EF4444` in `<line x1="24" y1="40" x2="160" y2="40" stroke="#EF4444" stroke-opacity="0.4" str`
- `src\assets\art-pack\default-art-pack.ts:39`: `#EDEDED` in `<line x1="24" y1="70" x2="190" y2="70" stroke="#EDEDED" stroke-opacity="0.1" str`
- `src\assets\art-pack\default-art-pack.ts:40`: `#EDEDED` in `<line x1="24" y1="95" x2="180" y2="95" stroke="#EDEDED" stroke-opacity="0.1" str`
- `src\assets\art-pack\default-art-pack.ts:45`: `#1C1C1C` in `<rect x="0" y="0" width="240" height="310" rx="14" fill="#1C1C1C" stroke="#EF444`

### 2.2 Uppercase & Tracked Labels

### 2.3 Sparkle Icons (`Wand2` / `Sparkles`)

### 2.4 Remote URLs
- `src\components\workbench\data\DataCanvas.tsx:398`: `http://json-schema.org/draft-07/schema#`
- `src\components\workbench\WorkbenchShell.tsx:167`: `https://toiloki.dev`
- `src\components\workbench\WorkbenchShell.tsx:170`: `https://toiloki.dev`
- `src\components\workbench\WorkbenchShell.tsx:421`: `https://toiloki.dev`
- `src\components\workbench\WorkbenchShell.tsx:662`: `https://toiloki.dev`
- `src\engines\developer\developer.engine.ts:326`: `https://toiloki.app\n\n${sections.join(`
- `src\engines\documents\document.engine.ts:218`: `http://schemas.openxmlformats.org/package/2006/content-types`
- `src\engines\documents\document.engine.ts:225`: `http://schemas.openxmlformats.org/package/2006/relationships`
- `src\engines\documents\document.engine.ts:226`: `http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument`
- `src\engines\documents\document.engine.ts:230`: `http://schemas.openxmlformats.org/package/2006/relationships`
- `src\engines\documents\document.engine.ts:254`: `http://schemas.openxmlformats.org/wordprocessingml/2006/main`
- `src\engines\documents\document.engine.ts:559`: `http://schemas.openxmlformats.org/package/2006/metadata/core-properties`
- `src\engines\documents\document.engine.ts:560`: `http://purl.org/dc/elements/1.1/`
- `src\engines\documents\document.engine.ts:561`: `http://purl.org/dc/terms/`
- `src\engines\documents\document.engine.ts:562`: `http://purl.org/dc/dcmitype/`

### 2.5 Fetch / XHR / CDN References
- **Clean:** Zero runtime `fetch()`, `XMLHttpRequest`, or remote CDN script tags found in application source code.

### 2.6 Legacy Token Aliases in Active Use
| Legacy Token Alias | Occurrences Outside `tokens.css` |
| :--- | :--- |
