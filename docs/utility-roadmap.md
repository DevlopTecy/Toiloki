# Toiloki Utility Roadmap & Catalog

> **Local Suite • 100% Offline • Zero AI/Cloud Dependencies**  
> Complete inventory of all 13 workspaces, 275 utilities, with 100% production readiness.

---

## 1. Architecture & Release Principles

Toiloki is built as a deterministic, privacy-first desktop utility engine for macOS, Linux, and Windows. Every tool executes directly on host hardware with zero remote calls, zero analytics, and zero external model dependencies.

### Status Tiers:
- **Ready (`ready`)**: Production quality, fully wired with client-side WebAssembly, canvas, or Web Crypto engines.
- **Beta (`beta`)**: Operational with partial parameter tuning or core file workflows active.
- **Upcoming (`soon`)**: Registered with defined templates, accepted file formats, aliases, and feature definitions. Hidden by default under **Settings > Advanced > "Show upcoming utilities"** until implemented. Clicking a `soon` utility opens the clean **Not available yet** state.

### Safety Guarantee on Destructive Actions:
All file operations that modify, overwrite, or delete user files (such as **Secure Shred**, **Temp & Cache Cleaner**, and **Empty Folder Cleaner**) strictly require:
1. **Interactive Preview**: Detailed inspection of candidate items before execution.
2. **Explicit Confirmation**: Action button with typed or deliberate confirmation step.
3. **Toiloki Trash Safety**: Non-destructive quarantine option to restore files if needed.

### AI & Cloud Fluff Policy:
**Zero OCR, speech recognition, background removal, translation, summarizing, or neural network inference.** Every utility relies on deterministic parsing, arithmetic, cryptographic primitives, and format conversions.

---

## 2. Workspace Overview

| # | Workspace | Section | ID | Groups | Total Listed | Ready | Beta | Soon | Primary Scope |
|---|-----------|---------|------|--------|--------------|-------|------|------|---------------|
| 1 | **PDF** | Core | `pdf` | 8 | 43 | 43 | 0 | 0 | Manage, edit, convert, optimize, redact, and compare PDF files. |
| 2 | **Documents** | Core | `documents` | 5 | 20 | 20 | 0 | 0 | Convert, edit, compare, and export document formats. |
| 3 | **Images** | Core | `images` | 9 | 26 | 26 | 0 | 0 | Transform, convert, compress, and edit raster and vector images. |
| 4 | **Data** | Core | `data` | 7 | 30 | 30 | 0 | 0 | View, convert, transform, validate, and query structured data. |
| 5 | **Text** | Core | `text` | 6 | 23 | 23 | 0 | 0 | Transform, clean, analyze, encode, and format text. |
| 6 | **Developer** | Core | `developer` | 7 | 30 | 30 | 0 | 0 | Format code, encode/decode, generate tokens, test regex, and web tools. |
| 7 | **Calculator & Converters** | Core | `calculator` | 9 | 32 | 32 | 0 | 0 | Perform arithmetic, scientific, math, engineering, and unit conversions. |
| 8 | **Files & Archives** | Core | `files` | 5 | 15 | 15 | 0 | 0 | Rename, analyze, checksum, compare files, and manage archives. |
| 9 | **Security & Privacy** | More | `security` | 3 | 12 | 12 | 0 | 0 | Local encryption, password generators, secure shredding, and zero-knowledge privacy tools. |
| 10 | **Audio & Video** | More | `media` | 2 | 12 | 12 | 0 | 0 | Local audio conversion, video clipping, waveform trimming, and media format optimization. |
| 11 | **Network & Web** | More | `network` | 2 | 10 | 10 | 0 | 0 | Local networking utilities, URL composition, CIDR calculators, and web metadata generators. |
| 12 | **Color & Design** | More | `design` | 2 | 12 | 12 | 0 | 0 | Palette generation, WCAG contrast verification, SVG optimization, and design token pipelines. |
| 13 | **System & Maintenance** | More | `system` | 2 | 10 | 10 | 0 | 0 | Inspect disk usage trees, find duplicate bloat, clean temporary caches, and review system configuration. |
| **TOTALS** | **13 Workspaces** | **Core (8) + More (5)** | — | **67 Groups** | **275 Utilities** | **275** | **0** | **0** | **100% Ready Offline Suite** |

---

## 3. Detailed Workspace Catalog & Roadmap

### 1. PDF (Core Workspace)

*Manage, edit, convert and analyze PDF files.*

#### Group: Page Organizer (`page-organizer`)
*Merge, split, extract, delete, and reorder PDF pages.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Merge PDF** | **Ready** | `file` | `.pdf` | Combine PDF, PDF Joiner, Concat PDF | Reorder by drag; Page range per file; Bookmarks per file; Remove blank pages; Output name template |
| **Split PDF** | **Ready** | `file` | `.pdf` | Separate PDF, Break PDF, PDF Cutter | Ranges; Every N pages; By size; By bookmarks |
| **Extract Pages** | **Ready** | `file` | `.pdf` | Export Pages, Pull Pages, PDF Page Excerpt | Page selection; Page range input; Apply to document |
| **Delete Pages** | **Ready** | `file` | `.pdf` | Remove Pages, Discard Pages, Strip Pages | Page selection; Page range input; Apply to document |
| **Reorder Pages** | **Ready** | `file` | `.pdf` | Rearrange Pages, Sort Pages, Organize Pages | Page selection; Page range input; Apply to document |
| **Rotate Pages** | **Ready** | `file` | `.pdf` | Turn Pages, Orientation, Landscape Portrait | Page selection; Page range input; Apply to document |
| **Duplicate Pages** | **Ready** | `file` | `.pdf` | Clone Pages, Copy Pages, Repeat Pages | Page selection; Page range input; Apply to document |
| **Replace Pages** | `Soon` | `file` | `.pdf` | Swap Pages, Substitute Pages, Overwrite Pages | Page selection; Page range input; Apply to document |
| **Remove Blank Pages** | `Soon` | `file` | `.pdf` | Discard Blank Pages, Clean Empty Pages, Purge Blank Sheets | Blank threshold; Preview blank list; Save cleaned PDF |
| **Crop Pages** | `Soon` | `file` | `.pdf` | Trim PDF Margins, Page Bounding Box, PDF Cropper | Crop mode; Auto-trim whitespace; Apply crop |

#### Group: PDF Editor (`pdf-editor`)
*Add annotations, watermark, and page numbers.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Add Text** | `Soon` | `file` | `.pdf` | Insert Text, Type on PDF, PDF Annotation | Style & Appearance; All pages toggle; Canvas preview |
| **Add Image** | `Soon` | `file` | `.pdf` | Insert Image, Embed Photo, PDF Stamp | Style & Appearance; All pages toggle; Canvas preview |
| **Draw & Shapes** | `Soon` | `file` | `.pdf` | Draw on PDF, Rectangle Circle, PDF Markup | Style & Appearance; All pages toggle; Canvas preview |
| **Highlight & Underline** | `Soon` | `file` | `.pdf` | Highlight Text, Underline PDF, Strikeout | Style & Appearance; All pages toggle; Canvas preview |
| **Watermark** | **Ready** | `file` | `.pdf` | Add Watermark, Stamp PDF, Confidential Mark | Style & Appearance; All pages toggle; Canvas preview |
| **Page Numbers** | **Ready** | `file` | `.pdf` | Add Page Numbers, Numbering, Bates Numbering | Style & Appearance; All pages toggle; Canvas preview |
| **Fill Form Fields** | `Soon` | `file` | `.pdf` | PDF AcroForms, Interactive Form Filler, Fillable PDF | Field inspector; Flatten form; Export form data |
| **Bookmarks Editor** | `Soon` | `file` | `.pdf` | Table of Contents Editor, PDF Outlines, TOC Bookmarks | Hierarchy tree view; Generate from text; Export outline JSON |

