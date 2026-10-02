# Toiloki Suite Complete Tool Inventory

**Hierarchy**: `Workspace > Group > Tool`  
**Total Registered Catalog Listings**: 145  
**Total Unique Tool Definitions**: 137  
**Sidebar Tooltip Status**: `121 ready - 8 beta - 16 coming soon` (reflects 145 raw catalog listings)  
**Unique Tool Status**: `117 ready - 8 beta - 12 soon` (137 unique tools, with 4 PDF placeholder converters routed to 4 working Documents converters)

---

## 1. Summary Statistics

### (1) Totals by Status (Unique Tools vs Catalog Listings)
| Status | Unique Tools | Catalog Listings | Percentage (Unique) | Description |
| :--- | :---: | :---: | :---: | :--- |
| **Ready** | 117 | 125 | 85.4% | Fully implemented offline desktop utilities with active handlers |
| **Beta** | 8 | 8 | 5.8% | Functional utilities with partial capabilities or preliminary UI |
| **Soon** | 12 | 12 | 8.8% | Coming soon utilities displaying clean empty state ("Not available yet") |
| **Total** | **137** | **145** | **100.0%** | Catalog entries include 8 cross-listed utilities via `alsoListedIn` |

### (2) Unique vs Listing Totals by Workspace
| Workspace | Ready (Listings) | Beta | Soon | Total Listings | Unique Tools |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **PDF** | 18 | 6 | 11 | **35** | 31 |
| **Documents** | 14 | 0 | 1 | **15** | 15 |
| **Images** | 16 | 2 | 0 | **18** | 18 |
| **Data** | 20 | 0 | 0 | **20** | 18 |
| **Text** | 15 | 0 | 0 | **15** | 13 |
| **Developer** | 20 | 0 | 0 | **20** | 20 |
| **Calculator & Converters** | 12 | 0 | 0 | **12** | 12 |
| **Files & Archives** | 10 | 0 | 0 | **10** | 10 |
| **Suite Total** | **125** | **8** | **12** | **145** | **137** |

### (3) Totals by Group
| Workspace › Group | Ready | Beta | Soon | Total Listings | Single-Tool Group? |
| :--- | :---: | :---: | :---: | :---: | :---: |
| PDF › Page Organizer | 7 | 0 | 1 | **8** | No |
| PDF › PDF Editor | 2 | 0 | 4 | **6** | No |
| PDF › PDF Converter | 5 | 0 | 1 | **6** | No |
| PDF › PDF Optimizer | 0 | 2 | 2 | **4** | No |
| PDF › PDF Extractor | 1 | 1 | 2 | **4** | No |
| PDF › PDF Security | 0 | 3 | 1 | **4** | No |
| PDF › PDF Information | 3 | 0 | 0 | **3** | No |
| Documents › Converter | 5 | 0 | 1 | **6** | No |
| Documents › Document Editor | 4 | 0 | 0 | **4** | No |
| Documents › Compare | 1 | 0 | 0 | **1** | **Yes (renders flat)** |
| Documents › Export | 4 | 0 | 0 | **4** | No |
| Images › Transformer | 4 | 0 | 0 | **4** | No |
| Images › Converter | 3 | 2 | 0 | **5** | No |
| Images › Optimizer | 2 | 0 | 0 | **2** | No |
| Images › Adjustments | 3 | 0 | 0 | **3** | No |
| Images › Metadata | 3 | 0 | 0 | **3** | No |
| Images › Image → PDF | 1 | 0 | 0 | **1** | **Yes (renders flat)** |
| Data › Viewer | 5 | 0 | 0 | **5** | No |
| Data › Converter | 4 | 0 | 0 | **4** | No |
| Data › Transformer | 4 | 0 | 0 | **4** | No |
| Data › Validator | 4 | 0 | 0 | **4** | No |
| Data › Formatter | 3 | 0 | 0 | **3** | No |
| Text › Transformer | 4 | 0 | 0 | **4** | No |
| Text › Cleaner | 4 | 0 | 0 | **4** | No |
| Text › Analyzer | 2 | 0 | 0 | **2** | No |
| Text › Encoder / Decoder | 4 | 0 | 0 | **4** | No |
| Text › Compare | 1 | 0 | 0 | **1** | **Yes (renders flat)** |
| Developer › Formatter | 6 | 0 | 0 | **6** | No |
| Developer › Encode / Decode | 4 | 0 | 0 | **4** | No |
| Developer › Generators | 5 | 0 | 0 | **5** | No |
| Developer › Regex Tester | 1 | 0 | 0 | **1** | **Yes (renders flat)** |
| Developer › Web Utilities | 4 | 0 | 0 | **4** | No |
| Calculator & Converters › General | 4 | 0 | 0 | **4** | No |
| Calculator & Converters › Scientific | 2 | 0 | 0 | **2** | No |
| Calculator & Converters › Math | 3 | 0 | 0 | **3** | No |
| Calculator & Converters › Engineering | 2 | 0 | 0 | **2** | No |
| Calculator & Converters › Units | 1 | 0 | 0 | **1** | **Yes (renders flat)** |
| Files & Archives › File Operations | 3 | 0 | 0 | **3** | No |
| Files & Archives › File Analyzer | 1 | 0 | 0 | **1** | **Yes (renders flat)** |
| Files & Archives › Duplicate Finder | 1 | 0 | 0 | **1** | **Yes (renders flat)** |
| Files & Archives › File Comparison | 1 | 0 | 0 | **1** | **Yes (renders flat)** |
| Files & Archives › Archive Manager | 4 | 0 | 0 | **4** | No |

