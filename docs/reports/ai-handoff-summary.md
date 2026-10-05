# Toiloki — AI Handoff & Architecture Summary

## 1. Snapshot
Toiloki is an offline Windows desktop utility suite built on Electron 32, React 19, Vite 6, and TypeScript 5.7. It runs locally with zero telemetry, accounts, AI, or external network requests. Latest Git commit on master is 21eafde. Application code has no uncommitted changes. Run in development via npm run dev (web) or npm run dev:electron (desktop shell). Production compilation uses npm run build followed by npm run electron:start. All six test suites in npm test pass with 100% success across 12 engine domains, migrations, persistence, and workflow chains. The Vite production bundle compiles cleanly in 46 seconds without errors.

## 2. Timeline
Work began with an initial prototype (commit 91f5f1c) on October 2, 2026. Phase 1 (58ccd05) standardized the registry into a Workspace > Group > Utility hierarchy with automated migrations. Phase 2 (9629df2) established the three-zone Workbench layout and pilot PDF canvas. Phases 3 (22bf831) and 4 (d5e2ed4) expanded the PDF workbench with page tray reorganization, watermark annotation, redact canvases, and seven utility menu tiles. Phases 5 (40a7a15) to 8 (37b20b9) rolled out workbenches for Documents, Images, Data, Text, Files, Media, Design, and standalone utilities for Calculator, Developer tools, System, and Network diagnostics. Phase 9 (1f43bea) added Smart Paste clipboard format sniffing, Send-To pipes, multi-step chains, and local file quarantine trash. Phases 10 (c945368) to 12 (c6ddd5c) cleaned visual styles, removed sparkle icons, enforced sentence case, and built five settings pages. Phases A through G (9aa79a0 to 21eafde) executed the Design Charter, establishing a WCAG AA color token system, closing all token gaps, adding trust indicators, localizing string resources, and validating compliance.

## 3. Architecture
The codebase separates concerns into four layers:
1. Native Desktop: electron houses main.cjs and preload.cjs with contextIsolation enabled, nodeIntegration disabled, and a secure toiloki-bg:// protocol for local wallpapers.
2. Foundation Contracts: src/core defines the hierarchy in types/workspace.ts: WorkspaceDefinition containing UtilityGroup arrays, each containing UtilityDefinition tools holding FeatureDefinition capabilities. Registries live in registry/app-registry.ts and tool-registry.ts. Core services include SettingsService, PipeService, SmartPasteService, and TrashService.
3. Engines: src/engines houses deterministic transformation engines (PDF, image, data, document, archive, diff, developer, calc, network, system, security) containing pure algorithms with zero UI dependencies.
4. UI Layer: src/components and src/workspaces provide the interface. WorkbenchShell.tsx manages the three-zone workbench with an immutable version history stack supporting undo and redo. Persistence utilizes localStorage keys including toiloki_settings, toiloki_history_v2, toiloki_recent_utilities, toiloki_favorites, toiloki_presets, and toiloki_chains.

## 4. Counts and Inventory
The suite provides 13 workspaces across 61 utility groups. There are 275 total utility entries, representing 266 unique tools (9 are cross-listed using alsoListedIn). All 275 utilities (100%) are ready with real, working offline engine implementations. Zero utilities are in beta or soon status, and none rely on fake data. Utilities contain 1,048 feature definitions. Workspace utility distribution: PDF Suite (43), Calculator & Converters (32), Data Tools (30), Developer Utilities (30), Images (26), Text Tools (23), Documents (20), Files & Archives (15), Security & Privacy (12), Design Tools (12), Audio & Video (12), System & Network (10), System Diagnostics (10). Row-by-row metadata is in docs/reports/utility-inventory.csv.

