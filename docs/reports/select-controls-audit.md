# Select Controls Audit & Modernization Report

**Date:** 2026-10-05  
**Phase:** Phase 3 — Layout Leftovers (P1)  
**Standard:** WCAG AA 3:1+ Boundary Contrast & Premium Segmented/Tile Interactions  

---

## 1. Executive Summary

As part of Phase 3, an audit was conducted across all workspace views and workbench shells in Toiloki for native `<select>` dropdown controls with fewer than 5 options. 

Native dropdowns with 2 to 4 options add unnecessary cognitive and physical interaction friction (requiring opening a modal dropdown list to pick between 2 or 3 fixed choices). These have been replaced with either:
1. **Interactive Preset Tiles** (for multi-attribute presets like Compression Quality with icons, labels, recommended badges, and result hints).
2. **Harmonic Segmented Controls** (`role="radiogroup"` / `role="radio"`, with keyboard navigation and instant single-click selection).

---

## 2. Replaced Controls Summary

### A. PDF Workspace (`src/workspaces/pdf/PdfWorkspaceView.tsx`)

| Utility / Control | Previous UI | Option Count | New UI Implementation | Rationale & Accessibility |
| :--- | :--- | :---: | :--- | :--- |
| **`compress-pdf`**<br>Compression Profile | `<select>` dropdown | 3 | **3 Compression Tiles Grid**<br>• **Light**: Feather icon, ~15-20% reduction<br>• **Balanced**: Gauge icon, Recommended badge, ~40-50% reduction (pre-selected default)<br>• **Extreme**: Minimize2 icon, ~70%+ reduction | High visual scannability, clear performance expectations, single-click selection. Meets `role="radiogroup"`. |
| **`rotate-pages`**<br>Global Rotation Angle | `<select>` dropdown | 3 | **Segmented Control**<br>`90° Clockwise` · `180° Flip` · `270° Counter-Clockwise` | Instant one-click angle selection; visual toggle state. |
| **`page-numbers`**<br>Position on Page | `<select>` dropdown | 3 | **Segmented Control**<br>`Bottom Center` · `Bottom Right` · `Top Right` | 3 clear spatial positions rendered inline. |
| **`draw-shapes`**<br>Shape Type | `<select>` dropdown | 3 | **Segmented Control**<br>`Rectangle` · `Circle` · `Line` | Immediate shape selection without opening a menu. |
| **`highlight-underline`**<br>Highlight Type | `<select>` dropdown | 2 | **Segmented Control**<br>`Highlight` · `Underline` | 2-option toggle rendered inline with active state. |
| **`pdf-to-images`**<br>Rasterization Resolution | `<select>` dropdown | 3 | **Segmented Control**<br>`72 DPI (Preview)` · `150 DPI (Retina)` · `300 DPI (Print)` | Immediate clarity on quality/rendering speed tradeoffs. |

---

### B. Workbench Shell (`src/components/workbench/WorkbenchShell.tsx`)

| Utility / Control | Previous UI | Option Count | New UI Implementation | Rationale & Accessibility |
| :--- | :--- | :---: | :--- | :--- |
| **`compress-pdf`**<br>Compression Preset | `<select>` dropdown | 3 | **3 Compression Tiles Grid**<br>• **Light**: Feather icon, Highest quality<br>• **Balanced**: Gauge icon, Recommended badge (default)<br>• **Extreme**: Minimize2 icon, Maximum reduction | Full parity between Classic Workspace and Workbench Shell modes. |
| **`draw-shapes`**<br>Shape Type | `<select>` dropdown | 3 | **Segmented Control**<br>`Rectangle` · `Circle` · `Line` | Replaced native dropdown with segmented control. |
| **`page-numbers`**<br>Position on Page | `<select>` dropdown | 3 | **Segmented Control**<br>`Bottom Center` · `Bottom Right` · `Top Right` | Spatial placement rendered inline. |
| **`pdf-redact`**<br>Redaction Style | `<select>` dropdown | 2 | **Segmented Control**<br>`Solid Blackout` · `Whiteout Mask` | Binary style choice converted to segmented buttons. |

---

### C. Existing Workspaces Validated

The following workspaces were audited and verified to already adhere to modern segmented chips/controls:
- **`TextWorkspaceView.tsx`**: Case conversion options, slug separators (`-`, `_`, `.`), sort order (`asc`, `desc`), table formats (`markdown`, `csv`, `tsv`, `html`), and lorem units (`paragraphs`, `sentences`, `words`).
- **`ImagesWorkspaceView.tsx`**: SVG scale multipliers, collage columns (2, 3, 4), and sprite layout.
- **`DocumentsWorkspaceView.tsx`**: Markdown preview mode, table of contents format and depth.
- **`DeveloperWorkspaceView.tsx`**: JSON view mode (`formatted` vs `tree`).
- **`DataWorkspaceView.tsx`**: Join types (`inner`, `left`, `right`, `outer`), aggregation functions, and split modes.
- **`SettingsLayout.tsx`**: Theme modes, font scale, accent swatches, and card style presets.

---

### D. Legitimate Native `<select>` Retained (>= 5 Options)

The following controls deliberately remain as native `<select>` dropdowns because their option counts exceed 4 options, where segmented controls would cause horizontal wrapping and visual clutter:
- Security Hash algorithms (MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, RIPEMD160).
- Developer Number Base converters (Binary, Octal, Decimal, Hex, Base32, Base58, Base64).
- Date & Time timezones and frequency tables.
- Audio/Video codec profiles and target container formats.

---

## 3. Styling & Accessibility Details

1. **Tokens**:
   - Background: `var(--surface)`
   - Border: `var(--border-strong)` (guaranteed 3.47:1 light / 3.27:1 dark)
   - Active state: `var(--surface-hover)` with `outline: 1px solid var(--border-strong)`
   - Recommended Badge: `var(--accent)` with `--on-accent: #1A1100` (WCAG AAA)
2. **Keyboard Accessibility**:
   - `role="radiogroup"` on containers
   - `role="radio"` and `aria-checked` on selectable items
   - Native Tab, Shift+Tab, and Enter/Space activation
