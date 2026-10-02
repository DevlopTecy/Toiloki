# Reusable Component System: Toiloki – Local Suite

This document defines the interface standards, component anatomy, and behavioral contracts for all UI components in Toiloki.

---

## 1. Buttons & Triggers

Buttons must adhere to a strict visual hierarchy. Never place two primary buttons adjacent to each other.

| Variant | Visual Specs | Usage |
| :--- | :--- | :--- |
| **Primary Button** | Background: `#D4B06A` (Champagne Gold)<br>Hover: `#E3C382`<br>Text: `#0B0C0F` (Dark) / `#FFFFFF` (Light)<br>Height: `34px`, Radius: `6px`, Font: `13.5px / 600`<br>Padding: `0 14px` | The singular main action per view: "Merge PDF", "Convert Images", "Export JSON", "Process Files". |
| **Secondary Button** | Background: `--bg-surface` (`#12141A`)<br>Hover: `--bg-hover` (`#1C2028`)<br>Border: `1px solid var(--border-default)`<br>Text: `--text-primary`<br>Height: `34px`, Radius: `6px`, Font: `13.5px / 500` | Secondary actions: "Add Files", "Choose Directory", "Save Preset", "Options". |
| **Ghost Button** | Background: `transparent`<br>Hover: `--bg-hover`<br>Text: `--text-secondary`, Hover Text: `--text-primary`<br>Height: `34px`, Radius: `6px` | Neutral actions: "Cancel", "Reset", "Clear All", "Close". |
| **Icon Button** | Size: `34×34px` (minimum `36×36px` hit target via padding/margin)<br>Background: `transparent` or `--bg-surface`<br>Hover: `--bg-hover`<br>Text: `--text-secondary`<br>Border: Optional `1px solid var(--border-subtle)` | Reorder up/down, remove item, copy to clipboard, toggle visibility. **Mandatory**: Must have `aria-label` and title tooltip. |
| **Danger Button** | Background: `rgba(240, 82, 82, 0.12)`<br>Hover: `rgba(240, 82, 82, 0.20)`<br>Border: `1px solid rgba(240, 82, 82, 0.30)`<br>Text: `#F05252` | Irreversible actions: "Delete Page", "Wipe History", "Reset Defaults". |

---

## 2. File Processing UI (Drop Zone & Table)

File processing is central to Toiloki. It must look like high-precision software, not a web drag-and-drop widget.

### 2.1 Compact File Drop Zone
- **Height**: Compact `100px` to `120px` maximum. **Forbidden**: Do not let the drop zone swallow 60% of the viewport.
- **Background**: `--bg-surface` (`#12141A`), or slight tint when hovered.
- **Border**: `1px dashed var(--border-default)` (or `1px dashed var(--accent-primary)` on drag-over).
- **Radius**: `8px`.
- **Content**:
  - Small upload/file icon (`20×20px`, `--text-tertiary`).
  - Primary text: `Drop files here, or` + Inline text button `Browse files` (accent colored).
  - Subtitle (Crucial privacy reassurance): `Files stay on your computer. Fully offline & local.` (`11.5px`, `--text-tertiary`).

### 2.2 File List Table & Rows
When files are added, present a dense, structured data table rather than scattered oversized cards.

```
+---------------------------------------------------------------------------------------------------+
| [ ] NAME                         SIZE      TYPE / DETAILS      STATUS       ACTIONS               |
+---------------------------------------------------------------------------------------------------+
| [=] quarterly_report_2026.pdf    2.4 MB    18 pages            Ready        [▲] [▼] [Preview] [✕] |
| [=] appendix_financials.pdf      840 KB    6 pages             Ready        [▲] [▼] [Preview] [✕] |
| [=] cover_page_v2.pdf            310 KB    1 page              Ready        [▲] [▼] [Preview] [✕] |
+---------------------------------------------------------------------------------------------------+
```

- **Header Row**: Height `30px`, font `11px`, weight `600`, uppercase, color `--text-tertiary`, bottom border `1px solid var(--border-subtle)`.
- **File Row Height**: `34px` to `38px` (compact, professional information density).
- **Background**: Alternating or uniform `--bg-surface`, hover `--bg-hover`.
- **Drag Handle**: Compact 6-dot grip icon for reorderable lists (PDF merge, document joiner).
- **Filename**: Truncated with ellipsis if long; mono extension badge or category icon.
- **Metadata**: Monospace typography (`JetBrains Mono`, `12px`) for size and page counts.
- **Actions**: Inline icon buttons for move up, move down, preview, and remove.

---

## 3. Options Panel

The options panel organizes tool settings (e.g. image compression ratio, PDF encryption password, CSV delimiter).

- **Location**: Right-hand column (`320px` to `360px` width) or embedded collapsible side panel.
- **Container**: Background `--bg-surface`, border `1px solid var(--border-default)`, radius `8px`, padding `16px`.
- **Section Headers**: `12px` uppercase, weight `600`, letter spacing `0.06em`, color `--text-tertiary`, margin bottom `12px`.
- **Grouping**: Logical groups separated by `1px solid var(--border-subtle)`.