---

## 2. Duplicate Placement & Cross-Listing Configuration (`alsoListedIn`)

To eliminate duplicate tool implementations and route-fragmentation while preserving seamless user discovery across workflows, tools are implemented **once** and cross-listed in secondary groups via the `alsoListedIn` registry field.

### Decided Duplicate Placements:
1. **Base64** (`dev-base64`):
   - **Primary Home**: Developer › Encode / Decode (`developer/dev-encoder/dev-base64`)
   - **Also Listed In**: Text › Encoder / Decoder (`text/text-encoder`)
   - **Behavior**: Opening from Text displays the primary breadcrumb (`Developer › Encode / Decode › Base64`) with an `Also in Text` badge.
2. **URL Encoding** (`dev-url`):
   - **Primary Home**: Developer › Encode / Decode (`developer/dev-encoder/dev-url`)
   - **Also Listed In**: Text › Encoder / Decoder (`text/text-encoder`)
   - **Behavior**: Displays primary breadcrumb with an `Also in Text` badge.
3. **JSON Formatter** (`format-json-code`):
   - **Primary Home**: Developer › Formatter (`developer/dev-formatter/format-json-code`)
   - **Also Listed In**: Data › Formatter (`data/data-formatter`)
   - **Behavior**: Displays primary breadcrumb with an `Also in Data` badge.
4. **XML Formatter** (`format-xml-code`):
   - **Primary Home**: Developer › Formatter (`developer/dev-formatter/format-xml-code`)
   - **Also Listed In**: Data › Formatter (`data/data-formatter`)
   - **Behavior**: Displays primary breadcrumb with an `Also in Data` badge.
5. **Document → PDF Converters** (`docx-to-pdf`, `txt-to-pdf-doc`, `md-to-pdf-doc`, `html-to-pdf-doc`):
   - **Primary Home**: Documents › Converter (`documents/doc-converter/*`)
   - **Also Listed In**: PDF › PDF Converter (`pdf/pdf-converter`)
   - **Behavior**: Displays primary breadcrumb with an `Also in PDF` badge. The previously non-functional PDF placeholder entries are now powered by the working Documents engines.

---

## 3. Near-Duplicates Analysis & Proposed Merge Options (Report Only - Unmerged)

The following 3 tool sets represent near-duplicate functionality. Per directive, they remain **unmerged** and are listed below with recommended merge paths:

### 1. Text Diff vs. Document Diff vs. File Comparison
- **Current Locations**:
  - `text/text-compare/text-diff` (Text › Compare › Text Diff)
  - `documents/doc-compare/doc-diff` (Documents › Compare › Document Diff)
  - `files/files-comparison/file-comparison-feat` (Files › File Comparison)
- **Technical Divergence**:
  - `text-diff` and `doc-diff` both invoke `DiffEngine.computeDiff` line-by-line comparison with identical side-by-side / inline rendering.
  - `file-comparison-feat` computes byte-level SHA-256 hashes to indicate binary equality.
- **Proposed Merge Options**:
  - **Option A (Recommended)**: Consolidate `text-diff` and `doc-diff` into a single first-class **Diff & Compare** tool located in Documents (`documents/doc-compare/doc-diff`) with `alsoListedIn: [{ workspaceId: 'text', groupId: 'text-compare' }]`. Support both drag-and-drop file comparison and direct raw-text pasting in dual panes.
  - **Option B**: Keep `text-diff` strictly for raw clipboard text and preserve `doc-diff` for multi-format file uploads (.txt, .md, .docx, .html).

### 2. Remove Extra Spaces vs. Text Cleanup
- **Current Locations**:
  - `text/text-cleaner/remove-spaces` (Text › Cleaner › Remove Extra Spaces)
  - `documents/doc-editor/doc-text-cleanup` (Documents › Document Editor › Text Cleanup)
- **Technical Divergence**:
  - `remove-spaces` trims consecutive whitespace and trailing spaces on strings in the text buffer.
  - `doc-text-cleanup` operates on full document text with additional line-break normalization.
- **Proposed Merge Options**:
  - **Option A (Recommended)**: Consolidate into **Text Cleaner** in Text workspace, with options for tabs-to-spaces, extra spaces, trailing spaces, and line-breaks. Add `alsoListedIn` for Documents.
  - **Option B**: Keep separate, branding `remove-spaces` as an inline micro-transform and `doc-text-cleanup` as a document batch-cleaning pipeline.

