# Layout & Shell Architecture: Toiloki – Local Suite

This document defines the structural layout standards, window geometry, shell composition, and screen architectures for Toiloki.

---

## 1. Application Window Shell

Toiloki is a native-feeling desktop application. Its shell must reflect desktop engineering discipline, not web SaaS landing patterns.

```
+-----------------------------------------------------------------------------------+
|  [Mark] TOILOKI  LOCAL SUITE                     [Search / Window Controls] [_][O][X] | 40px Titlebar
+-------------------+---------------------------------------------------------------+
|  HOME             |  BREADCRUMB: Home › PDF › Merge PDF                           |
|                   |  PAGE TITLE (32px): PDF                                       |
|  TOOLS            |  Description (14px): Manage, edit, convert and analyze PDF    |
|  - PDF (active)   |  [Page Organizer] [PDF Editor] [Convert] [Security]           | Tool Tabs
|  - Documents      |  +-------------------------------------+--------------------+ |
|  - Images         |  | ZONE 1: WORKSPACE / INPUT           | ZONE 2: OPTIONS    | |
|  - Data           |  | - Compact File Drop Zone            | - Order: Asc/Desc  | |
|  - Text           |  | - Structured File List Table (34px) | - Page Range       | |
|  - Developer      |  | - Drag handle, name, size, actions  | - Bookmark tree    | |
|  - Calc & Conv    |  +-------------------------------------+--------------------+ |
|  - Files & Arch   |  | ZONE 3: ACTION BAR                  [Reset] [Merge PDF]  | |
|                   +---------------------------------------------------------------+ |
|  LIBRARY          |                                                               |
|  - Favorites      |                                                               |
|  - History        |                                                               |
|  SETTINGS         |                                                               |
+-------------------+---------------------------------------------------------------+
  240px Sidebar                                  Main Content (max-width 1280px)
```

### 1.1 Specifications & Geometry
- **Minimum Window Resolution**: `1100px` width × `700px` height.
- **Recommended Default**: `1280px` width × `820px` height.
- **Title Bar**:
  - Exact height: `40px` (`h-10`)
  - Background: `--bg-sidebar` (`#0E1013`)
  - Border: `1px solid var(--border-subtle)` at bottom
  - Content:
    - Small geometric Toiloki brand mark (`18×18px`)
    - Wordmark: `TOILOKI` in semibold tracking (`12px`, letter spacing `0.1em`, color `--text-primary`)
    - Subtitle badge: `LOCAL SUITE` (`10px`, weight `600`, color `--text-tertiary`)
    - Right-hand side: Window controls (Minimize `_`, Maximize `▢`, Close `✕`) with standard Windows click targets (`44px` width)

---

## 2. Sidebar Navigation

The sidebar provides immediate access to the 8 core workspaces, persistent library items, and application settings.

- **Width**: `240px` (fixed, non-collapsible or collapsible to 56px mini-rail on compact viewports).
- **Background**: `--bg-sidebar` (`#0E1013`).
- **Internal Padding**: `12px` horizontal, `16px` vertical.
- **Structure**:
  1. **Top Nav**:
     - `Home` (Dashboard overview)
  2. **Section Header: TOOLS**:
     - `11px` uppercase, weight `600`, letter-spacing `0.08em`, color `--text-tertiary`
     - 8 Locked Workspaces:
       1. PDF
       2. Documents
       3. Images
       4. Data
       5. Text
       6. Developer
       7. Calculator & Converters
       8. Files & Archives
  3. **Section Header: LIBRARY**:
     - `Favorites`
     - `History`
  4. **Bottom Nav**:
     - `Settings` (Preferences, theme toggle, telemetry notice, storage info)

### 2.1 Sidebar Nav Item States
- **Height**: `32px`
- **Border Radius**: `6px`
- **Padding**: `0 10px`
- **Typography**: `13.5px`, weight `500`
- **Icon**: `16×16px`, stroke `1.75px`, muted `--text-secondary`
- **Default State**: Background transparent, color `--text-secondary`
- **Hover State**: Background `--bg-hover` (`#1C2028`), color `--text-primary`
- **Active State**:
  - Background: `--bg-raised` (`#171A21`)
  - Text: `--text-primary` (`#F4F5F7`)
  - Left indicator: `2px solid var(--accent-primary)` (Champagne gold)
  - Icon: tinted with workspace category color or gold accent
  - **Forbidden**: Never use glowing blue buttons, oversized neon pills, or saturated full-width gradient bars.

---

## 3. Main Content Container

