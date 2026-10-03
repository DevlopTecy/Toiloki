# Toiloki Suite Complete Feature Inventory

**Hierarchy**: `Workspace > Group > Utility > Feature > Engine`  
**Total Catalog Utilities**: 145  
**Total Registered Features**: 433  
**Feature Status**: `381 ready · 52 coming soon`  

---

## 1. Summary Statistics

### (1) Breakdown by Feature Kind
| Kind | Count | Percentage | UI Control Representation |
| :--- | :---: | :---: | :--- |
| **Option** | 174 | 40.2% | Input fields, checkboxes, toggles, quality sliders |
| **Mode** | 72 | 16.6% | Segmented controls, view toggles, calculation modes |
| **Action** | 125 | 28.9% | Direct action buttons, clipboard copy, jump-to-error |
| **Output** | 54 | 12.5% | Format dropdowns, export selectors, save targets |
| **Batch** | 8 | 1.8% | Multi-file queue, directory processing, ZIP bundling |
| **Total** | **433** | **100.0%** | All controls rendered contextually in options panel |

### (2) Breakdown by Workspace
| Workspace | Utilities | Features | Ready Features | Soon Features |
| :--- | :---: | :---: | :---: | :---: |
| **PDF** | 35 | **108** | 68 | 40 |
| **Documents** | 15 | **41** | 38 | 3 |
| **Images** | 18 | **59** | 51 | 8 |
| **Data** | 20 | **60** | 60 | 0 |
| **Text** | 15 | **38** | 38 | 0 |
| **Developer** | 20 | **58** | 58 | 0 |
| **Calculator & Converters** | 12 | **36** | 36 | 0 |
| **Files & Archives** | 10 | **33** | 32 | 1 |
| **Suite Total** | **145** | **433** | **381** | **52** |

---

## 2. Seed Utilities Feature Audit

The 9 seed utilities specified in Phase 3 are fully mapped below:

### Merge PDF (`PDF › Page Organizer`)
| Feature Name | Feature ID | Kind | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Reorder by drag** | `reorder-drag` | `action` | `ready` | Visually drag and drop PDF files to arrange their merge sequence. |
| **Page range per file** | `page-range-per-file` | `option` | `ready` | Specify individual page ranges (e.g. 1-5, 8, 12-end) for each input file. |
| **Bookmarks per file** | `bookmarks-per-file` | `option` | `soon` | Retain or generate table-of-contents bookmarks for each merged document. |
| **Remove blank pages** | `remove-blank-pages` | `option` | `soon` | Automatically detect and discard blank separator pages during merge. |
| **Output name template** | `output-name-template` | `option` | `ready` | Custom pattern for output file name with date and counter tokens. |

### Split PDF (`PDF › Page Organizer`)
| Feature Name | Feature ID | Kind | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Ranges** | `split-ranges` | `mode` | `ready` | Extract custom page ranges into one or multiple individual PDF documents. |
| **Every N pages** | `split-every-n` | `mode` | `ready` | Automatically divide document into equal chunks of N pages each. |
| **By size** | `split-by-size` | `mode` | `soon` | Split document into segments not exceeding a maximum target file size in MB. |
| **By bookmarks** | `split-by-bookmarks` | `mode` | `soon` | Split document into separate chapters based on top-level outline bookmarks. |

### Compress PDF (`PDF › PDF Optimizer`)
| Feature Name | Feature ID | Kind | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Presets** | `compress-presets` | `mode` | `ready` | Select between Low, Recommended, and Extreme compression quality profiles. |
| **Target size** | `target-size` | `option` | `soon` | Specify an exact target file size in MB for iterative compression optimization. |
| **Downsample images** | `downsample-images` | `option` | `ready` | Re-encode raster pictures to 72, 150, or 300 DPI. |
| **Strip metadata** | `strip-metadata` | `option` | `soon` | Remove PDF author, software producer, and creation date tracking metadata. |
| **Before/after comparison** | `before-after` | `action` | `ready` | Inspect side-by-side file size savings and visual page fidelity preview. |
| **Batch** | `batch-compress` | `batch` | `soon` | Process multiple PDF files concurrently with unified compression settings. |

### Compress Image (`Images › Optimizer`)
| Feature Name | Feature ID | Kind | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Quality** | `quality-slider` | `option` | `ready` | Fine-tune image compression ratio from 1% to 100% with immediate preview. |
| **Target KB** | `target-kb` | `option` | `soon` | Iteratively optimize compression to fit strictly under a maximum KB threshold. |
| **Strip EXIF** | `strip-exif` | `option` | `ready` | Remove camera model, geolocation GPS coordinates, and private EXIF tags. |
| **Format** | `format-selection` | `output` | `ready` | Select output format between original, WebP, JPG, or PNG. |
| **Batch folder** | `batch-folder` | `batch` | `soon` | Compress entire directories of images with recursive subfolder scanning. |
| **Before/after** | `before-after` | `action` | `ready` | Split-view visual comparison highlighting artifact boundaries and file savings. |

### Resize & Scale (`Images › Transformer`)
| Feature Name | Feature ID | Kind | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Px / Percent / Preset** | `resize-unit` | `mode` | `ready` | Switch dimension scaling between exact pixels, percentages, and standard presets. |
| **Lock aspect** | `lock-aspect` | `option` | `ready` | Constrain width and height proportionally to prevent distortion. |
| **Fit / Fill** | `fit-fill` | `mode` | `ready` | Choose between letterbox padding or canvas cropping to match target aspect ratio. |
| **Batch** | `batch-resize` | `batch` | `soon` | Apply dimension transformations across multiple image files in one operation. |

### Convert to JPG (`Images › Converter`)
| Feature Name | Feature ID | Kind | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Quality** | `converter-quality` | `option` | `ready` | Fine-tune export compression quality and visual sharpness. |
| **Background for transparency** | `bg-transparency` | `option` | `ready` | Specify matte background color (white, black, or custom hex) when converting transparent PNGs. |
| **Keep metadata** | `keep-metadata` | `option` | `soon` | Preserve camera settings, timestamps, and color profiles in converted file. |
| **Batch zip** | `batch-zip` | `batch` | `ready` | Convert multiple files simultaneously and bundle all outputs into a single ZIP archive. |

### JSON Formatter (`Data › Formatter`)
| Feature Name | Feature ID | Kind | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Indent size** | `indent-size` | `option` | `ready` | Set indentation spacing to 2 spaces, 4 spaces, or tab characters. |
| **Sort keys** | `sort-keys` | `option` | `ready` | Alphabetize object property keys alphabetically at all nesting depths. |
| **Minify** | `minify-json` | `action` | `ready` | Remove all unnecessary whitespace, comments, and newlines for compact payloads. |
| **Error line** | `error-line` | `option` | `ready` | Pinpoint and highlight syntax errors with line and column indicators. |
| **Tree view** | `tree-view` | `mode` | `ready` | Switch between formatted code editor and collapsible interactive JSON node tree. |

### CSV Table Viewer (`Data › Viewer`)
| Feature Name | Feature ID | Kind | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Filter** | `filter-rows` | `option` | `ready` | Quick search across all cells or apply column-specific query filters. |
| **Sort** | `sort-columns` | `option` | `ready` | Sort table rows in ascending or descending alphanumeric order by column. |
| **Column toggle** | `column-toggle` | `option` | `ready` | Show or hide selected columns to focus on essential data fields. |
| **Delimiter and encoding detect** | `detect-delimiter` | `option` | `ready` | Auto-detect whether input is comma, tab, semicolon, or pipe-delimited with UTF-8/ANSI decoding. |
| **Export view** | `export-view` | `output` | `ready` | Export currently filtered and sorted rows to clean CSV, JSON, or Excel file. |

### Batch Rename (`Files & Archives › File Operations`)
| Feature Name | Feature ID | Kind | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Pattern** | `rename-pattern` | `option` | `ready` | Define file naming templates with prefix, suffix, and metadata tokens. |
| **Numbering** | `sequential-numbering` | `option` | `ready` | Append sequential index numbers with configurable starting value and zero-padding. |
| **Case conversion** | `case-conversion` | `mode` | `ready` | Transform file names to lowercase, UPPERCASE, Title Case, or kebab-case. |
| **Regex** | `regex-rename` | `option` | `ready` | Perform regular expression find-and-replace on file names using capture groups. |
| **Live preview** | `live-preview` | `action` | `ready` | Display real-time before-and-after table of planned file renames before committing. |
| **Undo** | `undo-rename` | `action` | `soon` | Revert the most recent batch rename operation back to original file names. |

---

## 3. Complete Master Feature Registry Table