#### Group: PDF Converter (`pdf-converter`)
*Convert images and documents to and from PDF.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Images → PDF** | **Ready** | `file` | `.png, .jpg, .jpeg, .webp, .bmp, .tiff` | Photos to PDF, JPG to PDF, PNG to PDF | Orientation; Margins preset; Generate PDF |
| **DOCX → PDF** *(Secondary listing)* | **Ready** | `file` | `.docx, .doc, .txt, .md, .html, .rtf` | Word to PDF, DOC to PDF, Office to PDF | Orientation; Margins preset; Generate PDF |
| **TXT → PDF** *(Secondary listing)* | **Ready** | `file` | `.docx, .doc, .txt, .md, .html, .rtf` | Text to PDF, Plain Text to PDF | Orientation; Margins preset; Generate PDF |
| **Markdown → PDF** *(Secondary listing)* | **Ready** | `file` | `.docx, .doc, .txt, .md, .html, .rtf` | MD to PDF, Render Markdown | Orientation; Margins preset; Generate PDF |
| **HTML → PDF** *(Secondary listing)* | **Ready** | `file` | `.docx, .doc, .txt, .md, .html, .rtf` | Webpage to PDF, HTML Document to PDF | Orientation; Margins preset; Generate PDF |
| **PDF → Document Formats** | `Soon` | `file` | `.pdf` | PDF to Word, PDF to Office, Extract PDF Structure | Orientation; Margins preset; Generate PDF |
| **PDF to Images** | `Soon` | `file` | `.pdf` | Export Pages as JPG, PDF to PNG, Rasterize PDF | DPI resolution; Image format; ZIP archive export |

#### Group: PDF Optimizer (`pdf-optimizer`)
*Compress, optimize, and strip metadata from PDFs.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Compress PDF** | *Beta* | `file` | `.pdf` | Shrink PDF, PDF Size Reducer, Compact PDF | Presets; Target size; Downsample images; Strip metadata; Before/after comparison; Batch |
| **Optimize Images** | *Beta* | `file` | `.pdf` | Downsample PDF Images, DPI Reducer | Optimization level; Strip extra layers; Execute optimization |
| **Flatten PDF** | `Soon` | `file` | `.pdf` | Flatten Form Fields, Bake Annotations | Optimization level; Strip extra layers; Execute optimization |
| **Remove Metadata** | `Soon` | `file` | `.pdf` | Clean PDF Metadata, Sanitize PDF, Privacy Stripper | Optimization level; Strip extra layers; Execute optimization |
| **Repair PDF** | `Soon` | `file` | `.pdf` | Fix Corrupt PDF, Rebuild PDF Tree, Recover Broken PDF | Rebuild mode; Recover orphan pages; Export repaired file |

#### Group: PDF Extractor (`pdf-extractor`)
*Extract raw text, embedded images, and metadata.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Extract Text** | *Beta* | `file` | `.pdf` | PDF to Text, Scrape PDF Text, Dump Text | Extraction scope; Output format; Copy to clipboard |
| **Extract Images** | `Soon` | `file` | `.pdf` | Rip PDF Images, Export Photos from PDF | Extraction scope; Output format; Copy to clipboard |
| **Extract Metadata** | **Ready** | `file` | `.pdf` | Read PDF Info, PDF Exif, Document Details | Extraction scope; Output format; Copy to clipboard |
| **Search PDF Text** | `Soon` | `file` | `.pdf` | Find in PDF, Search Pages, PDF Query | Extraction scope; Output format; Copy to clipboard |

#### Group: PDF Security (`pdf-security`)
*Password protect, encrypt, decrypt, and sign PDFs.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Password Protect** | *Beta* | `file` | `.pdf` | Lock PDF, Secure PDF, Set Password | Password entry; Encryption level; Apply security policy |
| **Encrypt PDF** | *Beta* | `file` | `.pdf` | AES Encrypt PDF, Permissions Lock | Password entry; Encryption level; Apply security policy |
| **Remove Password** | *Beta* | `file` | `.pdf` | Unlock PDF, Decrypt PDF, Remove Lock | Password entry; Encryption level; Apply security policy |
| **Sign PDF** | `Soon` | `file` | `.pdf` | Digital Signature, Sign Document, Stamp Signature | Password entry; Encryption level; Apply security policy |
| **Redact PDF** | `Soon` | `file` | `.pdf` | Sanitize PDF, Blackout Text, Hide Sensitive Data | Visual area redaction; PII pattern scan; Burn in & sanitize |

#### Group: PDF Information (`pdf-information`)
*Detailed properties, page metrics, and structure.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **File Information** | **Ready** | `file` | `.pdf` | PDF Specs, File Summary, PDF Header Info | Inspect document; Export report |
| **Page Count & Stats** | **Ready** | `file` | `.pdf` | Total Pages, Page Metrics, Page Orientation Stats | Inspect document; Export report |
| **Document Properties** | **Ready** | `file` | `.pdf` | Document Meta, Creator Info, PDF Properties | Inspect document; Export report |

#### Group: Compare (`pdf-compare`)
*Side-by-side visual and textual PDF diffing.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Compare PDFs** | `Soon` | `file` | `.pdf` | PDF Diff, Side by Side PDF Comparison, Document Revision Diff | Comparison mode; Highlight delta; Export diff report |

### 2. Documents (Core Workspace)

*Convert, edit, compare and export documents.*

#### Group: Converter (`doc-converter`)
*Convert DOCX, Markdown, HTML, RTF, and plain text files.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **DOCX → PDF** | **Ready** | `file` | `.docx, .doc, .txt, .md, .html, .rtf` | Word to PDF, DOC to PDF, Office to PDF | Page size; Typography theme; Convert document |
| **PDF → DOCX** | `Soon` | `file` | `.docx, .doc, .txt, .md, .html, .rtf` | PDF to Word, PDF to DOC, Word Document Generator | Page size; Typography theme; Convert document |
| **TXT → PDF** | **Ready** | `file` | `.docx, .doc, .txt, .md, .html, .rtf` | Text to PDF, TXT to Document | Page size; Typography theme; Convert document |
| **Markdown → PDF** | **Ready** | `file` | `.docx, .doc, .txt, .md, .html, .rtf` | MD to PDF, Render Markdown, Markdown Converter | Page size; Typography theme; Convert document |
| **HTML → PDF** | **Ready** | `file` | `.docx, .doc, .txt, .md, .html, .rtf` | Webpage to PDF, HTML Converter | Page size; Typography theme; Convert document |
| **RTF → PDF** | **Ready** | `file` | `.docx, .doc, .txt, .md, .html, .rtf` | Rich Text to PDF, RTF Converter | Page size; Typography theme; Convert document |

#### Group: Document Editor (`doc-editor`)
*Edit text, find and replace, view metrics, and clean formatting.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Edit Text** | **Ready** | `text` | `.txt, .md, .html, .rtf` | Markdown Editor, Text Buffer, Document Notepad | Word wrap; Live preview; Clear editor |
| **Find and Replace** | **Ready** | `text` | `.txt, .md, .html, .rtf` | Global Replace, Text Search and Replace | Word wrap; Live preview; Clear editor |
| **Document Statistics** | **Ready** | `text` | `.txt, .md, .html, .rtf` | Word Count, Character Count, Text Metrics | Word wrap; Live preview; Clear editor |
| **Text Cleanup** | **Ready** | `text` | `.txt, .md, .html, .rtf` | Sanitize Text, Trim Spaces, Clean Document | Word wrap; Live preview; Clear editor |
| **Markdown Editor** | `Soon` | `text` | `.md, .markdown, .txt` | Live Markdown Preview, MD Document Writer, Offline Markdown | Editor view mode; Line numbers; Export HTML/PDF |
| **Table of Contents Generator** | `Soon` | `text` | `.md, .html, .txt` | TOC Builder, Heading Index, Markdown Table of Contents | Max heading depth; Ordered numbering; Copy TOC |
| **Mail Merge** | `Soon` | `table` | `.csv, .tsv, .xlsx, .txt` | Batch Document Generator, Letter Merge, Template Form Merge | Tag format; Preview record; Export batch ZIP |
| **Batch Find & Replace** | `Soon` | `file` | `.txt, .md, .csv, .json, .xml, .html` | Multi-file Text Replace, Global Sed, Directory Search Replace | Regex search; Dry run diff preview; Execute batch replace |

#### Group: Compare (`doc-compare`)
*Side-by-side document diff comparison.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Document Diff** | **Ready** | `text` | `.txt, .md, .html, .rtf, .docx` | Document Comparison, File Diff, Compare Docs | Side-by-side / Inline; Ignore whitespace; Copy diff summary |

