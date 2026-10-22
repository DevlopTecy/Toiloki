# Toiloki

> A high-performance, local-first desktop utility suite designed for everyday digital tasks. 100% offline, privacy-focused, and free of cloud dependencies or telemetry.

---

## Overview

**Toiloki** provides a comprehensive collection of productivity, file manipulation, and developer utilities in a single, cohesive desktop interface. All operations run directly on your machine—no data ever leaves your device.

## Key Features

- **100% Offline & Private**: Zero external network requests, zero telemetry, zero analytics.
- **Fast & Responsive**: Built with React, TypeScript, and modern desktop runtimes (Tauri / Electron).
- **Dark & Light Mode**: Accessible, high-contrast design system adhering to WCAG standards.
- **Extensive Toolset**: Organized into focused workspaces for streamlined workflows.

---

## Workspaces & Capabilities

- **PDF**: Merge, split, extract, rotate, reorder, compress, and convert images to PDF.
- **Documents**: Convert document formats, inspect and clean text, and compare revisions.
- **Images**: Resize, crop, rotate, convert formats (PNG, JPEG, WebP, SVG), compress, and adjust color properties.
- **Audio & Video**: Media inspection, waveform visualization, format conversion, and clipping.
- **Files & Archives**: Batch renamer, duplicate file finder (SHA-256 hash), and archive compression/extraction (ZIP, TAR, GZ).
- **Data**: CSV, JSON, YAML, and XML viewers, converters, formatters, and validators.
- **Text**: Case conversion, whitespace cleaning, line sorting, deduplication, word counters, and diff viewer.
- **Developer**: Code formatters, encoders/decoders (Base64, URL, HTML), JWT inspector, UUID generator, and Regex tester.
- **Calculator & Converters**: Scientific expression evaluator and multi-unit conversions (length, mass, temperature, data storage).
- **Security & Privacy**: Hash generation (MD5, SHA-1, SHA-256, SHA-512), checksum verification, and password generation.
- **Network & Web**: URL parser, query string builder, DNS lookup helpers, and HTTP request inspector.
- **Color & Design**: Color picker, palette generator, format conversion (HEX, RGB, HSL), and contrast checker.

---

## Getting Started

### Prerequisites

- **Node.js**: `v20` or higher
- **npm**: `v10` or higher
- *(Optional for Tauri native builds)*: [Rust](https://rustup.rs/)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/DevlopTecy/Toiloki.git
cd Toiloki
npm install
```

### Running Locally

Run the web interface development server:
```bash
npm run dev
```

Run as a desktop application via Electron:
```bash
npm run dev:electron
```

Or run via Tauri:
```bash
npm run dev:tauri
```

### Building for Production

Compile the web application:
```bash
npm run build
```

Build the native desktop installers:
```bash
# Package with Electron (NSIS installer & portable)
npm run electron:dist

# Or build with Tauri
npm run build:tauri
```

### Running Tests

Execute the automated test suite:
```bash
npm test
```

---

## Architecture

Toiloki is built around a modular architecture:

```
App
 └── Workspace
      └── Utility
           └── Feature
                └── Engine
```

- **Workspace**: Top-level functional domain (e.g., PDF, Data, Images).
- **Utility**: Group of related actions or tools.
- **Feature**: Specific user-facing task or view.
- **Engine**: Headless, reusable core logic isolated from UI components.

---

## Privacy Guarantee

- All file processing happens locally in memory or temporary local workspace directories.
- No accounts, subscriptions, or login required.
- No background network connections or telemetry.

---

## License

This project is licensed under the [MIT License](LICENSE).