---

## 4. Form Controls

All form controls must be refined, tactile, and restrained.

### 4.1 Text Input & Textarea
- **Height**: Input `32px` to `34px`, Textarea variable.
- **Background**: `--bg-surface` (`#12141A`).
- **Border**: `1px solid var(--border-default)`.
- **Radius**: `6px`.
- **Font**: `13.5px`, color `--text-primary`. Placeholder color `--text-tertiary`.
- **Focus State**: `1px solid var(--accent-primary)`, optional subtle ring `0 0 0 2px var(--accent-soft)`. No heavy blue outlines.

### 4.2 Select / Dropdown
- **Height**: `34px`.
- **Appearance**: Custom styled with subtle chevron icon, background `--bg-surface`, border `1px solid var(--border-default)`.
- **Menu Overlay**: Background `--bg-raised`, border `1px solid var(--border-strong)`, shadow `0 8px 24px rgba(0,0,0,0.4)`.

### 4.3 Toggle / Switch
- **Size**: Track `36px` width × `20px` height. Thumb `16×16px`.
- **Off State**: Track `--bg-hover` (`#1C2028`), thumb `--text-tertiary`.
- **On State**: Track `var(--accent-primary)` (`#D4B06A`), thumb `#0B0C0F`.
- **Focus**: Visible focus ring on keyboard tab.

### 4.4 Sliders / Range Controls
- **Track**: Height `4px`, background `--bg-hover`, border-radius `2px`.
- **Filled Track**: Background `var(--accent-primary)`.
- **Thumb**: `14×14px` circle, background `#F4F5F7`, border `1px solid var(--border-strong)`.
- **Value Badge**: Monospace readout adjacent to slider (e.g. `85%`, `300 DPI`).

---

## 5. Navigation & Tabs

### 5.1 Tool Selector Tabs
- **Height**: `32px`.
- **Style**: Underlined rail or segmented pill control.
- **Active Tab**: Champagne gold underline (`2px`) or subtle raised pill (`--bg-raised`), color `--text-primary`.
- **Inactive Tab**: Color `--text-secondary`, hover `--text-primary`.

### 5.2 Breadcrumbs
- **Format**: `Home › [Workspace Category] › [Tool Name]`
- **Hierarchy**: All on one single row, separated by `/` or `›` in `--text-tertiary`.
- **Interaction**: Clicks navigate back to Home or Workspace root.

---

## 6. Feedback & Status Components

### 6.1 Status Badges
- **Size**: Height `20px`, padding `0 8px`, border-radius `4px`.
- **Font**: `11px`, weight `600`, uppercase or capitalized.
- **Variants**:
  - *Neutral*: Background `--bg-hover`, text `--text-secondary`.
  - *Success*: Background `rgba(61, 214, 140, 0.12)`, text `#3DD68C`.
  - *Warning*: Background `rgba(245, 165, 36, 0.12)`, text `#F5A524`.
  - *Danger*: Background `rgba(240, 82, 82, 0.12)`, text `#F05252`.

### 6.2 Progress Bar
- **Height**: Compact `4px` or `6px`, border-radius `3px`.
- **Track**: `--bg-hover`.
- **Fill**: `var(--accent-primary)` with smooth CSS transition (`transition: width 200ms ease-out`).
- **Label**: Adjacent percentage and status description in `12px` font.

### 6.3 Toast Notifications
- **Position**: Floating bottom-right (`bottom: 24px; right: 24px;`).
- **Surface**: `--bg-raised`, border `1px solid var(--border-strong)`, shadow `0 12px 32px rgba(0,0,0,0.5)`.
- **Content**: Status icon, concise message, optional action button ("Open File", "Copy Link"), close button.
- **Auto-dismiss**: 4 seconds.

---

## 7. Modals & Dialogs

- **Backdrop**: `rgba(0, 0, 0, 0.65)` with subtle blur (`backdrop-filter: blur(2px)`).
- **Dialog Surface**: Width `440px` to `600px`, background `--bg-surface`, border `1px solid var(--border-strong)`, radius `8px`.
- **Header**: Title `18px / 600`, close icon button at top right.
- **Actions Bar**: Top border `1px solid var(--border-subtle)`, right-aligned: Ghost "Cancel", Primary action button.

---

## 8. State Screens

### 8.1 Empty State
- **Container**: Centered within workspace area, vertical padding `48px`.
- **Icon**: `36×36px`, color `--text-tertiary`.
- **Title**: `16px / 600`, color `--text-primary`.
- **Description**: `13.5px`, color `--text-secondary`, max-width `360px`, text-align center.
- **Action**: Secondary or Primary button (e.g. "Select File to Begin").

### 8.2 Error State
- **Container**: Compact banner or inline card with danger border `1px solid rgba(240, 82, 82, 0.30)`.
- **Icon**: Alert triangle in `#F05252`.
- **Copy**: Plain, actionable explanation (e.g. "Unable to read password-protected PDF. Enter decryption key below.").
- **Actions**: Retry or alternate format suggestion.