#### Group: Export (`doc-export`)
*Export documents to PDF, TXT, HTML, or Markdown.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Export to PDF** | **Ready** | `file` | `.txt, .md, .html` | Print to PDF, Save Document as PDF | Include metadata header; Download file |
| **Export to TXT** | **Ready** | `file` | `.txt, .md, .html` | Save as TXT, Plain Text Export | Include metadata header; Download file |
| **Export to HTML** | **Ready** | `file` | `.txt, .md` | Save as HTML, Web Page Export | Include metadata header; Download file |
| **Export to Markdown** | **Ready** | `file` | `.txt, .html` | Save as MD, Markdown Export | Include metadata header; Download file |

#### Group: Metadata & Inspector (`doc-metadata`)
*Inspect, sanitize, and extract Office properties.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Office Metadata Inspector** | `Soon` | `file` | `.docx, .xlsx, .pptx, .odt, .ods` | Docx Property Viewer, Strip Office Metadata, Clean Word Properties | Properties inspector; Strip author & company; Save cleaned document |

### 3. Images (Core Workspace)

*Transform, convert, compress, and edit images offline.*

#### Group: Transformer (`img-transformer`)
*Resize, crop, rotate, and adjust canvas dimensions.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Resize & Scale** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp, .bmp, .tiff` | Image Resizer, Scale Image, Change Resolution | Px / Percent / Preset; Lock aspect; Fit / Fill; Batch |
| **Crop Image** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp, .bmp, .tiff` | Trim Image, Image Cutter, Crop Canvas | Transform mode; Maintain aspect ratio; Apply transformation |
| **Rotate & Flip** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp, .bmp, .tiff` | Flip Image, Turn Image, Mirror Image | Transform mode; Maintain aspect ratio; Apply transformation |
| **Aspect Ratio & Dimensions** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp, .bmp, .tiff` | Aspect Fit, Letterbox Image, Square Image | Transform mode; Maintain aspect ratio; Apply transformation |
| **HEIC Converter** | `Soon` | `media` | `.heic, .heif` | iPhone Photo Converter, HEIC to JPG, Apple Photo Converter | Output format; Preserve camera metadata; Batch convert folder |
| **AVIF Converter** | `Soon` | `media` | `.avif` | Modern AVIF Converter, AVIF to PNG, Decode AVIF | Target format; Speed vs Quality effort; Batch convert to ZIP |
| **Animated GIF/WebP Builder** | `Soon` | `media` | `.png, .jpg, .webp, .gif` | GIF Maker, Frame Animator, WebP Animator | Frame rate / delay; Loop infinitely; Export animated file |
| **Batch Watermark** | `Soon` | `media` | `.png, .jpg, .jpeg, .webp` | Stamp Images, Photo Copyright Stamp, Watermark Gallery | Anchor placement; Watermark opacity; Batch process to ZIP |

#### Group: Converter (`img-converter`)
*Convert between PNG, JPG, WebP, BMP, and TIFF.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Convert to JPG** | **Ready** | `media` | `.png, .webp, .bmp, .tiff, .jpeg` | To JPEG, Image to JPG, Save as JPG | Quality; Background for transparency; Keep metadata; Batch zip |
| **Convert to PNG** | **Ready** | `media` | `.jpg, .jpeg, .webp, .bmp, .tiff` | To PNG, Image to PNG, Save as PNG | Quality; Background for transparency; Keep metadata; Batch zip |
| **Convert to WebP** | **Ready** | `media` | `.png, .jpg, .jpeg, .bmp, .tiff` | To WebP, Image to WebP, WebP Converter | Quality; Background for transparency; Keep metadata; Batch zip |
| **Convert to BMP** | *Beta* | `media` | `.png, .jpg, .jpeg, .webp, .tiff` | To BMP, Image to Bitmap | Quality; Background for transparency; Keep metadata; Batch zip |
| **Convert to TIFF** | *Beta* | `media` | `.png, .jpg, .jpeg, .webp, .bmp` | To TIFF, Image to TIF | Quality; Background for transparency; Keep metadata; Batch zip |
| **SVG to PNG** | `Soon` | `media` | `.svg` | Vector Rasterizer, Render SVG, SVG Exporter | Scale multiplier; Transparent canvas; Export PNG file |

#### Group: Optimizer (`img-optimizer`)
*Compress image files and optimize payload sizes.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Compress Image** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp, .bmp` | Image Compressor, Shrink Photo, Optimize Image | Quality; Target KB; Strip EXIF; Format; Batch folder; Before/after |
| **Resize during Compression** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp` | Scale and Compress, Batch Image Sizer | Compression level; Output format; Savings preview |

#### Group: Adjustments (`img-adjustments`)
*Brightness, contrast, saturation, and artistic filters.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Brightness & Contrast** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp, .bmp` | Image Brightness, Image Contrast, Tone Adjustment | Intensity slider; Reset to neutral; Export image |
| **Saturation & Vibrance** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp, .bmp` | Image Saturation, Vibrance, Color Intensity | Intensity slider; Reset to neutral; Export image |
| **Blur & Grayscale** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp, .bmp` | Photo Filters, Blur Image, Black and White | Intensity slider; Reset to neutral; Export image |

#### Group: Metadata (`img-metadata`)
*Inspect EXIF tags, GPS data, and camera settings.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **EXIF Viewer** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp, .tiff` | Read EXIF, Photo Metadata, Camera Info | Tag inspector; Export as JSON |
| **Remove EXIF** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp, .tiff` | Strip EXIF, Sanitize Photo, Privacy Scrubber | Tag inspector; Export as JSON |
| **Image Information** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp, .bmp, .tiff` | Image Specs, Resolution Info, Color Space | Tag inspector; Export as JSON |

#### Group: Image → PDF (`img-to-pdf-util`)
*Convert single or multiple images directly to PDF.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Multiple Images → PDF** | **Ready** | `media` | `.png, .jpg, .jpeg, .webp, .bmp, .tiff` | Images to PDF, Photo Album to PDF, Scan to PDF | Fit to page; Build PDF document |

#### Group: Composition & Layout (`img-compose`)
*Collages, contact sheets, and sprite sheet atlases.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Collage & Contact Sheet** | `Soon` | `media` | `.png, .jpg, .jpeg, .webp` | Photo Grid, Thumbnail Sheet, Contact Sheet Maker | Grid layout; Border gap & padding; Export contact sheet |
| **Sprite Sheet** | `Soon` | `media` | `.png, .jpg, .webp` | CSS Sprite Generator, Game Atlas Builder, Texture Packer | Packing algorithm; Generate CSS / JSON map; Export sprite sheet |

#### Group: Animation (`img-animation`)
*Animated GIF and WebP builder from frame sequences.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|

#### Group: Compare (`img-compare`)
*Side-by-side and interactive slider visual diffs.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Before/After Compare** | `Soon` | `media` | `.png, .jpg, .jpeg, .webp` | Image Diff, Slider Split Comparison, Photo Compare | Display mode; Synchronized zoom; Export comparison screenshot |

### 4. Data (Core Workspace)

*View, convert, transform, validate, and format tabular data.*

#### Group: Viewer (`data-viewer`)
*Table and tree view for CSV, JSON, XML, YAML, and XLSX.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **CSV Table Viewer** | **Ready** | `table` | `.csv, .tsv` | CSV Grid, Spreadsheet Viewer, Tabular View | Filter; Sort; Column toggle; Delimiter and encoding detect; Export view |
| **JSON Tree Viewer** | **Ready** | `text` | `.json` | JSON Inspector, Explore JSON, JSON Explorer | Search & filter; Expand / collapse; Export view |
| **XML Tree Viewer** | **Ready** | `text` | `.xml` | XML Explorer, XML Inspector, XML Hierarchy | Search & filter; Expand / collapse; Export view |
| **YAML Viewer** | **Ready** | `text` | `.yaml, .yml` | YAML Inspector, YAML Explorer | Search & filter; Expand / collapse; Export view |
| **XLSX Viewer** | **Ready** | `table` | `.xlsx, .xls` | Excel Preview, Spreadsheet Viewer, Workbook Viewer | Search & filter; Expand / collapse; Export view |