### 3. PDF Metadata Tools (File Information, Page Count & Stats, Document Properties, Extract Metadata)
- **Current Locations**:
  - `pdf/pdf-information/file-info` (File Information)
  - `pdf/pdf-information/page-count` (Page Count & Stats)
  - `pdf/pdf-information/doc-properties` (Document Properties)
  - `pdf/pdf-extractor/extract-metadata` (Extract Metadata)
- **Technical Divergence**:
  - All 4 tools invoke `PdfEngine.getMetadata()` and render varying subsets of document author, title, page dimensions, version, and creation date.
- **Proposed Merge Options**:
  - **Option A (Recommended)**: Merge into a single comprehensive **PDF Inspector** tool under `pdf/pdf-information/pdf-inspector` featuring tabs: *General Info*, *Page Dimensions & Geometry*, *Document Properties*, and *Raw Metadata / JSON Export*.
  - **Option B**: Retain `extract-metadata` under PDF Extractor for export workflows (JSON/CSV download) and combine `file-info`, `page-count`, and `doc-properties` into a unified **Document Properties & Stats** screen.

---

## 4. Single-Tool Groups (Rendered Flat Without Headings)

The following 8 groups contain exactly one tool and are rendered directly at the top level in the tool list panel without collapsible group wrappers or chevrons:
1. **Documents › Compare** → `Document Diff` (`doc-diff`)
2. **Images › Image → PDF** → `Multiple Images → PDF` (`images-to-pdf-transformer`)
3. **Text › Compare** → `Text Diff` (`text-diff`)
4. **Developer › Regex Tester** → `Regex Tester` (`regex-tester`)
5. **Calculator & Converters › Units** → `Unit Converter` (`calc-units`)
6. **Files & Archives › File Analyzer** → `File Analyzer` (`file-analyzer-feat`)
7. **Files & Archives › Duplicate Finder** → `Duplicate Finder` (`duplicate-finder-feat`)
8. **Files & Archives › File Comparison** → `File Comparison` (`file-comparison-feat`)

---

## 5. Tools with Status 'soon' (Clean Empty State) and 'beta'

### Status 'soon' (12 Unique Tools):
1. `pdf/page-organizer/replace-pages` (Replace Pages)
2. `pdf/pdf-editor/add-text` (Add Text)
3. `pdf/pdf-editor/add-image` (Add Image)
4. `pdf/pdf-editor/draw-shapes` (Draw & Shapes)
5. `pdf/pdf-editor/highlight-underline` (Highlight & Underline)
6. `pdf/pdf-converter/pdf-to-doc` (PDF → Document Formats)
7. `pdf/pdf-optimizer/flatten-pdf` (Flatten PDF)
8. `pdf/pdf-optimizer/remove-metadata` (Remove Metadata)
9. `pdf/pdf-extractor/extract-images` (Extract Images)
10. `pdf/pdf-extractor/search-text` (Search PDF Text)
11. `pdf/pdf-security/sign-pdf` (Sign PDF)
12. `documents/doc-converter/pdf-to-docx` (PDF → DOCX)

### Status 'beta' (8 Unique Tools):
1. `pdf/pdf-optimizer/compress-pdf` (Compress PDF)
2. `pdf/pdf-optimizer/optimize-images` (Optimize Images)
3. `pdf/pdf-extractor/extract-text` (Extract Text)
4. `pdf/pdf-security/password-protect` (Password Protect)
5. `pdf/pdf-security/encrypt-pdf` (Encrypt PDF)
6. `pdf/pdf-security/remove-password` (Remove Password)
7. `images/image-converter/convert-heic` (HEIC → JPG / PNG)
8. `images/image-converter/convert-raw` (RAW Image Converter)

---

## 6. Complete 145-Tool Master Registry Table