| Workspace | Utility | Feature Name | Feature ID | Kind | Status | Aliases | Description |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| PDF | Merge PDF | **Reorder by drag** | `reorder-drag` | `action` | `ready` | Drag reorder, Visual file sort, Arrange sequence | Visually drag and drop PDF files to arrange their merge sequence. |
| PDF | Merge PDF | **Page range per file** | `page-range-per-file` | `option` | `ready` | Subset selection, Per-file range, Page excerpt | Specify individual page ranges (e.g. 1-5, 8, 12-end) for each input file. |
| PDF | Merge PDF | **Bookmarks per file** | `bookmarks-per-file` | `option` | `soon` | Preserve outlines, PDF TOC bookmarks, Document index | Retain or generate table-of-contents bookmarks for each merged document. |
| PDF | Merge PDF | **Remove blank pages** | `remove-blank-pages` | `option` | `soon` | Drop blank pages, Skip empty pages, Blank removal | Automatically detect and discard blank separator pages during merge. |
| PDF | Merge PDF | **Output name template** | `output-name-template` | `option` | `ready` | Naming pattern, Output filename, Filename token | Custom pattern for output file name with date and counter tokens. |
| PDF | Split PDF | **Ranges** | `split-ranges` | `mode` | `ready` | Custom ranges, Page spans, Interval split | Extract custom page ranges into one or multiple individual PDF documents. |
| PDF | Split PDF | **Every N pages** | `split-every-n` | `mode` | `ready` | Fixed chunks, Equal splits, N-page split | Automatically divide document into equal chunks of N pages each. |
| PDF | Split PDF | **By size** | `split-by-size` | `mode` | `soon` | Max MB split, Size limit split, Target size partition | Split document into segments not exceeding a maximum target file size in MB. |
| PDF | Split PDF | **By bookmarks** | `split-by-bookmarks` | `mode` | `soon` | Chapter split, Bookmark split, TOC split | Split document into separate chapters based on top-level outline bookmarks. |
| PDF | Extract Pages | **Page selection** | `page-selection` | `option` | `ready` | Select pages, Thumbnails | Interactive thumbnail selector to choose specific pages. |
| PDF | Extract Pages | **Page range input** | `page-range-input` | `option` | `ready` | Range input, Page numbers | Specify page numbers or comma-separated ranges (e.g. 1-3, 5, 7). |
| PDF | Extract Pages | **Apply to document** | `apply-operation` | `action` | `ready` | Run action, Execute | Execute reorganization and save new PDF file. |
| PDF | Delete Pages | **Page selection** | `page-selection` | `option` | `ready` | Select pages, Thumbnails | Interactive thumbnail selector to choose specific pages. |
| PDF | Delete Pages | **Page range input** | `page-range-input` | `option` | `ready` | Range input, Page numbers | Specify page numbers or comma-separated ranges (e.g. 1-3, 5, 7). |
| PDF | Delete Pages | **Apply to document** | `apply-operation` | `action` | `ready` | Run action, Execute | Execute reorganization and save new PDF file. |
| PDF | Reorder Pages | **Page selection** | `page-selection` | `option` | `ready` | Select pages, Thumbnails | Interactive thumbnail selector to choose specific pages. |
| PDF | Reorder Pages | **Page range input** | `page-range-input` | `option` | `ready` | Range input, Page numbers | Specify page numbers or comma-separated ranges (e.g. 1-3, 5, 7). |
| PDF | Reorder Pages | **Apply to document** | `apply-operation` | `action` | `ready` | Run action, Execute | Execute reorganization and save new PDF file. |
| PDF | Rotate Pages | **Page selection** | `page-selection` | `option` | `ready` | Select pages, Thumbnails | Interactive thumbnail selector to choose specific pages. |
| PDF | Rotate Pages | **Page range input** | `page-range-input` | `option` | `ready` | Range input, Page numbers | Specify page numbers or comma-separated ranges (e.g. 1-3, 5, 7). |
| PDF | Rotate Pages | **Apply to document** | `apply-operation` | `action` | `ready` | Run action, Execute | Execute reorganization and save new PDF file. |
| PDF | Duplicate Pages | **Page selection** | `page-selection` | `option` | `ready` | Select pages, Thumbnails | Interactive thumbnail selector to choose specific pages. |
| PDF | Duplicate Pages | **Page range input** | `page-range-input` | `option` | `ready` | Range input, Page numbers | Specify page numbers or comma-separated ranges (e.g. 1-3, 5, 7). |
| PDF | Duplicate Pages | **Apply to document** | `apply-operation` | `action` | `ready` | Run action, Execute | Execute reorganization and save new PDF file. |
| PDF | Replace Pages | **Page selection** | `page-selection` | `option` | `soon` | Select pages, Thumbnails | Interactive thumbnail selector to choose specific pages. |
| PDF | Replace Pages | **Page range input** | `page-range-input` | `option` | `soon` | Range input, Page numbers | Specify page numbers or comma-separated ranges (e.g. 1-3, 5, 7). |
| PDF | Replace Pages | **Apply to document** | `apply-operation` | `action` | `soon` | Run action, Execute | Execute reorganization and save new PDF file. |
| PDF | Add Text | **Style & Appearance** | `style-customizer` | `option` | `soon` | Styling, Appearance | Customize font size, color, opacity, and positioning coordinates. |
| PDF | Add Text | **All pages toggle** | `apply-all-pages` | `option` | `soon` | Page scope, Batch apply | Apply modification to entire document or only specific pages. |
| PDF | Add Text | **Canvas preview** | `preview-canvas` | `action` | `soon` | Interactive preview, Visual edit | Live interactive PDF preview with draggable element anchors. |
| PDF | Add Image | **Style & Appearance** | `style-customizer` | `option` | `soon` | Styling, Appearance | Customize font size, color, opacity, and positioning coordinates. |
| PDF | Add Image | **All pages toggle** | `apply-all-pages` | `option` | `soon` | Page scope, Batch apply | Apply modification to entire document or only specific pages. |
| PDF | Add Image | **Canvas preview** | `preview-canvas` | `action` | `soon` | Interactive preview, Visual edit | Live interactive PDF preview with draggable element anchors. |
| PDF | Draw & Shapes | **Style & Appearance** | `style-customizer` | `option` | `soon` | Styling, Appearance | Customize font size, color, opacity, and positioning coordinates. |
| PDF | Draw & Shapes | **All pages toggle** | `apply-all-pages` | `option` | `soon` | Page scope, Batch apply | Apply modification to entire document or only specific pages. |
| PDF | Draw & Shapes | **Canvas preview** | `preview-canvas` | `action` | `soon` | Interactive preview, Visual edit | Live interactive PDF preview with draggable element anchors. |
| PDF | Highlight & Underline | **Style & Appearance** | `style-customizer` | `option` | `soon` | Styling, Appearance | Customize font size, color, opacity, and positioning coordinates. |
| PDF | Highlight & Underline | **All pages toggle** | `apply-all-pages` | `option` | `soon` | Page scope, Batch apply | Apply modification to entire document or only specific pages. |
| PDF | Highlight & Underline | **Canvas preview** | `preview-canvas` | `action` | `soon` | Interactive preview, Visual edit | Live interactive PDF preview with draggable element anchors. |
| PDF | Watermark | **Style & Appearance** | `style-customizer` | `option` | `ready` | Styling, Appearance | Customize font size, color, opacity, and positioning coordinates. |
| PDF | Watermark | **All pages toggle** | `apply-all-pages` | `option` | `ready` | Page scope, Batch apply | Apply modification to entire document or only specific pages. |
| PDF | Watermark | **Canvas preview** | `preview-canvas` | `action` | `ready` | Interactive preview, Visual edit | Live interactive PDF preview with draggable element anchors. |
| PDF | Page Numbers | **Style & Appearance** | `style-customizer` | `option` | `ready` | Styling, Appearance | Customize font size, color, opacity, and positioning coordinates. |
| PDF | Page Numbers | **All pages toggle** | `apply-all-pages` | `option` | `ready` | Page scope, Batch apply | Apply modification to entire document or only specific pages. |
| PDF | Page Numbers | **Canvas preview** | `preview-canvas` | `action` | `ready` | Interactive preview, Visual edit | Live interactive PDF preview with draggable element anchors. |
| PDF | Images → PDF | **Orientation** | `page-orientation` | `mode` | `ready` | Page layout, Landscape Portrait | Select Portrait, Landscape, or Auto page orientation. |
| PDF | Images → PDF | **Margins preset** | `page-margins` | `option` | `ready` | Margin size, Padding | Configure document margins (None, Normal, Wide). |
| PDF | Images → PDF | **Generate PDF** | `export-pdf-file` | `output` | `ready` | Save PDF, Compile PDF | Convert input document into standard PDF/A compliant document. |
| PDF | DOCX → PDF | **Orientation** | `page-orientation` | `mode` | `ready` | Page layout, Landscape Portrait | Select Portrait, Landscape, or Auto page orientation. |
| PDF | DOCX → PDF | **Margins preset** | `page-margins` | `option` | `ready` | Margin size, Padding | Configure document margins (None, Normal, Wide). |
| PDF | DOCX → PDF | **Generate PDF** | `export-pdf-file` | `output` | `ready` | Save PDF, Compile PDF | Convert input document into standard PDF/A compliant document. |
| PDF | TXT → PDF | **Orientation** | `page-orientation` | `mode` | `ready` | Page layout, Landscape Portrait | Select Portrait, Landscape, or Auto page orientation. |
| PDF | TXT → PDF | **Margins preset** | `page-margins` | `option` | `ready` | Margin size, Padding | Configure document margins (None, Normal, Wide). |
| PDF | TXT → PDF | **Generate PDF** | `export-pdf-file` | `output` | `ready` | Save PDF, Compile PDF | Convert input document into standard PDF/A compliant document. |
| PDF | Markdown → PDF | **Orientation** | `page-orientation` | `mode` | `ready` | Page layout, Landscape Portrait | Select Portrait, Landscape, or Auto page orientation. |
| PDF | Markdown → PDF | **Margins preset** | `page-margins` | `option` | `ready` | Margin size, Padding | Configure document margins (None, Normal, Wide). |
| PDF | Markdown → PDF | **Generate PDF** | `export-pdf-file` | `output` | `ready` | Save PDF, Compile PDF | Convert input document into standard PDF/A compliant document. |
| PDF | HTML → PDF | **Orientation** | `page-orientation` | `mode` | `ready` | Page layout, Landscape Portrait | Select Portrait, Landscape, or Auto page orientation. |
| PDF | HTML → PDF | **Margins preset** | `page-margins` | `option` | `ready` | Margin size, Padding | Configure document margins (None, Normal, Wide). |
| PDF | HTML → PDF | **Generate PDF** | `export-pdf-file` | `output` | `ready` | Save PDF, Compile PDF | Convert input document into standard PDF/A compliant document. |
| PDF | PDF → Document Formats | **Orientation** | `page-orientation` | `mode` | `soon` | Page layout, Landscape Portrait | Select Portrait, Landscape, or Auto page orientation. |
| PDF | PDF → Document Formats | **Margins preset** | `page-margins` | `option` | `soon` | Margin size, Padding | Configure document margins (None, Normal, Wide). |
| PDF | PDF → Document Formats | **Generate PDF** | `export-pdf-file` | `output` | `soon` | Save PDF, Compile PDF | Convert input document into standard PDF/A compliant document. |
| PDF | Compress PDF | **Presets** | `compress-presets` | `mode` | `ready` | Compression profiles, Quality presets, Low medium high | Select between Low, Recommended, and Extreme compression quality profiles. |
| PDF | Compress PDF | **Target size** | `target-size` | `option` | `soon` | Target MB, Max size limit, Goal size | Specify an exact target file size in MB for iterative compression optimization. |
| PDF | Compress PDF | **Downsample images** | `downsample-images` | `option` | `ready` | Image DPI, Downscale graphics, Raster resolution | Re-encode raster pictures to 72, 150, or 300 DPI. |
| PDF | Compress PDF | **Strip metadata** | `strip-metadata` | `option` | `soon` | Sanitize PDF, Clean tags, Remove author | Remove PDF author, software producer, and creation date tracking metadata. |
| PDF | Compress PDF | **Before/after comparison** | `before-after` | `action` | `ready` | Compare sizes, Delta view, Savings preview | Inspect side-by-side file size savings and visual page fidelity preview. |
| PDF | Compress PDF | **Batch** | `batch-compress` | `batch` | `soon` | Bulk compression, Multi-PDF compress, Folder queue | Process multiple PDF files concurrently with unified compression settings. |
| PDF | Optimize Images | **Optimization level** | `optimization-level` | `mode` | `ready` | Quality level, Aggressive | Choose balance between speed, file size, and visual clarity. |
| PDF | Optimize Images | **Strip extra layers** | `strip-annotations` | `option` | `ready` | Remove comments, Discard layers | Discard non-essential PDF annotation streams and form data. |
| PDF | Optimize Images | **Execute optimization** | `run-optimizer` | `action` | `ready` | Optimize file, Compress | Process file and display byte savings report. |
| PDF | Flatten PDF | **Optimization level** | `optimization-level` | `mode` | `soon` | Quality level, Aggressive | Choose balance between speed, file size, and visual clarity. |
| PDF | Flatten PDF | **Strip extra layers** | `strip-annotations` | `option` | `soon` | Remove comments, Discard layers | Discard non-essential PDF annotation streams and form data. |
| PDF | Flatten PDF | **Execute optimization** | `run-optimizer` | `action` | `soon` | Optimize file, Compress | Process file and display byte savings report. |
| PDF | Remove Metadata | **Optimization level** | `optimization-level` | `mode` | `soon` | Quality level, Aggressive | Choose balance between speed, file size, and visual clarity. |
| PDF | Remove Metadata | **Strip extra layers** | `strip-annotations` | `option` | `soon` | Remove comments, Discard layers | Discard non-essential PDF annotation streams and form data. |
| PDF | Remove Metadata | **Execute optimization** | `run-optimizer` | `action` | `soon` | Optimize file, Compress | Process file and display byte savings report. |
| PDF | Extract Text | **Extraction scope** | `extract-scope` | `option` | `ready` | Page filter, Target range | Extract from all pages, current page, or custom range. |
| PDF | Extract Text | **Output format** | `output-format-extract` | `output` | `ready` | Export type, File format | Select output format (Plain text, JSON metadata, or PNG). |
| PDF | Extract Text | **Copy to clipboard** | `copy-extracted` | `action` | `ready` | Clipboard copy, Quick copy | Copy extracted content directly to system clipboard. |
| PDF | Extract Images | **Extraction scope** | `extract-scope` | `option` | `soon` | Page filter, Target range | Extract from all pages, current page, or custom range. |
| PDF | Extract Images | **Output format** | `output-format-extract` | `output` | `soon` | Export type, File format | Select output format (Plain text, JSON metadata, or PNG). |
| PDF | Extract Images | **Copy to clipboard** | `copy-extracted` | `action` | `soon` | Clipboard copy, Quick copy | Copy extracted content directly to system clipboard. |
| PDF | Extract Metadata | **Extraction scope** | `extract-scope` | `option` | `ready` | Page filter, Target range | Extract from all pages, current page, or custom range. |
| PDF | Extract Metadata | **Output format** | `output-format-extract` | `output` | `ready` | Export type, File format | Select output format (Plain text, JSON metadata, or PNG). |
| PDF | Extract Metadata | **Copy to clipboard** | `copy-extracted` | `action` | `ready` | Clipboard copy, Quick copy | Copy extracted content directly to system clipboard. |
| PDF | Search PDF Text | **Extraction scope** | `extract-scope` | `option` | `soon` | Page filter, Target range | Extract from all pages, current page, or custom range. |
| PDF | Search PDF Text | **Output format** | `output-format-extract` | `output` | `soon` | Export type, File format | Select output format (Plain text, JSON metadata, or PNG). |
| PDF | Search PDF Text | **Copy to clipboard** | `copy-extracted` | `action` | `soon` | Clipboard copy, Quick copy | Copy extracted content directly to system clipboard. |
| PDF | Password Protect | **Password entry** | `password-input` | `option` | `ready` | Key input, Security passphrase | Set or enter document encryption password. |
| PDF | Password Protect | **Encryption level** | `encryption-strength` | `mode` | `ready` | Cipher strength, AES level | Select 128-bit AES or 256-bit AES cryptographic standard. |
| PDF | Password Protect | **Apply security policy** | `apply-security` | `action` | `ready` | Lock unlock, Save secure PDF | Write permissions and encrypt or unlock PDF file. |
| PDF | Encrypt PDF | **Password entry** | `password-input` | `option` | `ready` | Key input, Security passphrase | Set or enter document encryption password. |
| PDF | Encrypt PDF | **Encryption level** | `encryption-strength` | `mode` | `ready` | Cipher strength, AES level | Select 128-bit AES or 256-bit AES cryptographic standard. |
| PDF | Encrypt PDF | **Apply security policy** | `apply-security` | `action` | `ready` | Lock unlock, Save secure PDF | Write permissions and encrypt or unlock PDF file. |
| PDF | Remove Password | **Password entry** | `password-input` | `option` | `ready` | Key input, Security passphrase | Set or enter document encryption password. |
| PDF | Remove Password | **Encryption level** | `encryption-strength` | `mode` | `ready` | Cipher strength, AES level | Select 128-bit AES or 256-bit AES cryptographic standard. |
| PDF | Remove Password | **Apply security policy** | `apply-security` | `action` | `ready` | Lock unlock, Save secure PDF | Write permissions and encrypt or unlock PDF file. |
| PDF | Sign PDF | **Password entry** | `password-input` | `option` | `soon` | Key input, Security passphrase | Set or enter document encryption password. |
| PDF | Sign PDF | **Encryption level** | `encryption-strength` | `mode` | `soon` | Cipher strength, AES level | Select 128-bit AES or 256-bit AES cryptographic standard. |
| PDF | Sign PDF | **Apply security policy** | `apply-security` | `action` | `soon` | Lock unlock, Save secure PDF | Write permissions and encrypt or unlock PDF file. |
| PDF | File Information | **Inspect document** | `inspect-details` | `action` | `ready` | Inspect info, Scan details | Read detailed PDF headers, dictionary values, and metrics. |
| PDF | File Information | **Export report** | `export-summary` | `output` | `ready` | Save report, Dump info | Save document metadata and page properties to text file. |
| PDF | Page Count & Stats | **Inspect document** | `inspect-details` | `action` | `ready` | Inspect info, Scan details | Read detailed PDF headers, dictionary values, and metrics. |
| PDF | Page Count & Stats | **Export report** | `export-summary` | `output` | `ready` | Save report, Dump info | Save document metadata and page properties to text file. |
| PDF | Document Properties | **Inspect document** | `inspect-details` | `action` | `ready` | Inspect info, Scan details | Read detailed PDF headers, dictionary values, and metrics. |
| PDF | Document Properties | **Export report** | `export-summary` | `output` | `ready` | Save report, Dump info | Save document metadata and page properties to text file. |
| Documents | DOCX → PDF | **Page size** | `page-size-preset` | `mode` | `ready` | Document dimensions, Paper size | Choose target page format (A4, US Letter, Legal). |
| Documents | DOCX → PDF | **Typography theme** | `font-styling` | `option` | `ready` | Font theme, Document styling | Select clean typography styling for generated document. |
| Documents | DOCX → PDF | **Convert document** | `convert-output` | `output` | `ready` | Save document, Run converter | Transform document and download converted result. |
| Documents | PDF → DOCX | **Page size** | `page-size-preset` | `mode` | `soon` | Document dimensions, Paper size | Choose target page format (A4, US Letter, Legal). |
| Documents | PDF → DOCX | **Typography theme** | `font-styling` | `option` | `soon` | Font theme, Document styling | Select clean typography styling for generated document. |
| Documents | PDF → DOCX | **Convert document** | `convert-output` | `output` | `soon` | Save document, Run converter | Transform document and download converted result. |
| Documents | TXT → PDF | **Page size** | `page-size-preset` | `mode` | `ready` | Document dimensions, Paper size | Choose target page format (A4, US Letter, Legal). |
| Documents | TXT → PDF | **Typography theme** | `font-styling` | `option` | `ready` | Font theme, Document styling | Select clean typography styling for generated document. |
| Documents | TXT → PDF | **Convert document** | `convert-output` | `output` | `ready` | Save document, Run converter | Transform document and download converted result. |
| Documents | Markdown → PDF | **Page size** | `page-size-preset` | `mode` | `ready` | Document dimensions, Paper size | Choose target page format (A4, US Letter, Legal). |
| Documents | Markdown → PDF | **Typography theme** | `font-styling` | `option` | `ready` | Font theme, Document styling | Select clean typography styling for generated document. |
| Documents | Markdown → PDF | **Convert document** | `convert-output` | `output` | `ready` | Save document, Run converter | Transform document and download converted result. |
| Documents | HTML → PDF | **Page size** | `page-size-preset` | `mode` | `ready` | Document dimensions, Paper size | Choose target page format (A4, US Letter, Legal). |
| Documents | HTML → PDF | **Typography theme** | `font-styling` | `option` | `ready` | Font theme, Document styling | Select clean typography styling for generated document. |
| Documents | HTML → PDF | **Convert document** | `convert-output` | `output` | `ready` | Save document, Run converter | Transform document and download converted result. |
| Documents | RTF → PDF | **Page size** | `page-size-preset` | `mode` | `ready` | Document dimensions, Paper size | Choose target page format (A4, US Letter, Legal). |
| Documents | RTF → PDF | **Typography theme** | `font-styling` | `option` | `ready` | Font theme, Document styling | Select clean typography styling for generated document. |
| Documents | RTF → PDF | **Convert document** | `convert-output` | `output` | `ready` | Save document, Run converter | Transform document and download converted result. |
| Documents | Edit Text | **Word wrap** | `word-wrap` | `option` | `ready` | Wrap lines, Soft wrap | Toggle line wrapping in the document editing buffer. |
| Documents | Edit Text | **Live preview** | `editor-preview` | `mode` | `ready` | Formatted view, Rendered preview | Side-by-side formatted preview of document text. |
| Documents | Edit Text | **Clear editor** | `clear-editor` | `action` | `ready` | Reset buffer, Clear text | Reset document buffer to empty state. |
| Documents | Find and Replace | **Word wrap** | `word-wrap` | `option` | `ready` | Wrap lines, Soft wrap | Toggle line wrapping in the document editing buffer. |
| Documents | Find and Replace | **Live preview** | `editor-preview` | `mode` | `ready` | Formatted view, Rendered preview | Side-by-side formatted preview of document text. |
| Documents | Find and Replace | **Clear editor** | `clear-editor` | `action` | `ready` | Reset buffer, Clear text | Reset document buffer to empty state. |
| Documents | Document Statistics | **Word wrap** | `word-wrap` | `option` | `ready` | Wrap lines, Soft wrap | Toggle line wrapping in the document editing buffer. |
| Documents | Document Statistics | **Live preview** | `editor-preview` | `mode` | `ready` | Formatted view, Rendered preview | Side-by-side formatted preview of document text. |
| Documents | Document Statistics | **Clear editor** | `clear-editor` | `action` | `ready` | Reset buffer, Clear text | Reset document buffer to empty state. |
| Documents | Text Cleanup | **Word wrap** | `word-wrap` | `option` | `ready` | Wrap lines, Soft wrap | Toggle line wrapping in the document editing buffer. |
| Documents | Text Cleanup | **Live preview** | `editor-preview` | `mode` | `ready` | Formatted view, Rendered preview | Side-by-side formatted preview of document text. |
| Documents | Text Cleanup | **Clear editor** | `clear-editor` | `action` | `ready` | Reset buffer, Clear text | Reset document buffer to empty state. |
| Documents | Document Diff | **Side-by-side / Inline** | `diff-view-mode` | `mode` | `ready` | View mode, Dual pane | Toggle between dual-pane comparison and unified inline diff view. |
| Documents | Document Diff | **Ignore whitespace** | `ignore-whitespace-diff` | `option` | `ready` | Whitespace sensitivity, Trim diff | Disregard indentation, spaces, and line-ending differences. |
| Documents | Document Diff | **Copy diff summary** | `copy-diff-patch` | `action` | `ready` | Copy patch, Delta report | Copy delta statistics and changed lines to clipboard. |
| Documents | Export to PDF | **Include metadata header** | `include-header` | `option` | `ready` | Header banner, Export header | Prepend document title and export timestamp to file. |
| Documents | Export to PDF | **Download file** | `save-exported-doc` | `output` | `ready` | Export save, Write file | Save generated document directly to disk. |
| Documents | Export to TXT | **Include metadata header** | `include-header` | `option` | `ready` | Header banner, Export header | Prepend document title and export timestamp to file. |
| Documents | Export to TXT | **Download file** | `save-exported-doc` | `output` | `ready` | Export save, Write file | Save generated document directly to disk. |
| Documents | Export to HTML | **Include metadata header** | `include-header` | `option` | `ready` | Header banner, Export header | Prepend document title and export timestamp to file. |
| Documents | Export to HTML | **Download file** | `save-exported-doc` | `output` | `ready` | Export save, Write file | Save generated document directly to disk. |
| Documents | Export to Markdown | **Include metadata header** | `include-header` | `option` | `ready` | Header banner, Export header | Prepend document title and export timestamp to file. |
| Documents | Export to Markdown | **Download file** | `save-exported-doc` | `output` | `ready` | Export save, Write file | Save generated document directly to disk. |
| Images | Resize & Scale | **Px / Percent / Preset** | `resize-unit` | `mode` | `ready` | Dimension mode, Pixel percentage, Standard resolutions | Switch dimension scaling between exact pixels, percentages, and standard presets. |
| Images | Resize & Scale | **Lock aspect** | `lock-aspect` | `option` | `ready` | Keep aspect ratio, Proportional scaling, Constrain dimensions | Constrain width and height proportionally to prevent distortion. |
| Images | Resize & Scale | **Fit / Fill** | `fit-fill` | `mode` | `ready` | Canvas behavior, Pad or crop, Aspect fitting | Choose between letterbox padding or canvas cropping to match target aspect ratio. |
| Images | Resize & Scale | **Batch** | `batch-resize` | `batch` | `soon` | Bulk resize, Batch scale, Queue transform | Apply dimension transformations across multiple image files in one operation. |
| Images | Crop Image | **Transform mode** | `transform-mode` | `mode` | `ready` | Operation mode, Scale mode | Select exact dimensions or scale percentage. |
| Images | Crop Image | **Maintain aspect ratio** | `maintain-aspect` | `option` | `ready` | Constrain proportions, Aspect lock | Preserve original image width-to-height ratio. |
| Images | Crop Image | **Apply transformation** | `apply-transform` | `action` | `ready` | Render image, Apply | Render image modifications to canvas and export. |
| Images | Rotate & Flip | **Transform mode** | `transform-mode` | `mode` | `ready` | Operation mode, Scale mode | Select exact dimensions or scale percentage. |
| Images | Rotate & Flip | **Maintain aspect ratio** | `maintain-aspect` | `option` | `ready` | Constrain proportions, Aspect lock | Preserve original image width-to-height ratio. |
| Images | Rotate & Flip | **Apply transformation** | `apply-transform` | `action` | `ready` | Render image, Apply | Render image modifications to canvas and export. |
| Images | Aspect Ratio & Dimensions | **Transform mode** | `transform-mode` | `mode` | `ready` | Operation mode, Scale mode | Select exact dimensions or scale percentage. |
| Images | Aspect Ratio & Dimensions | **Maintain aspect ratio** | `maintain-aspect` | `option` | `ready` | Constrain proportions, Aspect lock | Preserve original image width-to-height ratio. |
| Images | Aspect Ratio & Dimensions | **Apply transformation** | `apply-transform` | `action` | `ready` | Render image, Apply | Render image modifications to canvas and export. |
| Images | Convert to JPG | **Quality** | `converter-quality` | `option` | `ready` | Export fidelity, Compression ratio, Quality setting | Fine-tune export compression quality and visual sharpness. |
| Images | Convert to JPG | **Background for transparency** | `bg-transparency` | `option` | `ready` | Matte color, Alpha replacement, Flatten transparency | Specify matte background color (white, black, or custom hex) when converting transparent PNGs. |
| Images | Convert to JPG | **Keep metadata** | `keep-metadata` | `option` | `soon` | Retain EXIF, Preserve tags, Copy metadata | Preserve camera settings, timestamps, and color profiles in converted file. |
| Images | Convert to JPG | **Batch zip** | `batch-zip` | `batch` | `ready` | Download ZIP, Batch conversion, Archive bundle | Convert multiple files simultaneously and bundle all outputs into a single ZIP archive. |
| Images | Convert to PNG | **Quality** | `converter-quality` | `option` | `ready` | Export fidelity, Compression ratio, Quality setting | Fine-tune export compression quality and visual sharpness. |
| Images | Convert to PNG | **Background for transparency** | `bg-transparency` | `option` | `ready` | Matte color, Alpha replacement, Flatten transparency | Specify matte background color (white, black, or custom hex) when converting transparent PNGs. |
| Images | Convert to PNG | **Keep metadata** | `keep-metadata` | `option` | `soon` | Retain EXIF, Preserve tags, Copy metadata | Preserve camera settings, timestamps, and color profiles in converted file. |
| Images | Convert to PNG | **Batch zip** | `batch-zip` | `batch` | `ready` | Download ZIP, Batch conversion, Archive bundle | Convert multiple files simultaneously and bundle all outputs into a single ZIP archive. |
| Images | Convert to WebP | **Quality** | `converter-quality` | `option` | `ready` | Export fidelity, Compression ratio, Quality setting | Fine-tune export compression quality and visual sharpness. |
| Images | Convert to WebP | **Background for transparency** | `bg-transparency` | `option` | `ready` | Matte color, Alpha replacement, Flatten transparency | Specify matte background color (white, black, or custom hex) when converting transparent PNGs. |
| Images | Convert to WebP | **Keep metadata** | `keep-metadata` | `option` | `soon` | Retain EXIF, Preserve tags, Copy metadata | Preserve camera settings, timestamps, and color profiles in converted file. |
| Images | Convert to WebP | **Batch zip** | `batch-zip` | `batch` | `ready` | Download ZIP, Batch conversion, Archive bundle | Convert multiple files simultaneously and bundle all outputs into a single ZIP archive. |
| Images | Convert to BMP | **Quality** | `converter-quality` | `option` | `ready` | Export fidelity, Compression ratio, Quality setting | Fine-tune export compression quality and visual sharpness. |
| Images | Convert to BMP | **Background for transparency** | `bg-transparency` | `option` | `ready` | Matte color, Alpha replacement, Flatten transparency | Specify matte background color (white, black, or custom hex) when converting transparent PNGs. |
| Images | Convert to BMP | **Keep metadata** | `keep-metadata` | `option` | `soon` | Retain EXIF, Preserve tags, Copy metadata | Preserve camera settings, timestamps, and color profiles in converted file. |
| Images | Convert to BMP | **Batch zip** | `batch-zip` | `batch` | `ready` | Download ZIP, Batch conversion, Archive bundle | Convert multiple files simultaneously and bundle all outputs into a single ZIP archive. |
| Images | Convert to TIFF | **Quality** | `converter-quality` | `option` | `ready` | Export fidelity, Compression ratio, Quality setting | Fine-tune export compression quality and visual sharpness. |
| Images | Convert to TIFF | **Background for transparency** | `bg-transparency` | `option` | `ready` | Matte color, Alpha replacement, Flatten transparency | Specify matte background color (white, black, or custom hex) when converting transparent PNGs. |
| Images | Convert to TIFF | **Keep metadata** | `keep-metadata` | `option` | `soon` | Retain EXIF, Preserve tags, Copy metadata | Preserve camera settings, timestamps, and color profiles in converted file. |
| Images | Convert to TIFF | **Batch zip** | `batch-zip` | `batch` | `ready` | Download ZIP, Batch conversion, Archive bundle | Convert multiple files simultaneously and bundle all outputs into a single ZIP archive. |
| Images | Compress Image | **Quality** | `quality-slider` | `option` | `ready` | Compression quality, Quality slider, JPEG fidelity | Fine-tune image compression ratio from 1% to 100% with immediate preview. |
| Images | Compress Image | **Target KB** | `target-kb` | `option` | `soon` | Target file size, Max KB, Size budget | Iteratively optimize compression to fit strictly under a maximum KB threshold. |
| Images | Compress Image | **Strip EXIF** | `strip-exif` | `option` | `ready` | Remove metadata, Clean EXIF, Privacy scrub | Remove camera model, geolocation GPS coordinates, and private EXIF tags. |
| Images | Compress Image | **Format** | `format-selection` | `output` | `ready` | Target format, Output image type, Encode format | Select output format between original, WebP, JPG, or PNG. |
| Images | Compress Image | **Batch folder** | `batch-folder` | `batch` | `soon` | Bulk folder, Directory compress, Batch queue | Compress entire directories of images with recursive subfolder scanning. |
| Images | Compress Image | **Before/after** | `before-after` | `action` | `ready` | Side-by-side view, Compare preview, Artifact check | Split-view visual comparison highlighting artifact boundaries and file savings. |
| Images | Resize during Compression | **Compression level** | `compression-slider` | `option` | `ready` | Quality, Optimization strength | Adjust quality slider to optimize byte size. |
| Images | Resize during Compression | **Output format** | `output-image-type` | `output` | `ready` | Target format, Save format | Save as WebP, JPG, or optimized PNG. |
| Images | Resize during Compression | **Savings preview** | `preview-delta` | `action` | `ready` | Byte savings, File size check | Calculate percentage file size reduction. |
| Images | Brightness & Contrast | **Intensity slider** | `adjustment-slider` | `option` | `ready` | Filter strength, Level | Fine-tune filter value from 0% to 200%. |
| Images | Brightness & Contrast | **Reset to neutral** | `reset-adjustments` | `action` | `ready` | Revert colors, Reset filter | Revert all color values back to original defaults. |
| Images | Brightness & Contrast | **Export image** | `export-adjusted` | `output` | `ready` | Save photo, Render picture | Save color-adjusted picture to image file. |
| Images | Saturation & Vibrance | **Intensity slider** | `adjustment-slider` | `option` | `ready` | Filter strength, Level | Fine-tune filter value from 0% to 200%. |
| Images | Saturation & Vibrance | **Reset to neutral** | `reset-adjustments` | `action` | `ready` | Revert colors, Reset filter | Revert all color values back to original defaults. |
| Images | Saturation & Vibrance | **Export image** | `export-adjusted` | `output` | `ready` | Save photo, Render picture | Save color-adjusted picture to image file. |
| Images | Blur & Grayscale | **Intensity slider** | `adjustment-slider` | `option` | `ready` | Filter strength, Level | Fine-tune filter value from 0% to 200%. |
| Images | Blur & Grayscale | **Reset to neutral** | `reset-adjustments` | `action` | `ready` | Revert colors, Reset filter | Revert all color values back to original defaults. |
| Images | Blur & Grayscale | **Export image** | `export-adjusted` | `output` | `ready` | Save photo, Render picture | Save color-adjusted picture to image file. |
| Images | EXIF Viewer | **Tag inspector** | `view-exif-tags` | `action` | `ready` | Inspect tags, Read metadata | Display table of all embedded camera and GPS parameters. |
| Images | EXIF Viewer | **Export as JSON** | `copy-metadata-json` | `output` | `ready` | Save JSON, Copy metadata | Export complete metadata dictionary as structured JSON. |
| Images | Remove EXIF | **Tag inspector** | `view-exif-tags` | `action` | `ready` | Inspect tags, Read metadata | Display table of all embedded camera and GPS parameters. |
| Images | Remove EXIF | **Export as JSON** | `copy-metadata-json` | `output` | `ready` | Save JSON, Copy metadata | Export complete metadata dictionary as structured JSON. |
| Images | Image Information | **Tag inspector** | `view-exif-tags` | `action` | `ready` | Inspect tags, Read metadata | Display table of all embedded camera and GPS parameters. |
| Images | Image Information | **Export as JSON** | `copy-metadata-json` | `output` | `ready` | Save JSON, Copy metadata | Export complete metadata dictionary as structured JSON. |
| Images | Multiple Images → PDF | **Fit to page** | `fit-page-mode` | `mode` | `ready` | Auto fit, Scale to page | Scale pictures to fit cleanly on PDF canvas without clipping. |
| Images | Multiple Images → PDF | **Build PDF document** | `generate-pdf-doc` | `output` | `ready` | Compile PDF, Export album | Compile all selected photos into a unified PDF file. |
| Data | CSV Table Viewer | **Filter** | `filter-rows` | `option` | `ready` | Table search, Row filter, Query cells | Quick search across all cells or apply column-specific query filters. |
| Data | CSV Table Viewer | **Sort** | `sort-columns` | `option` | `ready` | Order table, Sort headers, Column ordering | Sort table rows in ascending or descending alphanumeric order by column. |
| Data | CSV Table Viewer | **Column toggle** | `column-toggle` | `option` | `ready` | Visible columns, Hide fields, Column visibility | Show or hide selected columns to focus on essential data fields. |
| Data | CSV Table Viewer | **Delimiter and encoding detect** | `detect-delimiter` | `option` | `ready` | Delimiter detection, Auto delimiter, Encoding sniffer | Auto-detect whether input is comma, tab, semicolon, or pipe-delimited with UTF-8/ANSI decoding. |
| Data | CSV Table Viewer | **Export view** | `export-view` | `output` | `ready` | Download visible, Save filtered, Export grid | Export currently filtered and sorted rows to clean CSV, JSON, or Excel file. |
| Data | JSON Tree Viewer | **Search & filter** | `search-data` | `option` | `ready` | Quick search, Filter data | Instant search across all keys, fields, and records. |
| Data | JSON Tree Viewer | **Expand / collapse** | `expand-collapse-tree` | `action` | `ready` | Toggle nodes, Expand all | Toggle all nested hierarchy branches simultaneously. |
| Data | JSON Tree Viewer | **Export view** | `export-view-data` | `output` | `ready` | Save view, Export data | Save current table or tree view to disk. |
| Data | XML Tree Viewer | **Search & filter** | `search-data` | `option` | `ready` | Quick search, Filter data | Instant search across all keys, fields, and records. |
| Data | XML Tree Viewer | **Expand / collapse** | `expand-collapse-tree` | `action` | `ready` | Toggle nodes, Expand all | Toggle all nested hierarchy branches simultaneously. |
| Data | XML Tree Viewer | **Export view** | `export-view-data` | `output` | `ready` | Save view, Export data | Save current table or tree view to disk. |
| Data | YAML Viewer | **Search & filter** | `search-data` | `option` | `ready` | Quick search, Filter data | Instant search across all keys, fields, and records. |
| Data | YAML Viewer | **Expand / collapse** | `expand-collapse-tree` | `action` | `ready` | Toggle nodes, Expand all | Toggle all nested hierarchy branches simultaneously. |
| Data | YAML Viewer | **Export view** | `export-view-data` | `output` | `ready` | Save view, Export data | Save current table or tree view to disk. |
| Data | XLSX Viewer | **Search & filter** | `search-data` | `option` | `ready` | Quick search, Filter data | Instant search across all keys, fields, and records. |
| Data | XLSX Viewer | **Expand / collapse** | `expand-collapse-tree` | `action` | `ready` | Toggle nodes, Expand all | Toggle all nested hierarchy branches simultaneously. |
| Data | XLSX Viewer | **Export view** | `export-view-data` | `output` | `ready` | Save view, Export data | Save current table or tree view to disk. |
| Data | CSV ↔ JSON | **Parse options** | `parse-options` | `option` | `ready` | Conversion settings, Type casting | Configure headers, delimiter characters, and type inferencing. |
| Data | CSV ↔ JSON | **Output format** | `output-schema` | `output` | `ready` | Target structure, Save format | Select target serialization format and indentation. |
| Data | CSV ↔ JSON | **Copy converted data** | `copy-converted` | `action` | `ready` | Quick copy, Clipboard export | Copy converted data structure directly to clipboard. |
| Data | CSV ↔ XLSX | **Parse options** | `parse-options` | `option` | `ready` | Conversion settings, Type casting | Configure headers, delimiter characters, and type inferencing. |
| Data | CSV ↔ XLSX | **Output format** | `output-schema` | `output` | `ready` | Target structure, Save format | Select target serialization format and indentation. |
| Data | CSV ↔ XLSX | **Copy converted data** | `copy-converted` | `action` | `ready` | Quick copy, Clipboard export | Copy converted data structure directly to clipboard. |
| Data | JSON ↔ YAML | **Parse options** | `parse-options` | `option` | `ready` | Conversion settings, Type casting | Configure headers, delimiter characters, and type inferencing. |
| Data | JSON ↔ YAML | **Output format** | `output-schema` | `output` | `ready` | Target structure, Save format | Select target serialization format and indentation. |
| Data | JSON ↔ YAML | **Copy converted data** | `copy-converted` | `action` | `ready` | Quick copy, Clipboard export | Copy converted data structure directly to clipboard. |
| Data | XML ↔ JSON | **Parse options** | `parse-options` | `option` | `ready` | Conversion settings, Type casting | Configure headers, delimiter characters, and type inferencing. |
| Data | XML ↔ JSON | **Output format** | `output-schema` | `output` | `ready` | Target structure, Save format | Select target serialization format and indentation. |
| Data | XML ↔ JSON | **Copy converted data** | `copy-converted` | `action` | `ready` | Quick copy, Clipboard export | Copy converted data structure directly to clipboard. |
| Data | Sort & Filter | **Transformation rule** | `transformation-rule` | `option` | `ready` | Rules, Transform query | Select sort criteria, filter expressions, or column mappings. |
| Data | Sort & Filter | **Case sensitivity** | `case-sensitivity` | `option` | `ready` | Case match, Strict comparison | Match data values with strict or lenient case comparison. |
| Data | Sort & Filter | **Apply transform** | `apply-data-transform` | `action` | `ready` | Run transform, Execute data query | Process table records and show updated dataset. |
| Data | Remove Duplicates | **Transformation rule** | `transformation-rule` | `option` | `ready` | Rules, Transform query | Select sort criteria, filter expressions, or column mappings. |
| Data | Remove Duplicates | **Case sensitivity** | `case-sensitivity` | `option` | `ready` | Case match, Strict comparison | Match data values with strict or lenient case comparison. |
| Data | Remove Duplicates | **Apply transform** | `apply-data-transform` | `action` | `ready` | Run transform, Execute data query | Process table records and show updated dataset. |
| Data | Select & Rename Columns | **Transformation rule** | `transformation-rule` | `option` | `ready` | Rules, Transform query | Select sort criteria, filter expressions, or column mappings. |
| Data | Select & Rename Columns | **Case sensitivity** | `case-sensitivity` | `option` | `ready` | Case match, Strict comparison | Match data values with strict or lenient case comparison. |
| Data | Select & Rename Columns | **Apply transform** | `apply-data-transform` | `action` | `ready` | Run transform, Execute data query | Process table records and show updated dataset. |
| Data | Format Values | **Transformation rule** | `transformation-rule` | `option` | `ready` | Rules, Transform query | Select sort criteria, filter expressions, or column mappings. |
| Data | Format Values | **Case sensitivity** | `case-sensitivity` | `option` | `ready` | Case match, Strict comparison | Match data values with strict or lenient case comparison. |
| Data | Format Values | **Apply transform** | `apply-data-transform` | `action` | `ready` | Run transform, Execute data query | Process table records and show updated dataset. |
| Data | JSON Validation | **Jump to error** | `jump-to-error` | `action` | `ready` | Find error, Go to line | Locate and focus cursor on exact line of syntax error. |
| Data | JSON Validation | **Strict schema check** | `strict-validation` | `option` | `ready` | Strict mode, Linter check | Enforce strict schema rules and type conformity. |
| Data | XML Validation | **Jump to error** | `jump-to-error` | `action` | `ready` | Find error, Go to line | Locate and focus cursor on exact line of syntax error. |
| Data | XML Validation | **Strict schema check** | `strict-validation` | `option` | `ready` | Strict mode, Linter check | Enforce strict schema rules and type conformity. |
| Data | CSV Validation | **Jump to error** | `jump-to-error` | `action` | `ready` | Find error, Go to line | Locate and focus cursor on exact line of syntax error. |
| Data | CSV Validation | **Strict schema check** | `strict-validation` | `option` | `ready` | Strict mode, Linter check | Enforce strict schema rules and type conformity. |
| Data | YAML Validation | **Jump to error** | `jump-to-error` | `action` | `ready` | Find error, Go to line | Locate and focus cursor on exact line of syntax error. |
| Data | YAML Validation | **Strict schema check** | `strict-validation` | `option` | `ready` | Strict mode, Linter check | Enforce strict schema rules and type conformity. |
| Data | JSON Formatter | **Indent size** | `indent-size` | `option` | `ready` | Tab size, Spaces or tabs, Indentation depth | Set indentation spacing to 2 spaces, 4 spaces, or tab characters. |
| Data | JSON Formatter | **Sort keys** | `sort-keys` | `option` | `ready` | Order keys, Alphabetical JSON, Sort properties | Alphabetize object property keys alphabetically at all nesting depths. |
| Data | JSON Formatter | **Minify** | `minify-json` | `action` | `ready` | Compact JSON, Compress JSON, One-line JSON | Remove all unnecessary whitespace, comments, and newlines for compact payloads. |
| Data | JSON Formatter | **Error line** | `error-line` | `option` | `ready` | Syntax check, Error indicator, Line highlight | Pinpoint and highlight syntax errors with line and column indicators. |
| Data | JSON Formatter | **Tree view** | `tree-view` | `mode` | `ready` | Node explorer, Collapsible tree, Visual JSON | Switch between formatted code editor and collapsible interactive JSON node tree. |
| Data | XML Formatter | **Indentation spacing** | `format-indent-setting` | `option` | `ready` | Indent size, Format spacing | Set indentation to 2 spaces, 4 spaces, or tabs. |
| Data | XML Formatter | **Sort dictionary keys** | `sort-formatted-keys` | `option` | `ready` | Sort keys, Order properties | Alphabetize object property keys alphabetically. |
| Data | XML Formatter | **Copy formatted output** | `copy-formatted-code` | `action` | `ready` | Copy code, Export formatted | Copy clean indented text to clipboard. |
| Data | YAML Formatting | **Indentation spacing** | `format-indent-setting` | `option` | `ready` | Indent size, Format spacing | Set indentation to 2 spaces, 4 spaces, or tabs. |
| Data | YAML Formatting | **Sort dictionary keys** | `sort-formatted-keys` | `option` | `ready` | Sort keys, Order properties | Alphabetize object property keys alphabetically. |
| Data | YAML Formatting | **Copy formatted output** | `copy-formatted-code` | `action` | `ready` | Copy code, Export formatted | Copy clean indented text to clipboard. |
| Text | Case Conversion | **Case / direction mode** | `conversion-target` | `mode` | `ready` | Transform mode, Case target | Select target case styling or reversal orientation. |
| Text | Case Conversion | **Transform text** | `apply-text-transform` | `action` | `ready` | Execute transform, Update text | Apply transformation to active text buffer. |
| Text | Case Conversion | **Copy result** | `copy-text-result` | `action` | `ready` | Copy string, Quick copy | Copy transformed string to clipboard. |
| Text | Reverse Text | **Case / direction mode** | `conversion-target` | `mode` | `ready` | Transform mode, Case target | Select target case styling or reversal orientation. |
| Text | Reverse Text | **Transform text** | `apply-text-transform` | `action` | `ready` | Execute transform, Update text | Apply transformation to active text buffer. |
| Text | Reverse Text | **Copy result** | `copy-text-result` | `action` | `ready` | Copy string, Quick copy | Copy transformed string to clipboard. |
| Text | Sort Lines | **Case / direction mode** | `conversion-target` | `mode` | `ready` | Transform mode, Case target | Select target case styling or reversal orientation. |
| Text | Sort Lines | **Transform text** | `apply-text-transform` | `action` | `ready` | Execute transform, Update text | Apply transformation to active text buffer. |
| Text | Sort Lines | **Copy result** | `copy-text-result` | `action` | `ready` | Copy string, Quick copy | Copy transformed string to clipboard. |
| Text | Deduplicate Lines | **Case / direction mode** | `conversion-target` | `mode` | `ready` | Transform mode, Case target | Select target case styling or reversal orientation. |
| Text | Deduplicate Lines | **Transform text** | `apply-text-transform` | `action` | `ready` | Execute transform, Update text | Apply transformation to active text buffer. |
| Text | Deduplicate Lines | **Copy result** | `copy-text-result` | `action` | `ready` | Copy string, Quick copy | Copy transformed string to clipboard. |
| Text | Remove Extra Spaces | **Cleaning scope** | `cleaner-scope` | `option` | `ready` | Clean rules, Whitespace filter | Select which whitespace or control characters to strip. |
| Text | Remove Extra Spaces | **Clean buffer** | `run-cleaner` | `action` | `ready` | Sanitize buffer, Clean text | Normalize text and remove unwanted characters. |
| Text | Remove Blank Lines | **Cleaning scope** | `cleaner-scope` | `option` | `ready` | Clean rules, Whitespace filter | Select which whitespace or control characters to strip. |
| Text | Remove Blank Lines | **Clean buffer** | `run-cleaner` | `action` | `ready` | Sanitize buffer, Clean text | Normalize text and remove unwanted characters. |
| Text | Invisible Characters Cleanup | **Cleaning scope** | `cleaner-scope` | `option` | `ready` | Clean rules, Whitespace filter | Select which whitespace or control characters to strip. |
| Text | Invisible Characters Cleanup | **Clean buffer** | `run-cleaner` | `action` | `ready` | Sanitize buffer, Clean text | Normalize text and remove unwanted characters. |
| Text | Line-Ending Normalization | **Cleaning scope** | `cleaner-scope` | `option` | `ready` | Clean rules, Whitespace filter | Select which whitespace or control characters to strip. |
| Text | Line-Ending Normalization | **Clean buffer** | `run-cleaner` | `action` | `ready` | Sanitize buffer, Clean text | Normalize text and remove unwanted characters. |
| Text | Text Statistics | **Live metric counter** | `live-metrics` | `option` | `ready` | Realtime stats, Auto update | Continuously recalculate counts as you type. |
| Text | Text Statistics | **Copy metrics report** | `copy-metrics` | `action` | `ready` | Copy report, Save counts | Copy text summary statistics to clipboard. |
| Text | Reading Time | **Live metric counter** | `live-metrics` | `option` | `ready` | Realtime stats, Auto update | Continuously recalculate counts as you type. |
| Text | Reading Time | **Copy metrics report** | `copy-metrics` | `action` | `ready` | Copy report, Save counts | Copy text summary statistics to clipboard. |
| Text | Base64 | **Encode / Decode** | `codec-direction` | `mode` | `ready` | Direction, Encode or decode | Toggle between encoding raw string and decoding encoded representation. |
| Text | Base64 | **URL-safe variant** | `url-safe-mode` | `option` | `ready` | Web safe, URL safe | Use URL-safe character replacements (- and _) for web compatibility. |
| Text | Base64 | **Copy output** | `copy-encoded-output` | `action` | `ready` | Copy result, Clipboard | Copy resulting encoded or decoded string. |
| Text | URL Encoding | **Encode / Decode** | `codec-direction` | `mode` | `ready` | Direction, Encode or decode | Toggle between encoding raw string and decoding encoded representation. |
| Text | URL Encoding | **URL-safe variant** | `url-safe-mode` | `option` | `ready` | Web safe, URL safe | Use URL-safe character replacements (- and _) for web compatibility. |
| Text | URL Encoding | **Copy output** | `copy-encoded-output` | `action` | `ready` | Copy result, Clipboard | Copy resulting encoded or decoded string. |
| Text | HTML Encoding | **Encode / Decode** | `codec-direction` | `mode` | `ready` | Direction, Encode or decode | Toggle between encoding raw string and decoding encoded representation. |
| Text | HTML Encoding | **URL-safe variant** | `url-safe-mode` | `option` | `ready` | Web safe, URL safe | Use URL-safe character replacements (- and _) for web compatibility. |
| Text | HTML Encoding | **Copy output** | `copy-encoded-output` | `action` | `ready` | Copy result, Clipboard | Copy resulting encoded or decoded string. |
| Text | Unicode Tool | **Encode / Decode** | `codec-direction` | `mode` | `ready` | Direction, Encode or decode | Toggle between encoding raw string and decoding encoded representation. |
| Text | Unicode Tool | **URL-safe variant** | `url-safe-mode` | `option` | `ready` | Web safe, URL safe | Use URL-safe character replacements (- and _) for web compatibility. |
| Text | Unicode Tool | **Copy output** | `copy-encoded-output` | `action` | `ready` | Copy result, Clipboard | Copy resulting encoded or decoded string. |
| Text | Text Diff | **Side-by-side / Inline** | `text-diff-mode` | `mode` | `ready` | Diff mode, Dual pane | Switch between split view and unified line diff. |
| Text | Text Diff | **Ignore case differences** | `ignore-casing` | `option` | `ready` | Case insensitive, Ignore case | Treat uppercase and lowercase characters as equal. |
| Developer | JSON Formatter | **Indent size** | `indent-size` | `option` | `ready` | Tab size, Spaces or tabs, Indentation depth | Set indentation spacing to 2 spaces, 4 spaces, or tab characters. |
| Developer | JSON Formatter | **Sort keys** | `sort-keys` | `option` | `ready` | Order keys, Alphabetical JSON, Sort properties | Alphabetize object property keys alphabetically at all nesting depths. |
| Developer | JSON Formatter | **Minify** | `minify-json` | `action` | `ready` | Compact JSON, Compress JSON, One-line JSON | Remove all unnecessary whitespace, comments, and newlines for compact payloads. |
| Developer | JSON Formatter | **Error line** | `error-line` | `option` | `ready` | Syntax check, Error indicator, Line highlight | Pinpoint and highlight syntax errors with line and column indicators. |
| Developer | JSON Formatter | **Tree view** | `tree-view` | `mode` | `ready` | Node explorer, Collapsible tree, Visual JSON | Switch between formatted code editor and collapsible interactive JSON node tree. |
| Developer | HTML Formatter | **Indentation spacing** | `code-indent-size` | `option` | `ready` | Indentation depth, Tabs spaces | Select 2 spaces, 4 spaces, or tab indentation. |
| Developer | HTML Formatter | **Minify code** | `minify-code-action` | `action` | `ready` | Minify, Compact code | Strip all comments and whitespace for production distribution. |
| Developer | HTML Formatter | **Copy formatted code** | `copy-code-result` | `action` | `ready` | Copy code, Export | Copy beautified syntax to clipboard. |
| Developer | CSS Formatter | **Indentation spacing** | `code-indent-size` | `option` | `ready` | Indentation depth, Tabs spaces | Select 2 spaces, 4 spaces, or tab indentation. |
| Developer | CSS Formatter | **Minify code** | `minify-code-action` | `action` | `ready` | Minify, Compact code | Strip all comments and whitespace for production distribution. |
| Developer | CSS Formatter | **Copy formatted code** | `copy-code-result` | `action` | `ready` | Copy code, Export | Copy beautified syntax to clipboard. |
| Developer | JavaScript Formatter | **Indentation spacing** | `code-indent-size` | `option` | `ready` | Indentation depth, Tabs spaces | Select 2 spaces, 4 spaces, or tab indentation. |
| Developer | JavaScript Formatter | **Minify code** | `minify-code-action` | `action` | `ready` | Minify, Compact code | Strip all comments and whitespace for production distribution. |
| Developer | JavaScript Formatter | **Copy formatted code** | `copy-code-result` | `action` | `ready` | Copy code, Export | Copy beautified syntax to clipboard. |
| Developer | XML Formatter | **Indentation spacing** | `code-indent-size` | `option` | `ready` | Indentation depth, Tabs spaces | Select 2 spaces, 4 spaces, or tab indentation. |
| Developer | XML Formatter | **Minify code** | `minify-code-action` | `action` | `ready` | Minify, Compact code | Strip all comments and whitespace for production distribution. |
| Developer | XML Formatter | **Copy formatted code** | `copy-code-result` | `action` | `ready` | Copy code, Export | Copy beautified syntax to clipboard. |
| Developer | SQL Formatter | **Indentation spacing** | `code-indent-size` | `option` | `ready` | Indentation depth, Tabs spaces | Select 2 spaces, 4 spaces, or tab indentation. |
| Developer | SQL Formatter | **Minify code** | `minify-code-action` | `action` | `ready` | Minify, Compact code | Strip all comments and whitespace for production distribution. |
| Developer | SQL Formatter | **Copy formatted code** | `copy-code-result` | `action` | `ready` | Copy code, Export | Copy beautified syntax to clipboard. |
| Developer | Base64 | **Encode / Decode** | `codec-mode-select` | `mode` | `ready` | Mode, Direction | Switch between encoding and decoding operations. |
| Developer | Base64 | **Inspect claims** | `jwt-verify-sig` | `action` | `ready` | Token claims, Check expiry | Inspect token expiration timestamp and payload claims. |
| Developer | Base64 | **Copy payload JSON** | `copy-decoded-token` | `output` | `ready` | Copy claims, Export JSON | Copy decoded JWT claims as formatted JSON. |
| Developer | URL Encoding | **Encode / Decode** | `codec-mode-select` | `mode` | `ready` | Mode, Direction | Switch between encoding and decoding operations. |
| Developer | URL Encoding | **Inspect claims** | `jwt-verify-sig` | `action` | `ready` | Token claims, Check expiry | Inspect token expiration timestamp and payload claims. |
| Developer | URL Encoding | **Copy payload JSON** | `copy-decoded-token` | `output` | `ready` | Copy claims, Export JSON | Copy decoded JWT claims as formatted JSON. |
| Developer | JWT Inspector | **Encode / Decode** | `codec-mode-select` | `mode` | `ready` | Mode, Direction | Switch between encoding and decoding operations. |
| Developer | JWT Inspector | **Inspect claims** | `jwt-verify-sig` | `action` | `ready` | Token claims, Check expiry | Inspect token expiration timestamp and payload claims. |
| Developer | JWT Inspector | **Copy payload JSON** | `copy-decoded-token` | `output` | `ready` | Copy claims, Export JSON | Copy decoded JWT claims as formatted JSON. |
| Developer | URL Components | **Encode / Decode** | `codec-mode-select` | `mode` | `ready` | Mode, Direction | Switch between encoding and decoding operations. |
| Developer | URL Components | **Inspect claims** | `jwt-verify-sig` | `action` | `ready` | Token claims, Check expiry | Inspect token expiration timestamp and payload claims. |
| Developer | URL Components | **Copy payload JSON** | `copy-decoded-token` | `output` | `ready` | Copy claims, Export JSON | Copy decoded JWT claims as formatted JSON. |
| Developer | UUID Generator | **Quantity count** | `generator-count` | `option` | `ready` | Batch count, Amount | Number of random values or UUIDs to generate at once. |
| Developer | UUID Generator | **Character complexity** | `include-special-chars` | `option` | `ready` | Symbols, Complexity | Toggle uppercase, lowercase, numbers, and symbols. |
| Developer | UUID Generator | **Regenerate** | `generate-new-batch` | `action` | `ready` | Refresh values, Reroll | Generate fresh set of random values. |
| Developer | Random String | **Quantity count** | `generator-count` | `option` | `ready` | Batch count, Amount | Number of random values or UUIDs to generate at once. |
| Developer | Random String | **Character complexity** | `include-special-chars` | `option` | `ready` | Symbols, Complexity | Toggle uppercase, lowercase, numbers, and symbols. |
| Developer | Random String | **Regenerate** | `generate-new-batch` | `action` | `ready` | Refresh values, Reroll | Generate fresh set of random values. |
| Developer | Timestamp | **Quantity count** | `generator-count` | `option` | `ready` | Batch count, Amount | Number of random values or UUIDs to generate at once. |
| Developer | Timestamp | **Character complexity** | `include-special-chars` | `option` | `ready` | Symbols, Complexity | Toggle uppercase, lowercase, numbers, and symbols. |
| Developer | Timestamp | **Regenerate** | `generate-new-batch` | `action` | `ready` | Refresh values, Reroll | Generate fresh set of random values. |
| Developer | Random Number | **Quantity count** | `generator-count` | `option` | `ready` | Batch count, Amount | Number of random values or UUIDs to generate at once. |
| Developer | Random Number | **Character complexity** | `include-special-chars` | `option` | `ready` | Symbols, Complexity | Toggle uppercase, lowercase, numbers, and symbols. |
| Developer | Random Number | **Regenerate** | `generate-new-batch` | `action` | `ready` | Refresh values, Reroll | Generate fresh set of random values. |
| Developer | Test Data | **Quantity count** | `generator-count` | `option` | `ready` | Batch count, Amount | Number of random values or UUIDs to generate at once. |
| Developer | Test Data | **Character complexity** | `include-special-chars` | `option` | `ready` | Symbols, Complexity | Toggle uppercase, lowercase, numbers, and symbols. |
| Developer | Test Data | **Regenerate** | `generate-new-batch` | `action` | `ready` | Refresh values, Reroll | Generate fresh set of random values. |
| Developer | Regex Tester | **Regex flags (g, i, m, s)** | `regex-flags` | `option` | `ready` | Flags, Modifiers | Toggle Global, Case-Insensitive, Multiline, and DotAll flags. |
| Developer | Regex Tester | **Capture groups inspector** | `group-inspector` | `action` | `ready` | Groups view, Capture list | Inspect matched capture groups and index offsets in real time. |
| Developer | Regex Tester | **Replacement preview** | `substitution-preview` | `option` | `ready` | Replace preview, Substitution test | Test regex substitution templates with $1 and $2 tokens. |
| Developer | URL Parser | **Query param editor** | `url-query-builder` | `option` | `ready` | Params editor, Query table | Interactive key-value table to modify URL parameters. |
| Developer | URL Parser | **Copy parsed JSON** | `copy-parsed-url` | `output` | `ready` | Copy URL JSON, Export breakdown | Export URL breakdown into structured JSON object. |
| Developer | HTTP Headers | **Query param editor** | `url-query-builder` | `option` | `ready` | Params editor, Query table | Interactive key-value table to modify URL parameters. |
| Developer | HTTP Headers | **Copy parsed JSON** | `copy-parsed-url` | `output` | `ready` | Copy URL JSON, Export breakdown | Export URL breakdown into structured JSON object. |
| Developer | Query String | **Query param editor** | `url-query-builder` | `option` | `ready` | Params editor, Query table | Interactive key-value table to modify URL parameters. |
| Developer | Query String | **Copy parsed JSON** | `copy-parsed-url` | `output` | `ready` | Copy URL JSON, Export breakdown | Export URL breakdown into structured JSON object. |
| Developer | HTTP Status Reference | **Query param editor** | `url-query-builder` | `option` | `ready` | Params editor, Query table | Interactive key-value table to modify URL parameters. |
| Developer | HTTP Status Reference | **Copy parsed JSON** | `copy-parsed-url` | `output` | `ready` | Copy URL JSON, Export breakdown | Export URL breakdown into structured JSON object. |
| Calculator & Converters | Basic Calculator | **Calculation mode** | `calculation-mode` | `mode` | `ready` | Mode switcher, Operation type | Select arithmetic formula or conversion unit. |
| Calculator & Converters | Basic Calculator | **Copy result** | `copy-math-result` | `action` | `ready` | Copy answer, Save result | Copy numeric calculation result to clipboard. |
| Calculator & Converters | Basic Calculator | **Decimal precision** | `precision-slider` | `option` | `ready` | Decimals, Rounding | Control number of decimal places in calculated output. |
| Calculator & Converters | Percentage | **Calculation mode** | `calculation-mode` | `mode` | `ready` | Mode switcher, Operation type | Select arithmetic formula or conversion unit. |
| Calculator & Converters | Percentage | **Copy result** | `copy-math-result` | `action` | `ready` | Copy answer, Save result | Copy numeric calculation result to clipboard. |
| Calculator & Converters | Percentage | **Decimal precision** | `precision-slider` | `option` | `ready` | Decimals, Rounding | Control number of decimal places in calculated output. |
| Calculator & Converters | Discount | **Calculation mode** | `calculation-mode` | `mode` | `ready` | Mode switcher, Operation type | Select arithmetic formula or conversion unit. |
| Calculator & Converters | Discount | **Copy result** | `copy-math-result` | `action` | `ready` | Copy answer, Save result | Copy numeric calculation result to clipboard. |
| Calculator & Converters | Discount | **Decimal precision** | `precision-slider` | `option` | `ready` | Decimals, Rounding | Control number of decimal places in calculated output. |
| Calculator & Converters | Ratio & Proportion | **Calculation mode** | `calculation-mode` | `mode` | `ready` | Mode switcher, Operation type | Select arithmetic formula or conversion unit. |
| Calculator & Converters | Ratio & Proportion | **Copy result** | `copy-math-result` | `action` | `ready` | Copy answer, Save result | Copy numeric calculation result to clipboard. |
| Calculator & Converters | Ratio & Proportion | **Decimal precision** | `precision-slider` | `option` | `ready` | Decimals, Rounding | Control number of decimal places in calculated output. |
| Calculator & Converters | Scientific Calculator | **Calculation mode** | `calculation-mode` | `mode` | `ready` | Mode switcher, Operation type | Select arithmetic formula or conversion unit. |
| Calculator & Converters | Scientific Calculator | **Copy result** | `copy-math-result` | `action` | `ready` | Copy answer, Save result | Copy numeric calculation result to clipboard. |
| Calculator & Converters | Scientific Calculator | **Decimal precision** | `precision-slider` | `option` | `ready` | Decimals, Rounding | Control number of decimal places in calculated output. |
| Calculator & Converters | Constants | **Calculation mode** | `calculation-mode` | `mode` | `ready` | Mode switcher, Operation type | Select arithmetic formula or conversion unit. |
| Calculator & Converters | Constants | **Copy result** | `copy-math-result` | `action` | `ready` | Copy answer, Save result | Copy numeric calculation result to clipboard. |
| Calculator & Converters | Constants | **Decimal precision** | `precision-slider` | `option` | `ready` | Decimals, Rounding | Control number of decimal places in calculated output. |
| Calculator & Converters | Fractions | **Calculation mode** | `calculation-mode` | `mode` | `ready` | Mode switcher, Operation type | Select arithmetic formula or conversion unit. |
| Calculator & Converters | Fractions | **Copy result** | `copy-math-result` | `action` | `ready` | Copy answer, Save result | Copy numeric calculation result to clipboard. |
| Calculator & Converters | Fractions | **Decimal precision** | `precision-slider` | `option` | `ready` | Decimals, Rounding | Control number of decimal places in calculated output. |
| Calculator & Converters | Statistics | **Calculation mode** | `calculation-mode` | `mode` | `ready` | Mode switcher, Operation type | Select arithmetic formula or conversion unit. |
| Calculator & Converters | Statistics | **Copy result** | `copy-math-result` | `action` | `ready` | Copy answer, Save result | Copy numeric calculation result to clipboard. |
| Calculator & Converters | Statistics | **Decimal precision** | `precision-slider` | `option` | `ready` | Decimals, Rounding | Control number of decimal places in calculated output. |
| Calculator & Converters | Equations | **Calculation mode** | `calculation-mode` | `mode` | `ready` | Mode switcher, Operation type | Select arithmetic formula or conversion unit. |
| Calculator & Converters | Equations | **Copy result** | `copy-math-result` | `action` | `ready` | Copy answer, Save result | Copy numeric calculation result to clipboard. |
| Calculator & Converters | Equations | **Decimal precision** | `precision-slider` | `option` | `ready` | Decimals, Rounding | Control number of decimal places in calculated output. |
| Calculator & Converters | Ohm's Law | **Calculation mode** | `calculation-mode` | `mode` | `ready` | Mode switcher, Operation type | Select arithmetic formula or conversion unit. |
| Calculator & Converters | Ohm's Law | **Copy result** | `copy-math-result` | `action` | `ready` | Copy answer, Save result | Copy numeric calculation result to clipboard. |
| Calculator & Converters | Ohm's Law | **Decimal precision** | `precision-slider` | `option` | `ready` | Decimals, Rounding | Control number of decimal places in calculated output. |
| Calculator & Converters | Electrical Power | **Calculation mode** | `calculation-mode` | `mode` | `ready` | Mode switcher, Operation type | Select arithmetic formula or conversion unit. |
| Calculator & Converters | Electrical Power | **Copy result** | `copy-math-result` | `action` | `ready` | Copy answer, Save result | Copy numeric calculation result to clipboard. |
| Calculator & Converters | Electrical Power | **Decimal precision** | `precision-slider` | `option` | `ready` | Decimals, Rounding | Control number of decimal places in calculated output. |
| Calculator & Converters | Unit Converter | **Calculation mode** | `calculation-mode` | `mode` | `ready` | Mode switcher, Operation type | Select arithmetic formula or conversion unit. |
| Calculator & Converters | Unit Converter | **Copy result** | `copy-math-result` | `action` | `ready` | Copy answer, Save result | Copy numeric calculation result to clipboard. |
| Calculator & Converters | Unit Converter | **Decimal precision** | `precision-slider` | `option` | `ready` | Decimals, Rounding | Control number of decimal places in calculated output. |
| Files & Archives | Batch Rename | **Pattern** | `rename-pattern` | `option` | `ready` | Name template, Filename pattern, Token formatting | Define file naming templates with prefix, suffix, and metadata tokens. |
| Files & Archives | Batch Rename | **Numbering** | `sequential-numbering` | `option` | `ready` | Numeric sequence, Counter padding, File counter | Append sequential index numbers with configurable starting value and zero-padding. |
| Files & Archives | Batch Rename | **Case conversion** | `case-conversion` | `mode` | `ready` | Change case, Filename casing, Title case | Transform file names to lowercase, UPPERCASE, Title Case, or kebab-case. |
| Files & Archives | Batch Rename | **Regex** | `regex-rename` | `option` | `ready` | RegEx replace, Capture group rename, Pattern substitution | Perform regular expression find-and-replace on file names using capture groups. |
| Files & Archives | Batch Rename | **Live preview** | `live-preview` | `action` | `ready` | Preview changes, Dry run, Rename diff | Display real-time before-and-after table of planned file renames before committing. |
| Files & Archives | Batch Rename | **Undo** | `undo-rename` | `action` | `soon` | Rollback rename, Revert filenames, History undo | Revert the most recent batch rename operation back to original file names. |
| Files & Archives | File Type Detection | **Hash algorithm (SHA256, MD5)** | `hash-algorithm-select` | `mode` | `ready` | Checksum type, Hash algorithm | Select cryptographic hash algorithm for comparison and integrity checks. |
| Files & Archives | File Type Detection | **Export checksums** | `export-checksum-file` | `output` | `ready` | Save checksum, Hash report | Save calculated checksums to .sha256 or .md5 verification file. |
| Files & Archives | File Type Detection | **Copy hash** | `copy-hash-result` | `action` | `ready` | Copy fingerprint, Copy digest | Copy calculated fingerprint to clipboard. |
| Files & Archives | File Metadata & Size | **Hash algorithm (SHA256, MD5)** | `hash-algorithm-select` | `mode` | `ready` | Checksum type, Hash algorithm | Select cryptographic hash algorithm for comparison and integrity checks. |
| Files & Archives | File Metadata & Size | **Export checksums** | `export-checksum-file` | `output` | `ready` | Save checksum, Hash report | Save calculated checksums to .sha256 or .md5 verification file. |
| Files & Archives | File Metadata & Size | **Copy hash** | `copy-hash-result` | `action` | `ready` | Copy fingerprint, Copy digest | Copy calculated fingerprint to clipboard. |
| Files & Archives | File Analyzer | **Hash algorithm (SHA256, MD5)** | `hash-algorithm-select` | `mode` | `ready` | Checksum type, Hash algorithm | Select cryptographic hash algorithm for comparison and integrity checks. |
| Files & Archives | File Analyzer | **Export checksums** | `export-checksum-file` | `output` | `ready` | Save checksum, Hash report | Save calculated checksums to .sha256 or .md5 verification file. |
| Files & Archives | File Analyzer | **Copy hash** | `copy-hash-result` | `action` | `ready` | Copy fingerprint, Copy digest | Copy calculated fingerprint to clipboard. |
| Files & Archives | Duplicate Finder | **Hash algorithm (SHA256, MD5)** | `hash-algorithm-select` | `mode` | `ready` | Checksum type, Hash algorithm | Select cryptographic hash algorithm for comparison and integrity checks. |
| Files & Archives | Duplicate Finder | **Export checksums** | `export-checksum-file` | `output` | `ready` | Save checksum, Hash report | Save calculated checksums to .sha256 or .md5 verification file. |
| Files & Archives | Duplicate Finder | **Copy hash** | `copy-hash-result` | `action` | `ready` | Copy fingerprint, Copy digest | Copy calculated fingerprint to clipboard. |
| Files & Archives | File Comparison | **Hash algorithm (SHA256, MD5)** | `hash-algorithm-select` | `mode` | `ready` | Checksum type, Hash algorithm | Select cryptographic hash algorithm for comparison and integrity checks. |
| Files & Archives | File Comparison | **Export checksums** | `export-checksum-file` | `output` | `ready` | Save checksum, Hash report | Save calculated checksums to .sha256 or .md5 verification file. |
| Files & Archives | File Comparison | **Copy hash** | `copy-hash-result` | `action` | `ready` | Copy fingerprint, Copy digest | Copy calculated fingerprint to clipboard. |
| Files & Archives | Create ZIP | **Archive compression** | `compression-method` | `mode` | `ready` | ZIP compression, Archive level | Select Store, Standard, or Best compression level. |
| Files & Archives | Create ZIP | **Search archive tree** | `search-archive-files` | `option` | `ready` | Find file in zip, Search archive | Filter files and folders inside archive without extracting. |
| Files & Archives | Create ZIP | **Extract archive** | `extract-archive-action` | `action` | `ready` | Unzip files, Unpack | Unpack files to destination directory. |
| Files & Archives | Extract ZIP | **Archive compression** | `compression-method` | `mode` | `ready` | ZIP compression, Archive level | Select Store, Standard, or Best compression level. |
| Files & Archives | Extract ZIP | **Search archive tree** | `search-archive-files` | `option` | `ready` | Find file in zip, Search archive | Filter files and folders inside archive without extracting. |
| Files & Archives | Extract ZIP | **Extract archive** | `extract-archive-action` | `action` | `ready` | Unzip files, Unpack | Unpack files to destination directory. |
| Files & Archives | Inspect ZIP | **Archive compression** | `compression-method` | `mode` | `ready` | ZIP compression, Archive level | Select Store, Standard, or Best compression level. |
| Files & Archives | Inspect ZIP | **Search archive tree** | `search-archive-files` | `option` | `ready` | Find file in zip, Search archive | Filter files and folders inside archive without extracting. |
| Files & Archives | Inspect ZIP | **Extract archive** | `extract-archive-action` | `action` | `ready` | Unzip files, Unpack | Unpack files to destination directory. |
| Files & Archives | TAR & GZIP | **Archive compression** | `compression-method` | `mode` | `ready` | ZIP compression, Archive level | Select Store, Standard, or Best compression level. |
| Files & Archives | TAR & GZIP | **Search archive tree** | `search-archive-files` | `option` | `ready` | Find file in zip, Search archive | Filter files and folders inside archive without extracting. |
| Files & Archives | TAR & GZIP | **Extract archive** | `extract-archive-action` | `action` | `ready` | Unzip files, Unpack | Unpack files to destination directory. |