#### Group: Converter (`data-converter`)
*Bidirectional converters for CSV, JSON, XLSX, and YAML.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **CSV ↔ JSON** | **Ready** | `text` | `.csv, .json` | CSV to JSON, JSON to CSV | Parse options; Output format; Copy converted data |
| **CSV ↔ XLSX** | **Ready** | `file` | `.csv, .xlsx` | CSV to Excel, Excel to CSV | Parse options; Output format; Copy converted data |
| **JSON ↔ YAML** | **Ready** | `text` | `.json, .yaml, .yml` | JSON to YAML, YAML to JSON | Parse options; Output format; Copy converted data |
| **XML ↔ JSON** | **Ready** | `text` | `.xml, .json` | XML to JSON, JSON to XML | Parse options; Output format; Copy converted data |
| **NDJSON/TSV Converter** | `Soon` | `file` | `.ndjson, .jsonl, .tsv, .csv` | Newline JSON to TSV, JSON Lines Converter, JSONL to CSV | Target format; Flatten nested objects; Save converted dataset |

#### Group: Transformer (`data-transformer`)
*Sort, filter, deduplicate, and reshape tabular data.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Sort & Filter** | **Ready** | `table` | `.csv, .json` | Filter Table, Sort Rows, Query Data | Transformation rule; Case sensitivity; Apply transform |
| **Remove Duplicates** | **Ready** | `table` | `.csv, .json` | Deduplicate Data, Unique Rows, Drop Duplicates | Transformation rule; Case sensitivity; Apply transform |
| **Select & Rename Columns** | **Ready** | `table` | `.csv, .json` | Column Selector, Rename Headers, Projection | Transformation rule; Case sensitivity; Apply transform |
| **Format Values** | **Ready** | `table` | `.csv, .json` | Clean Cells, Format Columns, Transform Values | Transformation rule; Case sensitivity; Apply transform |
| **JSONPath Query** | `Soon` | `text` | `.json` | Filter JSON, JSON Path Evaluator, Query JSON | JSONPath expression; Highlight matching tree; Copy extracted JSON |
| **Join & Merge CSV** | `Soon` | `table` | `.csv, .tsv` | VLOOKUP Tool, Inner/Outer Join CSV, Merge Tables | Join type; Primary key columns; Export joined CSV |
| **Pivot & Group-by** | `Soon` | `table` | `.csv, .tsv` | Pivot Table, Aggregate Data, Group By Tool | Aggregation function; Group-by field; Export pivot table |
| **Split CSV** | `Soon` | `table` | `.csv, .tsv` | Divide CSV, Split by Column Value, Partition CSV | Split method; Repeat header row; Export split parts ZIP |
| **Encoding Fixer** | `Soon` | `file` | `.csv, .txt, .tsv` | Fix Mojibake, UTF-8 Repair, Convert Windows-1252 | Source encoding; Strip Byte Order Mark (BOM); Export clean UTF-8 |
| **JSON to TypeScript** | `Soon` | `text` | `.json` | Generate TS Interfaces, JSON to Types, TypeScript Typegen | Root interface name; Declaration style; Copy TypeScript definition |
| **JSON Schema Validator** | `Soon` | `text` | `.json` | Validate JSON Schema, Draft-07 Validator, Schema Lint | Schema specification; Detailed path pointer; Generate schema from payload |

#### Group: Validator (`data-validator`)
*Validate syntax and schema compliance for data formats.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **JSON Validation** | **Ready** | `text` | `.json` | JSON Linter, Verify JSON, JSON Syntax Check | Jump to error; Strict schema check |
| **XML Validation** | **Ready** | `text` | `.xml` | XML Linter, Verify XML, XML Check | Jump to error; Strict schema check |
| **CSV Validation** | **Ready** | `table` | `.csv` | CSV Linter, Verify CSV, CSV Integrity Check | Jump to error; Strict schema check |
| **YAML Validation** | **Ready** | `text` | `.yaml, .yml` | YAML Linter, Verify YAML, YAML Check | Jump to error; Strict schema check |

#### Group: Formatter (`data-formatter`)
*Prettify and indent JSON, XML, and YAML data.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **JSON Formatter** *(Secondary listing)* | **Ready** | `text` | `.json` | JSON Beautifier, Prettify JSON, JSON Indent | Indent size; Sort keys; Minify; Error line; Tree view |
| **XML Formatter** *(Secondary listing)* | **Ready** | `text` | `.xml` | XML Beautifier, Prettify XML, XML Indent | Indentation spacing; Sort dictionary keys; Copy formatted output |
| **YAML Formatting** | **Ready** | `text` | `.yaml, .yml` | YAML Beautifier, Prettify YAML, Indent YAML | Indentation spacing; Sort dictionary keys; Copy formatted output |

#### Group: Query & SQL (`data-query`)
*Run local SQL and JSONPath selectors over tables.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **SQL on CSV** | `Soon` | `table` | `.csv, .tsv` | Query CSV with SQL, In-memory SQLite, CSV Database | SQL query editor; Auto-detect types; Export query result |

#### Group: Compare (`data-compare`)
*Side-by-side structural differences in JSON datasets.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **JSON Diff** | `Soon` | `text` | `.json` | Semantic JSON Compare, Deep Object Diff, JSON Delta | Ignore key ordering; Diff tree view; Export RFC 6902 patch |

### 5. Text (Core Workspace)

*Transform, clean, analyze, encode, and compare text.*

#### Group: Transformer (`text-transformer`)
*Case conversions, line sorting, reversing, and deduplication.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Case Conversion** | **Ready** | `text` | `.txt, .md, .log` | Change Case, camelCase Converter, Title Case | Case / direction mode; Transform text; Copy result |
| **Reverse Text** | **Ready** | `text` | `.txt, .md, .log` | Invert Text, Mirror Text, Backwards Text | Case / direction mode; Transform text; Copy result |
| **Sort Lines** | **Ready** | `text` | `.txt, .md, .log` | Line Sorter, Alphabetize Text, Order Lines | Case / direction mode; Transform text; Copy result |
| **Deduplicate Lines** | **Ready** | `text` | `.txt, .md, .log` | Unique Lines, Remove Duplicate Lines, Line Dedup | Case / direction mode; Transform text; Copy result |
| **Extract Emails/URLs/Numbers** | `Soon` | `text` | `.txt, .md, .log, .html` | Regex Pattern Extractor, Harvest Links & Emails, Entity Scraper | Target entity; Deduplicate matches; Copy extracted items |
| **Find Duplicate Paragraphs** | `Soon` | `text` | `.txt, .md` | Deduplicate Text, Repeated Lines Finder, Paragraph Dedupe | Similarity threshold; Case-insensitive matching; Deduplicate text |
| **Slugify** | `Soon` | `text` | `.txt` | URL Slug Generator, Kebab Case String, Clean URL Title | Separator character; Transliterate unicode; Copy slug |
| **Natural Sort** | `Soon` | `text` | `.txt` | Alphanumeric Sort, Human Order Sort, Natural Order | Sort direction; Strip blank lines; Apply natural sort |
| **Text to Table** | `Soon` | `text` | `.txt` | Convert Delimited Text, Text to Markdown Table, Make Table | Column delimiter; Output format; Copy table code |
| **Multi-file Regex Replace** | `Soon` | `file` | `.txt, .md, .log, .json` | Global Regex Search, Sed Multi-file, Workspace Regex | Support capture groups; Preview diffs; Save all modified files |

#### Group: Cleaner (`text-cleaner`)
*Remove extra spaces, blank lines, and normalize line endings.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Remove Extra Spaces** | **Ready** | `text` | `.txt, .md, .log` | Trim Spaces, Strip Whitespace, Single Space | Cleaning scope; Clean buffer |
| **Remove Blank Lines** | **Ready** | `text` | `.txt, .md, .log` | Strip Empty Lines, Collapse Blank Lines | Cleaning scope; Clean buffer |
| **Invisible Characters Cleanup** | **Ready** | `text` | `.txt, .md, .log` | Strip Zero Width, Remove Control Chars, Clean Hidden Chars | Cleaning scope; Clean buffer |
| **Line-Ending Normalization** | **Ready** | `text` | `.txt, .md, .log` | CRLF to LF, LF to CRLF, Normalize Newlines | Cleaning scope; Clean buffer |

