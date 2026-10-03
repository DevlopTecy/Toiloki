# Toiloki Workbench Mapping

This document maps the utilities to their respective workbench modes and menus, fulfilling the Phase 2 (W1) registry modeling requirement.

## 1. PDF Workspace (File Workbench)
**Workbench Type:** `file`

### Menu: Organize
- Merge PDF -> `tray` (accepts: many)
- Split PDF -> `markers` (accepts: one)
- Extract Pages -> `pages`
- Delete Pages -> `pages`
- Reorder Pages -> `pages`
- Rotate Pages -> `pages`
- Duplicate Pages -> `pages`
- Replace Pages -> `pages`
- Remove Blank Pages -> `pages`
- Crop Pages -> `pages`

### Menu: Edit
- Add Text -> `annotate`
- Add Image -> `annotate`
- Draw & Shapes -> `annotate`
- Highlight & Underline -> `annotate`
- Watermark -> `annotate`
- Page Numbers -> `annotate`
- Redact -> `annotate`
- Fill Form Fields -> `annotate`
- Bookmarks Editor -> `annotate`

### Menu: Convert
- Images -> PDF -> `tray` (accepts: many, non-PDF)
- DOCX / TXT / Markdown / HTML -> PDF -> `panel` (accepts: one, non-PDF)
- PDF -> Images -> `panel`
- PDF -> Document Formats -> `panel`

### Menu: Optimize
- Compress -> `panel`
- Optimize Images -> `panel`
- Flatten -> `panel`
- Remove Metadata -> `panel`
- Repair -> `panel`

### Menu: Extract
- Extract Text -> `info`
- Extract Images -> `info`
- Extract Metadata -> `info`
- Search PDF Text -> `info`

### Menu: Secure
- Password Protect -> `panel`
- Encrypt -> `panel`
- Remove Password -> `panel`
- Sign PDF -> `annotate`

### Menu: Info
- File Information -> `info`
- Page Count and Stats -> `info`
- Document Properties -> `info`

## 2. Images Workspace (File Workbench)
**Workbench Type:** `file`
- Canvas: image preview with before/after toggle, batch strip thumbnails.
- Menus: Transform (Resize, Crop on canvas, Rotate and Flip, Aspect Ratio), Convert (panel with tiles), Optimize, Adjust, Metadata, Compose, Image -> PDF.

## 3. Documents Workspace (File Workbench)
**Workbench Type:** `file`
- Modes: `tray`, `panel` (convert, compare, export)

## 4. Audio & Video Workspace (File Workbench)
**Workbench Type:** `file`
- Canvas: player + timeline (trim handles)
- Modes: `trim`, `panel`, `info`

## 5. Files & Archives Workspace (File Workbench)
**Workbench Type:** `file`
- Canvas: file table canvas + panel
- Utilities: Create/Extract/Inspect ZIP, Batch Rename with live preview.

## 6. Text, Data, Developer Workspaces (Editor Workbench)
**Workbench Type:** `editor`
- Canvas: Input | Output split filling canvas with line numbers and status bar.
- Menus mapped from existing groups.

## 7. Standalone Workspaces
**Workbench Type:** `standalone`
- Includes: Calculator & Converters, Security & Privacy, Network & Web, Color & Design, System & Maintenance
- Canvas: Existing utility templates (calculator keypad, large fields).
