---
name: toiloki-ui
description: Create, redesign, review, audit, and maintain the UI of the desktop application "Toiloki – Local Suite" across all 13 workspaces (PDF, Documents, Images, Audio & Video, Files & Archives, Data, Text, Developer, Network & Web, Color & Design, Calculator & Converters, Security & Privacy, System & Maintenance). Enforces a restrained, premium desktop utility design system (Linear, Raycast, Arc, and Notion Calendar caliber) with dark neutral surfaces, high-contrast WCAG AA accessible accent (#F5A524 Dark / #E8890C Light), 8px harmonic spacing, 52px window shell, 240px sidebar (56px compact rail), 3-zone tool layout, multi-viewport resilience (<600px, 600-1023px, >=1024px), PlatformAdapter architecture, and zero AI/cloud fluff.
---

# Toiloki UI Engineering & Design System

A specialized skill for building, redesigning, reviewing, and maintaining the user interface of **Toiloki – Local Suite**.

Toiloki is a professional, local-first Windows desktop utility suite. It is **NOT** an AI SaaS dashboard. It must look and feel like an officially published, high-precision desktop application with the design discipline of products like Linear, Raycast, Arc, and Notion Calendar.

---

## 1. Core Principles & Philosophy

1. **Restrained Utility Elegance**: Calm, precise, clean, functional. No decorative fluff, no portfolio animations, no marketing widgets.
2. **Deterministic Desktop Density**: Standard window resolution `1280×820` (minimum `1040×680`). Max content container `1280px` with `32–48px` horizontal padding. Compact, highly informative layouts with sentence-case typography.
3. **Local-First & Offline Integrity**: Zero runtime network requests (100% offline, air-gapped). Never add AI, chat interfaces, cloud accounts, telemetry banners, or subscription notices. Every tool operates strictly on the local machine with zero external binary bloat.
4. **Preserve All Functionality**: Never remove existing features or routes to make an interface look "cleaner". Real utility always trumps minimalist emptiness.

---

## 2. Progressive Disclosure & Reference Guides

Before writing code or auditing layouts, consult the specialized reference documents in `docs/`:

- **[Design Charter](file:///d:/Projects/Project%203_Toiloki/docs/design-charter.md)**: Color scales, WCAG 2.1 AA/AAA contrast ratios, canonical CSS tokens, 8px spacing, and hairline borders.
- **[Platform Feasibility](file:///d:/Projects/Project%203_Toiloki/docs/platform-feasibility.md)**: `PlatformAdapter` abstraction layer for Windows Desktop (Electron), Tablet PWA, and Mobile Capacitor feasibility.
- **[QA Sweep Report](file:///d:/Projects/Project%203_Toiloki/docs/qa/sweep-report.md)**: Permanent automated UI sweep results across all 13 workspaces and 74 active utilities.
- **[Planned Engines](file:///d:/Projects/Project%203_Toiloki/docs/planned-engines.md)**: Licensing, binary sizes, and roadmap for future sidecars (FFmpeg, HEIC, 7z). Heavy utilities remain marked `'soon'` and hidden until supported.

---

## 3. Quick Reference: Canonical Visual Tokens

| Dimension | Dark Theme (Default) | Light Theme (Strict Mirror) |
| :--- | :--- | :--- |
| **App Background (`--bg`)** | `#0B0F17` | `#F8F9FA` |
| **Sidebar / Titlebar (`--sidebar`)** | `#0E1013` | `#F0F2F5` |
| **Surface / Card (`--surface`)** | `#12141A` | `#FFFFFF` |
| **Surface Hover (`--surface-hover`)** | `#1C2028` | `#EAECEF` |
| **Primary Text (`--text`)** | `#F4F5F7` | `#111318` |
| **Secondary Text (`--text-2`)** | `#B0B0B0` | `#54544F` |
| **Muted Text (`--text-muted`)** | `#8E8E8E` | `#6B6B65` |
| **Decorative Divider (`--border`)** | `#2E2E2E` | `#E3E3DE` |
| **Control Boundary (`--border-strong`)** | `#6B6B6B` (3:1+ WCAG) | `#8A8A84` (3:1+ WCAG) |
| **Primary Accent (`--accent`)** | `#F5A524` (Hover `#E8890C`) | `#E8890C` (Hover `#D17A06`) |
| **On Accent (`--on-accent`)** | `#1A1100` (High Contrast) | `#1A1100` (High Contrast) |
| **Focus Ring (`--focus-ring`)** | `0 0 0 2px var(--accent)` | `0 0 0 2px var(--focus-ring)` |

### Typography Scale
- **UI Font**: `Inter` or `Geist` (`-apple-system`, `Segoe UI`, sans-serif).
- **Monospace Font**: `JetBrains Mono` for code, hashes, file metadata, sizes, and technical options.
- **Case Rules**: Strict Sentence case everywhere. Zero `text-transform: uppercase`.

---

## 4. The 13 Locked Workspaces

Toiloki organizes all 200+ utilities across 13 authoritative workspaces divided into three sidebar sections:

### Section 1: Files & Media
1. **PDF (`pdf`)**: Merge, Split, Reorder, Delete, Rotate, Extract, Compress presets, Watermark, Redact, Annotate Canvas.
2. **Documents (`documents`)**: Markdown Editor with live sync preview, Document Diff, Text formatting.
3. **Images (`images`)**: Resize, Compress (JPEG white fill, EXIF rotation respect), Crop, Filter, Format Converter.
4. **Audio & Video (`media`)**: Native Web Audio API Trimmer (PCM WAV), Gain/Fade, Subtitle SRT Shift, Duration inspector. (FFmpeg video tools remain `'soon'`).
5. **Files & Archives (`files`)**: ZIP Packaging & Extraction (Zip Slip protected), Duplicate File Finder, TAR, GZIP, Hash Checksum manifest.

### Section 2: Data & Code
6. **Data (`data`)**: Tabular CSV/TSV Grid viewer with auto-delimiter detection, Column management, Data stats.
7. **Text (`text`)**: Case conversions, Word count & frequency, Regex replacements, Split view, Undo/Redo.
8. **Developer (`developer`)**: JSON Formatter with line/col error tracking, Base64/Base64URL UTF-8, JWT Inspector, UUID, Unix Timestamp, Regex tester, Cron parser, chmod, .env Diff.
9. **Network & Web (`network`)**: Multi-shell cURL generator (Bash, PowerShell, CMD), Subnet CIDR calculator (/31 & /32 RFC 3021), MIME directory, SEO meta card generator, IP converter.
10. **Color & Design (`design`)**: HEX/RGB/HSL/CMYK converter, WCAG 2.1 contrast checker (AA/AAA), Harmonies, Color blindness deficiency simulation, Modular type scales, SVG sanitizer, Token exporter.

### Section 3: Tools
11. **Calculator & Converters (`calculator`)**: Scientific floating-point precision math, Unit converters, Loan EMI amortization schedules, GST/VAT splits, Date delta.
12. **Security & Privacy (`security`)**: CSPRNG Password Generator, Passphrase Diceware, Hash/HMAC (MD5, SHA-256, SHA-512), RFC 6238 TOTP, AES-GCM file encryption, Multi-pass file shredder, PII redactor.
13. **System & Maintenance (`system`)**: Diagnostic hardware snapshot, `.env` parser with default secret masking, Hosts file parser, Storage directory hierarchy tree.

---

## 5. Responsive Design Breakpoints

Toiloki enforces three standardized responsive tiers across all layouts:

1. **Expanded (>= 1024px)**:
   - Full desktop experience: 240px sidebar, 52px titlebar with centered search.
   - 3-Zone Workbench: Left Zone 1 canvas/preview, Right Zone 2 options panel (320px).
2. **Medium / Tablet (600px – 1023px)**:
   - Compact desktop & tablet: Sidebar auto-collapses to 56px icon rail.
   - Zone 2 options panel narrows to 280px; canvas adapts fluidly.
   - Touch targets expand to 40–44px.
3. **Compact / Mobile (< 600px)**:
   - 56px narrow rail or off-canvas drawer.
   - Titlebar wordmark hidden; search expands to full width on tap.
   - Workbench 3-Zone switches to single-column vertical stack (`flex-direction: column; overflow-y: auto`).
   - Strictly zero horizontal overflow (`overflow-x: hidden`).

---

## 6. Multi-Platform Architecture: PlatformAdapter

Platform-dependent capabilities are decoupled through [`src/core/platform/platform-adapter.ts`](file:///d:/Projects/Project%203_Toiloki/src/core/platform/platform-adapter.ts):

- **`ElectronPlatformAdapter`**: Full OS integration (direct file buffers, native dialogs, custom frameless window minimizing/closing, system tray).
- **`WebPlatformAdapter`**: W3C standards (File System Access API `showOpenFilePicker`, fallback `<input>` / `Blob`, `navigator.clipboard`, Web Notifications).
- **Detection**: `getPlatformAdapter()` automatically activates the appropriate adapter based on environment.

---

## 7. Automated Quality Gates

Every pull request or release milestone must pass:
1. **Unit & Engine Tests**: `npm test` (all 23 engine, migration, session, and workspace suites).
2. **UI Sweep Test**: `npm run test:sweep` (crawls all 13 workspaces and 74 active utilities via Playwright Electron with 0 uncaught errors).
3. **Compliance Guards**: `node tests/guard-compliance.test.cjs` (0 violations: zero sparkles, zero uppercase, zero legacy aliases, zero network requests, zero unlisted colors).
4. **Contrast Verification**: `node scripts/verify_wcag_contrast.cjs` (10/10 token pairs pass WCAG AA/AAA).
5. **Production Build**: `npm run build` (`tsc -b && vite build` succeeds with zero errors).

---

## 8. Absolute Prohibitions (Never Do)

- ❌ **NO AI SaaS Aesthetics**: No floating gradient mesh, no neon cyan/purple glows, no chat assistant widgets, no sparkle icons (Wand2, Sparkles).
- ❌ **NO Giant Pill Controls**: No `rounded-full` / `9999px` cards, badges, or buttons. Keep corners between `4px` and `8px`.
- ❌ **NO Saturated Large Surfaces**: Workspace category colors belong **only** inside small `20×20px` to `28×28px` icon tiles. Never paint an entire card or panel in category colors.
- ❌ **NO Marketing Bloat**: No vanity counters ("Over 500k files transformed!"), no fake reviews, no upgrade banners.
- ❌ **NO Cloud / Network Code**: Toiloki is 100% offline. Never add third-party tracking, analytics, or remote API calls.
- ❌ **NO Bundled External Binaries**: Do NOT bundle FFmpeg, 7z, or HEIC binaries. Utilities requiring them stay marked `'soon'` and hidden.
- ❌ **NO Feature Deletion**: Never sacrifice utility features for visual minimalism.