#### Group: Analyzer (`text-analyzer`)
*Word count, character count, and reading time estimation.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Text Statistics** | **Ready** | `text` | `.txt, .md, .log` | Word Counter, Character Counter, Text Metrics | Live metric counter; Copy metrics report |
| **Reading Time** | **Ready** | `text` | `.txt, .md, .log` | Reading Duration, Speech Duration, WPM Calculator | Live metric counter; Copy metrics report |
| **Word Frequency** | `Soon` | `text` | `.txt, .md` | Text Statistics, N-gram Analyzer, Word Counter | Filter stop words; N-gram phrase length; Export frequency table |

#### Group: Encoder / Decoder (`text-encoder`)
*Base64, URL encoding, HTML entities, and Unicode inspection.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Base64** *(Secondary listing)* | **Ready** | `text` | `.txt, .bin, *` | Base64 Encoder, Base64 Decoder, B64 Convert | Encode / Decode; URL-safe variant; Copy output |
| **URL Encoding** *(Secondary listing)* | **Ready** | `text` | `.txt, *` | Percent Encoding, URL Decoder, Escape URI | Encode / Decode; URL-safe variant; Copy output |
| **HTML Encoding** | **Ready** | `text` | `.txt, .html` | Escape HTML, HTML Entities, Unescape HTML | Encode / Decode; URL-safe variant; Copy output |
| **Unicode Tool** | **Ready** | `text` | `.txt` | Code Point Lookup, Unicode Inspector, UTF-8 Bytes | Encode / Decode; URL-safe variant; Copy output |

#### Group: Compare (`text-compare`)
*Side-by-side and unified text diff.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Text Diff** | **Ready** | `text` | `.txt, .md, .log, .code` | Diff Checker, Compare Text, Side-by-side Diff | Side-by-side / Inline; Ignore case differences |

#### Group: Generators (`text-generator`)
*Generate filler text, placeholder copy, and dummy prose.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Lorem Ipsum** | `Soon` | `text` | `.txt` | Dummy Text Generator, Placeholder Copy, Filler Text | Unit type; Wrap in <p> tags; Copy generated text |

### 6. Developer (Core Workspace)

*Format code, encode/decode, generate tokens, test regex, and web tools.*

#### Group: Formatter (`dev-formatter`)
*Beautify JSON, HTML, CSS, JavaScript, XML, and SQL code.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **JSON Formatter** | **Ready** | `text` | `.json` | JSON Beautifier, Prettify JSON, JSON Indent | Indent size; Sort keys; Minify; Error line; Tree view |
| **HTML Formatter** | **Ready** | `text` | `.html, .htm` | HTML Beautifier, Prettify HTML, Indent HTML | Indentation spacing; Minify code; Copy formatted code |
| **CSS Formatter** | **Ready** | `text` | `.css, .scss` | CSS Beautifier, Prettify CSS, Clean CSS | Indentation spacing; Minify code; Copy formatted code |
| **JavaScript Formatter** | **Ready** | `text` | `.js, .jsx, .ts, .tsx` | JS Beautifier, Prettify JavaScript, Clean JS | Indentation spacing; Minify code; Copy formatted code |
| **XML Formatter** | **Ready** | `text` | `.xml` | XML Beautifier, Prettify XML, XML Indent | Indentation spacing; Minify code; Copy formatted code |
| **SQL Formatter** | **Ready** | `text` | `.sql` | SQL Beautifier, Prettify SQL, SQL Query Cleaner | Indentation spacing; Minify code; Copy formatted code |

#### Group: Encode / Decode (`dev-encode`)
*Base64, URL encoding, JWT inspector, and URL components.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Base64** | **Ready** | `text` | `.txt, .bin, *` | Base64 Encoder, Base64 Decoder, B64 Convert | Encode / Decode; Inspect claims; Copy payload JSON |
| **URL Encoding** | **Ready** | `text` | `.txt, *` | Percent Encoding, URL Decoder, Escape URI | Encode / Decode; Inspect claims; Copy payload JSON |
| **JWT Inspector** | **Ready** | `text` | `.txt, .json` | JWT Decoder, Token Inspector, JSON Web Token | Encode / Decode; Inspect claims; Copy payload JSON |
| **URL Components** | **Ready** | `text` | `.txt` | URL Breakdown, Parse URI, URL Segments | Encode / Decode; Inspect claims; Copy payload JSON |

#### Group: Generators (`dev-generators`)
*Generate UUIDs, random strings, timestamps, and test data.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **UUID Generator** | **Ready** | `text` | `*` | GUID Generator, UUID v4, Generate ID | Quantity count; Character complexity; Regenerate |
| **Random String** | **Ready** | `text` | `*` | Password Generator, Random Token, Secret Generator | Quantity count; Character complexity; Regenerate |
| **Timestamp** | **Ready** | `text` | `*` | Epoch Converter, Unix Timestamp, Current Epoch | Quantity count; Character complexity; Regenerate |
| **Random Number** | **Ready** | `text` | `*` | Random Int, RNG, Dice Roller | Quantity count; Character complexity; Regenerate |
| **Test Data** | **Ready** | `text` | `.json, .csv` | Mock Data Generator, Faker Data, Sample Data | Quantity count; Character complexity; Regenerate |
| **QR Generator** | `Soon` | `media` | `.png, .svg` | Create QR Code, Barcode 2D, QR Code Maker | Error correction; Quiet zone margin; Export vector SVG |
| **QR Scanner** | `Soon` | `media` | `.png, .jpg, .webp` | Decode QR Code, Read QR Image, QR Decoder | Input source; Detect URL action; Copy decoded payload |
| **Barcode Generator** | `Soon` | `media` | `.png, .svg` | Code128 Generator, EAN-13 Maker, 1D Barcode | Symbology format; Show text label; Export vector SVG |
| **chmod Calculator** | `Soon` | `calculator` | `.txt` | Linux Permissions, Octal chmod, Permission Matrix | Permission matrix; Special bits (SUID/SGID/Sticky); Copy chmod command |
| **User-Agent Parser** | `Soon` | `text` | `.txt` | Inspect UA, Browser & OS Detector, UA String Analyzer | Category breakdown; Use my current browser UA; Export structured JSON |
| **.gitignore Generator** | `Soon` | `text` | `.gitignore, .txt` | Create Gitignore, Git Ignore Templates, Repo Ignored Files | Technology presets; Custom override rules; Download .gitignore |

#### Group: Regex Tester (`dev-regex`)
*Interactive regular expression matcher with flag controls.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Regex Tester** | **Ready** | `text` | `.txt` | RegEx Checker, Regular Expressions, Regex Matcher | Regex flags (g, i, m, s); Capture groups inspector; Replacement preview |

#### Group: Web Utilities (`dev-web`)
*URL parser, HTTP headers, query string analyzer, and status codes.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **URL Parser** | **Ready** | `text` | `.txt` | URI Inspector, Query Parser, URL Analyzer | Query param editor; Copy parsed JSON |
| **HTTP Headers** | **Ready** | `text` | `.txt` | Header Parser, HTTP Request Headers, CORS Headers | Query param editor; Copy parsed JSON |
| **Query String** | **Ready** | `text` | `.txt, .json` | URL Search Params, Query Builder, Query to JSON | Query param editor; Copy parsed JSON |
| **HTTP Status Reference** | **Ready** | `text` | `*` | HTTP Codes, Status 200 404 500, Status Code Guide | Query param editor; Copy parsed JSON |

#### Group: Utilities & Units (`dev-utilities`)
*Cron scheduling, permission calculators, and typography math.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Cron Explainer** | `Soon` | `text` | `.txt` | Crontab Helper, Human Cron Description, Cron Parser | Execution forecast; Schedule timezone; Copy explanation |
| **px/rem Converter** | `Soon` | `calculator` | `.txt` | Rem to Px Converter, CSS Unit Calculator, Fluid Typography | Base font size (px); Fluid clamp() builder; Copy CSS snippet |
| **Hash & HMAC** *(Secondary listing)* | `Soon` | `text` | `.txt` | HMAC Generator, Crypto Hash, Message Digest | Hash algorithm; HMAC secret key; Copy hexadecimal hash |

#### Group: Environment Compare (`dev-compare`)
*Diff environment configuration files and audit secrets.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **.env Diff** | `Soon` | `text` | `.env, .env.example, .txt` | Environment Variable Diff, Compare .env, Missing Env Keys | Mask secret values; Missing keys only; Generate synced .env |

