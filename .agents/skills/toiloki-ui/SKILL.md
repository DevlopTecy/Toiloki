---
name: toiloki-ui
description: Create, redesign, review, audit, and maintain the UI of the desktop application "Toiloki – Local Suite" across all 8 workspaces (PDF, Documents, Images, Data, Text, Developer, Calculator & Converters, Files & Archives). Enforces a restrained, premium desktop utility design system (Linear, Raycast, Arc, and Notion Calendar caliber) with dark neutral surfaces, Champagne gold accent (#D4B06A), 8px harmonic spacing, 40px window shell, 240px sidebar, 3-zone tool layout, WCAG AA accessibility, and zero AI/cloud fluff. Use whenever designing new screens, building or refactoring UI components, inspecting layouts, reviewing UI quality, detecting visual inconsistencies, or auditing dark/light theme parity in Toiloki.
---

# Toiloki UI Engineering & Design System

A specialized skill for building, redesigning, reviewing, and maintaining the user interface of **Toiloki – Local Suite**.

Toiloki is a professional, local-first Windows desktop utility suite. It is **NOT** an AI SaaS dashboard. It must look and feel like an officially published, high-precision desktop application with the design discipline of products like Linear, Raycast, Arc, and Notion Calendar.

---

## 1. Core Principles & Philosophy

1. **Restrained Utility Elegance**: Calm, precise, clean, functional. No decorative fluff, no portfolio animations, no marketing widgets.
2. **Deterministic Desktop Density**: Standard window resolution `1280×820` (minimum `1100×700`). Max content container `1280px` with `32–48px` horizontal padding. Compact, highly informative layouts.
3. **Local-First & Offline Integrity**: Never add AI, chat interfaces, cloud accounts, telemetry banners, or subscription notices. Every tool operates strictly on the local machine.
4. **Preserve All Functionality**: Never remove existing features or routes to make an interface look "cleaner". Real utility always trumps minimalist emptiness.

---

## 2. Progressive Disclosure & Reference Guides

Before writing code or auditing layouts, consult the specialized reference documents in `references/`:

- **[Design Tokens](references/design-tokens.md)**: Color scales (Dark & Light palettes), Champagne gold accent (`#D4B06A`), typography scales (Inter/Geist and JetBrains Mono), 8px spacing, and hairline borders.
- **[Layout & Shell](references/layout-shell.md)**: 40px desktop window titlebar, 240px compact sidebar, Home launcher dashboard, and the 3-zone tool blueprint.
- **[Reusable Components](references/components.md)**: Exact specs for all 22 components (Buttons, Compact Dropzone, 34px File List Table, Options Panel, Form Controls, Modals, Status Badges, Empty States).
- **[12-Point Inspection Checklist](references/inspection-checklist.md)**: The mandatory visual review rubric for alignment, spacing, contrast, theme parity, and anti-pattern prevention.

---

## 3. Quick Reference: Visual Tokens

| Dimension | Dark Theme (Default) | Light Theme (Strict Mirror) |
| :--- | :--- | :--- |
| **App Background** | `#0B0C0F` | `#F8F9FA` |
| **Sidebar / Titlebar** | `#0E1013` | `#F0F2F5` |
| **Surface / Card** | `#12141A` | `#FFFFFF` |
| **Raised / Headers** | `#171A21` | `#F4F5F7` |
| **Hover Surface** | `#1C2028` | `#EAECEF` |
| **Primary Text** | `#F4F5F7` | `#111318` |
| **Secondary Text** | `#A3A9B5` | `#57606A` |
| **Tertiary / Meta** | `#6B7280` | `#8C95A0` |
| **Hairline Borders** | `rgba(255, 255, 255, 0.06 / 0.10 / 0.16)` | `rgba(0, 0, 0, 0.06 / 0.10 / 0.16)` |
| **Primary Accent** | Champagne Gold `#D4B06A` (Hover `#E3C382`) | Champagne Gold `#B88E3E` (Hover `#C99F4E`) |
| **Accent Soft Tint** | `rgba(212, 176, 106, 0.12)` | `rgba(184, 142, 62, 0.12)` |

### Typography Scale
- **UI Font**: `Inter` or `Geist` (`-apple-system`, `Segoe UI`, sans-serif).
- **Monospace Font**: `JetBrains Mono` for code, hashes, file metadata, sizes, and technical options.
- **Hierarchy**:
  - Page Title: `32px / 40px` (Weight `650`, tracking `-0.02em`)
  - Section Heading: `18px / 26px` (Weight `600`)
  - Card Title: `15px / 22px` (Weight `600`)
  - Body Text: `14px / 22px` (Weight `400`)
  - Sidebar Items: `13.5px / 20px` (Weight `500`)
  - Caption / Uppercase Meta: `11px / 16px` (Weight `600`, tracking `0.08em`)

---

## 4. Standard Workflows

### Workflow A: Designing a New Tool Screen
Follow this exact sequence whenever introducing a new utility screen:

1. **Verify Workspace Category**:
   Map the tool to one of the 8 locked workspaces:
   1. PDF | 2. Documents | 3. Images | 4. Data | 5. Text | 6. Developer | 7. Calculator & Converters | 8. Files & Archives.
2. **Establish the Header & Navigation**:
   - Single-line breadcrumb: `Home › [Workspace Category] › [Tool Name]`.
   - Page title (`32px / 650`) and concise two-line utility summary.
   - Module tabs if the workspace has sibling tools.
3. **Assemble the 3-Zone Layout**:
   - **Zone 1: Main Workspace** (60–70% width):
     - Compact dropzone (`100–120px` max) with privacy notice: *"Files stay on your computer. Fully offline & local."*
     - Structured data table for uploaded files (compact `34px–38px` rows with filename, monospace size, page count, and action icon buttons).
     - Interactive editor/viewer canvas (if applicable).
   - **Zone 2: Options Panel** (30–40% width):
     - Grouped form controls on `--bg-surface` with `16px` padding and hairline borders.
     - Sliders with monospace value tags, dropdowns, and toggles.
   - **Zone 3: Action Execution Bar**:
     - Exactly one Primary Action button in Champagne Gold (`#D4B06A`).
     - Reset / Cancel in Secondary or Ghost style.
     - Processing status badge.
4. **Enforce Dark & Light Parity**:
   Ensure CSS variables drive all colors so switching themes alters only tokens, with zero layout shift.

---

### Workflow B: Redesigning or Refactoring an Existing Screen
When improving an existing screen that feels inconsistent or outdated:

1. **Identify Visual Anti-Patterns**:
   - Strip out giant marketing hero sections, colorful gradient cards, and pill buttons (`rounded-full`).
   - Eliminate neon glow drop-shadows and saturated background colors.
   - Reduce oversized dropzones down to compact `100–120px` areas.
2. **Apply Toiloki Layout & Component Contracts**:
   - Replace custom buttons with standard Toiloki button components (`components.md`).
   - Convert unordered lists or scattered cards into dense `34px` table rows.
   - Standardize inputs, dropdowns, and switches to `--bg-surface` with `1px solid var(--border-default)`.
3. **Preserve Logic & Routes**:
   - Retain all input handlers, state management, file parsing logic, and export routines.
   - Test that existing route parameters and workflows execute identically.

---

### Workflow C: Visual Inspection & Regression Audit
Whenever completing a UI change, execute this rigorous audit:

1. **Run the Automated Verification Script**:
   ```bash
   python scripts/verify_ui.py
   ```
   Checks for missing CSS variables, scans for forbidden styling patterns, connects to the local dev server, and captures headless screenshots to `.tmp/`.
2. **Perform the 12-Point Checklist**:
   Audit against `references/inspection-checklist.md`:
   - [ ] Alignment & Grid
   - [ ] Spacing (8px increments)
   - [ ] Typography scale & JetBrains Mono usage
   - [ ] Contrast (WCAG AA 4.5:1 minimum)
   - [ ] Component consistency
   - [ ] Sidebar consistency (240px, locked groups)
   - [ ] Button hierarchy (1 primary gold button)
   - [ ] Empty state compactness
   - [ ] File processing table density
   - [ ] Responsive scaling (1100×700 to 1280px)
   - [ ] Dark and Light theme parity
   - [ ] Zero AI / marketing noise
3. **Inspect Output Screenshots**:
   Review captured renders (`audit_home_dark.png`, `audit_home_light.png`, `audit_pdf_tool.png`, etc.) to confirm visual calm and precision.

---

## 5. Absolute Prohibitions (Never Do)

- ❌ **NO AI SaaS Aesthetics**: No floating gradient mesh, no neon cyan/purple glows, no chat assistant widgets, no sparkle icons.
- ❌ **NO Giant Pill Controls**: No `rounded-full` / `9999px` cards, badges, or buttons. Keep corners between `4px` and `8px`.
- ❌ **NO Saturated Large Surfaces**: Workspace category colors belong **only** inside small `20×20px` to `28×28px` icon tiles. Never paint an entire card or panel in category colors.
- ❌ **NO Marketing Bloat**: No vanity counters ("Over 500k files transformed!"), no fake reviews, no upgrade banners.
- ❌ **NO Cloud / Network Code**: Toiloki is 100% offline. Never add third-party tracking, analytics, or remote API calls.
- ❌ **NO Feature Deletion**: Never sacrifice utility features for visual minimalism.
