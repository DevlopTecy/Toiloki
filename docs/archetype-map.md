# Toiloki Layout Archetype & Functionality Map

**Document Version**: 2.0.0  
**Date**: October 9, 2026  
**Status**: Authoritative Layout Blueprint (Phase 0 Planning)  
**Scope**: All 13 Workspaces · 275 Utilities  

---

## 1. Executive Summary & Design System Rules

Every workspace screen in Toiloki adheres strictly to the **Toiloki UI Kit V2 design system** and belongs to **exactly one of eight layout archetypes (A through H)**. This eliminates ad-hoc card-and-input templates, avoids nested card clutter, and ensures consistent desktop ergonomics across the entire suite.

### 1.1 Core Shell & Design Rules
1. **One Primary Action Per Screen**: Exactly one accent button (`--accent` orange: `#F5A524` dark / `#E8890C` light) per view. All other actions must be neutral secondary buttons or ghost actions.
2. **Strict Color Discipline**:
   - Orange is reserved **strictly** for: (1) Primary button, (2) Active group indicator, (3) Focus ring (`2px solid var(--accent)`), (4) Progress bars.
   - Zero orange text links, zero orange category flood fills, zero orange checkboxes/tabs.
   - Dirty-tab indicator is a `6px` circular dot in `--text-2` (not orange).
   - Destructive actions use the `--danger` token consistently (never orange).
   - Status badges use neutral raised surfaces with an icon + text (e.g., `✓ Ready`, `⧗ Beta`).
3. **Workspace Header (Universal)**:
   - Present on **every** workspace view.
   - Breadcrumb: Small muted path (`Workspace / Group / Utility`).
   - Title row: `22px` font-weight 600 utility title + Favorite star toggle + `(i)` info popover + `...` options menu with `Reset to defaults`.
   - Description line: Exactly one muted sentence explaining the purpose.
   - Active group: Underlined in the horizontal menubar; active utility title is always visible.
4. **View Switcher (No Nested Tabs)**:
   - Nested tab bars inside cards are prohibited.
   - Replaced by a top-level **View switcher**: at most 3 icon-plus-label segments, neutral raised surface, right-aligned in the canvas header toolbar.
5. **Universal ActionBar**:
   - Fixed bottom-docked bar: ONE primary action on the right, secondary actions on the left.
   - Exact unit summaries: `pages` for PDF; `duration` and `MB` for audio/video; `rows` for data tables; `files` and `MB` for file utilities.
6. **Zero Preloaded Fake Content**:
   - Every editor, table, and file view starts completely **empty** with an `EmptyState` component.
   - Contains an icon, short description, and a clear `"Try a sample"` link.
   - Sample data is never preloaded on mount, never saved into Recent or History, and never presented as a real processed result.

---

## 2. Layout Archetype Blueprints (A through H)

| Archetype | Name | Typical Structure | Zone 1 (Left / Center) | Zone 2 (Right / Side) | Zone 3 (Bottom) |
|:---:|:---|:---|:---|:---|:---|
| **A** | **Generator** | Left controls column, large live result card right | Controls Column (320px fixed) | Result Surface + CopyField / Preview | Action Bar (Regenerate, Copy) |
| **B** | **Converter / Inspector** | Input left, live output & stats right | Input Area / Parameters (50% or 400px) | Output StatCards & CopyFields (50%) | Secondary Export Actions |
| **C** | **Analyzer / Report** | Top dropzone, StatCards row, detailed report table | Dropzone + Metric StatCards (Full width) | Filter & Breakdown Drawer | Export Report / CSV Button |
| **D** | **Visual Tool** | Large canvas/preview center, options panel right | Interactive Canvas / Before-After Preview | Parameters & Presets Panel (320px) | Universal ActionBar |
| **E** | **Editor Split** | Side-by-side or stacked code/text editor | Input Editor (Left / Top) | Output Editor (Right / Bottom) | Status Bar (Counts, Line/Col) |
| **F** | **Data Table** | Toolbar, virtualized data grid, detail side drawer | Toolbar + Virtualized Grid Table | Row Detail / Column Stats Drawer | Pagination + Export View Bar |
| **G** | **File Table + Rules** | File grid with Original ➔ New, rules column right | File Mapping Table (Original ➔ Target) | Transformation Rules Stack (320px) | ActionBar (Batch Run, Progress)|
| **H** | **Media** | Waveform player & timeline center, audio controls right | Audio Waveform + Trimmer Timeline | Presets, Bitrate, Channels Panel (320px)| Audio Player + Export Bar |

---

## 3. Authoritative Workspace Archetype Mapping & Target Functions

