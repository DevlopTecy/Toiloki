# Design Tokens Reference: Toiloki – Local Suite

This document defines the strict visual design tokens for Toiloki. All components, screens, and workspaces must adhere strictly to these tokens. Never introduce arbitrary ad-hoc hex codes, gradients, or styling rules.

---

## 1. Color Palette

### 1.1 Dark Theme (Primary Default)
The dark theme is modern, quiet, restrained, and editorial. Surfaces are near-black neutral graphite; borders are ultra-thin hairlines; accents are warm champagne gold.

| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--bg-app` | `#0B0C0F` | Main app background behind workspaces |
| `--bg-sidebar` | `#0E1013` | Sidebar background & Window titlebar background |
| `--bg-surface` | `#12141A` | Cards, panels, tool workspace base, inputs |
| `--bg-raised` | `#171A21` | Popovers, active nav pills, dropdown menus, table headers |
| `--bg-hover` | `#1C2028` | Hover state for interactive items, list rows, tool cards |
| `--text-primary` | `#F4F5F7` | Headings, active labels, primary values |
| `--text-secondary`| `#A3A9B5` | Body text, descriptions, table contents, placeholders |
| `--text-tertiary` | `#6B7280` | Captions, shortcut keys, disabled text, breadcrumb slashes |
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` | Subtle dividers, inactive card borders, inner table lines |
| `--border-default`| `rgba(255, 255, 255, 0.10)` | Card outlines, panel borders, input borders |
| `--border-strong` | `rgba(255, 255, 255, 0.16)` | Focused inputs, hovered cards, active selection borders |

### 1.2 Light Theme (Strict Mirror)
Light mode must mirror dark mode identically in layout, spacing, typography, and density. It uses clean, low-glare paper-gray surfaces.

| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--bg-app` | `#F8F9FA` | Main app background |
| `--bg-sidebar` | `#F0F2F5` | Sidebar background & Window titlebar background |
| `--bg-surface` | `#FFFFFF` | Cards, panels, tool workspace base, inputs |
| `--bg-raised` | `#F4F5F7` | Popovers, active nav pills, dropdown menus, table headers |
| `--bg-hover` | `#EAECEF` | Hover state for interactive items, list rows |
| `--text-primary` | `#111318` | Headings, active labels, primary values |
| `--text-secondary`| `#57606A` | Body text, descriptions, table contents |
| `--text-tertiary` | `#8C95A0` | Captions, shortcut keys, disabled text |
| `--border-subtle` | `rgba(0, 0, 0, 0.06)` | Subtle dividers, inner table lines |
| `--border-default`| `rgba(0, 0, 0, 0.10)` | Card outlines, panel borders, input borders |
| `--border-strong` | `rgba(0, 0, 0, 0.16)` | Focused inputs, hovered cards |

### 1.3 Accent Color (Champagne Gold)
Used exclusively for primary calls-to-action, active indicators, and focus states. Never spray accent color across large backdrops or decorative bars.

| Token | Dark Mode | Light Mode | Usage |
| :--- | :--- | :--- | :--- |
| `--accent-primary` | `#D4B06A` | `#B88E3E` | Primary buttons, active tab indicators, selected radio/checkbox |
| `--accent-hover`   | `#E3C382` | `#C99F4E` | Primary button hover |
| `--accent-soft`    | `rgba(212, 176, 106, 0.12)` | `rgba(184, 142, 62, 0.12)` | Active navigation background tint, badge background |
| `--accent-text`    | `#0B0C0F` | `#FFFFFF` | Text color on primary accent background |

### 1.4 Functional / Semantic Status Colors
Restrained, high-contrast, functional colors for system feedback and alerts.

| Semantic | Hex Value | Soft Background | Usage |
| :--- | :--- | :--- | :--- |
| **Success** | `#3DD68C` | `rgba(61, 214, 140, 0.12)` | Successful file export, verified checksum, active toggle |
| **Warning** | `#F5A524` | `rgba(245, 165, 36, 0.12)` | Large file alert, non-reversible action, pending state |
| **Danger**  | `#F05252` | `rgba(240, 82, 82, 0.12)` | Delete file, format error, missing input, invalid syntax |

### 1.5 Workspace Category Identity
Each of the 8 workspaces has a dedicated subtle hue, but **CRITICAL RULE**: Category colors must appear **only** inside the 20×20px or 28×28px icon tile, never as large colored backgrounds, gradient banners, or glowing borders.

