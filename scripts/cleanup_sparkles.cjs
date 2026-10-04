const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

function replaceInFile(relPath, transforms) {
  const fullPath = path.join(projectRoot, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;
  for (const t of transforms) {
    if (typeof t.from === 'string') {
      if (!content.includes(t.from)) {
        console.warn(`[WARN] Target not found in ${relPath}: ${t.from.substring(0, 40)}...`);
      }
      content = content.split(t.from).join(t.to);
    } else if (t.from instanceof RegExp) {
      if (!t.from.test(content)) {
        console.warn(`[WARN] Regex not matched in ${relPath}: ${t.from}`);
      }
      content = content.replace(t.from, t.to);
    }
  }
  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${relPath}`);
  } else {
    console.log(`No changes made: ${relPath}`);
  }
}

// 1. app-registry.ts
replaceInFile('src/core/registry/app-registry.ts', [
  { from: /^\s*Sparkles,\r?\n/m, to: '' },
  { from: `            icon: Sparkles,`, to: `            icon: Sliders,` },
  { from: `            icon: Sparkles,`, to: `            icon: Palette,` }, // second occurrence will hit design-color-converter
]);

// 2. WorkbenchShell.tsx
replaceInFile('src/components/workbench/WorkbenchShell.tsx', [
  { from: /^\s*Sparkles,\r?\n/m, to: '' }
]);

// 3. SettingsLayout.tsx
replaceInFile('src/components/views/settings/SettingsLayout.tsx', [
  { from: 'Palette, Sparkles, MousePointer,', to: 'Palette, SlidersHorizontal, MousePointer,' },
  { from: "{ id: 'themes', label: 'Themes & Presets', icon: Sparkles,", to: "{ id: 'themes', label: 'Themes & Presets', icon: SlidersHorizontal," }
]);

// 4. ThemeEditorModal.tsx
replaceInFile('src/components/views/settings/sections/ThemeEditorModal.tsx', [
  { from: 'Sparkles, ', to: '' }
]);

// 5. ThemesSection.tsx
replaceInFile('src/components/views/settings/sections/ThemesSection.tsx', [
  { from: 'Sparkles, ', to: '' }
]);

// 6. DeveloperSection.tsx
replaceInFile('src/components/views/settings/sections/DeveloperSection.tsx', [
  { from: 'Sparkles, ', to: '' },
  { from: '<Sparkles size={13} /> Experimental Flags', to: '<Sliders size={13} /> Experimental Flags' }
]);

// 7. ContrastBadge.tsx
replaceInFile('src/components/views/settings/components/ContrastBadge.tsx', [
  { from: 'Sparkles', to: 'Zap' },
  { from: '<Sparkles size={10} /> Auto-fix', to: '<Zap size={10} /> Auto-fix' }
]);

// 8. ButtonsSection.tsx
replaceInFile('src/components/views/settings/sections/ButtonsSection.tsx', [
  { from: 'Sparkles, ', to: '' }
]);

// 9. PdfAnnotateCanvas.tsx
replaceInFile('src/components/workbench/pdf/PdfAnnotateCanvas.tsx', [
  { from: /^\s*Sparkles\r?\n/m, to: '' }
]);

// 10. PdfMarkersCanvas.tsx
replaceInFile('src/components/workbench/pdf/PdfMarkersCanvas.tsx', [
  { from: 'Sparkles, ', to: '' }
]);

// 11. MediaCanvas.tsx
replaceInFile('src/components/workbench/media/MediaCanvas.tsx', [
  { from: /^\s*Sparkles,\r?\n/m, to: '' }
]);

// 12. TextCanvas.tsx
replaceInFile('src/components/workbench/editor/TextCanvas.tsx', [
  { from: /^\s*Sparkles,\r?\n/m, to: '' },
  { from: '<Sparkles size={13} />', to: '<FileText size={13} />' }
]);

// 13. TabBar.tsx
replaceInFile('src/components/layout/TabBar.tsx', [
  { from: 'Sparkles, ', to: '' }
]);

// 14. TitleBar.tsx
replaceInFile('src/components/layout/TitleBar.tsx', [
  { from: 'Sparkles, ', to: 'Clipboard, ' },
  { from: "<Sparkles size={12} style={{ color: 'var(--color-accent)' }} />", to: "<Clipboard size={12} style={{ color: 'var(--color-accent)' }} />" }
]);

// 15. FeaturesControlsPanel.tsx
replaceInFile('src/components/common/FeaturesControlsPanel.tsx', [
  { from: 'Sparkles', to: 'Zap' },
  { from: '<Sparkles size={13} className="act-icon" />', to: '<Zap size={13} className="act-icon" />' }
]);

// 16. SoonState.tsx
replaceInFile('src/components/common/SoonState.tsx', [
  { from: ', Sparkles', to: '' }
]);

// 17. WhatThisCanDoModal.tsx
replaceInFile('src/components/common/WhatThisCanDoModal.tsx', [
  { from: 'Sparkles, ', to: '' },
  { from: 'return <Sparkles size={13} />;', to: 'return <Zap size={13} />;' }
]);

// 18. SmartPasteModal.tsx
replaceInFile('src/components/common/SmartPasteModal.tsx', [
  { from: 'Sparkles, ', to: '' },
  { from: "<Sparkles size={16} style={{ color: 'var(--color-accent)' }} />", to: "<Clipboard size={16} style={{ color: 'var(--color-accent)' }} />" }
]);

console.log('Sparkles cleanup done.');
