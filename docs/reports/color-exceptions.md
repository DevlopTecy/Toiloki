# Color Exceptions Report (Phase 4 — Visual Debt)

**Document Status:** Complete & Verified  
**Scope:** Static Analysis & Visual Debt Compliance  
**Date:** October 2026  

## Allowed Color Exceptions (Data & Artwork)

As specified in the Design Charter and Phase 4 directives, raw hex or RGB colors are strictly forbidden for application UI styling (which must exclusively reference canonical tokens in `tokens.css`). The following files and patterns are permitted exceptions because the colors represent **data, image/canvas drawing routines, algorithm fixtures, test inputs, or vector illustrations**:

### 1. Vector Art & Logos (Artwork Data)
- `src/assets/art-pack/default-art-pack.ts`: Offline resolution-independent SVG data-URIs representing abstract category art pack illustrations and decorative hero artwork.
- `src/assets/logo/toiloki-app-icon-dark.svg`, `src/assets/logo/toiloki-app-icon-light.svg`, `src/assets/logo/toiloki-horizontal-dark.svg`, `src/assets/logo/toiloki-horizontal-light.svg`, `src/assets/logo/toiloki-symbol.svg`, `src/assets/logo/favicon.svg`: Packaged application branding SVG files.
- `src/components/common/ToilokiLogo.tsx`: The inline SVG mark with multi-stop radial and linear gradient stops (`#FFA726`, `#FB8C00`, `#F4511E`, `#BF360C`).

### 2. Color Engines, Canvas Drawing & Interactive Color Data
- `src/engines/design/design.engine.ts`: Color conversion algorithms (HEX, RGB, HSL, HSV, CMYK, LAB, LCH), palette generators (monochromatic, analogous, complementary, triadic, tetradic), and tint/shade calculations.
- `src/engines/images/image.engine.ts`: Pixel-level canvas raster operations and pixel data buffers.
- `src/engines/pdf/pdf.engine.ts`: Low-level PDF document page drawing operations (watermark text stamps, shape rendering, highlight rectangles).
- `src/workspaces/design/DesignWorkspaceView.tsx`: Interactive color picker swatches, contrast preview background/text tester, and color blindness vision matrix.
- `src/components/workbench/WorkbenchShell.tsx`: Annotation color swatch options (Gold, White, Black, Red, Blue, Yellow, Green, Cyan, Pink) for PDF shape, text, and highlighter tools.
- `src/components/workbench/pdf/PdfAnnotateCanvas.tsx`: PDF canvas annotation overlay stroke/fill color props.
- `src/components/workbench/pdf/pdfThumbnailService.ts`: Canvas thumbnail raster rendering background (`ctx.fillStyle = '#FFFFFF'`).
- `src/components/workbench/media/MediaCanvas.tsx`: Waveform audio canvas raster visualization drawing context.
- `src/components/workbench/documents/DocumentCanvas.tsx`: Fallback document canvas raster drawing context.

### 3. Theme Presets & Color Definitions (Configuration Data)
- `src/core/theme/theme-presets.ts`: Static token preset values for default dark, clean light, midnight navy, high-contrast, and custom user theme variants.
- `src/core/theme/theme.types.ts`: Preset `ACCENT_PALETTE` swatch options (Orange, Blue, Teal, Green, Violet, Pink, Red, Neutral) for user preference custom accent selection.
- `src/core/services/settings.service.ts`: Default user settings fallback accent hex (`#F5A524`).
- `src/core/theme/wcag-contrast.ts`: Mathematical relative luminance and contrast ratio algorithms with standard test vectors.
- `src/core/theme/ThemeContext.tsx`: Theme manager dynamically computing background SVG dot grid patterns.
- `src/core/services/smart-paste.service.ts`: Regular expressions detecting whether user clipboard text is a hex or rgb color code.
- `src/components/views/settings/sections/ThemeEditorModal.tsx`: Visual token editor allowing user inspection and real-time adjustment of token hex strings.

### 4. Non-Color Raster Effects & Overlays
- Modal backdrop overlays (`rgba(0, 0, 0, 0.40)` to `rgba(0, 0, 0, 0.75)`).
- Elevation drop shadows (`box-shadow: ... rgba(0, 0, 0, ...)`).
- Gradient image mask alpha channels (`mask-image: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 1) 100%)`).

### 5. Tests and Verification Suites
- `tests/*`: Smoke tests, contrast audits, capability verifications, and offline CJK checks.
- `scripts/*`: Build verifications and compliance audit scripts.

---

## Migration Summary
All application components, modals, shells, buttons, tables, dropzones, headers, footers, search palettes, and views outside the above exceptions have been completely migrated to design tokens (`var(--surface)`, `var(--border)`, `var(--border-strong)`, `var(--text)`, `var(--text-2)`, `var(--text-muted)`, `var(--accent)`, `var(--on-accent)`, `var(--success)`, `var(--warning)`, `var(--danger)`).
