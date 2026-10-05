# Remote URL Inventory & Classification Report

**Document Status:** Complete & Verified  
**Application:** Toiloki – Local Suite (v1.0.0)  
**Audit Head Commit:** Phase 1 (Privacy and Trust)  
**Audit Date:** October 2026  

---

## 1. Executive Summary

As part of Phase 1 (Privacy and Trust), an exhaustive static code scan was performed across all source files in `src/` to identify and classify every instance of `http://` and `https://`.

- **Total URL strings detected:** 53 occurrences across TypeScript/TSX source files.
- **Runtime CDN / Remote Asset References:** **0** (The single runtime CDN URL in `pdfThumbnailService.ts` has been replaced with local bundled assets).
- **Network Requests Initiated at Runtime:** **0** (Enforced by strict CSP and Electron `session.webRequest` cancellation).

---

## 2. Classification Matrix

All detected URLs fall into three strictly non-network categories:

### Category A: XML / SVG / JSON Schema Namespaces (Non-resolving Identifiers)
These strings are W3C / ISO / ECMA standard specification identifiers required by standards-compliant parsers and document generators (such as SVG images, OpenXML DOCX packages, and sitemaps). They are treated purely as static string tokens and are never fetched over the wire.

| File Path & Line | URL String | Functional Usage |
| :--- | :--- | :--- |
| `src/assets/art-pack/default-art-pack.ts` (19 lines) | `http://www.w3.org/2000/svg` | `xmlns` attribute for inline SVG icon generation |
| `src/components/common/ToilokiLogo.tsx:51` | `http://www.w3.org/2000/svg` | `xmlns` attribute for Toiloki vector logo |
| `src/components/workbench/data/DataCanvas.tsx:398` | `http://json-schema.org/draft-07/schema#` | `$schema` identifier in JSON Schema generator |
| `src/engines/documents/document.engine.ts:218` | `http://schemas.openxmlformats.org/package/2006/content-types` | OpenXML DOCX `[Content_Types].xml` namespace |
| `src/engines/documents/document.engine.ts:225, 230` | `http://schemas.openxmlformats.org/package/2006/relationships` | OpenXML `_rels/.rels` package relationships namespace |
| `src/engines/documents/document.engine.ts:226` | `http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument` | OpenXML main document relationship type identifier |
| `src/engines/documents/document.engine.ts:254` | `http://schemas.openxmlformats.org/wordprocessingml/2006/main` | WordprocessingML `document.xml` root namespace |
| `src/engines/documents/document.engine.ts:559` | `http://schemas.openxmlformats.org/package/2006/metadata/core-properties` | OpenXML `core.xml` document properties namespace |
| `src/engines/documents/document.engine.ts:560` | `http://purl.org/dc/elements/1.1/` | Dublin Core metadata namespace identifier |
| `src/engines/documents/document.engine.ts:561` | `http://purl.org/dc/terms/` | Dublin Core terms namespace identifier |
| `src/engines/documents/document.engine.ts:562` | `http://purl.org/dc/dcmitype/` | Dublin Core Dcmitype namespace identifier |
| `src/engines/documents/document.engine.ts:563` | `http://www.w3.org/2001/XMLSchema-instance` | W3C XMLSchema-instance namespace identifier |
| `src/engines/documents/document.engine.ts:573` | `http://schemas.openxmlformats.org/officeDocument/2006/extended-properties` | OpenXML `app.xml` extended properties namespace |
| `src/engines/network/network.engine.ts:395` | `http://www.sitemaps.org/schemas/sitemap/0.9` | XML sitemap standard namespace identifier |
| `src/engines/network/network.engine.ts:455` | `https://schema.org` | Schema.org JSON-LD structural context identifier |
| `src/engines/pdf/pdf.engine.ts:1495, 1505, 1506, 1513, 1537` | `http://schemas.openxmlformats.org/...` | PDF-to-DOCX export OpenXML package namespaces |
| `src/workspaces/design/DesignWorkspaceView.tsx:353` | `http://www.w3.org/2000/svg` | `xmlns` attribute for SVG color preview |

---

### Category B: Sample Input & Placeholder Test Strings (User Interface Data)
These URLs appear strictly as default placeholder values or demo data in inputs and textareas (such as the URL parser, cURL builder, QR code generator, and regex tester). They are never executed, fetched, or resolved.

| File Path & Line | URL String | Functional Usage |
| :--- | :--- | :--- |
| `src/components/workbench/WorkbenchShell.tsx:163, 166, 417, 658` | `https://toiloki.dev` | Sample URL string in utility input demo states |
| `src/engines/developer/developer.engine.ts:326` | `https://toiloki.app` | Template header in generated Markdown/API notes |
| `src/workspaces/developer/DeveloperWorkspaceView.tsx:57` | `https://toiloki.local/api/v1/query?tag=utility&lang=en` | Sample URL query string for URL parser test |
| `src/workspaces/developer/DeveloperWorkspaceView.tsx:618` | `https://toiloki.local` | Sample base URL in cURL generator demo |
| `src/workspaces/network/NetworkWorkspaceView.tsx:153` | `https://api.example.com/v1/resource` | Sample input for cURL command builder |
| `src/workspaces/network/NetworkWorkspaceView.tsx:278` | `https://mywebsite.com` | Sample input for Sitemap XML generator |
| `src/workspaces/network/NetworkWorkspaceView.tsx:321` | `https://toiloki.app` | Sample input for Open Graph preview card |
| `src/workspaces/system/SystemWorkspaceView.tsx:267` | `https://toiloki.app` | Sample URL for ping/traceroute command formatter |
| `src/workspaces/text/TextWorkspaceView.tsx:68` | `https://toiloki.dev/dashboard`, `http://docs.local` | Sample text block for URL extractor test |

---

### Category C: Remediated Remote Asset Reference
| File Path & Line | Original URL String | Remediated Status |
| :--- | :--- | :--- |
| `src/components/workbench/pdf/pdfThumbnailService.ts:47` | `https://cdn.jsdelivr.net/npm/pdfjs-dist/cmaps/` | **REMOVED & REPLACED**. `pdfjs-dist` cmaps (169 files) and standard fonts (16 files) are packaged locally in `public/cmaps` and `public/standard_fonts`, resolved via local base URL. |

---

## 3. Verification & Guarding

To guarantee zero network calls:
1. **Network Interceptor Guard Test (`tests/network-guard.test.cjs`):** Intercepts Node's `http.request`, `https.request`, and `global.fetch` during test execution. Any outbound attempt immediately throws an assertion error and aborts the suite.
2. **Production CSP in `index.html`:** Enforces `connect-src 'self'`, `default-src 'self' toiloki-bg: data: blob:`, and `font-src 'self' data:`.
3. **Electron WebRequest Filter:** Enforces session-wide cancellation of all external HTTP/HTTPS traffic.