### 7. Calculator & Converters (Core Workspace)

*Perform arithmetic, scientific, math, engineering, and unit conversions.*

#### Group: General (`calc-general`)
*Basic arithmetic, percentage, discount, and ratio calculations.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Basic Calculator** | **Ready** | `calculator` | `*` | Desktop Calculator, Standard Calculator, Math Calculator | Calculation mode; Copy result; Decimal precision |
| **Percentage** | **Ready** | `calculator` | `*` | Percent Calculator, Percentage Change, Percent Diff | Calculation mode; Copy result; Decimal precision |
| **Discount** | **Ready** | `calculator` | `*` | Sale Price, Discount Calculator, Savings Calculator | Calculation mode; Copy result; Decimal precision |
| **Ratio & Proportion** | **Ready** | `calculator` | `*` | Proportion Solver, Ratio Simplifier, Scale Ratio | Calculation mode; Copy result; Decimal precision |

#### Group: Scientific (`calc-scientific`)
*Trigonometry, logarithms, powers, and universal physical constants.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Scientific Calculator** | **Ready** | `calculator` | `*` | Trig Calculator, Log Calculator, Advanced Calculator | Calculation mode; Copy result; Decimal precision |
| **Constants** | **Ready** | `calculator` | `*` | Physical Constants, Math Constants, Speed of Light Pi | Calculation mode; Copy result; Decimal precision |

#### Group: Math (`calc-math`)
*Fraction simplifier, statistics metrics, and equation solver.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Fractions** | **Ready** | `calculator` | `*` | Fraction Calculator, Simplify Fraction, Mixed Numbers | Calculation mode; Copy result; Decimal precision |
| **Statistics** | **Ready** | `calculator` | `*` | Mean Median Mode, Standard Deviation, Stats Calculator | Calculation mode; Copy result; Decimal precision |
| **Equations** | **Ready** | `calculator` | `*` | Quadratic Solver, Linear Equation, Algebra Solver | Calculation mode; Copy result; Decimal precision |

#### Group: Engineering (`calc-engineering`)
*Ohm's law and electrical power calculations.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Ohm's Law** | **Ready** | `calculator` | `*` | Voltage Current Resistance, Circuit Calculator, V=IR | Calculation mode; Copy result; Decimal precision |
| **Electrical Power** | **Ready** | `calculator` | `*` | Watt Calculator, kWh Calculator, Energy Cost Calculator | Calculation mode; Copy result; Decimal precision |

#### Group: Units (`calc-units`)
*Multi-category offline unit converter.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Unit Converter** | **Ready** | `calculator` | `*` | Metric Imperial, Measurement Converter, All Units | Calculation mode; Copy result; Decimal precision |

#### Group: Date & Time (`calc-date-time`)
*Calendar calculations, durations, age, timezone conversion, and timers.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Age Calculator** | `Soon` | `calculator` | `.txt` | Chronological Age, Birthday Calculator, Exact Age | Date of birth; Next birthday countdown; Copy age summary |
| **Date Difference** | `Soon` | `calculator` | `.txt` | Days Between Dates, Duration Between Dates, Date Span | Include end date (+1); Units breakdown; Copy duration |
| **Add/Subtract Dates** | `Soon` | `calculator` | `.txt` | Date Shift, Future Date Calculator, Offset Date | Operation mode; Skip weekend days; Copy resulting date |
| **Business Days** | `Soon` | `calculator` | `.txt` | Working Days Calculator, Exclude Holidays, Business Calendar | Custom holiday list; Workweek configuration; Copy working days total |
| **Time Duration** | `Soon` | `calculator` | `.txt` | Time Calculator, Add Hours and Minutes, Time Sheet Total | Time card list; Decimal hours conversion; Copy total time |
| **Timezone Converter** | `Soon` | `calculator` | `.txt` | World Clock Converter, Meeting Time Planner, Timezone Matrix | Saved cities & zones; Highlight overlapping work hours; Copy meeting invite slot |
| **Timer & Stopwatch** | `Soon` | `calculator` | `.txt` | Countdown Timer, Lap Stopwatch, Precision Chronometer | Tool mode; Audio notification chime; Export lap history |
| **Currency (Manual Rates)** | `Soon` | `calculator` | `.txt` | Offline Currency Converter, Exchange Rate Matrix, Manual Forex | Exchange rates table; Invert currency pair; Copy converted amount |
| **Number to Words** | `Soon` | `calculator` | `.txt` | Spell Out Numbers, Check Words Generator, Currency in Words | Number style; Currency denomination; Copy spelled words |

#### Group: Finance (`calc-finance`)
*Loan EMI, amortization schedules, compound interest, SIP, GST, and profit margins.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Loan/EMI Calculator** | `Soon` | `calculator` | `.txt` | Mortgage Calculator, Monthly Payment EMI, Car Loan Calculator | Loan input fields; Breakdown ratio; Copy loan summary |
| **Amortization Schedule** | `Soon` | `table` | `.csv, .tsv` | Repayment Schedule, Loan Amortization Table, Prepayment Simulator | Extra prepayment simulation; Annual summary view; Export schedule CSV |
| **Compound Interest** | `Soon` | `calculator` | `.txt` | Investment Growth, Compounding Calculator, Future Value | Compounding frequency; Regular monthly contribution; Copy future value summary |
| **SIP Calculator** | `Soon` | `calculator` | `.txt` | Systematic Investment Plan, Mutual Fund SIP, DCA Calculator | SIP parameters; Adjust for inflation; Copy returns summary |
| **GST/VAT Calculator** | `Soon` | `calculator` | `.txt` | Sales Tax Calculator, Value Added Tax, Goods & Services Tax | Calculation mode; Preset tax brackets; Copy tax breakdown |
| **Margin & Markup** | `Soon` | `calculator` | `.txt` | Gross Margin, Markup Percentage, Profit Margin Calculator | Solve for variable; Gross profit currency display; Copy pricing summary |
| **Tip Split** | `Soon` | `calculator` | `.txt` | Bill Splitter, Restaurant Tip Calculator, Split Check | Tip percentage; Round per-person up; Copy split bill |

#### Group: Health (`calc-health`)
*Body Mass Index and basal metabolic rate expenditure calculations.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **BMI Calculator** | `Soon` | `calculator` | `.txt` | Body Mass Index, Healthy Weight Calculator, BMI Index | Measurement units; WHO category gauge; Copy BMI summary |
| **Calorie/BMR Calculator** | `Soon` | `calculator` | `.txt` | Basal Metabolic Rate, Daily Calorie Needs, TDEE Calculator | Estimation formula; Daily activity factor; Copy calorie goals |

#### Group: Everyday (`calc-everyday`)
*Base conversions, Roman numerals, and written number word phrasing.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Number Base** | `Soon` | `calculator` | `.txt` | Radix Converter, Hex to Dec, Binary to Decimal | Multi-radix view; Format with digit separators; Copy number representation |
| **Roman Numerals** | `Soon` | `calculator` | `.txt` | Arabic to Roman, Roman to Decimal, Ancient Numerals | Conversion mode; Vinculum bar for >3,999; Copy converted numeral |

### 8. Files & Archives (Core Workspace)

*Rename, analyze, checksum, compare files, and manage archives.*

#### Group: File Operations (`files-operations`)
*Batch renaming, file type inspection, and metadata metrics.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Batch Rename** | **Ready** | `file` | `*` | Bulk Rename, File Renamer, Number Files | Pattern; Numbering; Case conversion; Regex; Live preview; Undo |
| **File Type Detection** | **Ready** | `file` | `*` | MIME Detector, Magic Bytes, Format Identifier | Hash algorithm (SHA256, MD5); Export checksums; Copy hash |
| **File Metadata & Size** | **Ready** | `file` | `*` | File Attributes, File Size Inspector, Disk Metrics | Hash algorithm (SHA256, MD5); Export checksums; Copy hash |
| **Organize by Type/Date** | `Soon` | `file` | `*` | Auto Folder Sorter, File Organizer, Sort by Year Month | Organization rule; Dry run preview; Execute file organization |
| **Split & Join Large Files** | `Soon` | `file` | `*` | File Chunk Splitter, HJSplit Alternative, Recombine Files | Operation; Target chunk size; Generate verification checksums |
| **Folder to Text Tree** | `Soon` | `file` | `*` | ASCII Directory Tree, Project Folder Diagram, tree Command Generator | Diagram style; Max folder depth; Copy tree diagram |

