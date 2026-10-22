# QA Audit Report: PDF Workspace (Phase 4A)

**Workspace**: PDF  
**Date**: October 5, 2026  
**Auditor**: Automated QA Runner & Workspace Auditor  
**Suite**: Toiloki Offline Desktop Suite  
**Commit**: Phase 4A  

---

## Executive Summary

Phase 4A completed a comprehensive overhaul of all PDF utilities in Toiloki:
1. **Split PDF**: Implemented 4 partitioning modes (`markers`, `everyN`, `ranges`, `size`), dynamic live cutDividers, and real-time computation of planned output file names (`${cleanBase}_part${i}_p${start}-${end}.pdf`) displayed in a clean outputs preview chips banner before execution. Auto-packaging to zip archive when multiple parts are produced.
2. **Optimize & Compress PDF**: Implemented 3 preset tiles (`Light`, `Balanced` [Recommended/Default], `Extreme`). Added numeric feedback calculation (`4.0 MB to 1.6 MB, 61% smaller`), object streams optimization, and an `isLarger` guard that preserves the original document if compression increases file size.
3. **Organize Pages (Crop & Replace)**: Added an `"Apply to: All pages | Selected pages only"` scope toggle to Crop Pages, passing specific target page indices to the engine. Added a "Replace page" action in the floating selection toolbar to allow one-click page replacement from an external PDF file.
4. **Remove Blank Pages**: Added sensitivity threshold control (`Low (Conservative)`, `Balanced`, `High (Aggressive)`), visual `[Blank]` pill badge detection on page cards, and auto-selection of detected blanks.
5. **Redaction Sanitization**: Verified and enhanced annotation dictionary purging (`page.node.delete(PDFName.of('Annots'))`) on redacted pages to ensure no popup, comment, or underlying vector text leaks.

---

## Universal Checklist & Audit Table

| Utility ID | Issue / Requirement | Type | Severity | Status | Test Added | Verification Details |
|---|---|---|---|---|---|---|
| `split-pdf` | No output filename preview or count before run; single split logic | UI/UX / Feature | P1 | **Fixed** | `tests/pdf-workspace-complete.test.cjs` | 4 modes (`markers`, `everyN`, `ranges`, `size`), output chips preview, zipped multi-part export |
| `compress-pdf` | Generic compression without numeric feedback or larger-file guard | UI/UX / Bug | P1 | **Fixed** | `tests/pdf-workspace-complete.test.cjs` | 3 presets (Balanced recommended), numeric feedback (`X MB to Y MB, Z% smaller`), original preserved when larger |
| `pdf-crop-pages` | Cropping always applied blindly to all pages without selection scope | UI/UX / Feature | P2 | **Fixed** | `tests/pdf-workspace-complete.test.cjs` | Added `"All pages"` vs `"Selected pages only"` scope toggle; engine only modifies targeted page crop boxes |
| `pdf-replace-page` | Missing one-click page replacement from external PDF | Feature | P2 | **Fixed** | `tests/pdf-workspace-complete.test.cjs` | Added Replace button to floating toolbar when 1 page selected; uses `PdfEngine.replacePages` |
| `pdf-remove-blank-pages` | Hardcoded dummy selection; no sensitivity threshold | UI/UX / Bug | P1 | **Fixed** | `tests/pdf-workspace-complete.test.cjs` | Sensitivity control (Low, Balanced, High), `[Blank]` pill badges, auto-select blanks |
| `pdf-redact` | Need to verify text and annotations are truly purged without leaks | Security / Bug | P0 | **Fixed** | `tests/pdf-workspace-complete.test.cjs` | `page.node.delete(PDFName.of('Annots'))` strips annotation dictionaries on redacted pages |
| `merge-pdf` | File range parsing & page order preservation (from Phase 3) | Bug | P0 | **Fixed** | `tests/pdf-page-range.test.cjs` | Full range grammar parser (`1-3, 5, 8-end`), real previews, tray reordering |
| `delete-pages` | Selection deletion via floating toolbar & Delete shortcut | UI/UX | P2 | **Fixed** | `tests/verify-all-engines.cjs` | Instant page deletion with undo versioning |
| `rotate-pages` | Selected rotation 90° CW via floating toolbar & 'R' key | UI/UX | P2 | **Fixed** | `tests/verify-all-engines.cjs` | Visual rotation badges, instant preview update |
| `duplicate-pages`| Page duplication with auto-updated page count | UI/UX | P2 | **Fixed** | `tests/verify-all-engines.cjs` | Duplicates copied into PDF structure cleanly |
| `reorder-pages` | Drag-and-drop page cards reordering | UI/UX | P2 | **Fixed** | `tests/verify-all-engines.cjs` | HTML5 drag and drop with drop indicators |
| `watermark` | Custom text, opacity slider, font size slider, presets | UI/UX | P2 | **Fixed** | `tests/verify-all-engines.cjs` | Live canvas preview overlay + deterministic stamp |
| `page-numbers` | Position dropdown (6 positions) and start number offset | UI/UX | P2 | **Fixed** | `tests/verify-all-engines.cjs` | Formatted headers and footers |
| `flatten-pdf` | Flatten form fields and annotations into static vectors | Feature | P2 | **Fixed** | `tests/verify-all-engines.cjs` | `doc.getForm().flatten()` removes interactive form widgets |
| `remove-metadata`| Scrub author, title, producer, catalog metadata streams | Privacy | P1 | **Fixed** | `tests/verify-all-engines.cjs` | Deletes Metadata catalog dictionary and clears info dict |
| `repair-pdf` | Repair malformed xref tables and stream headers | Reliability | P1 | **Fixed** | `tests/verify-all-engines.cjs` | Loads with `ignoreEncryption: true` and reserializes clean xref table |
| `pdf-to-doc` | Offline PDF to Word DOCX extraction | Feature | P2 | **Fixed** | `tests/verify-all-engines.cjs` | Native vector text XML packaging into valid DOCX container |
| `pdf-to-images` | Offline PDF to raster PNG rendering with configurable DPI | Feature | P2 | **Fixed** | `tests/verify-all-engines.cjs` | High-res canvas rasterization via pdf.js |

---

## Responsive & Layout Verification

- **1280x720 Desktop**:
  - Full 3-zone layout: options panel, interactive canvas/tray, and bottom action bar fit comfortably within viewport.
  - Zero horizontal scrolling or clipped cards.
  - All interactive buttons have at least 8px spacing and AA contrast.
- **800x560 Compact**:
  - Grid auto-fits thumbnails minmax(130px, 1fr).
  - Planned outputs chips wrap cleanly without overflow.
  - Bottom action bar preserves primary action and download buttons within viewport.

---

## Token & Design System Compliance

- **Surface Tokens**: `var(--bg)`, `var(--surface)`, `var(--surface-hover)` used throughout.
- **Border Tokens**: `var(--border)` and `var(--border-strong)` (3:1 boundary on interactive controls). Zero `--border-subtle` usage in newly touched components.
- **Accent Color**: `var(--accent)` (Champagne gold `#D4B06A`) used exclusively for primary actions, active indicators, and selection highlights. Max 3 orange elements rule respected.
- **Typography**: Inter sentence-case throughout. Monospace used only for file names and part badges.
- **Icons**: Lucide outline icons 14-16px with consistent 6-8px label gaps.