- **Max Width**: `1280px` centered or left-aligned with fluid padding.
- **Padding**:
  - `32px` to `48px` horizontal padding (`px-8` to `px-12`)
  - `24px` to `32px` vertical padding (`py-6` to `py-8`)
- **Spacing Discipline**: Avoid sprawling voids of unused space. Align form controls, tables, and buttons to a clean column grid.

---

## 4. Home Dashboard Screen Architecture

The Home screen acts as a functional launcher, not a marketing showcase or SaaS dashboard.

```
+-----------------------------------------------------------------------------------+
|  Local Utility Suite                                      [ Q Search tools... Ctrl K ] |
|  Fast, offline, deterministic tools running on your machine.                      |
|                                                                                   |
|  WORKSPACE MODULES (11px uppercase mono)                                8 Workspaces |
|  +----------------+ +----------------+ +----------------+ +----------------+     |
|  | [Icon] PDF     | | [Icon] Docs    | | [Icon] Images  | | [Icon] Data    |     |
|  | 35 tools    -> | | 15 tools    -> | | 18 tools    -> | | 20 tools    -> |     |
|  | Manage, edit.. | | Convert, edit..| | Transform, webp| | View, parse... |     |
|  +----------------+ +----------------+ +----------------+ +----------------+     |
|  +----------------+ +----------------+ +----------------+ +----------------+     |
|  | [Icon] Text    | | [Icon] Dev     | | [Icon] Calc    | | [Icon] Files   |     |
|  | 15 tools    -> | | 20 tools    -> | | 12 tools    -> | | 10 tools    -> |     |
|  | Clean, diff... | | Formatter, jwt.| | Unit, currency | | Archive, hash..|     |
|  +----------------+ +----------------+ +----------------+ +----------------+     |
|                                                                                   |
|  RECENT ACTIVITY                            QUICK ACTIONS                         |
|  - PDF Merger (2 files)          Open ↗     - [PDF] Merge PDF                  ↗  |
|  - JSON Formatter (Formatted)    Open ↗     - [DEV] JSON Formatter             ↗  |
+-----------------------------------------------------------------------------------+
```

### Key Rules for Home:
- **Executive Header**: Headline and description on the left; compact search input (`360px`, `36px` height) with `Ctrl K` on the right.
- **Zero Vanity Metrics**: Never include fake counter cards ("145 Total Tools", "100% Privacy", "0 B Saved").
- **Category Cards**:
  - Strict 4×2 grid on desktop.
  - Surface: `--bg-surface`, border `1px solid var(--border-default)`.
  - Icon Tile: `28×28px` rounded `6px` with soft translucent tint: `rgba(categoryColor, 0.12)`.
  - Content: Category title (`14.5px / 600`), concise description (`12px / 1.45`), tool count, and subtle hover arrow.
  - **Forbidden**: Do not clutter the card with tiny tag pills or colorful gradient borders.

---

## 5. Tool Screen Architecture (The 3-Zone Blueprint)

Every tool screen within the 8 workspaces must follow this identical ergonomic blueprint:

### 5.1 Header Area
1. **Breadcrumb**:
   - Single horizontal line: `Home › [Workspace Category] › [Tool Name]`
   - Font: `12px`, color `--text-tertiary`, active end-crumb `--text-secondary`.
   - Never wrap to two lines.
2. **Title & Summary**:
   - Tool Title: `28px` to `32px`, weight `650`, tracking `-0.02em`.
   - Summary: `14px`, color `--text-secondary`, maximum 2 lines describing utility function.
3. **Module Tabs / Tool Selector**:
   - If a workspace contains multiple related tools (e.g., PDF -> Merge, Split, Extract, Rotate), present them as a horizontal tab rail with active gold underline or raised pill.

### 5.2 The 3 Zones
- **Zone 1: Main Workspace / Input Canvas** (Left or Center, 60–70% width):
  - Compact File Drop Zone.
  - Professional File List Table.
  - Interactive Canvas / Textarea / Code Editor.
- **Zone 2: Options Panel** (Right side or Collapsible sidebar, 30–40% width):
  - Grouped settings: Output format, quality slider, delimiters, page ranges.
  - Surface: `--bg-surface`, border `1px solid var(--border-default)`, radius `8px`.
  - Spacing: `16px` internal padding, `12px` between controls.
- **Zone 3: Persistent Action Bar** (Bottom or Top-Right):
  - Execution button: Primary Champagne Gold button (`#D4B06A`).
  - Clear / Reset button: Secondary or Ghost button.
  - Status indicator: Compact badge showing input count or ready state.
  - Output summary: File size delta, destination directory selector.
