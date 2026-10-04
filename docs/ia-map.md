# Toiloki – Information Architecture Map (IA Map)
**Version 1.0 · Design Charter Compliance**

---

## 1. Top-Level Shell & Navigation Architecture

```
[ Window Chrome / Titlebar (40px) ]
  ├── [ Left: Window Title & App Icon ]
  ├── [ Center: Global Search & Command Trigger (Ctrl+K) ]
  └── [ Right: Theme Quick Toggle | Window Controls (Min, Max, Close) ]

[ App Shell (Three-Column / Responsive Desktop) ]
  ├── [ Primary Sidebar (240px Fixed) ]
  │     ├── Brand Header ("Toiloki")
  │     ├── Core Navigation Group (Max 7 items)
  │     │     ├── Home / Dashboard
  │     │     ├── PDF Suite
  │     │     ├── Documents
  │     │     ├── Images & Media
  │     │     ├── Data Tools
  │     │     ├── Text Tools
  │     │     └── Developer Utilities
  │     ├── Secondary Collapsible ("More Workspaces")
  │     │     ├── Calculator & Converters
  │     │     ├── Files & Archives
  │     │     ├── Security & Privacy
  │     │     ├── Design Tools
  │     │     └── System & Network
  │     ├── Utility Views
  │     │     ├── Recent & History
  │     │     └── Favorites
  │     └── Footer (Pinned Bottom)
  │           ├── Trust Badge: "Runs locally · 100% offline" (Dot with tooltip)
  │           └── Settings Button (Gear icon)
  │
  └── [ Main Workbench Area (Dynamic Width) ]
        ├── Workspace Header (Breadcrumbs, Preset Selector, Action Bar)
        ├── Central Work Canvas (Primary Interaction Zone / Drop Target)
        └── Sticky Bottom Action Bar (One Primary Action Button [Accent Fill], Secondary Actions)
```

---

## 2. Global Dialogs, Sheets & Overlays

| Modal / Overlay | Shortcut | Purpose | Return Target |
| :--- | :--- | :--- | :--- |
| **Command Palette** | `Ctrl + K` / `Cmd + K` | Universal search & direct launcher for all 100+ utilities | Invoking view |
| **Smart Paste Modal** | `Ctrl + Alt + V` | Sniffs clipboard (JSON, CSV, JWT, Color, Cron) and suggests utilities | Selected utility |
| **Drop Anywhere Overlay** | Drag & Drop | Global drag listener on window for instantaneous file routing | Target workspace |
| **Shortcuts Cheatsheet** | `Ctrl + ?` | Quick-reference keyboard shortcuts panel | Current screen |
| **Presets & Chains** | Modal | Create, inspect, and run multi-step deterministic pipelines | Current utility |

---

## 3. Workspaces & Tool Taxonomy

### 3.1 PDF Suite
- **PDF Compress**: Optimize PDF filesize locally.
- **PDF Merge**: Combine multiple PDF files into one.
- **PDF Split**: Extract pages or page ranges into new PDFs.
- **PDF Organize / Reorder**: Drag-and-drop page reorganization, rotation, and deletion.
- **PDF Annotate**: Highlight, redact sensitive text, add notes.
- **PDF Convert**: Extract images or export to plain text.
- **PDF Protect & Unlock**: Encrypt or decrypt password-protected PDFs.

### 3.2 Documents
- **DOCX to PDF**: Local rendering and conversion without Microsoft Office.
- **Markdown Studio**: Live preview, HTML export, DOCX export.
- **RTF Converter**: RTF to TXT and HTML conversion.
- **Document Metadata**: View, edit, or wipe author/creator metadata.

### 3.3 Images & Media
- **Image Converter**: PNG, JPG, WebP, BMP, TIFF, SVG conversion.
- **Image Resizer**: Pixel and percentage resizing with aspect ratio lock.
- **Image Compressor**: Quality adjustment with instant side-by-side preview.
- **Color Palette Extractor**: Dominant color sampling from images.
- **Audio Waveform Player**: Local WAV playback and inspect waveform.
- **Subtitle Time Shifter**: Adjust SRT/VTT subtitle timestamps in batch.

### 3.4 Data Tools
- **CSV & Excel Studio**: Convert CSV to JSON, XLSX, YAML, Markdown tables.
- **JSON Formatter & Validator**: Beautify, minify, validate, schema check.
- **XML / YAML Converter**: Bidirectional conversion and syntax linting.
- **Table Inspector**: Sort, filter, column reorder, and preview tabular datasets.