#### Group: File Analyzer (`files-analyzer`)
*Checksum generator and byte-level file analysis.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **File Analyzer** | **Ready** | `file` | `*` | Checksum Generator, Hash Calculator, SHA256 MD5 Check | Hash algorithm (SHA256, MD5); Export checksums; Copy hash |

#### Group: Duplicate Finder (`files-duplicates`)
*Detect identical files using cryptographic content hashes.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Duplicate Finder** | **Ready** | `file` | `*` | Find Duplicates, Duplicate Cleaner, Hash Compare | Hash algorithm (SHA256, MD5); Export checksums; Copy hash |

#### Group: File Comparison (`files-comparison`)
*Binary and checksum comparison between files.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **File Comparison** | **Ready** | `file` | `*` | Binary Compare, File Hash Compare, Verify Equality | Hash algorithm (SHA256, MD5); Export checksums; Copy hash |
| **Folder Compare** | `Soon` | `file` | `*` | Directory Diff, Compare Folders, Folder Tree Comparison | Comparison criteria; Hide identical files; Export diff manifest |

#### Group: Archive Manager (`files-archives`)
*Create, inspect, and extract ZIP and TAR.GZ archives.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Create ZIP** | **Ready** | `file` | `*` | Compress to ZIP, Make ZIP, Zip Files | Archive compression; Search archive tree; Extract archive |
| **Extract ZIP** | **Ready** | `file` | `.zip` | Unzip, Extract Archive, Unpack ZIP | Archive compression; Search archive tree; Extract archive |
| **Inspect ZIP** | **Ready** | `file` | `.zip` | View ZIP Contents, List ZIP, Explore ZIP | Archive compression; Search archive tree; Extract archive |
| **TAR & GZIP** | **Ready** | `file` | `.tar, .gz, .tgz, .tar.gz` | Tarball Manager, Extract Tar Gz, Create Tarball | Archive compression; Search archive tree; Extract archive |
| **7z Extract** | `Soon` | `file` | `.7z` | Unpack 7z Archive, 7-Zip Reader, Extract 7z | Inspect archive list; Archive password; Extract to folder |

### 9. Security & Privacy (More Workspace)

*Local encryption, password generators, secure shredding, and zero-knowledge privacy tools.*

#### Group: Credentials & Keys (`sec-credentials`)
*Generate high-entropy secrets, master passphrases, and cryptographic key pairs.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Password Generator** | `Soon` | `calculator` | `.txt` | Create Secure Password, Random Password Generator, Entropy Generator | Password length; Character complexity; Copy & auto-clear |
| **Passphrase Generator** | `Soon` | `calculator` | `.txt` | Diceware Generator, Memorable Passphrase, Multi-word Password | Word count; Word delimiter; Copy passphrase |
| **Password Strength Checker** | `Soon` | `text` | `.txt` | Test Password Strength, Crack Time Estimator, zxcvbn Checker | Threat model scenario; Pattern weakness warnings; Wipe input immediately |
| **TOTP Generator** | `Soon` | `calculator` | `.txt` | 2FA Code Generator, Authenticator Helper, TOTP Token | Algorithm; 30-second epoch indicator; Copy 6-digit code |
| **PEM/Certificate Decoder** | `Soon` | `text` | `.crt, .pem, .cer, .txt` | X.509 Certificate Decoder, Inspect SSL Cert, PEM Parser | Attribute view; Expiry status indicator; Export certificate JSON |
| **Key Pair Generator** | `Soon` | `text` | `.pem, .pub` | RSA Key Generator, Ed25519 Keygen, SSH Key Pair | Key algorithm; Passphrase encryption; Download key pair ZIP |

#### Group: Encryption & Hashing (`sec-encryption`)
*Local file encryption, cryptographic hash calculation, and checksum matching.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Hash & HMAC** | `Soon` | `text` | `.txt` | HMAC Generator, Crypto Hash, Message Digest | Hash algorithm; HMAC secret key; Copy hexadecimal hash |
| **File Encrypt/Decrypt** | `Soon` | `file` | `*` | AES-256 File Locker, Password Encrypt File, Decrypt Attachment | Operation; Argon2id key derivation; Save processed file |
| **Checksum Verifier** | `Soon` | `file` | `*` | Verify File Hash, Integrity Checker, Compare Checksum | Expected checksum; Hash algorithm; Copy computed checksum |

#### Group: Data Sanitization & Shredding (`sec-sanitization`)
*Multi-pass secure shredding, bulk metadata stripping, and sensitive text redaction.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Secure Shred** | `Soon` | `file` | `*` | File Eraser, DoD Overwrite, Permanent Delete | Wipe standard; Backup to Toiloki Trash; Confirm & Shred File |
| **Metadata Scrubber** | `Soon` | `file` | `.pdf, .jpg, .png, .docx, .xlsx` | Bulk Exif Stripper, Clean Document Metadata, Sanitize Files | Inspect found tags; Strip GPS locations only; Export clean ZIP |
| **Text Redaction Helper** | `Soon` | `text` | `.txt, .md, .log` | PII Masker, Anonymize Text, Redact Sensitive Information | PII categories; Masking style; Copy sanitized text |

### 10. Audio & Video (More Workspace)

*Local audio conversion, video clipping, waveform trimming, and media format optimization.*

#### Group: Audio Tools (`media-audio`)
*Encode, trim, merge, fade, and edit metadata on local audio tracks.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Audio Converter** | `Soon` | `media` | `.mp3, .wav, .flac, .aac, .ogg, .m4a` | Convert MP3, WAV to MP3, FLAC Converter | Target format; Bitrate quality; Batch convert album |
| **Audio Trimmer** | `Soon` | `media` | `.mp3, .wav, .aac, .ogg, .m4a` | Audio Cut, Ringtone Maker, Trim Sound Clip | Waveform scrub view; Fade in & fade out; Export trimmed audio |
| **Audio Joiner** | `Soon` | `media` | `.mp3, .wav, .flac, .m4a` | Merge Audio Tracks, Combine MP3s, Concatenate Audio | Crossfade transition; Track playback sequence; Export concatenated audio |
| **Volume & Fade** | `Soon` | `media` | `.mp3, .wav, .flac, .m4a` | Boost Audio Volume, Normalize Audio, Audio Gain | Gain adjustment (dB); Peak normalization; Save adjusted audio |
| **Audio Metadata** | `Soon` | `media` | `.mp3, .flac, .m4a` | ID3 Tag Editor, Music Tag Editor, Edit Song Info | Tag fields editor; Cover art thumbnail; Write ID3 tags |

#### Group: Video Tools (`media-video`)
*Compress video sizes, trim scenes, extract audio, and create animated GIFs.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Video Converter** | `Soon` | `media` | `.mp4, .webm, .mkv, .mov, .avi` | Transcode Video, MP4 to WebM, Video Encoder | Video container; Resolution preset; Batch transcode queue |
| **Video Compressor** | `Soon` | `media` | `.mp4, .webm, .mkv, .mov` | Shrink Video Size, Target MB Compressor, Video Optimizer | Target file size (MB); CRF visual quality; Export compressed video |
| **Video Trimmer** | `Soon` | `media` | `.mp4, .webm, .mkv, .mov` | Cut Video Scene, Lossless Video Cut, Fast Video Trim | Keyframe visual timeline; Lossless stream copy (instant); Save trimmed scene |
| **Video to GIF** | `Soon` | `media` | `.mp4, .webm, .mov` | Create GIF from Video, Video GIF Maker, Animated GIF | Frame rate; Color palette optimization; Export GIF animation |
| **Extract Audio** | `Soon` | `media` | `.mp4, .webm, .mkv, .mov, .avi` | Rip Video Audio, Video to MP3, Extract Soundtrack | Output audio format; Direct stream extract; Batch rip video list |
| **Frame Extractor** | `Soon` | `media` | `.mp4, .webm, .mkv, .mov` | Video Still Capture, Extract Frames to PNG, Video Screenshots | Extraction mode; Frame image format; Download frames ZIP |
| **Subtitle Shift & Convert** | `Soon` | `text` | `.srt, .vtt, .ass, .txt` | Sync Subtitles, SRT to VTT, Subtitle Time Offset | Time offset (milliseconds); Target subtitle format; Export synced subtitle |

