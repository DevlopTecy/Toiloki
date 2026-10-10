# Toiloki Engine Architecture & Migration Plan

**Document Version**: 2.0.0  
**Date**: October 9, 2026  
**Status**: Authoritative Planning Specification (Phase 0)  
**Target Backend**: Rust + Tauri 2.0 IPC Bridge  

---

## 1. Executive Summary & Backend Wiring

Toiloki is a high-precision, air-gapped desktop utility suite. To eliminate performance bottlenecks in heavy computations (cryptographic hashing, multi-pass file encryption, archive compression, million-row CSV parsing, directory tree scanning, image manipulation, and audio waveform decoding), heavy background execution is shifted from the frontend TypeScript thread into a dedicated, deterministic Rust backend.

### 1.1 Backend Wiring Topology
The Rust backend is wired directly into the application using **Tauri 2.0 Commands and Event Streams**:
- **Rust Crate Core**: Located at `src-tauri/` (package: `toiloki`, library: `toiloki_lib`).
- **IPC Dispatcher**: Tauri's native IPC mechanism (`tauri::generate_handler!`) exposes fast, memory-safe functions without sidecar process overhead.
- **Frontend Bridge**: Located at `src/core/platform/tauri-bridge.ts`. It provides dynamic detection (`isTauriEnvironment()`), invokes commands via `invokeTauri()`, and attaches the typed bridge interface onto `window.toiloki.rustEngine`.
- **Platform Abstraction**: Decoupled via `PlatformAdapter` (`src/core/platform/platform-adapter.ts`). When running in Tauri, `TauriPlatformAdapter` delegates all high-volume tasks directly to the Rust engine while graceful fallbacks remain available for Web PWA and Electron development environments.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Frontend (React 19 + TypeScript)                  │
│   Archetypes (A–H) ───► UI Kit Controls ───► PlatformAdapter            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Tauri IPC (invoke / emit)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Tauri Bridge (`tauri-bridge.ts`)                     │
│    engine.run(jobId, utilityId, params, inputs)  │ engine.cancel(jobId) │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Zero-Copy Path Passing & Event Stream
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Rust Backend (`src-tauri/`)                        │
│  ┌───────────────────────┬──────────────────────┬────────────────────┐  │
│  │  toiloki_engine::crypto│ toiloki_engine::fs   │ toiloki_engine::csv│  │
│  ├───────────────────────┼──────────────────────┼────────────────────┤  │
│  │  toiloki_engine::media │ toiloki_engine::arch │ toiloki_engine::sys│  │
│  └───────────────────────┴──────────────────────┴────────────────────┘  │
│           │ Throttled Progress (~10 Hz)          ▲ Path Validation  │
│           ▼ Typed Event Stream                   │ (No Traversal)   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Universal Bridge Contract

The engine migration enforces a strict, typed contract between the TypeScript UI layer and the Rust backend.

### 2.1 Interface Definition

```typescript
export interface EngineBridgeContract {
  /**
   * Spawns an asynchronous job in the Rust backend.
   * Progress, logs, intermediate results, and terminal outcomes stream over the event channel.
   */
  run(
    jobId: string,
    utilityId: string,
    params: Record<string, unknown>,
    inputs: EngineInputDescriptor[]
  ): Promise<void>;

  /**
   * Signals the Rust engine to abort an active job.
   * Rust workers monitor an Arc<AtomicBool> cancellation token.
   */
  cancel(jobId: string): Promise<boolean>;

  /**
   * Subscribes to real-time events emitted by an active job.
   */
  onEvent(jobId: string, callback: (event: EngineStreamEvent) => void): () => void;
}

export interface EngineInputDescriptor {
  type: 'file_path' | 'text' | 'buffer_temp' | 'number';
  path?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export type EngineStreamEvent =
  | { type: 'progress'; jobId: string; percentage: number; currentItem?: string; etaSeconds?: number }
  | { type: 'log'; jobId: string; level: 'info' | 'warn' | 'error'; message: string }
  | { type: 'result'; jobId: string; data: unknown; outputPath?: string; elapsedMs: number }
  | { type: 'error'; jobId: string; error: EngineTypedError };

export interface EngineTypedError {
  code: string;
  userMessage: string;
  details?: string;
}
```

