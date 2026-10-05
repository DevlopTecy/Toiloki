# Toiloki Planned Future Engines Architecture

**Document Version:** 1.0.0  
**Status:** Architectural Blueprint & Future Roadmap  
**Scope:** FFmpeg, HEIC Decoder, and 7-Zip Integration  

---

## 1. Overview & Constraints

In accordance with Toiloki's privacy and local-first charter, all third-party processing engines must satisfy three non-negotiable principles:
1. **100% Offline:** Zero network requests, runtime downloads, or external analytics.
2. **Deterministic & Transparent:** Exact file outputs, observable CPU/RAM usage, and clear user controls.
3. **License & Copyleft Compliance:** Strict respect for LGPL/GPL requirements, dynamic linking boundaries, and source code availability notices.

Currently, media transcoding, native HEIC parsing, and 7Z/RAR decompression are marked **`soon`** in the application registry to prevent deceptive mock execution.

---

## 2. Planned Engine 1: FFmpeg (`ffmpeg.exe` & `ffprobe.exe`)

### 2.1 Specifications
- **Licensing:** LGPL 2.1 (recommended configuration: `--enable-shared --disable-gpl --disable-nonfree`) or GPL 3.0 (if bundling x264/x265).
- **Binary Footprint:** ~65 MB to 110 MB (Windows x64 static/shared build).
- **Execution Architecture:**
  - Placed in Electron resources directory: `app.asar.unpacked/bin/ffmpeg.exe`.
  - Electron main process invokes engine via `child_process.spawn`.
  - IPC channel `toiloki:ffmpeg:transcode` streams stdout/stderr progress updates.
  - Progress calculated by parsing stderr line patterns: `frame=\s*(\d+)` and `time=(\d+:\d+:\d+\.\d+)`.

### 2.2 Unlocked Utilities
Integrating the standalone FFmpeg engine unlocks 7 currently staged utilities in the **Audio & Video** workspace:
1. **`video-converter` (Video Converter):** Transcodes between MP4, MKV, WebM, MOV, and AVI formats.
2. **`video-compressor` (Video Compressor):** Two-pass CRF and bitrate throttling for email, Discord, and archival limits.
3. **`video-to-gif` (Video to GIF):** Palettegen-filtered high-fidelity animated GIF creation.
4. **`media-extract-audio` (Audio Extractor):** High-speed lossy/lossless audio stripping (MP3, AAC, FLAC, WAV).
5. **`media-frame-extractor` (Frame Extractor):** Scene-change and interval image snapshotting (PNG/JPEG).
6. **`audio-trimmer` (Audio Trimmer):** Exact timestamp clipping without re-encoding (`-c copy`).
7. **`audio-normalizer` (Audio Normalizer):** EBU R128 two-pass loudness normalization.

---

## 3. Planned Engine 2: HEIC / High Efficiency Image Decoder

### 3.1 Specifications
- **Licensing:** LGPL 3.0 (`libheif`) / MIT (`heic2any` wrapper with `libde265.wasm`).
- **Binary / Wasm Footprint:** ~3.2 MB to 7.8 MB (WebAssembly binary `libde265.wasm` + wrapper scripts).
- **Execution Architecture:**
  - Executed inside dedicated Web Workers (`heic.worker.ts`) to avoid main-thread UI stalling.
  - Raw `ArrayBuffer` piped to Wasm decoder, returning decoded `ImageData` (RGBA8888).
  - OffscreenCanvas renders output for immediate export to PNG, JPEG, or WebP.

### 3.2 Unlocked Utilities
Integrating the HEIC Wasm decoder unlocks 3 image utilities in the **Images** workspace:
1. **`img-heic-converter` (HEIC to JPG/PNG):** Decodes Apple iOS HEIC photos into widely compatible formats.
2. **`img-batch-heic` (Batch HEIC Processor):** Parallel multi-threaded conversion of entire camera roll folders.
3. **`img-live-photo` (Live Photo Splitter):** Separates the still HEIC keyframe from paired MOV clips.

---

## 4. Planned Engine 3: 7-Zip (`7za.exe` / `7z.dll`)

### 4.1 Specifications
- **Licensing:** GNU LGPL 2.1 (with unRAR license restriction; unRAR binary kept separate).
- **Binary Footprint:** ~2.1 MB (`7za.exe` standalone CLI) or ~4.2 MB (full `7z.exe` + `7z.dll`).
- **Execution Architecture:**
  - Invoked via Electron main process with strict file argument escaping.
  - Zip-Slip path sanitization verified before writing any extracted file to disk.
  - Streaming percentage parsing from stdout progress lines.

### 4.2 Unlocked Utilities
Integrating the 7-Zip engine unlocks 4 archive utilities in the **Files & Archives** workspace:
1. **`archive-7z-extractor` (7Z Extractor):** Decompresses LZMA/LZMA2 7z archives with password support.
2. **`archive-rar-extractor` (RAR Extractor):** Multi-volume RAR 4.x and RAR 5.x extraction.
3. **`archive-7z-creator` (7Z Creator):** High-compression archive authoring with custom dictionary size presets.
4. **`archive-repair` (Archive Header Repair):** Recovers corrupted headers and extracts surviving blocks.

---

## 5. Security & Isolation Matrix

| Engine | Execution Context | Memory Limit | Isolation Level | Network Access |
| :--- | :--- | :--- | :--- | :--- |
| **FFmpeg** | Electron `child_process` (sandboxed spawned PID) | 4 GB | Child Process Sandbox | Disallowed (`-nostdin`, no net protocols) |
| **HEIC Decoder** | Dedicated WebAssembly Web Worker | 1 GB | Browser Thread Sandbox | Blocked by strict CSP |
| **7-Zip** | Electron `child_process` (sandboxed spawned PID) | 2 GB | Path-Sanitized Sandbox | Disallowed |