### 3.5 Text Tools
- **Diff & Compare**: Side-by-side text difference with `+` and `-` markers.
- **Case Converter**: UPPERCASE, lowercase, camelCase, snake_case, kebab-case.
- **Line Deduplicator**: Sort and remove redundant lines.
- **Word & Character Counter**: Real-time stats (words, characters, reading time).
- **Regex Tester**: Real-time regex pattern evaluator with match groups.

### 3.6 Developer Utilities
- **UUID & ID Generator**: v4, v7, NanoID, cryptographic random strings.
- **Hash & Checksum**: MD5, SHA-1, SHA-256, SHA-512, HMAC calculation.
- **Base64 & URL Tools**: Base64 encode/decode, URL encode/decode, parse URL query strings.
- **JWT Inspector**: Decode JWT headers and payload claims securely offline.
- **Timestamp Converter**: Unix epoch milliseconds/seconds to ISO 8601 and local time.
- **Cron Expression Builder**: Human-readable schedule breakdown and next runs.

### 3.7 Calculator & Converters
- **Basic Calculator**: High-precision arithmetic calculator.
- **Unit Converter**: Length, weight, temperature, volume, data storage units.
- **Date & Time Difference**: Business days, leap years, delta duration.
- **Percentage & Margin**: Markup, margin, percentage change calculator.

### 3.8 Files & Archives
- **Archive Manager**: ZIP and TAR packer and unpacker with Zip-Slip path security.
- **Batch Renamer**: Pattern replacement, prefix, suffix, numbering tokens.
- **Duplicate File Finder**: Hash-based identical file detection.
- **File Shredder**: Multi-pass secure overwrite and deletion.

### 3.9 Security & Privacy
- **AES-256 File Encryption**: Local passphrase encryption and decryption.
- **Checksum Verifier**: Compare file hash against vendor checksum.
- **EXIF & Metadata Stripper**: Strip privacy-sensitive tags from photos and docs.

### 3.10 Design Tools
- **Color Picker & Contrast**: WCAG AA / AAA contrast ratio validator.
- **Palette Generator**: Harmonic palettes (analogous, complementary, triadic).
- **SVG Optimizer**: Clean unneeded SVG attributes and reduce file size.

### 3.11 System & Network
- **Hosts File Viewer**: Parse and validate local hosts entries.
- **Environment (.env) Validator**: Check duplicate keys, syntax, and formatting.
- **CIDR & Subnet Calculator**: Network ranges, broadcast IP, usable hosts.
- **cURL to Fetch Converter**: Translate curl commands into JavaScript code.

---

## 4. Settings Architecture (5 Clear Sections)

1. **General**: Startup behavior, default save directory, confirmation prompts, telemetry notice (100% offline verification).
2. **Appearance**: Theme selection (Dark, Light, System), density control (Default, Compact, Comfortable), corner radius (Default, Sharp, Round), subtle background patterns, image launcher style toggle.
3. **Workspaces**: Toggle visibility of core and secondary workspaces.
4. **Performance**: Hardware acceleration toggle, web worker threads, memory cache threshold.
5. **History & Privacy**: History retention limits, recent files clearing, diagnostics export ("Report a problem" - produces safe local JSON for manual email), privacy policy.
6. **About**: Toiloki version, open-source licenses, build timestamp, offline pledge.

---

## 5. Top 10 Jobs: Click-Path & Efficiency Analysis

| Job # | Task | Target Path from Home | Clicks to Complete |
| :--- | :--- | :--- | :--- |
| **1** | **Compress PDF** | Home -> Drag file to Dropzone -> Click "Compress" | **2 clicks** (or 1 drag + 1 click) |
| **2** | **Merge PDFs** | Home -> Quick Action "Merge PDF" -> Select files -> Click "Merge" | **3 clicks** |
| **3** | **Split PDF** | Home -> Quick Action "Split PDF" -> Drop file -> Click "Split" | **2 clicks** |
| **4** | **Convert Image** | Home -> Drop image -> Select format tile -> Click "Convert" | **2 clicks** |
| **5** | **Resize Image** | Home -> Drop image -> Enter width -> Click "Resize" | **2 clicks** |
| **6** | **Format JSON** | Home -> Quick Action "Format JSON" -> Paste -> Click "Format" | **2 clicks** |
| **7** | **Basic Calculator** | Home -> Sidebar "Calculator" -> Enter calculation | **2 clicks** |
| **8** | **Batch Rename** | Home -> Files -> Drop files -> Apply pattern | **3 clicks** |
| **9** | **Extract Archive** | Home -> Drop ZIP file -> Click "Extract All" | **2 clicks** |
| **10**| **Hash / Checksum** | Home -> Drop file -> Select "SHA-256" -> Click "Copy" | **2 clicks** |

*All top 10 jobs strictly satisfy the Design Charter target of 3 clicks or fewer from Home.*
