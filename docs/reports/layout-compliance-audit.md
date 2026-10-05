# Application Layout & Charter Compliance Audit

**Document Status:** Complete & Verified  
**Application:** Toiloki – Local Suite (v1.0.0)  
**Standard:** Design Charter v1.0 & Desktop Suite Layout Requirements  
**Audit Date:** October 2026  

---

## 1. Compliance Matrix

| Requirement | Status | Evidence & Inspection Details | Screenshot Evidence |
| :--- | :---: | :--- | :--- |
| **1. Sidebar in three purpose chunks (Files and media / Data and code / Tools) with a Library (Favorites, Recent, Workflows, Trash) and no counts in rows** | **PARTLY** | The sidebar (`Sidebar.tsx`) currently partitions categories into `Workspaces` (Core) and `More` rather than the 3 requested purpose chunks. Every workspace row displays a count pill (`nav-count-pill`), which violates the "no counts in rows" rule. The Library section includes Favorites, Recent History, and Trash, but lacks Workflows. | `docs/reports/screenshots/home-dark.png`<br>`docs/reports/screenshots/home-light.png` |
| **2. Title bar = logo, centered search, window controls only (no theme toggle, no Smart Paste or Chains pills)** | **PARTLY** | `TitleBar.tsx` successfully eliminates the theme toggle and features the Toiloki logo, centered search, and window controls. However, lines 47–69 still render `Smart Paste` and `Chains` action pills adjacent to the search input. | `docs/reports/screenshots/home-dark.png`<br>`docs/reports/screenshots/home-light.png` |
| **3. Tab row only with 2+ tabs** | **PARTLY** | `TabBar.tsx` supports multi-tab management, but in `App.tsx` (line 452), `<TabBar>` is rendered unconditionally even when only a single tab (`tabs.length === 1`) is active. | `docs/reports/screenshots/home-dark.png`<br>`docs/reports/screenshots/home-light.png` |
| **4. Each workspace uses the workbench with a top menubar** | **DONE** | All 13 workspaces are wrapped in `WorkbenchShell.tsx` (lines 1996–2037) featuring a prominent top bar with `<nav className="workbench-menubar" role="menubar">`, categorized dropdown menus for each group, and full utility routing. | `docs/reports/screenshots/pdf-workbench-file-dark.png`<br>`docs/reports/screenshots/pdf-workbench-file-light.png` |
| **5. PDF menu names without the "PDF" prefix** | **DONE** | In `app-registry.ts`, menu and action names drop the "PDF" prefix (e.g. "Organize", "Edit", "Convert", "Optimize", "Extract", "Secure", "Info", with utilities named "Merge PDF", "Split PDF", "Compress PDF", "Rotate Pages", etc.). None use "PDF" as a leading prefix (e.g., no "PDF Merge" or "PDF Compress"). | `docs/reports/screenshots/pdf-workbench-file-dark.png`<br>`docs/reports/screenshots/pdf-workbench-file-light.png` |
| **6. Compression presets as tiles** | **NOT DONE** | In both `WorkbenchShell.tsx` (line 3940) and `PdfWorkspaceView.tsx` (line 1100), compression profiles are implemented as an HTML `<select>` dropdown menu (`<option value="recommended">`, `<option value="extreme">`), rather than selectable graphical tiles/cards. | `docs/reports/screenshots/pdf-workbench-file-dark.png`<br>`docs/reports/screenshots/pdf-workbench-file-light.png` |
| **7. Result summary with numbers** | **DONE** | `ResultViewer.tsx` prominently renders exact numeric metrics: before and after file sizes, total byte savings, percentage reduction (`-63.7%`), processing duration in milliseconds (`45ms elapsed`), and batch completion tallies (`X of Y files`). | `docs/reports/screenshots/pdf-workbench-file-dark.png`<br>`docs/reports/screenshots/pdf-workbench-file-light.png` |
| **8. Background changer survives restart** | **DONE** | The custom backdrop configuration (solid, gradient, image path, opacity, blur) is saved to persistent `localStorage` under `toiloki_custom_themes` and `toiloki_settings`. Custom background images are saved to disk via Electron IPC. Verified passing in `tests/settings-persistence.test.cjs` and `tests/e2e-smoke.test.cjs`. | `docs/reports/screenshots/settings-appearance-dark.png`<br>`docs/reports/screenshots/settings-appearance-light.png` |

---

## 2. Summary Breakdown
- **DONE:** 4 items (#4, #5, #7, #8)
- **PARTLY:** 3 items (#1, #2, #3)
- **NOT DONE:** 1 item (#6)

---

## 3. Recommended Remediation Order
1. **TitleBar Clean-up (Item 2):** Relocate `Smart Paste` and `Chains` pills out of `TitleBar.tsx` into keyboard shortcuts and sidebar/palette triggers so the title bar contains strictly: Logo, Centered Search (`Ctrl+K`), and Window Controls.
2. **Tab Row Conditional Visibility (Item 3):** Wrap `<TabBar>` in `App.tsx` with `{tabs.length > 1 && ...}` so single-tab mode does not consume vertical viewport space.
3. **Sidebar Restructuring (Item 1):** Reorganize the 13 workspaces into 3 logical purpose chunks (`Files and media`, `Data and code`, `Tools`), remove row count badges, and add `Workflows` to the Library group.
4. **Compression Preset Tiles (Item 6):** Refactor the compression `<select>` dropdown in `WorkbenchShell.tsx` and `PdfWorkspaceView.tsx` into a responsive 3-tile grid (Recommended, High Compression, Extreme) with visual radio state.