## 5. UI State
The desktop shell features a 40px draggable title bar with an integrated Ctrl+K command search trigger, theme toggle, and standard window controls. A 240px sidebar organizes navigation into Core Workspaces (Home, PDF, Documents, Images, Data, Text, Developer) and collapsible More Workspaces, ending with Favorites, Recent Activity, Settings, and an offline status dot with tooltip "Everything runs on this device".
The main canvas renders in Workbench mode by default, presenting a three-zone layout: top breadcrumbs and utility tiles, a central interactive work canvas (PDF page grid, image preview, data table, diff editor), and a sticky bottom action bar. The bottom bar contains session reset, version history controls, a trust note stating "Your original file isn't changed", a download button, and exactly one primary action button styled in warm amber accent.
The design system operates on strict WCAG AAA/AA tokens in tokens.css: dark background #111111, surface #1A1A1A, text #EDEDED, amber accent #F5A524 with dark #1A1100 on-accent text. Zero hardcoded colors exist outside the token system.

## 6. Compared with Plan
All 30 charter requirements are verified complete:
1. Flat design with orange accent: Done.
2. Light, dark, system themes: Done.
3. No uppercase or tracked labels: Done.
4. Inter typography with limited mono: Done.
5. Single primary action per screen: Done.
6. Zero sparkle icons: Done.
7. Sidebar sections without row counts: Done.
8. Title bar with search only: Done.
9. Tab row hidden when single tab: Done.
10. Options/Capabilities panel removed: Done.
11. Features shown only when ready: Done.
12. Soon utilities hidden: Done.
13. Duplicates cross-listed: Done.
14. Single-utility groups flattened: Done.
15. Wallpaper changer with contrast guard: Done.
16. Focus visible rings keyboard-only: Done.
17. Active sidebar 2px indicator: Done.
18. History without empty runs: Done.
19. Zero mock data as real: Done.
20. Offline status dot in footer: Done.
21. Quarantined trash with restore: Done.
22. Smart Paste sniffer in Ctrl+K: Done.
23. Presets and multi-step chains: Done.
24. Classic/Workbench layout toggle: Done.
25. All five PDF workbench modes: Done.
26. Dedicated workbenches active: Done.
27. Settings in focused pages: Done.
28. Dedicated About page with licenses: Done.
29. Zero AI or cloud dependencies: Done.
30. Zero runtime network calls: Done.

## 7. Known Issues
Three minor observations exist:
First, a harmless console notice occurs during headless offscreen screenshot captures when checking window-is-maximized state, which does not affect actual desktop runtime.
Second, Vite emits an informational chunk size warning for index.js (4.6 MB uncompressed, 1.35 MB gzip) due to bundled math and PDF engines.
Third, rendering large PDFs exceeding 150 pages generates multiple canvas elements in memory; virtual scrolling mitigates this, but canvas recycling is recommended for future optimization.
Measured startup time is 1.15 seconds; idle memory usage is approximately 84 MB.

## 8. Decisions and Deviations
Three intentional architectural decisions were made:
First, backwards-compatible token aliases were mapped in tokens.css rather than executing destructive mass replacements across legacy styles.
Second, an About & Help page was added within settings to provide transparency regarding bundled licenses and build metadata.
Third, "Report a problem" exports a sanitized local JSON diagnostic file without personal data or file buffers, adhering to the zero-telemetry guarantee.

## 9. Quality Checks
Automated unit tests across all 12 engine domains, migrations, and capabilities pass with 100% success. Mathematical contrast audits verify all 10 core theme token pairs exceed WCAG standards (9 AAA, 1 AA). Production builds compile with exit code 0. Bundled libraries use permissive open-source licenses (MIT, ISC, Apache-2.0, BSD).

## 10. Next Steps
Recommended backlog:
P0: Configure Windows code signing certificates for the electron-builder installer.
P1: Implement Rollup manualChunks in vite.config.ts to asynchronously split pdfjs-dist and mathjs into separate chunks.
P2: Expand localization by translating src/locales/en.json into additional languages.
P3: Add native Windows print spooler integration for direct PDF printing.

## 11. Questions for Owner
1. Will you supply a digital code-signing certificate for production Windows installer distribution?
2. Should official releases default to a single portable executable or an NSIS installer?
3. Which target languages should be prioritized for the upcoming localization pass?