### 2.2 Path Passing & IPC Zero-Copy Rule
1. **Never Pass Whole Files Over IPC**: Raw binary files are never passed across the IPC boundary as byte buffers. Only validated absolute filesystem paths (`string`) are passed.
2. **Session Temp Directory**: All temporary outputs, intermediate transforms, and staging files are written strictly to the dedicated session temp directory:
   - Windows path: `%TEMP%\toiloki\session_<sessionId>\`
   - All session files are automatically purged when the application exits or when `engine.cancel(jobId)` is invoked.
3. **Progress Throttling**: Progress events emitted by long-running loops (e.g. hashing 100,000 files, scrubbing gigabytes of media) are throttled in Rust to approximately **10 Hz** (every 100ms) to eliminate frontend thread starvation and UI stutter.
4. **Path Canonicalization & Directory Traversal Guards**:
   - Every input path is resolved and canonicalized via `std::fs::canonicalize` or `dunce::canonicalize` (for Windows UNC path resilience).
   - Paths containing relative traversal segments (`../`, `..\\`) or attempting to escape approved user working folders are rejected with error code `ERR_PATH_TRAVERSAL`.
5. **Zero Network crates & Enforced Offline Isolation**:
   - The Rust backend must never include crates that perform network I/O (`reqwest`, `hyper`, `surf`, `tungstenite`, `native-tls`, etc.).
   - Compliance is strictly enforced via `cargo-deny` with `[bans.network]` and automated CI license auditing (`cargo audit`).

---

## 3. Candidate Crates & Licensing Matrix

All crates chosen for the Rust backend prioritize permissively licensed, production-grade, memory-efficient libraries:

| Crate | Version | Target Domain | License | Purpose & Notes |
|:---|:---:|:---|:---:|:---|
| `sha2` | 0.10 | Crypto / Hash | MIT / Apache-2.0 | Hardware-accelerated SHA-256, SHA-512 |
| `md-5` | 0.10 | Crypto / Hash | MIT / Apache-2.0 | RFC 1321 MD5 verification (legacy/compatibility) |
| `blake3` | 1.5 | Crypto / Hash | Apache-2.0 / CC0 | Ultra-fast multi-threaded BLAKE3 checksums |
| `hmac` | 0.12 | Crypto / HMAC | MIT / Apache-2.0 | Keyed cryptographic message authentication |
| `aes-gcm` | 0.10 | Crypto / Encryption | MIT / Apache-2.0 | AES-256-GCM authenticated file encryption |
| `argon2` | 0.5 | Crypto / KDF | MIT / Apache-2.0 | Memory-hard Argon2id key derivation |
| `rand` | 0.8 | Crypto / RNG | MIT / Apache-2.0 | ThreadRng CSPRNG for password/shredder generator |
| `zxcvbn` | 2.2 | Security / Strength | MIT | Offline password entropy and dictionary analysis |
| `walkdir` / `jwalk` | 2.5 / 0.8 | File System | MIT / Apache-2.0 | Multi-threaded parallel directory traversal |
| `trash` | 5.2 | File Operations | MIT | Native OS recycle bin / trash integration |
| `sysinfo` | 0.30 | System / Diagnostics | MIT | CPU, memory, process list, OS metrics |
| `csv` | 1.3 | Data / CSV | MIT / Unlicense | Ultra-fast streaming CSV reader & writer |
| `serde_json` | 1.0 | Data / JSON | MIT / Apache-2.0 | High-performance JSON serializer/deserializer |
| `rusqlite` | 0.32 | Data / SQL | MIT | In-memory embedded SQLite for SQL-on-CSV queries |
| `zip` | 2.2 | Archives | MIT | ZIP archive creation, extraction, Zip-Slip guard |
| `tar` | 0.4 | Archives | MIT / Apache-2.0 | POSIX ustar archive reader and writer |
| `flate2` | 1.0 | Archives / Compression | MIT / Apache-2.0 | DEFLATE / GZIP streaming compression |
| `sevenz-rust` | 0.6 | Archives | Apache-2.0 | Pure Rust 7-Zip (.7z) decompressor |
| `image` | 0.25 | Images / Processing | MIT / Apache-2.0 | JPEG, PNG, WebP, BMP, TIFF decoding/encoding |
| `fast_image_resize`| 5.1 | Images / Scaling | MIT / Apache-2.0 | SIMD-accelerated high-quality image resampling |
| `symphonia` | 0.5 | Audio / Decoding | MPL-2.0 | Pure Rust audio decoder (MP3, WAV, AAC, FLAC) |
| `hound` | 3.5 | Audio / WAV | Apache-2.0 | Fast 16-bit/24-bit PCM WAV reading and writing |
| `lopdf` | 0.34 | PDF / Processing | MIT | Low-level PDF parsing, page extraction, repair |

> [!NOTE]
> **Video Utilities & FFmpeg Sidecar (Phase 3D)**: All video transcoding, container manipulation, and frame extraction utilities remain marked `'soon'` and hidden until an external, LGPL-compliant FFmpeg sidecar binary is configured. No external binary is bundled directly in the git repository.

---

## 4. Complete 275 Utility Migration Matrix

This matrix classifies every single utility across all 13 workspaces by its current engine, target Rust module, and migration roadmap status.

### 4.1 Security & Privacy (`security`) — 12 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `sec-password-generator` | Password Generator | TypeScript | `toiloki_engine::crypto::pwd` | Target Batch 3A |
| `sec-passphrase-generator` | Passphrase Generator | TypeScript | `toiloki_engine::crypto::passphrase` | Target Batch 3A |
| `sec-password-strength` | Password Strength Checker | TypeScript | `toiloki_engine::crypto::zxcvbn` | Target Batch 3A |
| `sec-totp-generator` | TOTP Generator | TypeScript | `toiloki_engine::crypto::totp` | Target Batch 3A |
| `sec-cert-decoder` | PEM/Certificate Decoder | TypeScript | `toiloki_engine::crypto::x509` | Target Batch 3A |
| `sec-keypair-generator` | Key Pair Generator | TypeScript | `toiloki_engine::crypto::rsa_ed25519` | Target Batch 3A |
| `sec-hash-hmac` | Hash & HMAC | TypeScript | `toiloki_engine::crypto::hash_hmac` | Target Batch 3A |
| `sec-file-encrypt` | File Encrypt/Decrypt | TypeScript | `toiloki_engine::crypto::aes_argon2` | Target Batch 3A |
| `sec-checksum-verifier` | Checksum Verifier | TypeScript | `toiloki_engine::crypto::checksum` | Target Batch 3A |
| `sec-secure-shred` | Secure Shred | TypeScript | `toiloki_engine::fs::shredder` | Target Batch 3A |
| `sec-metadata-scrubber` | Metadata Scrubber | TypeScript | `toiloki_engine::media::metadata_scrub` | Target Batch 3A |
| `sec-text-redaction` | Text Redaction Helper | TypeScript | `toiloki_engine::text::pii_redactor` | Target Batch 3A |

### 4.2 Color & Design (`design`) — 12 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `design-color-converter` | Color Converter | TypeScript | `toiloki_engine::design::color` | Target Batch 3A |
| `design-palette-generator` | Palette Generator | TypeScript | `toiloki_engine::design::palette` | Target Batch 3A |
| `design-contrast-checker` | Contrast Checker | TypeScript | `toiloki_engine::design::contrast` | Target Batch 3A |
| `design-gradient-generator` | Gradient Generator | TypeScript | `toiloki_engine::design::gradient` | Target Batch 3A |
| `design-color-blindness-sim` | Color Blindness Simulator | TypeScript | `toiloki_engine::design::colorblind` | Target Batch 3A |
| `design-image-palette-extractor`| Image Palette Extractor | TypeScript | `toiloki_engine::image::palette` | Target Batch 3A |
| `design-css-shadow-gen` | CSS Shadow Generator | TypeScript | `toiloki_engine::design::shadow` | Target Batch 3A |
| `design-svg-optimizer` | SVG Optimizer | TypeScript | `toiloki_engine::design::svg_opt` | Target Batch 3A |
| `design-favicon-generator` | Favicon/Icon Generator | TypeScript | `toiloki_engine::image::ico` | Target Batch 3A |
| `design-font-inspector` | Font Inspector | TypeScript | `toiloki_engine::design::font` | Target Batch 3A |
| `design-type-scale-calc` | Type Scale Calculator | TypeScript | `toiloki_engine::design::type_scale`| Target Batch 3A |
| `design-token-exporter` | Design Token Exporter | TypeScript | `toiloki_engine::design::tokens` | Target Batch 3A |

### 4.3 System & Maintenance (`system`) — 10 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `sys-disk-usage-tree` | Disk Usage Tree | TypeScript | `toiloki_engine::sys::disk_usage` | Target Batch 3B |
| `sys-large-file-finder` | Large File Finder | TypeScript | `toiloki_engine::sys::large_files` | Target Batch 3B |
| `sys-temp-cache-cleaner` | Temp & Cache Cleaner | TypeScript | `toiloki_engine::sys::temp_cleaner`| Target Batch 3B |
| `sys-empty-folder-cleaner`| Empty Folder Cleaner | TypeScript | `toiloki_engine::sys::empty_dirs` | Target Batch 3B |
| `sys-system-info-report` | System Info Report | Rust (sysinfo) | `toiloki_engine::sys::sysinfo` | Active (Batch 3B) |
| `sys-env-vars-viewer` | Environment Variables | TypeScript | `toiloki_engine::sys::env_vars` | Target Batch 3B |
| `sys-hosts-file-viewer` | Hosts File Viewer | TypeScript | `toiloki_engine::sys::hosts` | Target Batch 3B |
| `sys-process-viewer` | Process Viewer (Read-only)| Rust (sysinfo) | `toiloki_engine::sys::processes` | Active (Batch 3B) |
| `sys-startup-items-viewer`| Startup Items Viewer | TypeScript | `toiloki_engine::sys::startup` | Target Batch 3B |
| `sys-clipboard-history` | Clipboard History | TypeScript | `toiloki_engine::sys::clipboard` | Target Batch 3B |

### 4.4 Network & Web (`network`) — 10 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `net-url-builder` | URL Builder | TypeScript | `toiloki_engine::net::url_builder`| Target Batch 3B |
| `net-mime-lookup` | MIME Lookup | TypeScript | `toiloki_engine::net::mime` | Target Batch 3B |
| `net-curl-builder` | cURL Builder | TypeScript | `toiloki_engine::net::curl` | Target Batch 3B |
| `net-robots-sitemap-gen`| robots.txt & Sitemap | TypeScript | `toiloki_engine::net::sitemap` | Target Batch 3B |
| `net-meta-og-gen` | Meta Tag & Open Graph | TypeScript | `toiloki_engine::net::meta_og` | Target Batch 3B |
| `net-subnet-cidr` | Subnet/CIDR | TypeScript | `toiloki_engine::net::cidr` | Target Batch 3B |
| `net-local-port-check` | Local Port Check | TypeScript | `toiloki_engine::net::ports` | Target Batch 3B |
| `net-dns-record-helper` | DNS Record Helper | TypeScript | `toiloki_engine::net::dns` | Target Batch 3B |
| `net-ip-converter` | IP Converter | TypeScript | `toiloki_engine::net::ip` | Target Batch 3B |
| `net-mac-vendor-lookup` | MAC Vendor Lookup | TypeScript | `toiloki_engine::net::mac_oui` | Target Batch 3B |

### 4.5 Developer (`developer`) — 30 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `format-json-code` | JSON Formatter | TypeScript | `toiloki_engine::dev::json_fmt` | Target Batch 3B |
| `format-html-code` | HTML Formatter | TypeScript | `toiloki_engine::dev::html_fmt` | Target Batch 3B |
| `format-css-code` | CSS Formatter | TypeScript | `toiloki_engine::dev::css_fmt` | Target Batch 3B |
| `format-js-code` | JavaScript Formatter | TypeScript | `toiloki_engine::dev::js_fmt` | Target Batch 3B |
| `format-xml-code` | XML Formatter | TypeScript | `toiloki_engine::dev::xml_fmt` | Target Batch 3B |
| `format-sql-code` | SQL Formatter | TypeScript | `toiloki_engine::dev::sql_fmt` | Target Batch 3B |
| `dev-base64` | Base64 | TypeScript | `toiloki_engine::dev::base64` | Target Batch 3B |
| `dev-url` | URL Encoding | TypeScript | `toiloki_engine::dev::url_encode`| Target Batch 3B |
| `dev-jwt` | JWT Inspector | TypeScript | `toiloki_engine::dev::jwt` | Target Batch 3B |
| `dev-url-components` | URL Components | TypeScript | `toiloki_engine::dev::url_parse` | Target Batch 3B |
| `gen-uuid` | UUID Generator | TypeScript | `toiloki_engine::dev::uuid` | Target Batch 3B |
| `gen-random-string` | Random String | TypeScript | `toiloki_engine::dev::rand_str` | Target Batch 3B |
| `gen-timestamp` | Timestamp | TypeScript | `toiloki_engine::dev::timestamp`| Target Batch 3B |
| `gen-random-number` | Random Number | TypeScript | `toiloki_engine::dev::rand_num` | Target Batch 3B |
| `gen-test-data` | Test Data | TypeScript | `toiloki_engine::dev::mock_data`| Target Batch 3B |
| `dev-qr-generator` | QR Generator | TypeScript | `toiloki_engine::dev::qr_gen` | Target Batch 3B |
| `dev-qr-scanner` | QR Scanner | TypeScript | `toiloki_engine::dev::qr_scan` | Target Batch 3B |
| `dev-barcode-generator`| Barcode Generator | TypeScript | `toiloki_engine::dev::barcode` | Target Batch 3B |
| `dev-chmod-calculator` | chmod Calculator | TypeScript | `toiloki_engine::dev::chmod` | Target Batch 3B |
| `dev-user-agent-parser`| User-Agent Parser | TypeScript | `toiloki_engine::dev::ua_parse` | Target Batch 3B |
| `dev-gitignore-generator`| .gitignore Generator | TypeScript | `toiloki_engine::dev::gitignore`| Target Batch 3B |
| `regex-tester-feature` | Regex Tester | TypeScript | `toiloki_engine::dev::regex` | Target Batch 3B |
| `web-url-parser` | URL Parser | TypeScript | `toiloki_engine::dev::url_parse` | Target Batch 3B |
| `web-http-headers` | HTTP Headers | TypeScript | `toiloki_engine::dev::http_hdr` | Target Batch 3B |
| `web-query-string` | Query String | TypeScript | `toiloki_engine::dev::query_str`| Target Batch 3B |
| `web-status-codes` | HTTP Status Reference | TypeScript | `toiloki_engine::dev::http_stat`| Target Batch 3B |
| `dev-cron-explainer` | Cron Explainer | TypeScript | `toiloki_engine::dev::cron` | Target Batch 3B |
| `dev-px-rem` | px/rem Converter | TypeScript | `toiloki_engine::dev::px_rem` | Target Batch 3B |
| `sec-hash-hmac` | Hash & HMAC (Dev Alias) | TypeScript | `toiloki_engine::crypto::hash_hmac` | Target Batch 3A/3B |
| `dev-env-diff` | .env Diff | TypeScript | `toiloki_engine::dev::env_diff` | Target Batch 3B |

### 4.6 Text (`text`) — 23 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `case-conversion` | Case Conversion | TypeScript | `toiloki_engine::text::case` | Target Batch 3C |
| `reverse-text` | Reverse Text | TypeScript | `toiloki_engine::text::reverse` | Target Batch 3C |
| `sort-lines` | Sort Lines | TypeScript | `toiloki_engine::text::sort` | Target Batch 3C |
| `deduplicate-lines` | Deduplicate Lines | TypeScript | `toiloki_engine::text::dedup` | Target Batch 3C |
| `text-extract-entities`| Extract Entities | TypeScript | `toiloki_engine::text::extract` | Target Batch 3C |
| `text-find-duplicate-paras`| Find Duplicate Paras | TypeScript | `toiloki_engine::text::para_dup`| Target Batch 3C |
| `text-slugify` | Slugify | TypeScript | `toiloki_engine::text::slug` | Target Batch 3C |
| `text-natural-sort` | Natural Sort | TypeScript | `toiloki_engine::text::natsort` | Target Batch 3C |
| `text-to-table` | Text to Table | TypeScript | `toiloki_engine::text::table` | Target Batch 3C |
| `text-multi-file-regex`| Multi-file Regex | TypeScript | `toiloki_engine::text::grep_rep`| Target Batch 3C |
| `remove-spaces` | Remove Extra Spaces | TypeScript | `toiloki_engine::text::whitespace`| Target Batch 3C |
| `remove-blank-lines` | Remove Blank Lines | TypeScript | `toiloki_engine::text::blank_ln`| Target Batch 3C |
| `invisible-chars` | Invisible Characters | TypeScript | `toiloki_engine::text::invis` | Target Batch 3C |
| `line-endings` | Line-Ending Normalization| TypeScript | `toiloki_engine::text::crlf` | Target Batch 3C |
| `text-statistics` | Text Statistics | TypeScript | `toiloki_engine::text::stats` | Target Batch 3C |
| `reading-time` | Reading Time | TypeScript | `toiloki_engine::text::read_time`| Target Batch 3C |
| `text-word-frequency` | Word Frequency | TypeScript | `toiloki_engine::text::word_freq`| Target Batch 3C |
| `dev-base64` | Base64 (Text Alias) | TypeScript | `toiloki_engine::dev::base64` | Target Batch 3C |
| `dev-url` | URL Encoding (Text Alias)| TypeScript | `toiloki_engine::dev::url_encode`| Target Batch 3C |
| `html-encoding` | HTML Encoding | TypeScript | `toiloki_engine::text::html_enc`| Target Batch 3C |
| `unicode-tool` | Unicode Tool | TypeScript | `toiloki_engine::text::unicode` | Target Batch 3C |
| `text-diff` | Text Diff | TypeScript | `toiloki_engine::text::diff` | Target Batch 3C |
| `text-lorem-ipsum` | Lorem Ipsum | TypeScript | `toiloki_engine::text::lorem` | Target Batch 3C |

### 4.7 Data (`data`) — 30 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `csv-viewer` | CSV Table Viewer | TypeScript (PapaParse)| `toiloki_engine::csv::streaming`| Target Batch 3C |
| `json-tree` | JSON Tree Viewer | TypeScript | `toiloki_engine::data::json_tree`| Target Batch 3C |
| `xml-tree` | XML Tree Viewer | TypeScript | `toiloki_engine::data::xml_tree` | Target Batch 3C |
| `yaml-viewer` | YAML Viewer | TypeScript | `toiloki_engine::data::yaml` | Target Batch 3C |
| `xlsx-viewer` | XLSX Viewer | TypeScript (ExcelJS) | `toiloki_engine::data::xlsx` | Target Batch 3C |
| `csv-to-json` | CSV ↔ JSON | TypeScript | `toiloki_engine::csv::convert` | Target Batch 3C |
| `csv-to-xlsx` | CSV ↔ XLSX | TypeScript | `toiloki_engine::data::csv_xlsx` | Target Batch 3C |
| `json-to-yaml` | JSON ↔ YAML | TypeScript | `toiloki_engine::data::json_yaml`| Target Batch 3C |
| `xml-to-json` | XML ↔ JSON | TypeScript | `toiloki_engine::data::xml_json` | Target Batch 3C |
| `data-ndjson-tsv` | NDJSON/TSV Converter | TypeScript | `toiloki_engine::data::ndjson` | Target Batch 3C |
| `data-sort-filter` | Sort & Filter | TypeScript | `toiloki_engine::csv::filter` | Target Batch 3C |
| `data-dedup` | Remove Duplicates | TypeScript | `toiloki_engine::csv::dedup` | Target Batch 3C |
| `data-columns` | Select & Rename Columns | TypeScript | `toiloki_engine::csv::columns` | Target Batch 3C |
| `data-format-values` | Format Values | TypeScript | `toiloki_engine::csv::format` | Target Batch 3C |
| `data-jsonpath-query` | JSONPath Query | TypeScript | `toiloki_engine::data::jsonpath` | Target Batch 3C |
| `data-join-csv` | Join & Merge CSV | TypeScript | `toiloki_engine::csv::join` | Target Batch 3C |
| `data-pivot-groupby` | Pivot & Group-by | TypeScript | `toiloki_engine::csv::pivot` | Target Batch 3C |
| `data-split-csv` | Split CSV | TypeScript | `toiloki_engine::csv::split` | Target Batch 3C |
| `data-encoding-fixer` | Encoding Fixer | TypeScript | `toiloki_engine::data::encoding` | Target Batch 3C |
| `data-json-to-typescript`| JSON to TypeScript | TypeScript | `toiloki_engine::data::json_ts` | Target Batch 3C |
| `data-json-schema-validator`| JSON Schema Validator | TypeScript | `toiloki_engine::data::schema` | Target Batch 3C |
| `validate-json` | JSON Validation | TypeScript | `toiloki_engine::data::val_json` | Target Batch 3C |
| `validate-xml` | XML Validation | TypeScript | `toiloki_engine::data::val_xml` | Target Batch 3C |
| `validate-csv` | CSV Validation | TypeScript | `toiloki_engine::csv::validate` | Target Batch 3C |
| `validate-yaml` | YAML Validation | TypeScript | `toiloki_engine::data::val_yaml` | Target Batch 3C |
| `format-json-code` | JSON Formatter (Data) | TypeScript | `toiloki_engine::dev::json_fmt` | Target Batch 3C |
| `format-xml-code` | XML Formatter (Data) | TypeScript | `toiloki_engine::dev::xml_fmt` | Target Batch 3C |
| `yaml-formatting` | YAML Formatting | TypeScript | `toiloki_engine::data::yaml_fmt` | Target Batch 3C |
| `data-sql-csv` | SQL on CSV | TypeScript | `toiloki_engine::csv::rusqlite` | Target Batch 3C |
| `data-json-diff` | JSON Diff | TypeScript | `toiloki_engine::data::json_diff`| Target Batch 3C |

### 4.8 Files & Archives (`files`) — 15 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `batch-rename-files` | Batch Rename | Rust / TS Hybrid | `toiloki_engine::fs::rename` | Target Batch 3D |
| `file-type-detection` | File Type Detection | TypeScript | `toiloki_engine::fs::magic_bytes`| Target Batch 3D |
| `file-metadata-ops` | File Metadata & Size | TypeScript | `toiloki_engine::fs::metadata` | Target Batch 3D |
| `files-organize-type-date`| Organize by Type/Date | TypeScript | `toiloki_engine::fs::organize` | Target Batch 3D |
| `files-split-join-large`| Split & Join Large Files | TypeScript | `toiloki_engine::fs::split_join` | Target Batch 3D |
| `files-folder-text-tree`| Folder to Text Tree | TypeScript | `toiloki_engine::fs::tree` | Target Batch 3D |
| `file-analyzer-full` | File Analyzer | Rust / TS Hybrid | `toiloki_engine::fs::analyzer` | Target Batch 3D |
| `duplicate-finder-hash`| Duplicate Finder | TypeScript | `toiloki_engine::fs::duplicates` | Target Batch 3D |
| `file-compare-hashes` | File Comparison | TypeScript | `toiloki_engine::fs::compare` | Target Batch 3D |
| `files-folder-compare` | Folder Compare | TypeScript | `toiloki_engine::fs::folder_diff`| Target Batch 3D |
| `create-zip-archive` | Create ZIP | TypeScript (JSZip) | `toiloki_engine::arch::zip_create`| Target Batch 3D |
| `extract-zip-archive` | Extract ZIP | TypeScript (JSZip) | `toiloki_engine::arch::zip_extract`| Target Batch 3D |
| `inspect-zip-archive` | Inspect ZIP | TypeScript (JSZip) | `toiloki_engine::arch::zip_inspect`| Target Batch 3D |
| `tar-gzip-manager` | TAR & GZIP | TypeScript (pako) | `toiloki_engine::arch::tar_gzip` | Target Batch 3D |
| `files-7z-extract` | 7z Extract | TypeScript | `toiloki_engine::arch::sevenz` | Target Batch 3D |

### 4.9 Audio & Video (`media`) — 12 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `audio-converter` | Audio Converter | Web Audio API | `toiloki_engine::media::symphonia`| Target Batch 3D |
| `audio-trimmer` | Audio Trimmer | Web Audio API | `toiloki_engine::media::waveform` | Target Batch 3D |
| `audio-joiner` | Audio Joiner | Web Audio API | `toiloki_engine::media::joiner` | Target Batch 3D |
| `audio-volume-fade` | Volume & Fade | Web Audio API | `toiloki_engine::media::volume` | Target Batch 3D |
| `audio-metadata-editor`| Audio Metadata | TypeScript | `toiloki_engine::media::id3` | Target Batch 3D |
| `video-converter` | Video Converter | None (Mock) | `ffmpeg_sidecar` | Soon (Hidden) |
| `video-compressor` | Video Compressor | None (Mock) | `ffmpeg_sidecar` | Soon (Hidden) |
| `video-trimmer` | Video Trimmer | None (Mock) | `ffmpeg_sidecar` | Soon (Hidden) |
| `video-to-gif` | Video to GIF | None (Mock) | `ffmpeg_sidecar` | Soon (Hidden) |
| `media-extract-audio` | Extract Audio | None (Mock) | `ffmpeg_sidecar` | Soon (Hidden) |
| `media-frame-extractor`| Frame Extractor | None (Mock) | `ffmpeg_sidecar` | Soon (Hidden) |
| `media-subtitle-shift` | Subtitle Shift & Convert | TypeScript | `toiloki_engine::media::subtitles`| Target Batch 3D |

### 4.10 Images (`images`) — 26 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `img-resize` | Resize & Scale | Canvas API | `toiloki_engine::img::fast_resize`| Target Batch 3E |
| `img-crop` | Crop Image | Canvas API | `toiloki_engine::img::crop` | Target Batch 3E |
| `img-rotate` | Rotate & Flip | Canvas API | `toiloki_engine::img::rotate` | Target Batch 3E |
| `img-aspect` | Aspect Ratio & Dimensions| Canvas API | `toiloki_engine::img::aspect` | Target Batch 3E |
| `img-heic-converter` | HEIC Converter | None | `libheif_rs` | Soon (Hidden) |
| `img-avif-converter` | AVIF Converter | Canvas API | `toiloki_engine::img::avif` | Target Batch 3E |
| `img-gif-webp-builder` | Animated GIF/WebP | Canvas API | `toiloki_engine::img::anim` | Target Batch 3E |
| `img-batch-watermark` | Batch Watermark | Canvas API | `toiloki_engine::img::watermark` | Target Batch 3E |
| `convert-jpg` | Convert to JPG | Canvas API | `toiloki_engine::img::encode` | Target Batch 3E |
| `convert-png` | Convert to PNG | Canvas API | `toiloki_engine::img::encode` | Target Batch 3E |
| `convert-webp` | Convert to WebP | Canvas API | `toiloki_engine::img::encode` | Target Batch 3E |
| `convert-bmp` | Convert to BMP | Canvas API | `toiloki_engine::img::encode` | Target Batch 3E |
| `convert-tiff` | Convert to TIFF | Canvas API | `toiloki_engine::img::encode` | Target Batch 3E |
| `img-svg-to-png` | SVG to PNG | Canvas API | `resvg` / `usvg` | Target Batch 3E |
| `compress-image` | Compress Image | Canvas API | `toiloki_engine::img::compress` | Target Batch 3E |
| `resize-compress` | Resize during Compression| Canvas API | `toiloki_engine::img::res_comp` | Target Batch 3E |
| `adjust-color` | Brightness & Contrast | Canvas API | `toiloki_engine::img::adjust` | Target Batch 3E |
| `adjust-saturation` | Saturation & Vibrance | Canvas API | `toiloki_engine::img::adjust` | Target Batch 3E |
| `adjust-filters` | Blur & Grayscale | Canvas API | `toiloki_engine::img::filters` | Target Batch 3E |
| `exif-view` | EXIF Viewer | TypeScript (exifreader)| `toiloki_engine::img::exif_view` | Target Batch 3E |
| `exif-remove` | Remove EXIF | TypeScript | `toiloki_engine::img::exif_strip`| Target Batch 3E |
| `img-info` | Image Information | Canvas API | `toiloki_engine::img::info` | Target Batch 3E |
| `multi-img-pdf` | Multiple Images → PDF | TypeScript (pdf-lib) | `toiloki_engine::pdf::images_pdf`| Target Batch 3E |
| `img-collage-sheet` | Collage & Contact Sheet | Canvas API | `toiloki_engine::img::collage` | Target Batch 3E |
| `img-sprite-sheet` | Sprite Sheet | Canvas API | `toiloki_engine::img::spritesheet`| Target Batch 3E |
| `img-before-after` | Before/After Compare | Canvas API | `toiloki_engine::img::diff_mask` | Target Batch 3E |

### 4.11 Documents (`documents`) — 20 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `docx-to-pdf` | DOCX → PDF | TypeScript (mammoth) | `toiloki_engine::doc::docx_pdf` | Target Batch 3E |
| `pdf-to-docx` | PDF → DOCX | TypeScript | `toiloki_engine::doc::pdf_docx` | Target Batch 3E |
| `txt-to-pdf-doc` | TXT → PDF | TypeScript | `toiloki_engine::doc::txt_pdf` | Target Batch 3E |
| `md-to-pdf-doc` | Markdown → PDF | TypeScript | `toiloki_engine::doc::md_pdf` | Target Batch 3E |
| `html-to-pdf-doc` | HTML → PDF | TypeScript | `toiloki_engine::doc::html_pdf` | Target Batch 3E |
| `rtf-to-pdf` | RTF → PDF | TypeScript | `toiloki_engine::doc::rtf_pdf` | Target Batch 3E |
| `edit-text` | Edit Text | TypeScript | `toiloki_engine::text::edit` | Target Batch 3E |
| `find-replace` | Find and Replace | TypeScript | `toiloki_engine::text::find_rep` | Target Batch 3E |
| `doc-stats` | Document Statistics | TypeScript | `toiloki_engine::text::stats` | Target Batch 3E |
| `text-cleanup` | Text Cleanup | TypeScript | `toiloki_engine::text::cleanup` | Target Batch 3E |
| `doc-markdown-editor` | Markdown Editor | TypeScript | `toiloki_engine::doc::md_editor`| Target Batch 3E |
| `doc-toc-generator` | Table of Contents | TypeScript | `toiloki_engine::doc::toc` | Target Batch 3E |
| `doc-mail-merge` | Mail Merge | TypeScript | `toiloki_engine::doc::mail_merge`| Target Batch 3E |
| `doc-batch-find-replace`| Batch Find & Replace | TypeScript | `toiloki_engine::doc::batch_rep` | Target Batch 3E |
| `doc-diff` | Document Diff | TypeScript (diff) | `toiloki_engine::doc::diff` | Target Batch 3E |
| `export-pdf` | Export to PDF | TypeScript | `toiloki_engine::doc::exp_pdf` | Target Batch 3E |
| `export-txt` | Export to TXT | TypeScript | `toiloki_engine::doc::exp_txt` | Target Batch 3E |
| `export-html` | Export to HTML | TypeScript | `toiloki_engine::doc::exp_html` | Target Batch 3E |
| `export-md` | Export to Markdown | TypeScript | `toiloki_engine::doc::exp_md` | Target Batch 3E |
| `doc-office-metadata` | Office Metadata | TypeScript (adm-zip) | `toiloki_engine::doc::metadata` | Target Batch 3E |

### 4.12 PDF (`pdf`) — 43 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `merge-pdf` | Merge PDF | TypeScript (pdf-lib) | `toiloki_engine::pdf::merge` | Target Batch 3E |
| `split-pdf` | Split PDF | TypeScript (pdf-lib) | `toiloki_engine::pdf::split` | Target Batch 3E |
| `extract-pages` | Extract Pages | TypeScript (pdf-lib) | `toiloki_engine::pdf::extract` | Target Batch 3E |
| `delete-pages` | Delete Pages | TypeScript (pdf-lib) | `toiloki_engine::pdf::delete` | Target Batch 3E |
| `reorder-pages` | Reorder Pages | TypeScript (pdf-lib) | `toiloki_engine::pdf::reorder` | Target Batch 3E |
| `rotate-pages` | Rotate Pages | TypeScript (pdf-lib) | `toiloki_engine::pdf::rotate` | Target Batch 3E |
| `duplicate-pages` | Duplicate Pages | TypeScript (pdf-lib) | `toiloki_engine::pdf::duplicate`| Target Batch 3E |
| `replace-pages` | Replace Pages | TypeScript (pdf-lib) | `toiloki_engine::pdf::replace` | Target Batch 3E |
| `pdf-remove-blank-pages`| Remove Blank Pages | TypeScript | `toiloki_engine::pdf::blank` | Target Batch 3E |
| `pdf-crop-pages` | Crop Pages | TypeScript | `toiloki_engine::pdf::crop` | Target Batch 3E |
| `add-text` | Add Text | TypeScript (pdf-lib) | `toiloki_engine::pdf::annotate` | Target Batch 3E |
| `add-image` | Add Image | TypeScript (pdf-lib) | `toiloki_engine::pdf::annotate` | Target Batch 3E |
| `draw-shapes` | Draw & Shapes | TypeScript (pdf-lib) | `toiloki_engine::pdf::annotate` | Target Batch 3E |
| `highlight-underline` | Highlight & Underline | TypeScript (pdf-lib) | `toiloki_engine::pdf::annotate` | Target Batch 3E |
| `watermark` | Watermark | TypeScript (pdf-lib) | `toiloki_engine::pdf::watermark`| Target Batch 3E |
| `page-numbers` | Page Numbers | TypeScript (pdf-lib) | `toiloki_engine::pdf::numbers` | Target Batch 3E |
| `pdf-fill-form-fields` | Fill Form Fields | TypeScript (pdf-lib) | `toiloki_engine::pdf::forms` | Target Batch 3E |
| `pdf-bookmarks-editor` | Bookmarks Editor | TypeScript | `toiloki_engine::pdf::bookmarks`| Target Batch 3E |
| `images-to-pdf` | Images → PDF | TypeScript (pdf-lib) | `toiloki_engine::pdf::images_pdf`| Target Batch 3E |
| `docx-to-pdf` | DOCX → PDF (PDF Alias)| TypeScript | `toiloki_engine::doc::docx_pdf` | Target Batch 3E |
| `txt-to-pdf-doc` | TXT → PDF (PDF Alias) | TypeScript | `toiloki_engine::doc::txt_pdf` | Target Batch 3E |
| `md-to-pdf-doc` | Markdown → PDF (Alias)| TypeScript | `toiloki_engine::doc::md_pdf` | Target Batch 3E |
| `html-to-pdf-doc` | HTML → PDF (Alias) | TypeScript | `toiloki_engine::doc::html_pdf` | Target Batch 3E |
| `pdf-to-doc` | PDF → Document Formats | TypeScript | `toiloki_engine::pdf::to_doc` | Target Batch 3E |
| `pdf-to-images` | PDF to Images | TypeScript (pdfjs-dist)| `toiloki_engine::pdf::rasterize`| Target Batch 3E |
| `compress-pdf` | Compress PDF | TypeScript | `toiloki_engine::pdf::compress` | Target Batch 3E |
| `optimize-images` | Optimize Images | TypeScript | `toiloki_engine::pdf::opt_img` | Target Batch 3E |
| `flatten-pdf` | Flatten PDF | TypeScript (pdf-lib) | `toiloki_engine::pdf::flatten` | Target Batch 3E |
| `remove-metadata` | Remove Metadata | TypeScript | `toiloki_engine::pdf::metadata` | Target Batch 3E |
| `pdf-repair-pdf` | Repair PDF | TypeScript | `toiloki_engine::pdf::repair` | Target Batch 3E |
| `extract-text` | Extract Text | TypeScript (pdfjs-dist)| `toiloki_engine::pdf::ext_text` | Target Batch 3E |
| `extract-images` | Extract Images | TypeScript | `toiloki_engine::pdf::ext_img` | Target Batch 3E |
| `extract-metadata` | Extract Metadata | TypeScript | `toiloki_engine::pdf::metadata` | Target Batch 3E |
| `search-text` | Search PDF Text | TypeScript | `toiloki_engine::pdf::search` | Target Batch 3E |
| `password-protect` | Password Protect | TypeScript (pdf-lib) | `toiloki_engine::pdf::security` | Target Batch 3E |
| `encrypt-pdf` | Encrypt PDF | TypeScript (pdf-lib) | `toiloki_engine::pdf::security` | Target Batch 3E |
| `remove-password` | Remove Password | TypeScript | `toiloki_engine::pdf::security` | Target Batch 3E |
| `sign-pdf` | Sign PDF | TypeScript | `toiloki_engine::pdf::sign` | Target Batch 3E |
| `pdf-redact` | Redact PDF | TypeScript | `toiloki_engine::pdf::redact` | Target Batch 3E |
| `file-info` | File Information | TypeScript | `toiloki_engine::pdf::info` | Target Batch 3E |
| `page-count` | Page Count & Stats | TypeScript | `toiloki_engine::pdf::stats` | Target Batch 3E |
| `doc-properties` | Document Properties | TypeScript | `toiloki_engine::pdf::props` | Target Batch 3E |
| `pdf-compare-pdfs` | Compare PDFs | TypeScript | `toiloki_engine::pdf::compare` | Target Batch 3E |

### 4.13 Calculator & Converters (`calculator`) — 32 Utilities

| Utility ID | Utility Name | Current Engine | Target Rust Module | Status |
|:---|:---|:---:|:---:|:---:|
| `calc-basic` | Basic Calculator | TypeScript | Pure Frontend / MathJS | Target Batch 3E |
| `calc-percentage` | Percentage | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-discount` | Discount | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-ratio` | Ratio & Proportion | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-trig-logs` | Scientific Calculator | TypeScript (MathJS) | Pure Frontend / MathJS | Target Batch 3E |
| `calc-constants` | Constants | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-fractions` | Fractions | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-statistics` | Statistics | TypeScript | `toiloki_engine::calc::stats` | Target Batch 3E |
| `calc-equations` | Equations | TypeScript (MathJS) | Pure Frontend | Target Batch 3E |
| `calc-ohms-law` | Ohm's Law | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-power` | Electrical Power | TypeScript | Pure Frontend | Target Batch 3E |
| `unit-converter-all` | Unit Converter | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-age` | Age Calculator | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-date-diff` | Date Difference | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-date-add-sub` | Add/Subtract Dates | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-business-days` | Business Days | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-time-duration` | Time Duration | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-timezone-converter`| Timezone Converter | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-timer-stopwatch` | Timer & Stopwatch | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-currency-manual` | Currency (Manual Rates)| TypeScript | Pure Frontend | Target Batch 3E |
| `calc-number-to-words` | Number to Words | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-loan-emi` | Loan/EMI Calculator | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-amortization` | Amortization Schedule | TypeScript | `toiloki_engine::calc::amort` | Target Batch 3E |
| `calc-compound-interest`| Compound Interest | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-sip` | SIP Calculator | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-gst-vat` | GST/VAT Calculator | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-margin-markup` | Margin & Markup | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-tip-split` | Tip Split | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-bmi` | BMI Calculator | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-calorie-bmr` | Calorie/BMR Calculator | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-number-base` | Number Base | TypeScript | Pure Frontend | Target Batch 3E |
| `calc-roman-numerals` | Roman Numerals | TypeScript | Pure Frontend | Target Batch 3E |

---

## 5. Typed Error Code Dictionary

All low-level errors encountered in Rust map to strongly typed codes with friendly, non-technical user messages:

| Error Code | Category | User-Facing Message | Description |
|:---|:---:|:---|:---|
| `ERR_PATH_NOT_FOUND` | Filesystem | "The specified file or folder could not be found." | Path does not exist or was moved |
| `ERR_PATH_TRAVERSAL` | Security | "The file path is invalid or references unauthorized directories." | Path contains `..` or escapes sandboxed folder |
| `ERR_PERMISSION_DENIED`| Filesystem | "Access was denied by the operating system. Check permissions." | OS permission / read-only lock |
| `ERR_WRONG_PASSWORD` | Cryptography| "Incorrect password or decryption key. Please try again." | AES-GCM MAC validation failed |
| `ERR_CORRUPT_ARCHIVE` | Archives | "The archive is corrupted or not a valid ZIP/TAR/7z file." | Malformed header or truncated stream |
| `ERR_ZIP_SLIP_ATTACK` | Security | "Archive contains dangerous path traversal entries and was blocked." | Path traversal detected inside ZIP entry |
| `ERR_CSV_MALFORMED` | Data | "The CSV structure is malformed. Verify delimiters and quotes." | Uneven columns, unclosed quote |
| `ERR_UNSUPPORTED_FORMAT`| Media | "This media format is not supported locally." | Missing codec or unsupported container |
| `ERR_CANCELLED_BY_USER`| Engine | "Operation was canceled." | User pressed Cancel in the action bar |
| `ERR_OUT_OF_MEMORY` | Engine | "The operation exceeded available system memory limits." | File buffer exceeds safe threshold |
