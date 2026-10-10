# Toiloki (Desktop Utility Suite)

> **Toiloki** is a high-performance, local-first desktop utility suite for Windows designed for everyday digital tasks across 8 core workspaces. It is completely offline, privacy-first, free of AI/cloud dependencies, and engineered with a modular **Workspace → Utility → Feature → Engine** hierarchy.

---

## 🏛️ Core Architecture

```
App
 └── Workspace
      └── Utility
           └── Feature
                └── Engine
```

- **Workspace**: User's broad goal/domain.
- **Utility**: Group of related operations.
- **Feature**: Specific user-facing capability.
- **Engine**: Reusable, UI-independent technical implementation.

---

## 🔒 The 8 Locked Workspaces

1. **PDF**: Page Organizer (Merge, Split, Extract, Rotate), PDF Converter (Images → PDF), PDF Optimizer, PDF Security, PDF Information.
2. **Documents**: Converter (DOCX → HTML/Text), Document Diff / Comparison, Text Cleanup.
3. **Images**: Transformer (Resize, Rotate, Flip), Format Converter (PNG, JPEG, WebP), Optimizer (Quality Compression), Adjustments (Brightness, Contrast, Saturation, Grayscale), Image → PDF.
4. **Data**: Viewer, Converter (CSV ↔ JSON, JSON ↔ YAML, CSV ↔ XLSX), Formatter & Validator (JSON pretty/minify, XML).
5. **Text**: Transformer (Case conversion, Sort, Deduplicate), Cleaner (Whitespace, line endings), Analyzer (Word count, read time), Compare (Diff).
6. **Developer**: Code Formatter, Encode/Decode (Base64, URL), JWT Inspector, UUID v4 Generator, Live Regex Tester.
7. **Calculator & Converters**: Scientific Math Expression Evaluator, Multi-Unit Converter (Length, Mass, Temperature, Data size).
8. **Files & Archives**: Batch File Renamer (prefix, suffix, find & replace, numbering), Hash-based Duplicate Finder (SHA-256), Archive Manager.

---

## 🚀 Getting Started

### Prerequisites (for Rust & Tauri Desktop Backend)
To run or build the native Rust backend:
```bash
# Install Rust via Windows Package Manager
winget install Rustlang.Rustup

# Restart terminal or reload environment, then verify:
cargo --version
rustc --version
```

### Development
```bash
# Start frontend dev server
npm run dev

# Start Tauri desktop app (Rust backend + React frontend)
npm run dev:tauri

# Start legacy Electron desktop app (optional fallback)
npm run dev:electron
```

### Production Build
```bash
# Build React + Vite bundle
npm run build

# Build Tauri native Windows executable (installer & portable binary)
npm run build:tauri

# Or package legacy Electron executable
npm run electron:dist
```

### Test Suite
```bash
# Run all automated verification tests (including Tauri & Rust architecture checks)
npm test
```


---

## 🛡️ Privacy Guarantee
- 100% offline local processing
- Zero network requests or telemetry
- All file manipulations occur directly on your local machine
- Isolated temporary file session directory with automatic cleanup on exit