| Workspace | Group | Tool Name | Route / ID | Status | Template Type | Accepted Formats | Notes |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| PDF | Page Organizer | Merge PDF | `pdf/page-organizer/merge-pdf` | `ready` | `file` | .pdf | Combine multiple PDF files into one. |
| PDF | Page Organizer | Split PDF | `pdf/page-organizer/split-pdf` | `ready` | `file` | .pdf | Split a PDF into individual pages or ranges. |
| PDF | Page Organizer | Extract Pages | `pdf/page-organizer/extract-pages` | `ready` | `file` | .pdf | Extract chosen pages to a new PDF document. |
| PDF | Page Organizer | Delete Pages | `pdf/page-organizer/delete-pages` | `ready` | `file` | .pdf | Remove unwanted pages from a PDF document. |
| PDF | Page Organizer | Reorder Pages | `pdf/page-organizer/reorder-pages` | `ready` | `file` | .pdf | Visually rearrange the sequence of pages. |
| PDF | Page Organizer | Rotate Pages | `pdf/page-organizer/rotate-pages` | `ready` | `file` | .pdf | Rotate pages 90°, 180°, or 270° clockwise. |
| PDF | Page Organizer | Duplicate Pages | `pdf/page-organizer/duplicate-pages` | `ready` | `file` | .pdf | Clone selected pages inside a PDF. |
| PDF | Page Organizer | Replace Pages | `pdf/page-organizer/replace-pages` | `soon` | `file` | .pdf | Substitute pages with pages from another PDF. |
| PDF | PDF Editor | Add Text | `pdf/pdf-editor/add-text` | `soon` | `file` | .pdf | Insert custom text boxes and labels into PDF pages. |
| PDF | PDF Editor | Add Image | `pdf/pdf-editor/add-image` | `soon` | `file` | .pdf | Embed logos, stamps, or pictures onto PDF pages. |
| PDF | PDF Editor | Draw & Shapes | `pdf/pdf-editor/draw-shapes` | `soon` | `file` | .pdf | Add rectangles, circles, lines, and freehand markup. |
| PDF | PDF Editor | Highlight & Underline | `pdf/pdf-editor/highlight-underline` | `soon` | `file` | .pdf | Emphasize document text with colored highlights. |
| PDF | PDF Editor | Watermark | `pdf/pdf-editor/watermark` | `ready` | `file` | .pdf | Apply confidential, draft, or custom text watermarks. |
| PDF | PDF Editor | Page Numbers | `pdf/pdf-editor/page-numbers` | `ready` | `file` | .pdf | Number pages with custom formatting and position. |
| PDF | PDF Converter | Images → PDF | `pdf/pdf-converter/images-to-pdf` | `ready` | `file` | .png, .jpg, .jpeg, .webp | Combine JPG, PNG, WebP images into a single PDF. |
| PDF | PDF Converter | PDF → Document Formats | `pdf/pdf-converter/pdf-to-doc` | `soon` | `file` | .pdf | Export PDF text and content to structured formats. |
| PDF | PDF Converter | DOCX → PDF | `pdf/pdf-converter/docx-to-pdf` | `ready` | `file` | .docx, .doc, .txt, .md, .html, .rtf | Convert Word DOCX files to clean PDF documents. |
| PDF | PDF Converter | TXT → PDF | `pdf/pdf-converter/txt-to-pdf-doc` | `ready` | `file` | .docx, .doc, .txt, .md, .html, .rtf | Convert plain text files into formatted PDF documents. |
| PDF | PDF Converter | Markdown → PDF | `pdf/pdf-converter/md-to-pdf-doc` | `ready` | `file` | .docx, .doc, .txt, .md, .html, .rtf | Render Markdown files into elegant PDF pages. |
| PDF | PDF Converter | HTML → PDF | `pdf/pdf-converter/html-to-pdf-doc` | `ready` | `file` | .docx, .doc, .txt, .md, .html, .rtf | Convert local HTML files or rich text into PDF. |
| PDF | PDF Optimizer | Compress PDF | `pdf/pdf-optimizer/compress-pdf` | `beta` | `file` | .pdf | Reduce PDF file size while maintaining visual clarity. |
| PDF | PDF Optimizer | Optimize Images | `pdf/pdf-optimizer/optimize-images` | `beta` | `file` | .pdf | Re-encode embedded graphics at lower DPI. |
| PDF | PDF Optimizer | Flatten PDF | `pdf/pdf-optimizer/flatten-pdf` | `soon` | `file` | .pdf | Merge form fields and annotations into static page content. |
| PDF | PDF Optimizer | Remove Metadata | `pdf/pdf-optimizer/remove-metadata` | `soon` | `file` | .pdf | Strip author, software, and tracking info for privacy. |
| PDF | PDF Extractor | Extract Text | `pdf/pdf-extractor/extract-text` | `beta` | `file` | .pdf | Export full text content as plain text or structured lines. |
| PDF | PDF Extractor | Extract Images | `pdf/pdf-extractor/extract-images` | `soon` | `file` | .pdf | Extract all embedded photos and raster assets. |
| PDF | PDF Extractor | Extract Metadata | `pdf/pdf-extractor/extract-metadata` | `ready` | `file` | .pdf | Read creation date, author, producer, and page info. |
| PDF | PDF Extractor | Search PDF Text | `pdf/pdf-extractor/search-text` | `soon` | `file` | .pdf | Find occurrences of words and phrases across pages. |
| PDF | PDF Security | Password Protect | `pdf/pdf-security/password-protect` | `beta` | `file` | .pdf | Enforce user password protection with standard encryption. |
| PDF | PDF Security | Encrypt PDF | `pdf/pdf-security/encrypt-pdf` | `beta` | `file` | .pdf | Apply 128/256-bit permission and printing restrictions. |
| PDF | PDF Security | Remove Password | `pdf/pdf-security/remove-password` | `beta` | `file` | .pdf | Decrypt and save an unencumbered copy with your password. |
| PDF | PDF Security | Sign PDF | `pdf/pdf-security/sign-pdf` | `soon` | `file` | .pdf | Place a visual signature or certified mark on the document. |
| PDF | PDF Information | File Information | `pdf/pdf-information/file-info` | `ready` | `file` | .pdf | Inspect file size, version, and page dimensions. |
| PDF | PDF Information | Page Count & Stats | `pdf/pdf-information/page-count` | `ready` | `file` | .pdf | Detailed breakdown of page counts, aspect ratios, and orientations. |
| PDF | PDF Information | Document Properties | `pdf/pdf-information/doc-properties` | `ready` | `file` | .pdf | View creator, producer, title, and creation timestamps. |
| Documents | Converter | DOCX → PDF | `documents/doc-converter/docx-to-pdf` | `ready` | `file` | .docx, .doc, .txt, .md, .html, .rtf | Convert Word DOCX files to clean PDF documents. |
| Documents | Converter | PDF → DOCX | `documents/doc-converter/pdf-to-docx` | `soon` | `file` | .docx, .doc, .txt, .md, .html, .rtf | Extract structured text and formatting to Word DOCX. |
| Documents | Converter | TXT → PDF | `documents/doc-converter/txt-to-pdf-doc` | `ready` | `file` | .docx, .doc, .txt, .md, .html, .rtf | Convert plain text files into formatted PDF documents. |
| Documents | Converter | Markdown → PDF | `documents/doc-converter/md-to-pdf-doc` | `ready` | `file` | .docx, .doc, .txt, .md, .html, .rtf | Render Markdown files into elegant PDF pages. |
| Documents | Converter | HTML → PDF | `documents/doc-converter/html-to-pdf-doc` | `ready` | `file` | .docx, .doc, .txt, .md, .html, .rtf | Convert local HTML files or rich text into PDF. |
| Documents | Converter | RTF → PDF | `documents/doc-converter/rtf-to-pdf` | `ready` | `file` | .docx, .doc, .txt, .md, .html, .rtf | Convert Rich Text Format (RTF) documents to PDF. |
| Documents | Document Editor | Edit Text | `documents/doc-editor/edit-text` | `ready` | `text/code` | plain text, Markdown | Rich text and markdown editing surface with preview. |
| Documents | Document Editor | Find and Replace | `documents/doc-editor/find-replace` | `ready` | `text/code` | plain text, Markdown | Bulk search and replace text with case sensitivity. |
| Documents | Document Editor | Document Statistics | `documents/doc-editor/doc-stats` | `ready` | `text/code` | plain text, Markdown | Live word, character, and paragraph counter. |
| Documents | Document Editor | Text Cleanup | `documents/doc-editor/text-cleanup` | `ready` | `text/code` | plain text, Markdown | Strip duplicate spaces, blank lines, and line breaks. |
| Documents | Compare | Document Diff | `documents/doc-compare/doc-diff` | `ready` | `text/code` | plain text | Highlight additions, deletions, and changed sections. |
| Documents | Export | Export to PDF | `documents/doc-export/export-pdf` | `ready` | `file` | plain text, Markdown | Export document directly to print-ready PDF. |
| Documents | Export | Export to TXT | `documents/doc-export/export-txt` | `ready` | `file` | plain text, Markdown | Export clean plain text file. |
| Documents | Export | Export to HTML | `documents/doc-export/export-html` | `ready` | `file` | plain text, Markdown | Export HTML file with standard styling. |
| Documents | Export | Export to Markdown | `documents/doc-export/export-md` | `ready` | `file` | plain text, Markdown | Export formatted Markdown document. |
| Images | Transformer | Resize & Scale | `images/img-transformer/img-resize` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Scale dimensions by pixels or percentage with aspect lock. |
| Images | Transformer | Crop Image | `images/img-transformer/img-crop` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Trim canvas boundaries to exact coordinates. |
| Images | Transformer | Rotate & Flip | `images/img-transformer/img-rotate` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Rotate 90/180/270 degrees or flip horizontally/vertically. |
| Images | Transformer | Aspect Ratio & Dimensions | `images/img-transformer/img-aspect` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Pad or fit image into standard 16:9, 4:3, or 1:1 ratios. |
| Images | Converter | Convert to JPG | `images/img-converter/convert-jpg` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Universal format with adjustable compression. |
| Images | Converter | Convert to PNG | `images/img-converter/convert-png` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Lossless format supporting full transparency. |
| Images | Converter | Convert to WebP | `images/img-converter/convert-webp` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Modern web format for maximum space savings. |
| Images | Converter | Convert to BMP | `images/img-converter/convert-bmp` | `beta` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Standard Windows uncompressed bitmap. |
| Images | Converter | Convert to TIFF | `images/img-converter/convert-tiff` | `beta` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | High-fidelity archive and print graphic format. |
| Images | Optimizer | Compress Image | `images/img-optimizer/compress-image` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Fine-tune quality slider to achieve target file size. |
| Images | Optimizer | Resize during Compression | `images/img-optimizer/resize-compress` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Scale down image dimensions while compressing. |
| Images | Adjustments | Brightness & Contrast | `images/img-adjustments/adjust-color` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Adjust exposure, highlights, and shadow depth. |
| Images | Adjustments | Saturation & Vibrance | `images/img-adjustments/adjust-saturation` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Boost vividness or soften intense colors. |
| Images | Adjustments | Blur & Grayscale | `images/img-adjustments/adjust-filters` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Apply Gaussian blur or convert to monochrome grayscale. |
| Images | Metadata | EXIF Viewer | `images/img-metadata/exif-view` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Inspect camera model, focal length, aperture, and GPS. |
| Images | Metadata | Remove EXIF | `images/img-metadata/exif-remove` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Strip privacy-sensitive metadata from photos before sharing. |
| Images | Metadata | Image Information | `images/img-metadata/img-info` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Inspect color depth, DPI, dimensions, and file format. |
| Images | Image → PDF | Multiple Images → PDF | `images/img-to-pdf-util/multi-img-pdf` | `ready` | `file` | .png, .jpg, .jpeg, .webp, .bmp, .tiff | Select order, margins, page sizing, and orientation. |
| Data | Viewer | CSV Table Viewer | `data/data-viewer/csv-viewer` | `ready` | `table` | .csv, .json, .xml, .yaml, .xlsx | Sort, filter, and paginate tabular CSV data. |
| Data | Viewer | JSON Tree Viewer | `data/data-viewer/json-tree` | `ready` | `table` | .csv, .json, .xml, .yaml, .xlsx | Collapsible hierarchical JSON tree navigator. |
| Data | Viewer | XML Tree Viewer | `data/data-viewer/xml-tree` | `ready` | `table` | .csv, .json, .xml, .yaml, .xlsx | Inspect XML node hierarchy, tags, and attributes. |
| Data | Viewer | YAML Viewer | `data/data-viewer/yaml-viewer` | `ready` | `table` | .csv, .json, .xml, .yaml, .xlsx | Syntax-highlighted YAML structure viewer. |
| Data | Viewer | XLSX Viewer | `data/data-viewer/xlsx-viewer` | `ready` | `table` | .csv, .json, .xml, .yaml, .xlsx | Browse sheets and cells from Microsoft Excel workbooks. |
| Data | Converter | CSV ↔ JSON | `data/data-converter/csv-to-json` | `ready` | `text/code` | .csv, .json, .xml, .yaml, .xlsx | Convert tabular CSV to JSON array or back. |
| Data | Converter | CSV ↔ XLSX | `data/data-converter/csv-to-xlsx` | `ready` | `text/code` | .csv, .json, .xml, .yaml, .xlsx | Convert CSV into Excel workbook or sheets to CSV. |
| Data | Converter | JSON ↔ YAML | `data/data-converter/json-to-yaml` | `ready` | `text/code` | .csv, .json, .xml, .yaml, .xlsx | Convert JSON payloads into clean YAML and back. |
| Data | Converter | XML ↔ JSON | `data/data-converter/xml-to-json` | `ready` | `text/code` | .csv, .json, .xml, .yaml, .xlsx | Convert XML tags to JSON objects and vice versa. |
| Data | Transformer | Sort & Filter | `data/data-transformer/data-sort-filter` | `ready` | `table` | .csv, tabular data | Apply multi-column sorting and filtering criteria. |
| Data | Transformer | Remove Duplicates | `data/data-transformer/data-dedup` | `ready` | `table` | .csv, tabular data | Identify and remove identical rows or records. |
| Data | Transformer | Select & Rename Columns | `data/data-transformer/data-columns` | `ready` | `table` | .csv, tabular data | Reorder fields, rename headers, and project columns. |
| Data | Transformer | Format Values | `data/data-transformer/data-format-values` | `ready` | `table` | .csv, tabular data | Change numbers, dates, strings, and types across rows. |
| Data | Validator | JSON Validation | `data/data-validator/validate-json` | `ready` | `text/code` | .json, .xml, .csv, .yaml | Check JSON syntax with exact line & column errors. |
| Data | Validator | XML Validation | `data/data-validator/validate-xml` | `ready` | `text/code` | .json, .xml, .csv, .yaml | Validate well-formed XML structure and tags. |
| Data | Validator | CSV Validation | `data/data-validator/validate-csv` | `ready` | `text/code` | .json, .xml, .csv, .yaml | Verify uniform column counts and delimiters. |
| Data | Validator | YAML Validation | `data/data-validator/validate-yaml` | `ready` | `text/code` | .json, .xml, .csv, .yaml | Check YAML indentation and typing syntax. |
| Data | Formatter | YAML Formatting | `data/data-formatter/yaml-formatting` | `ready` | `text/code` | .json, .xml, .yaml | Normalize YAML structure and comments. |
| Data | Formatter | JSON Formatter | `data/data-formatter/format-json-code` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Format and indent JSON data with custom indentation. |
| Data | Formatter | XML Formatter | `data/data-formatter/format-xml-code` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Format XML tags with custom indentation. |
| Text | Transformer | Case Conversion | `text/text-transformer/case-conversion` | `ready` | `text/code` | plain text | Upper, lower, title, sentence, camel, kebab, and snake case. |
| Text | Transformer | Reverse Text | `text/text-transformer/reverse-text` | `ready` | `text/code` | plain text | Reverse characters, words, or line order. |
| Text | Transformer | Sort Lines | `text/text-transformer/sort-lines` | `ready` | `text/code` | plain text | Alphabetical, numerical, or length-based line sorting. |
| Text | Transformer | Deduplicate Lines | `text/text-transformer/deduplicate-lines` | `ready` | `text/code` | plain text | Remove duplicate lines while preserving order. |
| Text | Cleaner | Remove Extra Spaces | `text/text-cleaner/remove-spaces` | `ready` | `text/code` | plain text | Collapse consecutive spaces and trim edge whitespace. |
| Text | Cleaner | Remove Blank Lines | `text/text-cleaner/remove-blank-lines` | `ready` | `text/code` | plain text | Strip empty lines and trailing carriage returns. |
| Text | Cleaner | Invisible Characters Cleanup | `text/text-cleaner/invisible-chars` | `ready` | `text/code` | plain text | Remove zero-width spaces and unprintable control characters. |
| Text | Cleaner | Line-Ending Normalization | `text/text-cleaner/line-endings` | `ready` | `text/code` | plain text | Convert CRLF (Windows) to LF (Unix) or vice-versa. |
| Text | Analyzer | Text Statistics | `text/text-analyzer/text-statistics` | `ready` | `text/code` | plain text | Count words, characters (with/without spaces), lines, and paragraphs. |
| Text | Analyzer | Reading Time | `text/text-analyzer/reading-time` | `ready` | `text/code` | plain text | Estimate reading and speaking duration at standard speeds. |
| Text | Encoder / Decoder | HTML Encoding | `text/text-encoder/html-encoding` | `ready` | `text/code` | plain text | Escape HTML entities (&amp;, &lt;, &gt;, quotes) and unescape entities. |
| Text | Encoder / Decoder | Unicode Tool | `text/text-encoder/unicode-tool` | `ready` | `text/code` | plain text | Inspect Unicode code points, hex values, and glyphs. |
| Text | Encoder / Decoder | Base64 | `text/text-encoder/dev-base64` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Encode text/binary to Base64 or decode to UTF-8. |
| Text | Encoder / Decoder | URL Encoding | `text/text-encoder/dev-url` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Percent-encode special URI characters. |
| Text | Compare | Text Diff | `text/text-compare/text-diff` | `ready` | `text/code` | plain text | Compare two text blocks line by line with color highlights. |
| Developer | Formatter | JSON Formatter | `developer/dev-formatter/format-json-code` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Format and indent JSON data with custom indentation. |
| Developer | Formatter | HTML Formatter | `developer/dev-formatter/format-html-code` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Beautify HTML markup with balanced tags and indenting. |
| Developer | Formatter | CSS Formatter | `developer/dev-formatter/format-css-code` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Format CSS stylesheets, rules, and selectors. |
| Developer | Formatter | JavaScript Formatter | `developer/dev-formatter/format-js-code` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Format JS/TS scripts and syntax. |
| Developer | Formatter | XML Formatter | `developer/dev-formatter/format-xml-code` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Format XML tags with custom indentation. |
| Developer | Formatter | SQL Formatter | `developer/dev-formatter/format-sql-code` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Beautify SQL queries with standard keyword capitalization. |
| Developer | Encode / Decode | Base64 | `developer/dev-encode/dev-base64` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Encode text/binary to Base64 or decode to UTF-8. |
| Developer | Encode / Decode | URL Encoding | `developer/dev-encode/dev-url` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Percent-encode special URI characters. |
| Developer | Encode / Decode | JWT Inspector | `developer/dev-encode/dev-jwt` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Decode JWT header, payload claims, and expiration date. |
| Developer | Encode / Decode | URL Components | `developer/dev-encode/dev-url-components` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Deconstruct URL into protocol, host, port, path, and params. |
| Developer | Generators | UUID Generator | `developer/dev-generators/gen-uuid` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Batch generate v4 UUIDs with 1-click copy. |
| Developer | Generators | Random String | `developer/dev-generators/gen-random-string` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Generate cryptographic passwords, salts, and API keys. |
| Developer | Generators | Timestamp | `developer/dev-generators/gen-timestamp` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Convert Unix epoch timestamps to human-readable dates. |
| Developer | Generators | Random Number | `developer/dev-generators/gen-random-number` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Generate random numbers within a min/max boundary. |
| Developer | Generators | Test Data | `developer/dev-generators/gen-test-data` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Generate sample JSON/CSV records (names, emails, dates). |
| Developer | Regex Tester | Regex Tester | `developer/dev-regex/regex-tester-feature` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Test patterns with flags (g, i, m, s) against sample text. |
| Developer | Web Utilities | URL Parser | `developer/dev-web/web-url-parser` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Deconstruct query parameters and paths into a table. |
| Developer | Web Utilities | HTTP Headers | `developer/dev-web/web-http-headers` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Format and parse raw HTTP header blocks. |
| Developer | Web Utilities | Query String | `developer/dev-web/web-query-string` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Serialize or parse URL query parameter strings. |
| Developer | Web Utilities | HTTP Status Reference | `developer/dev-web/web-status-codes` | `ready` | `text/code` | code, JSON, JWT, text, URLs | Searchable dictionary of HTTP status codes and semantics. |
| Calculator & Converters | General | Basic Calculator | `calculator/calc-general/calc-basic` | `ready` | `calculator` | numeric expressions, parameters | Standard desktop arithmetic calculator. |
| Calculator & Converters | General | Percentage | `calculator/calc-general/calc-percentage` | `ready` | `calculator` | numeric expressions, parameters | Calculate percentage increases, decreases, and shares. |
| Calculator & Converters | General | Discount | `calculator/calc-general/calc-discount` | `ready` | `calculator` | numeric expressions, parameters | Calculate sale prices, discounts, and tax totals. |
| Calculator & Converters | General | Ratio & Proportion | `calculator/calc-general/calc-ratio` | `ready` | `calculator` | numeric expressions, parameters | Solve proportional ratios (A:B = C:D). |
| Calculator & Converters | Scientific | Scientific Calculator | `calculator/calc-scientific/calc-trig-logs` | `ready` | `calculator` | numeric expressions, parameters | Sin, cos, tan, ln, log10, square roots, and powers. |
| Calculator & Converters | Scientific | Constants | `calculator/calc-scientific/calc-constants` | `ready` | `calculator` | numeric expressions, parameters | Quick lookup of Pi, Euler's e, speed of light, and constants. |
| Calculator & Converters | Math | Fractions | `calculator/calc-math/calc-fractions` | `ready` | `calculator` | numeric expressions, parameters | Simplify, add, subtract, multiply, and divide fractions. |
| Calculator & Converters | Math | Statistics | `calculator/calc-math/calc-statistics` | `ready` | `calculator` | numeric expressions, parameters | Calculate mean, median, mode, variance, and standard deviation. |
| Calculator & Converters | Math | Equations | `calculator/calc-math/calc-equations` | `ready` | `calculator` | numeric expressions, parameters | Solve linear and quadratic equations. |
| Calculator & Converters | Engineering | Ohm's Law | `calculator/calc-engineering/calc-ohms-law` | `ready` | `calculator` | numeric expressions, parameters | Calculate Voltage (V), Current (I), and Resistance (R). |
| Calculator & Converters | Engineering | Electrical Power | `calculator/calc-engineering/calc-power` | `ready` | `calculator` | numeric expressions, parameters | Calculate Watts (P = V * I) and energy consumption. |
| Calculator & Converters | Units | Unit Converter | `calculator/calc-units/unit-converter-all` | `ready` | `calculator` | numeric expressions, parameters | Convert between physical, digital, and imperial/metric units. |
| Files & Archives | File Operations | Batch Rename | `files/files-operations/batch-rename-files` | `ready` | `file` | Any local files, .zip, .tar, .gz | Rename files with prefix, suffix, find & replace, and numbering. |
| Files & Archives | File Operations | File Type Detection | `files/files-operations/file-type-detection` | `ready` | `file` | Any local files, .zip, .tar, .gz | Identify true MIME type from file header signatures. |
| Files & Archives | File Operations | File Metadata & Size | `files/files-operations/file-metadata-ops` | `ready` | `file` | Any local files, .zip, .tar, .gz | Inspect exact size, created date, and modified timestamps. |
| Files & Archives | File Analyzer | File Analyzer | `files/files-analyzer/file-analyzer-full` | `ready` | `file` | Any local files, .zip, .tar, .gz | Analyze files and compute SHA-256 and MD5 hashes. |
| Files & Archives | Duplicate Finder | Duplicate Finder | `files/files-duplicates/duplicate-finder-hash` | `ready` | `file` | Any local files, .zip, .tar, .gz | Scan multiple files and group exact matches by hash. |
| Files & Archives | File Comparison | File Comparison | `files/files-comparison/file-compare-hashes` | `ready` | `file` | Any local files, .zip, .tar, .gz | Compare two files by hash, size, and binary equality. |
| Files & Archives | Archive Manager | Create ZIP | `files/files-archives/create-zip-archive` | `ready` | `file` | Any local files, .zip, .tar, .gz | Compress files into a standard ZIP archive. |
| Files & Archives | Archive Manager | Extract ZIP | `files/files-archives/extract-zip-archive` | `ready` | `file` | Any local files, .zip, .tar, .gz | Inspect file list and extract contents of a ZIP file. |
| Files & Archives | Archive Manager | Inspect ZIP | `files/files-archives/inspect-zip-archive` | `ready` | `file` | Any local files, .zip, .tar, .gz | View file listing and compression ratios without extracting. |
| Files & Archives | Archive Manager | TAR & GZIP | `files/files-archives/tar-gzip-manager` | `ready` | `file` | Any local files, .zip, .tar, .gz | Create and extract TAR and GZIP archives. |