| Workspace | Category Accent | Soft Tile Tint |
| :--- | :--- | :--- |
| **PDF** | `#E06C75` | `rgba(224, 108, 117, 0.12)` |
| **Documents** | `#61AFEF` | `rgba(97, 175, 239, 0.12)` |
| **Images** | `#98C379` | `rgba(152, 195, 121, 0.12)` |
| **Data** | `#E5C07B` | `rgba(229, 192, 123, 0.12)` |
| **Text** | `#C678DD` | `rgba(198, 120, 221, 0.12)` |
| **Developer** | `#56B6C2` | `rgba(86, 182, 194, 0.12)` |
| **Calculator & Converters** | `#D19A66` | `rgba(209, 154, 102, 0.12)` |
| **Files & Archives** | `#ABB2BF` | `rgba(171, 178, 191, 0.12)` |

---

## 2. Typography System

### 2.1 Font Families
- **Interface Font**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Geist`, sans-serif.
- **Monospace Font**: `JetBrains Mono`, `Fira Code`, `Consolas`, monospace. Use strictly for:
  - Code editors and viewers
  - File hashes (MD5, SHA-256)
  - Raw JSON/YAML/XML payloads
  - File metadata (file sizes, byte counts, MIME types, dimensions)
  - Keyboard shortcuts (`Ctrl+K`, `Esc`)
  - Hexadecimal color codes and coordinate values

### 2.2 Typographic Hierarchy Scale

| Level | Size / Line-Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `32px / 40px` | `650` | `-0.02em` | Workspace main headers, Home hero header |
| **Section Heading** | `18px / 26px` | `600` | `-0.01em` | Tool page sections, Card group titles, Settings groups |
| **Card Title** | `15px / 22px` | `600` | `-0.005em`| Workspace tool cards, options group headers |
| **Body (Default)** | `14px / 22px` | `400` | `0` | Standard UI text, descriptions, table cells, form labels |
| **Sidebar Item** | `13.5px / 20px`| `500` | `0` | Sidebar navigation labels, compact menus |
| **Caption / Meta** | `11px / 16px` | `600` | `0.08em` | Section badges, uppercase subheaders, status tags |
| **Code / Mono** | `12.5px / 18px`| `400` | `0` | Terminal outputs, technical parameters, hashes |

**Rule**: Never use giant condensed typography, oversized marketing numbers, or decorative serif headers.

---

## 3. Spacing System (8px Grid)

Use an uncompromising 8px harmonic spacing system:
- `4px` (`var(--space-1)`): Micro gaps, icon-to-label spacing, badge padding
- `8px` (`var(--space-2)`): Form field padding, tight list items, icon button padding
- `12px` (`var(--space-3)`): Standard component gap, input field internal padding
- `16px` (`var(--space-4)`): Card padding, sidebar horizontal item padding, group spacing
- `24px` (`var(--space-6)`): Section spacing, options panel padding
- `32px` (`var(--space-8)`): Workspace top margin, page padding for smaller viewports
- `48px` (`var(--space-12)`): Main content horizontal padding on desktop

---

## 4. Radii & Borders

- **Subtle Corners**: `4px` for tags, badges, and small inputs; `6px` for standard buttons, inputs, dropdowns; `8px` for panels, cards, and modal dialogs; `10px` maximum for outer workspace containers.
- **Never use pill-shaped cards or pill-shaped buttons**: Pill shapes (`rounded-full` / `9999px`) belong to mobile consumer apps, not professional desktop utility software.
- **Hairline Borders**: `1px solid` border using `--border-subtle` or `--border-default`. Never use heavy `2px` or `3px` colored borders.

---

## 5. Shadows & Elevation

Depth is communicated primarily through surface color contrast (`--bg-surface` vs `--bg-raised`) and hairline borders. Shadows are minimal and reserved for floating overlays:
- **Card / Surface**: No shadow (`box-shadow: none`), relies on 1px hairline border.
- **Dropdown / Context Menu**: `0 4px 16px rgba(0, 0, 0, 0.36), 0 0 0 1px rgba(255, 255, 255, 0.08)`
- **Modal Dialog**: `0 16px 40px rgba(0, 0, 0, 0.50), 0 0 0 1px rgba(255, 255, 255, 0.12)`