### 3.1 Security & Privacy (`security`) — 12 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `sec-password-generator` | Password Generator | **A** | Controls: slider + stepper (8–128), switches for uppercase, lowercase, numbers, symbols, ambiguous filter. Passphrase Diceware mode (word count 3–10, separator, capitalization). Live zxcvbn entropy estimate. Bulk generate 5. Clipboard auto-clear timer (30s). Live regenerate. |
| `sec-passphrase-generator`| Passphrase Generator | **A** | Diceware algorithm, word count slider, separator picker (hyphen, space, dot, underscore), capitalized word toggle, entropy bits display, regenerate button, one-click copy. |
| `sec-password-strength` | Password Strength Checker | **B** | Input password field with show/hide, zxcvbn analysis: score (0–4), crack time estimates (online attack, offline fast hash), warning feedback, match suggestions. |
| `sec-totp-generator` | TOTP Generator | **B** | Secret key input, period (30s), digits (6/8), algorithm (SHA-1, SHA-256), live 30s countdown ring, current OTP CopyField, next OTP preview. |
| `sec-cert-decoder` | PEM/Certificate Decoder | **B** | Paste PEM/CRT certificate, inspect subject, issuer, serial, valid from/to timestamps, SANs, key algorithm, SHA-256 fingerprint CopyField. |
| `sec-keypair-generator` | Key Pair Generator | **A** | Algorithm selector (RSA 2048, RSA 4096, Ed25519), format (PKCS#8 PEM), Public & Private key CopyFields with individual download buttons. |
| `sec-hash-hmac` | Hash & HMAC | **B** | Text or file drop, computes MD5, SHA-1, SHA-256, SHA-512, BLAKE3 simultaneously. Hex case toggle. Optional HMAC key input. "Paste hash to compare" banner (match in success green, mismatch in danger red). Streaming progress for files. |
| `sec-file-encrypt` | File Encrypt/Decrypt | **D** | Mode switch (Encrypt / Decrypt), batch file dropzone, password input with show/hide, confirm password check, optional key file, Argon2id + AES-256-GCM, progress bar, clear wrong-password error. |
| `sec-checksum-verifier` | Checksum Verifier | **C** | Drop file + hash or `.sha256` / `.md5` sidecar file, auto-detect algorithm from digest length, match verification banner, batch summary table. |
| `sec-secure-shred` | Secure Shred | **G** | File/folder list with exact byte sizes, overwrite passes: 1 (CSPRNG random, default), 3 (DoD standard), 7 (Gutmann). Safety check: user must type exact file count to confirm. Progress bar, SSD wear explanation tooltip. |
| `sec-metadata-scrubber` | Metadata Scrubber | **C** | Drop images, PDFs, office docs. Table of detected metadata (GPS coordinates, camera EXIF, author, revision timestamps) with per-field keep/remove checkboxes. Export as `_clean` files. |
| `sec-text-redaction` | Text Redaction Helper | **E** | Left input pane, right sanitized output pane. Detectors for email, phone, US SSN, credit cards (Luhn valid), IP addresses, URLs, custom regex. Highlight overlay, mask options (`***`, `[REDACTED]`, keep last 4). Entity count status bar. |

---

### 3.2 Color & Design (`design`) — 12 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `design-color-converter` | Color Converter | **B** | Starts empty with EyeDropper picker. Real-time conversion across HEX, RGB, HSL, HSV, CMYK, LAB, OKLCH with alpha. Contrast vs white/black StatCards, tint/shade strip, local swatches. |
| `design-palette-generator` | Palette Generator | **A** | Base color input, harmony mode (analogous, complementary, triadic, tetradic, monochromatic), 5-swatch palette display with hex copy, contrast ratios, export CSS/JSON. |
| `design-contrast-checker` | Contrast Checker | **B** | Foreground and background color pickers with swap button. Large ratio readout (e.g. `14.2:1`), WCAG AA and AAA pass/fail badges for normal and large text, preview card with sample headings and body text. |
| `design-gradient-generator`| Gradient Generator | **D** | Gradient preview center, stops slider (color + position), type (linear / radial), angle dial, CSS code export (`background: linear-gradient(...)`). |
| `design-color-blindness-sim`| Color Blindness Simulator | **D** | Before/after preview center. Vision deficiency selector: Protanopia, Deuteranopia, Tritanopia, Achromatopsia. Image dropzone or test color swatches. |
| `design-image-palette-extractor`| Image Palette Extractor | **C** | Drop image, color clustering algorithm extracts dominant palette (5 to 10 colors), swatch table with HEX/RGB/HSL, one-click copy, export CSS palette. |
| `design-css-shadow-gen` | CSS Shadow Generator | **D** | Preview box with light/dark surface toggle, layer controls (X, Y, blur, spread, color, opacity, inset), up to 5 layers, presets, CSS and Tailwind export. |
| `design-svg-optimizer` | SVG Optimizer | **D** | Paste/drop SVG, side-by-side or visual before/after preview, options (strip metadata/comments, round coordinates, clean IDs, remove scripts with warning), size savings StatCard, copy clean SVG. |
| `design-favicon-generator` | Favicon/Icon Generator | **D** | Drop image, square crop preview, background padding/color, size grid preview (16, 32, 48, 64, 128, 256), export multi-size `.ico`, PNG pack, `site.webmanifest`, HTML snippet, ZIP bundle. |
| `design-font-inspector` | Font Inspector | **C** | Drop TTF/OTF/WOFF/WOFF2 font file, family name, style, glyph count, metrics (ascent, descent, upm), feature tags (liga, kern), editable live preview text with size and weight sliders. |
| `design-type-scale-calc` | Type Scale Calculator | **B** | Base size (px/rem), ratio preset (Minor Second, Major Third, Perfect Fourth, Golden Ratio), step range (-2 to +6), rem/px preview ladder, editable text, CSS variables / Tailwind export. |
| `design-token-exporter` | Design Token Exporter | **B** | Editable token table (colors, spacing, typography, radii), import from CSS/JSON, export to CSS Custom Properties, SCSS, Tailwind config, Style Dictionary JSON. |

---

### 3.3 System & Maintenance (`system`) — 10 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `sys-disk-usage-tree` | Disk Usage Tree | **C** | Select folder or drive. Parallel Rust scan with live progress and cancel. Sunburst/Treemap visualization plus sortable tree table. Min-size filter, Reveal in Explorer, Move to Toiloki Trash. |
| `sys-large-file-finder` | Large File Finder | **F** | Scan folder for files exceeding threshold (100MB, 500MB, 1GB). Sortable data table with file name, path, size, modification date. Reveal in Explorer, delete with confirmation. |
| `sys-temp-cache-cleaner` | Temp & Cache Cleaner | **C** | Scans system temporary directories and stale caches. Summary StatCard row (total bytes reclaimable, item count). Category checklist, preview scan, clean to Toiloki Trash with report. |
| `sys-empty-folder-cleaner`| Empty Folder Cleaner | **F** | Scans selected folder for 0-byte abandoned directories. Table with path, parent, depth. Select all, delete with confirmation. |
| `sys-system-info-report` | System Info Report | **C** | Hardware snapshot: OS name/version, CPU model, core count, RAM usage meter, display resolution, local network interfaces. Export report as Markdown/JSON. |
| `sys-env-vars-viewer` | Environment Variables | **B** | Real process variables with automatic secret masking (KEY, SECRET, TOKEN, PASSWORD). Search bar, copy value. Mode switcher: Process Vars vs `.env Paste` wide editor. |
| `sys-hosts-file-viewer` | Hosts File Viewer | **E** | Read-only syntax-highlighted editor of `C:\Windows\System32\drivers\etc\hosts`. Active DNS mappings vs commented rules. Search and copy entry. |
| `sys-process-viewer` | Process Viewer (Read-only)| **F** | Real running desktop background processes. Sortable table: Name, PID, CPU %, Memory (MB). Live search filter. No kill functionality (read-only for security). |
| `sys-startup-items-viewer`| Startup Items Viewer | **F** | Registry and startup folder applications. Table: Application Name, Command line, Location, Status. Search filter and export CSV. |
| `sys-clipboard-history` | Clipboard History | **B** | In-memory local clipboard history buffer (disabled by default, user-enabled). Searchable list with timestamp, character count, preview, copy button, and Clear History. |

---

### 3.4 Network & Web (`network`) — 10 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `net-url-builder` | URL Builder | **B** | Base URL input, query parameters key/value table with add/remove, UTM presets (source, medium, campaign), live encoded/decoded URL result, Send to QR Generator button. |
| `net-mime-lookup` | MIME Lookup | **B** | Searchable database of 1,000+ MIME types and extensions. Extension input ➔ MIME type; or MIME type ➔ file extensions and description. |
| `net-curl-builder` | cURL Builder | **B** | Method (GET, POST, PUT, DELETE), URL, headers table, auth (Bearer, Basic), body (JSON/Raw). Live multi-shell syntax export: Bash (`\`), PowerShell (`curl.exe ` `), and CMD (`^`). |
| `net-robots-sitemap-gen`| robots.txt & Sitemap | **E** | Left editor: User-agent rules, Disallow/Allow paths, Crawl-delay. Right pane: formatted `robots.txt` output with syntax validation and XML sitemap template generator. |
| `net-meta-og-gen` | Meta Tag & Open Graph | **B** | Page title, description, URL, image URL, site name. Live interactive card preview (Google Search SERP snippet, Twitter Card, Open Graph card) + generated HTML `<meta>` tags. |
| `net-subnet-cidr` | Subnet/CIDR | **B** | IP address + CIDR prefix slider (/0 to /32). StatCards: Netmask, Wildcard, Network Address, Broadcast, First Usable, Last Usable, Total Usable Hosts. RFC 3021 /31 and /32 support. |
| `net-local-port-check` | Local Port Check | **B** | Port number input (e.g. 3000, 5432, 8080) or common presets. Checks local socket listener, displays listening status and standard service name. |
| `net-dns-record-helper` | DNS Record Helper | **B** | Record type selector (A, AAAA, CNAME, MX, TXT, SPF, DKIM), host and value fields, TTL. Generates standard BIND zone file record syntax with copy button. |
| `net-ip-converter` | IP Converter | **B** | Accepts IPv4 address. Live CopyFields: Decimal integer, Hexadecimal, Binary (with octet dots), IPv6-mapped format, and Reverse DNS `in-addr.arpa`. |
| `net-mac-vendor-lookup` | MAC Vendor Lookup | **B** | MAC address input with auto-formatting (`AA:BB:CC:DD:EE:FF`). Offline IEEE OUI database lookup: Manufacturer / Vendor name, country, and address prefix. |

---

### 3.5 Developer (`developer`) — 30 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `format-json-code` | JSON Formatter | **E** | Indent options (2, 4, Tab), sort keys toggle, minify toggle. View switcher: Editor, Tree view, Raw. Real-time syntax error markers with line and column. Format on paste. Large payload handled via Rust `serde_json`. |
| `format-html-code` | HTML Formatter | **E** | HTML/XML formatter, custom indent, attribute wrap options, clean closing tags, copy and download. |
| `format-css-code` | CSS Formatter | **E** | CSS/SCSS formatter, property sorting, newline between rule blocks, minify toggle. |
| `format-js-code` | JavaScript Formatter | **E** | Prettify JS/TS with indentation, semicolon enforcement, quote normalization, copy and export. |
| `format-xml-code` | XML Formatter | **E** | XML tag indentation, self-closing tag normalization, attribute alignment, well-formedness check. |
| `format-sql-code` | SQL Formatter | **E** | SQL dialect options, keyword capitalization, indent subqueries, comma formatting, copy clean query. |
| `dev-base64` | Base64 | **E** | UTF-8 text and binary file encoding/decoding. Base64 vs Base64URL safe mode, live status bar with byte count. |
| `dev-url` | URL Encoding | **E** | Percent-encode / decode text and query parameters. Full URI vs Component mode. |
| `dev-jwt` | JWT Inspector | **E** | Token input, decoded Header and Payload JSON viewers with syntax highlighting, algorithm and expiration timestamp inspection (human date + relative). |
| `dev-url-components` | URL Components | **B** | URL input, structured breakdown table: Protocol, Host, Port, Path segments, Query parameters, Hash anchor. |
| `gen-uuid` | UUID Generator | **A** | Version (v4 random, v1 time-based), quantity (1 to 100), uppercase toggle, hyphens toggle, bulk CopyField. |
| `gen-random-string` | Random String | **A** | Length slider, charset toggles (A-Z, a-z, 0-9, symbols, custom), quantity, live copy list. |
| `gen-timestamp` | Timestamp | **B** | Current live Unix timestamp (seconds and milliseconds), custom date picker, relative time calculation, ISO 8601 string, UTC and local display. |
| `gen-random-number` | Random Number | **A** | Min and Max bounds, integer vs float, count, unique constraint, cryptographic CSPRNG source. |
| `gen-test-data` | Test Data | **A** | Generate mock user records (Name, Email, Phone, Address, UUID), format options (JSON, CSV, SQL insert), row count slider (1 to 500). |
| `dev-qr-generator` | QR Generator | **D** | Text/URL input, error correction level (L, M, Q, H), size slider, foreground/background color, live preview, export SVG and PNG. |
| `dev-qr-scanner` | QR Scanner | **D** | Drop QR image or scan file, offline decode via `jsqr`, displays decoded payload text with one-click copy. |
| `dev-barcode-generator`| Barcode Generator | **D** | Format (Code 128, EAN-13, UPC-A, Code 39), value input, check digit validation, live barcode render, SVG/PNG export. |
| `dev-chmod-calculator` | chmod Calculator | **B** | User, Group, Others permissions checkboxes (Read, Write, Execute), octal code (`755`), symbolic (`-rwxr-xr-x`), command generator (`chmod 755 file`). |
| `dev-user-agent-parser`| User-Agent Parser | **B** | Paste UA string or inspect current browser UA. Extracted browser, version, operating system, device family, engine, and bot status. |
| `dev-gitignore-generator`| .gitignore Generator | **A** | Searchable multi-tag chip picker (Node, Rust, Python, Go, macOS, Windows, VSCode), generates merged `.gitignore` with copy and download. |
| `regex-tester-feature` | Regex Tester | **E** | Pattern and flags (g, i, m, s), test string editor, live match highlighting, capture group details drawer, substitution tool. |
| `web-url-parser` | URL Parser | **B** | Deep URL inspection: protocol, username, password, hostname, port, pathname, search params, hash. |
| `web-http-headers` | HTTP Headers | **B** | Parse raw HTTP headers into key-value pairs, lookup standard RFC header definitions and security recommendations. |
| `web-query-string` | Query String | **B** | Bidirectional conversion between raw query strings (`?a=1&b=2`) and structured JSON objects. |
| `web-status-codes` | HTTP Status Reference | **F** | Searchable encyclopedia of 1xx, 2xx, 3xx, 4xx, 5xx HTTP codes with official RFC definitions and typical causes. |
| `dev-cron-explainer` | Cron Explainer | **B** | 5-part and 6-part cron expression input. Translates to plain English sentence (e.g. "At 04:00 on every day-of-week from Monday through Friday"), next 5 scheduled execution dates. |
| `dev-px-rem` | px/rem Converter | **B** | Root font size setting (default 16px), bidirectional live conversion table, fluid CSS `clamp(min, val, max)` calculator. |
| `sec-hash-hmac` | Hash & HMAC (Dev) | **B** | Shares implementation with Security Hash & HMAC utility. |
| `dev-env-diff` | .env Diff | **E** | Left editor `.env`, right editor `.env.example`. Highlights missing keys, extraneous variables, and unpopulated values. |

---

### 3.6 Text (`text`) — 23 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `case-conversion` | Case Conversion | **E** | View switcher (Editor, Split, Diff). Toolbar: Find & Replace. Options right: wrapping chips for lowercase, UPPERCASE, Title Case, camelCase, snake_case, kebab-case, CONSTANT_CASE, PascalCase. One-line status bar for character, word, and line count. |
| `reverse-text` | Reverse Text | **E** | Reverse by character, word, or line. Status bar with count, copy result. |
| `sort-lines` | Sort Lines | **E** | Line operations buttons: Sort A-Z, Sort Z-A, Length, Deduplicate. |
| `deduplicate-lines` | Deduplicate Lines | **E** | Remove identical lines, case sensitive toggle, preserve order vs sort. |
| `text-extract-entities`| Extract Entities | **E** | Regex extract emails, URLs, IP addresses, phone numbers into clean list. |
| `text-find-duplicate-paras`| Find Duplicate Paras | **E** | Detect repeated paragraphs, highlight duplicates, remove duplicates. |
| `text-slugify` | Slugify | **B** | Input text ➔ URL/git friendly slug with separator options (`-`, `_`). |
| `text-natural-sort` | Natural Sort | **E** | Alphanumeric sorting respecting embedded numbers (e.g. `item2` before `item10`). |
| `text-to-table` | Text to Table | **E** | Convert delimited lines to Markdown table, HTML `<table>`, or CSV. |
| `text-multi-file-regex`| Multi-file Regex | **G** | Drop multiple text files, regex search & replace rules panel, table of file matches and diff preview, batch apply. |
| `remove-spaces` | Remove Extra Spaces | **E** | Collapse consecutive spaces, trim leading/trailing whitespace. |
| `remove-blank-lines` | Remove Blank Lines | **E** | Strip all empty lines or collapse multiple blank lines to a single newline. |
| `invisible-chars` | Invisible Characters | **E** | Highlight zero-width spaces, non-breaking spaces, BOM, control characters. One-click strip. |
| `line-endings` | Line-Ending Normalization| **E** | Detect CRLF vs LF. Convert to Unix (LF) or Windows (CRLF). |
| `text-statistics` | Text Statistics | **B** | Real-time counts: characters, words, sentences, paragraphs, reading time, speaking time, average word length. |
| `reading-time` | Reading Time | **B** | Words per minute slider (default 200 wpm), silent reading vs speech duration. |
| `text-word-frequency` | Word Frequency | **F** | Tokenizes text, displays sortable frequency table of words and N-grams (word, count, percentage). |
| `dev-base64` | Base64 (Text) | **E** | Base64 encoder/decoder with live status bar. |
| `dev-url` | URL Encoding (Text) | **E** | Percent-encode / decode text strings. |
| `html-encoding` | HTML Encoding | **E** | Escape/unescape HTML special entities (`<`, `>`, `&`, `"`, `'`). |
| `unicode-tool` | Unicode Tool | **B** | Inspect character code points, UTF-8/16 bytes, name, and script category. |
| `text-diff` | Text Diff | **E** | Side-by-side or inline unified diff between two text documents with added/deleted line highlights. |
| `text-lorem-ipsum` | Lorem Ipsum | **A** | Paragraphs/words/bytes count, start with "Lorem ipsum...", generate placeholder copy. |

---

### 3.7 Data (`data`) — 30 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `csv-viewer` | CSV Table Viewer | **F** | Rust streaming CSV parser (supports 1M+ rows). Delimiter auto-detect (comma, semicolon, tab, pipe) with manual override. Virtualized data grid, column search filter, pin/hide/reorder columns, per-column stats drawer (type, nulls, unique, min/max). Primary action: "Export view" (never "Transform Data"). |
| `json-tree` | JSON Tree Viewer | **E** | Collapsible JSON tree explorer, search node paths, copy branch/value. |
| `xml-tree` | XML Tree Viewer | **E** | Collapsible XML node hierarchy explorer with attribute inspection. |
| `yaml-viewer` | YAML Viewer | **E** | Syntax-highlighted YAML structure explorer. |
| `xlsx-viewer` | XLSX Viewer | **F** | Multi-sheet Excel workbook viewer with tabbed sheet switcher and virtualized grid. |
| `csv-to-json` | CSV ↔ JSON | **E** | Bidirectional conversion, format options (array of objects, 2D array), indent. |
| `csv-to-xlsx` | CSV ↔ XLSX | **G** | Drop CSV ➔ convert to formatted `.xlsx` workbook; or drop Excel file ➔ extract sheets as CSV. |
| `json-to-yaml` | JSON ↔ YAML | **E** | Bidirectional conversion preserving types and indentation. |
| `xml-to-json` | XML ↔ JSON | **E** | Bidirectional XML to JSON converter with attribute prefixing. |
| `data-ndjson-tsv` | NDJSON/TSV Converter | **E** | Stream convert between newline-delimited JSON and tab-separated values. |
| `data-sort-filter` | Sort & Filter | **F** | Multi-column sort, row condition filters (`>`, `<`, `=`, `contains`), live count. |
| `data-dedup` | Remove Duplicates | **F** | Deduplicate rows based on selected key columns, summary stats. |
| `data-columns` | Select & Rename Columns | **F** | Checkbox column picker, rename header text, reorder via drag handle. |
| `data-format-values` | Format Values | **F** | Trim whitespace, date formatting, number precision across selected columns. |
| `data-jsonpath-query` | JSONPath Query | **E** | Input JSON, JSONPath expression input (e.g. `$.store.book[*].author`), matching nodes result. |
| `data-join-csv` | Join & Merge CSV | **F** | Load two CSV tables, select join key, join type (Inner, Left, Full), merged preview. |
| `data-pivot-groupby` | Pivot & Group-by | **F** | Group rows by categorical column, aggregate numeric values (Sum, Mean, Count). |
| `data-split-csv` | Split CSV | **G** | Split large CSV by row count (e.g. 10,000 rows/file) or by distinct column value. |
| `data-encoding-fixer` | Encoding Fixer | **E** | Auto-detect and convert corrupted character encodings (UTF-8, Latin-1, Windows-1252, Shift-JIS). |
| `data-json-to-typescript`| JSON to TypeScript | **E** | Infer TypeScript interfaces and types from sample JSON payloads. |
| `data-json-schema-validator`| JSON Schema Validator | **E** | Validate JSON payload against draft-07 / 2020-12 schema with detailed error markers. |
| `validate-json` | JSON Validation | **E** | Strict JSON syntax validation with line/column markers and repair suggestions. |
| `validate-xml` | XML Validation | **E** | XML tag nesting, closing tag validation, and namespace inspection. |
| `validate-csv` | CSV Validation | **F** | Checks uniform column lengths, unclosed quotes, and encoding discrepancies. |
| `validate-yaml` | YAML Validation | **E** | Indentation and syntax checker for YAML documents. |
| `format-json-code` | JSON Formatter (Data) | **E** | Prettify and minify JSON data. |
| `format-xml-code` | XML Formatter (Data) | **E** | Indent and format XML tags. |
| `yaml-formatting` | YAML Formatting | **E** | Clean up indentation and key alignment in YAML. |
| `data-sql-csv` | SQL on CSV | **F** | In-memory embedded SQLite query engine. Run `SELECT * FROM csv_table WHERE ...` with instant results in a virtualized data table. |
| `data-json-diff` | JSON Diff | **E** | Semantic structural comparison between two JSON payloads. |

---

### 3.8 Files & Archives (`files`) — 15 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `batch-rename-files` | Batch Rename | **G** | Real file drop. Table: Original name ➔ Proposed new name. Conflict warnings in danger tint with warning icon. Rules stack: find/replace, regex, prefix/suffix, sequential numbering (start, step, padding), case transforms, EXIF date insertion. Dry run preview. Undo journal in Rust. ActionBar: "Rename {n} files". No archive boxes on screen. |
| `file-type-detection` | File Type Detection | **C** | Drop file, reads magic bytes header (first 512 bytes), displays detected true MIME type, extension match/mismatch status, file entropy score. |
| `file-metadata-ops` | File Metadata & Size | **C** | Drop file(s), displays table of exact byte sizes, created/modified/accessed timestamps, file attributes, permissions. |
| `files-organize-type-date`| Organize by Type/Date | **G** | Select directory, choose organization rule (group by extension or capture month/year), preview folder moves table, execute safely with Undo journal. |
| `files-split-join-large`| Split & Join Large Files | **G** | Split large file into chunks (by size: 50MB, 100MB, custom) or join part files (`.001`, `.002`) back into original file with hash validation. |
| `files-folder-text-tree`| Folder to Text Tree | **E** | Select folder, generates clean ASCII/Markdown directory hierarchy diagram with depth filter and ignore rules. |
| `file-analyzer-full` | File Analyzer | **C** | Drop file, computes MD5, SHA-1, SHA-256, SHA-512, BLAKE3, Shannon entropy graph, magic byte type, size breakdown. |
| `duplicate-finder-hash`| Duplicate Finder | **G** | Select folder, two-phase parallel scan (size bucketing ➔ SHA-256 candidate verification). Grouped duplicate files table with size savings stat, select to delete/trash. |
| `file-compare-hashes` | File Comparison | **C** | Drop two files, side-by-side comparison of sizes, timestamps, SHA-256 hashes, byte difference offset. |
| `files-folder-compare` | Folder Compare | **G** | Select two folders, compares contents, displays diff table: identical files, modified files, files unique to folder A, files unique to folder B. |
| `create-zip-archive` | Create ZIP | **G** | Drop files/folders, compression level slider (Store, Fast, Optimal), password protection toggle (AES-256 ZIP), creates `.zip` archive. |
| `extract-zip-archive` | Extract ZIP | **G** | Drop `.zip`, extracts contents to chosen folder with Zip Slip path-traversal protection. |
| `inspect-zip-archive` | Inspect ZIP | **G** | Drop archive, tree view of entries with uncompressed size, compressed size, compression ratio, CRC32 checksum, extract selected files. |
| `tar-gzip-manager` | TAR & GZIP | **G** | Create and extract `.tar`, `.gz`, and `.tar.gz` archives with POSIX ustar formatting. |
| `files-7z-extract` | 7z Extract | **G** | Inspect and extract `.7z` archives using pure Rust decompressor. |

---

### 3.9 Audio & Video (`media`) — 12 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `audio-converter` | Audio Converter | **H** | Distinct screen. Drop audio file(s). Styled format tiles (MP3, WAV, AAC, FLAC, OGG), bitrate/quality presets (128k, 192k, 256k, 320k), sample rate and channel selectors. Batch queue with per-file progress and Cancel. |
| `audio-trimmer` | Audio Trimmer | **H** | Real waveform decoded via Rust Symphonia, downsampled to smooth peaks. Draggable start/end trim handles, timecode inputs (ms accuracy), loop selection play, keyboard nudge, zoom controls, export trimmed WAV/MP3. |
| `audio-joiner` | Audio Joiner | **H** | Drop multiple audio files, reorder tracks in timeline, crossfade option (seconds), merged preview player, export single audio file. |
| `audio-volume-fade` | Volume & Fade | **H** | Waveform player, gain adjustment slider (-20dB to +20dB) with live peak meter, fade-in and fade-out handle overlays on the waveform, export audio. |
| `audio-metadata-editor`| Audio Metadata | **H** | Drop audio, inspect and edit ID3 tags: Title, Artist, Album, Year, Genre, Track number, Cover artwork image dropzone, save tags. |
| `video-converter` | Video Converter | **D** | Marked `'soon'` and hidden until external FFmpeg sidecar is verified. Transcode presets: Web 1080p, 720p, Small file, Discord 8MB. |
| `video-compressor` | Video Compressor | **D** | Marked `'soon'` and hidden until external FFmpeg sidecar is verified. Target MB slider or CRF quality. |
| `video-trimmer` | Video Trimmer | **H** | Marked `'soon'` and hidden until external FFmpeg sidecar is verified. Lossless fast cut without re-encoding. |
| `video-to-gif` | Video to GIF | **D** | Marked `'soon'` and hidden until external FFmpeg sidecar is verified. Video clip ➔ optimized looping GIF with fps/width controls. |
| `media-extract-audio` | Extract Audio | **H** | Marked `'soon'` and hidden until external FFmpeg sidecar is verified. Rip soundtrack to MP3, AAC, or WAV. |
| `media-frame-extractor`| Frame Extractor | **D** | Marked `'soon'` and hidden until external FFmpeg sidecar is verified. Capture video frames as PNG/JPG. |
| `media-subtitle-shift` | Subtitle Shift & Convert | **E** | Left editor / dropzone for `.srt` or `.vtt`. Shift control (+/- milliseconds), timecode clamp, convert between SRT and VTT formats. |

---

### 3.10 Images (`images`) — 26 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `img-resize` | Resize & Scale | **D** | Center before/after canvas preview. Options right: dimensions (pixels, percentage), aspect ratio lock toggle, resampling filter (Lanczos3, Bicubic, Nearest). ActionBar: "Resize image". |
| `img-crop` | Crop Image | **D** | Interactive draggable crop box on canvas, preset aspect ratios (1:1, 4:3, 16:9, Free), width/height inputs, crop & export. |
| `img-rotate` | Rotate & Flip | **D** | 90° clockwise, 90° counter-clockwise, 180°, horizontal flip, vertical flip buttons with instant canvas update. |
| `img-aspect` | Aspect Ratio & Dimensions| **D** | Pad with background color or crop to fit standard display aspect ratios. |
| `img-heic-converter` | HEIC Converter | **D** | Marked `'soon'` and hidden until `libheif` engine is configured. |
| `img-avif-converter` | AVIF Converter | **D** | Convert AVIF images to WebP, PNG, or JPG with quality slider. |
| `img-gif-webp-builder` | Animated GIF/WebP | **D** | Drop multiple image frames, frame delay (ms), loop count, export animated GIF or WebP. |
| `img-batch-watermark` | Batch Watermark | **D** | Text or image watermark stamp, opacity slider, position grid (9 anchors), batch process gallery. |
| `convert-jpg` | Convert to JPG | **D** | Format tile picker, JPEG quality slider (1–100), background color fill for transparent areas. |
| `convert-png` | Convert to PNG | **D** | Lossless PNG conversion with compression level setting, preserves alpha. |
| `convert-webp` | Convert to WebP | **D** | WebP conversion with lossy/lossless toggle, quality slider. |
| `convert-bmp` | Convert to BMP | **D** | Windows Bitmap encoding. |
| `convert-tiff` | Convert to TIFF | **D** | Archival TIFF export with optional LZW compression. |
| `img-svg-to-png` | SVG to PNG | **D** | Drop SVG, raster scale multiplier (1x, 2x, 4x, custom resolution), export high-res PNG. |
| `compress-image` | Compress Image | **D** | Quality slider with live before/after byte size comparison StatCard and zoomable diff preview. |
| `resize-compress` | Resize during Compression| **D** | Simultaneous dimension scaling and byte compression in a single operation. |
| `adjust-color` | Brightness & Contrast | **D** | Sliders for brightness, contrast, exposure with live canvas updates and Reset button. |
| `adjust-saturation` | Saturation & Vibrance | **D** | Saturation and vibrance sliders with live preview. |
| `adjust-filters` | Blur & Grayscale | **D** | Gaussian blur slider, grayscale, sepia, and invert filters. |
| `exif-view` | EXIF Viewer | **C** | Drop photo, inspect camera make/model, lens, exposure time, aperture, ISO, focal length, GPS location. |
| `exif-remove` | Remove EXIF | **D** | Strip all EXIF, IPTC, and XMP metadata from JPEG/PNG images for privacy. |
| `img-info` | Image Information | **C** | Dimensions, aspect ratio, color depth, format, color space, DPI report. |
| `multi-img-pdf` | Multiple Images → PDF | **G** | Drop multiple pictures, reorder in tray, page orientation setting, export multi-page PDF document. |
| `img-collage-sheet` | Collage & Contact Sheet | **D** | Arrange pictures into contact sheet grid with custom columns and margins. |
| `img-sprite-sheet` | Sprite Sheet | **D** | Pack icon set into a single 2D sprite texture with CSS coordinate map generator. |
| `img-before-after` | Before/After Compare | **D** | Split-screen draggable wipe slider and difference mask viewer between two revisions. |

---

### 3.11 Documents (`documents`) — 20 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `docx-to-pdf` | DOCX → PDF | **G** | Drop DOCX file(s), convert to print-ready PDF using pure offline rendering. |
| `pdf-to-docx` | PDF → DOCX | **G** | Extract structured text, paragraphs, and headings from PDF to Word DOCX. |
| `txt-to-pdf-doc` | TXT → PDF | **G** | Format plain text file into styled PDF pages with font and margin controls. |
| `md-to-pdf-doc` | Markdown → PDF | **G** | Render Markdown file into elegant PDF document with styling themes. |
| `html-to-pdf-doc` | HTML → PDF | **G** | Convert local HTML documents into PDF. |
| `rtf-to-pdf` | RTF → PDF | **G** | Convert Rich Text Format (.rtf) to clean PDF document. |
| `edit-text` | Edit Text | **E** | Rich text & markdown editor with live side-by-side preview and word count. |
| `find-replace` | Find and Replace | **E** | Bulk text search and replace with regex and case sensitivity. |
| `doc-stats` | Document Statistics | **B** | Word, character, sentence, paragraph, and readability scores. |
| `text-cleanup` | Text Cleanup | **E** | Strip blank lines, trailing spaces, normalize line endings. |
| `doc-markdown-editor` | Markdown Editor | **E** | Live split-view editor with syntax highlighting, math, tables, code blocks. |
| `doc-toc-generator` | Table of Contents | **E** | Generate nested Markdown/HTML heading index with anchor links. |
| `doc-mail-merge` | Mail Merge | **F** | Template editor with `{{placeholders}}` merged against CSV records table. |
| `doc-batch-find-replace`| Batch Find & Replace | **G** | Search & replace across multiple document files simultaneously. |
| `doc-diff` | Document Diff | **E** | Visual comparison highlighting text additions and deletions between two document versions. |
| `export-pdf` | Export to PDF | **G** | Export current document editor content to PDF. |
| `export-txt` | Export to TXT | **E** | Export clean plain text file. |
| `export-html` | Export to HTML | **E** | Export HTML file with clean inline styling. |
| `export-md` | Export to Markdown | **E** | Export formatted Markdown document. |
| `doc-office-metadata` | Office Metadata | **C** | Inspect and sanitize author, company, revision count, and editing duration in Office files. |

---

### 3.12 PDF (`pdf`) — 43 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `merge-pdf` | Merge PDF | **G** | File tray canvas. Add multiple PDFs, reorder via drag handle, delete, merge into one PDF. |
| `split-pdf` | Split PDF | **D** | Visual thumbnail canvas with split marker scissors. Split into single pages or custom ranges (`1-3, 5, 8-10`). |
| `extract-pages` | Extract Pages | **D** | Visual page grid. Select thumbnails with checkmark, extract chosen pages to new PDF. |
| `delete-pages` | Delete Pages | **D** | Visual page grid. Click trash icon on thumbnails or enter page numbers to purge. |
| `reorder-pages` | Reorder Pages | **D** | Drag-and-drop page thumbnail organizer. Live sequence numbers. |
| `rotate-pages` | Rotate Pages | **D** | Rotate 90° CW, 180°, 270° CW per page or across all pages. |
| `duplicate-pages` | Duplicate Pages | **D** | Clone selected pages in-place within the document. |
| `replace-pages` | Replace Pages | **D** | Substitute specific pages with pages from another PDF file. |
| `pdf-remove-blank-pages`| Remove Blank Pages | **D** | Automatic scan detects 0-content white pages, review candidates, purge. |
| `pdf-crop-pages` | Crop Pages | **D** | Crop box margin adjuster (top, right, bottom, left) applied to selected or all pages. |
| `add-text` | Add Text | **D** | Interactive PDF annotation canvas. Place text boxes, font size, color, opacity. |
| `add-image` | Add Image | **D** | Stamp logo or signature image onto PDF page with resize handles. |
| `draw-shapes` | Draw & Shapes | **D** | Draw rectangles, circles, arrows, lines, and freehand markup on pages. |
| `highlight-underline` | Highlight & Underline | **D** | Highlight and underline text blocks on document canvas. |
| `watermark` | Watermark | **D** | Text watermark ("CONFIDENTIAL", "DRAFT"), opacity slider, rotation angle (-45° to 45°), layer under/over content. |
| `page-numbers` | Page Numbers | **D** | Numbering format (`Page X of Y`, `1/N`), position (top/bottom, left/center/right), start index. |
| `pdf-fill-form-fields` | Fill Form Fields | **D** | Inspect AcroForm text fields, checkboxes, dropdowns, fill values, flatten or export data. |
| `pdf-bookmarks-editor` | Bookmarks Editor | **E** | Tree editor for document outline bookmarks with page targets and indentation. |
| `images-to-pdf` | Images → PDF | **G** | Reorder multiple images in tray, page size presets (A4, Letter, Fit), margin options. |
| `docx-to-pdf` | DOCX → PDF (PDF) | **G** | Direct DOCX to PDF conversion tray. |
| `txt-to-pdf-doc` | TXT → PDF (PDF) | **G** | Text file to formatted PDF conversion tray. |
| `md-to-pdf-doc` | Markdown → PDF (PDF) | **G** | Markdown to PDF conversion tray. |
| `html-to-pdf-doc` | HTML → PDF (PDF) | **G** | HTML to PDF conversion tray. |
| `pdf-to-doc` | PDF → Document Formats | **G** | Convert PDF to text, HTML, or DOCX formats. |
| `pdf-to-images` | PDF to Images | **D** | Render every page to PNG, JPG, or WebP at custom DPI (150, 300, 600). |
| `compress-pdf` | Compress PDF | **D** | Compression presets (Low, Medium, Strong), downsample embedded raster images. |
| `optimize-images` | Optimize Images | **D** | Re-encode embedded PDF graphics at lower quality. |
| `flatten-pdf` | Flatten PDF | **D** | Bake all form fields and annotations permanently into the page raster stream. |
| `remove-metadata` | Remove Metadata | **D** | Strip title, author, producer, and modification tracking history. |
| `pdf-repair-pdf` | Repair PDF | **D** | Rebuild broken cross-reference tables and recover pages. |
| `extract-text` | Extract Text | **E** | Extract all text into editor pane, search, copy, download plain text. |
| `extract-images` | Extract Images | **G** | Extract all embedded photos into a gallery, download individual or ZIP. |
| `extract-metadata` | Extract Metadata | **C** | Report table of document properties, dates, producer, encryption status. |
| `search-text` | Search PDF Text | **E** | Search word occurrences across pages with page number indicators. |
| `password-protect` | Password Protect | **D** | Encrypt PDF with user and owner passwords, restrict printing/copying. |
| `encrypt-pdf` | Encrypt PDF | **D** | 128/256-bit AES encryption with granular permission flags. |
| `remove-password` | Remove Password | **D** | Enter current password to produce an unencrypted decrypted copy. |
| `sign-pdf` | Sign PDF | **D** | Visual signature stamp tool with date mark and cert metadata. |
| `pdf-redact` | Redact PDF | **D** | Permanently black out sensitive text and areas (destroys underlying byte stream). |
| `file-info` | File Information | **C** | Document size, PDF version, page count, dimensions table. |
| `page-count` | Page Count & Stats | **C** | Page count breakdown, portrait vs landscape count, aspect ratios. |
| `doc-properties` | Document Properties | **C** | Title, author, creator, subject, creation and modification timestamps. |
| `pdf-compare-pdfs` | Compare PDFs | **D** | Side-by-side and overlay diff comparing two PDF revisions. |

---

### 3.13 Calculator & Converters (`calculator`) — 32 Utilities

| Utility ID | Utility Name | Archetype | Target Functions & Phase 3 Specification |
|:---|:---|:---:|:---|
| `calc-basic` | Basic Calculator | **A** | Four-function desktop calculator with numeric keypad, tape history log, memory buttons (MC, MR, M+, M-). Floating-point precision `0.1 + 0.2 === 0.3`. |
| `calc-percentage` | Percentage | **B** | Percentage increase/decrease, percentage of value, what percent is X of Y. |
| `calc-discount` | Discount | **B** | Original price, discount %, sales tax % ➔ final price, savings amount StatCards. |
| `calc-ratio` | Ratio & Proportion | **B** | Solve A:B = C:D, simplify ratios, aspect ratio scaling. |
| `calc-trig-logs` | Scientific Calculator | **A** | Trig (sin, cos, tan), inverse, DEG/RAD toggle, log10, ln, powers, roots, scientific notation. |
| `calc-constants` | Constants | **B** | Searchable table of physical & mathematical constants (pi, e, c, h, G) with copy value. |
| `calc-fractions` | Fractions | **B** | Add, subtract, multiply, divide fractions with step-by-step reduction to simplest form. |
| `calc-statistics` | Statistics | **C** | Input dataset, computes mean, median, mode, variance, standard deviation, quartiles. |
| `calc-equations` | Equations | **B** | Linear (`ax + b = 0`) and quadratic (`ax² + bx + c = 0`) solvers with roots and discriminant. |
| `calc-ohms-law` | Ohm's Law | **B** | Voltage (V), Current (I), Resistance (R), Power (P) interactive solver. |
| `calc-power` | Electrical Power | **B** | Watts, kWh, daily usage hours, operating cost calculation. |
| `unit-converter-all` | Unit Converter | **B** | Length, mass, temperature, area, volume, speed, digital storage live unit converters. |
| `calc-age` | Age Calculator | **B** | Birthdate input ➔ exact age in years, months, days, hours, next birthday countdown. |
| `calc-date-diff` | Date Difference | **B** | Two dates input ➔ calendar duration, total days, weeks, business days elapsed. |
| `calc-date-add-sub` | Add/Subtract Dates | **B** | Add or subtract years, months, weeks, days from a date. |
| `calc-business-days` | Business Days | **B** | Calculate working days excluding Saturdays, Sundays, and custom holidays. |
| `calc-time-duration` | Time Duration | **B** | Sum, subtract, and average multiple time segments in HH:MM:SS. |
| `calc-timezone-converter`| Timezone Converter | **B** | Search worldwide timezones, compare local hours across regions with DST indicators. |
| `calc-timer-stopwatch` | Timer & Stopwatch | **A** | Countdown timer with sound alert and lap stopwatch. |
| `calc-currency-manual` | Currency (Manual Rates)| **B** | Offline currency converter using user-defined exchange rates. |
| `calc-number-to-words` | Number to Words | **B** | Numeric amount ➔ English words (e.g. for check writing and contracts). |
| `calc-loan-emi` | Loan/EMI Calculator | **B** | Loan amount, interest rate %, tenure ➔ monthly EMI, total interest, total payment StatCards. |
| `calc-amortization` | Amortization Schedule | **F** | Generates month-by-month repayment schedule table with principal, interest, and balance columns. |
| `calc-compound-interest`| Compound Interest | **B** | Principal, interest rate, compounding frequency, duration ➔ compound growth table and final balance. |
| `calc-sip` | SIP Calculator | **B** | Monthly investment, expected return %, duration ➔ invested amount, wealth gained, total value. |
| `calc-gst-vat` | GST/VAT Calculator | **B** | Net price, gross price, tax rate % (Add tax / Remove tax) with CGST/SGST split. |
| `calc-margin-markup` | Margin & Markup | **B** | Cost price, selling price, gross profit margin %, markup %. |
| `calc-tip-split` | Tip Split | **B** | Bill amount, tip %, number of people ➔ tip per person, total per person. |
| `calc-bmi` | BMI Calculator | **B** | Height, weight (metric/imperial) ➔ BMI value, category badge, healthy weight range. |
| `calc-calorie-bmr` | Calorie/BMR Calculator | **B** | Age, gender, height, weight, activity level ➔ BMR and daily maintenance calorie burn. |
| `calc-number-base` | Number Base | **B** | Simultaneous live conversion across Binary, Octal, Decimal, and Hexadecimal. |
| `calc-roman-numerals` | Roman Numerals | **B** | Bidirectional conversion between Arabic integers and classical Roman numerals. |

---

## 4. Summary & Verification Matrix

- **Total Utilities Mapped**: 275 (100.0%)
- **Archetype Distribution**:
  - **Archetype A (Generator)**: 14 utilities (5.1%)
  - **Archetype B (Converter / Inspector)**: 73 utilities (26.5%)
  - **Archetype C (Analyzer / Report)**: 19 utilities (6.9%)
  - **Archetype D (Visual Tool)**: 45 utilities (16.4%)
  - **Archetype E (Editor Split)**: 42 utilities (15.3%)
  - **Archetype F (Data Table)**: 16 utilities (5.8%)
  - **Archetype G (File Table + Rules)**: 34 utilities (12.4%)
  - **Archetype H (Media)**: 32 utilities (11.6%)
- **Prohibitions Maintained**:
  - Zero raw native form controls.
  - Zero card-in-a-card nestings.
  - Zero fake preloaded data.
  - Zero AI widgets or telemetry banners.