### 11. Network & Web (More Workspace)

*Local networking utilities, URL composition, CIDR calculators, and web metadata generators.*

#### Group: Web & URL (`net-url-web`)
*Build URLs, look up MIME types, compose cURL requests, and generate web tags.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **URL Builder** | `Soon` | `text` | `.txt` | Query String Builder, UTM Tag Generator, Compose URL | UTM campaign parameters; URI encode query values; Copy assembled URL |
| **MIME Lookup** | `Soon` | `text` | `.txt` | Content-Type Lookup, File Extension to MIME, MIME Directory | Extension or MIME filter; Category groupings; Copy Content-Type header |
| **cURL Builder** | `Soon` | `text` | `.txt` | Compose cURL, cURL Command Maker, HTTP Request Builder | HTTP method; Authentication header; Copy cURL command |
| **robots.txt & Sitemap Generator** | `Soon` | `text` | `.txt, .xml` | Create robots.txt, XML Sitemap Maker, Search Engine Rules | Target file; Crawl delay directive; Save file to disk |
| **Meta Tag & Open Graph Generator** | `Soon` | `text` | `.html, .txt` | Open Graph Generator, SEO Meta Tags, Twitter Card Maker | Social card preview; Include JSON-LD Schema.org; Copy <head> tags |

#### Group: IP & Network Tools (`net-ip-network`)
*Subnet calculations, local port listeners, DNS record syntax, and MAC lookups.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Subnet/CIDR** | `Soon` | `calculator` | `.txt` | CIDR Calculator, IPv4 Subnetting, IP Address Range | CIDR prefix length; Binary representation; Copy subnet summary |
| **Local Port Check** | `Soon` | `calculator` | `.txt` | Check Open Port, Localhost Port Scanner, Port Conflict Finder | Port number; Common dev ports; Check port status |
| **DNS Record Helper** | `Soon` | `text` | `.txt` | DNS Zone Syntax, SPF Record Maker, DKIM Record Helper | DNS record type; TTL (Time To Live); Copy zone file entry |
| **IP Converter** | `Soon` | `calculator` | `.txt` | IP to Decimal, Hex IP Converter, IPv4 to IPv6 | Representation sync; RFC 1918 private check; Copy converted notation |
| **MAC Vendor Lookup** | `Soon` | `text` | `.txt` | OUI Lookup, MAC Address Manufacturer, NIC Vendor | MAC address parser; Multicast / Broadcast bit; Copy manufacturer details |

### 12. Color & Design (More Workspace)

*Palette generation, WCAG contrast verification, SVG optimization, and design token pipelines.*

#### Group: Color Utilities (`design-color`)
*Convert color models, check accessibility, build gradients, and simulate color blindness.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Color Converter** | `Soon` | `calculator` | `.txt` | HEX to RGB, HSL Converter, CMYK Print Converter | Color spaces matrix; Alpha transparency (0-100%); Copy CSS color code |
| **Palette Generator** | `Soon` | `media` | `.txt, .json, .css` | Color Scheme Generator, Color Harmony Maker, Theme Palette | Color harmony rule; Luminance shades and tints; Export CSS variables |
| **Contrast Checker** | `Soon` | `calculator` | `.txt` | WCAG Accessibility Checker, Contrast Ratio Tool, Color Accessibility | Target compliance; Auto-adjust to pass; Copy audit badge |
| **Gradient Generator** | `Soon` | `media` | `.css, .txt` | CSS Gradient Maker, Linear Gradient Generator, Radial Background | Gradient type; Multi-stop slider; Copy CSS gradient rule |
| **Color Blindness Simulator** | `Soon` | `media` | `.png, .jpg, .jpeg, .webp` | Daltonism Simulator, A11y Vision Filter, Color Deficiency Test | Deficiency filter; Side-by-side view; Export simulated picture |
| **Image Palette Extractor** | `Soon` | `media` | `.png, .jpg, .jpeg, .webp` | Extract Colors from Photo, Image Swatches, Dominant Color Finder | Number of swatches; Sort by visual weight; Export palette swatch data |

#### Group: Design Assets & CSS (`design-assets`)
*Optimize vector graphics, build layered shadows, format icons, and generate design tokens.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **CSS Shadow Generator** | `Soon` | `calculator` | `.css, .txt` | Box Shadow Maker, Smooth Layered Shadows, Elevation Generator | Layer count; Inset shadow; Copy box-shadow CSS |
| **SVG Optimizer** | `Soon` | `text` | `.svg` | SVGO Web UI, Minify SVG, Clean Vector Artwork | Coordinate precision; Strip comments & editor metadata; Export optimized SVG |
| **Favicon/Icon Generator** | `Soon` | `media` | `.png, .jpg, .svg` | Favicon Maker, App Icon Pack, Generate .ico | Included resolutions; Generate HTML link tags; Download Favicon ZIP pack |
| **Font Inspector** | `Soon` | `media` | `.ttf, .otf, .woff, .woff2` | Inspect Typography, Font Glyph Viewer, WOFF2 Inspector | Glyph grid browser; Size waterfall test; Export font metrics JSON |
| **Type Scale Calculator** | `Soon` | `calculator` | `.css, .txt` | Modular Scale, Typography Ladder, Font Hierarchy Scale | Modular ratio interval; Base body size; Copy type scale CSS variables |
| **Design Token Exporter** | `Soon` | `text` | `.json, .css, .js` | Export Design Tokens, CSS Variables Generator, Tailwind Config Exporter | Export syntax target; Variable prefix; Download tokens file |

### 13. System & Maintenance (More Workspace)

*Inspect disk usage trees, find duplicate bloat, clean temporary caches, and review system configuration.*

#### Group: Disk & Storage Tools (`sys-storage`)
*Visualize storage usage, locate enormous files, and purge temp folders with restorable safety.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **Disk Usage Tree** | `Soon` | `file` | `*` | SpaceMonger Alternative, Folder Size Visualizer, Storage Analyzer | Visualization style; Minimum size threshold; Export storage report |
| **Large File Finder** | `Soon` | `file` | `*` | Find Big Files, Huge File Scanner, Disk Space Recovery | Size threshold; Sort by last modified date; Copy paths list |
| **Temp & Cache Cleaner** | `Soon` | `file` | `*` | Clean Temp Files, Purge Build Cache, System Cleaner | Cleanup categories; Safety backup to Toiloki Trash; Preview & Confirm Cleanup |
| **Empty Folder Cleaner** | `Soon` | `file` | `*` | Remove Empty Folders, Delete Zero-byte Directories, Clean Empty Trees | Scan depth; Preserve hidden dot-folders; Confirm & Purge Empty Folders |

#### Group: System Diagnostics & Environment (`sys-diagnostics`)
*Read-only inspection of host specs, environment variables, startup tasks, and active processes.*

| Utility | Status | Template | Accepted Formats | Aliases | Key Features |
|---------|--------|----------|------------------|---------|--------------|
| **System Info Report** | `Soon` | `text` | `.txt, .json` | Computer Specs, Hardware Diagnostics, System Information | Specification categories; Mask IP and MAC addresses; Copy diagnostic report |
| **Environment Variables Viewer** | `Soon` | `text` | `.txt` | Inspect PATH, System Environment Variables, Env Key Viewer | PATH directory table; Search variable key/value; Copy variable value |
| **Hosts File Viewer** | `Soon` | `text` | `.txt` | Inspect hosts File, DNS Hosts Entries, Localhost Mappings | Active mappings table; Include commented entries (#); Copy hosts content |
| **Process Viewer (Read-only)** | `Soon` | `table` | `.txt` | Task Manager Lite, Running Processes List, Memory Usage Table | Sort by resource usage; Filter out OS kernel tasks; Export process snapshot |
| **Startup Items Viewer** | `Soon` | `table` | `.txt` | Startup Apps List, Windows Run Keys, Startup Inspection | Source location; Highlight broken shortcuts; Export startup report |
| **Clipboard History** | `Soon` | `text` | `.txt` | Local Clipboard Buffer, Clipboard Manager, Past Snippets | Search history; Purge clipboard buffer; Pin persistent snippet |

