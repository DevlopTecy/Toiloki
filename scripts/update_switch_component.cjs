const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

// 1. FeaturesControlsPanel.tsx
const f1 = path.join(projectRoot, 'src/components/common/FeaturesControlsPanel.tsx');
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  "import { Sliders, ToggleLeft, ToggleRight, Layers, ArrowRight, Download, Zap } from 'lucide-react';",
  "import { Sliders, Layers, ArrowRight, Download, Zap } from 'lucide-react';"
);

c1 = c1.replace(
  /\{isChecked \?\s*\(\s*<ToggleRight[^>]+>\s*\)\s*:\s*\(\s*<ToggleLeft[^>]+>\s*\)\}/,
  `<span className={\`toiloki-switch-track \${isChecked ? 'is-checked' : ''}\`}>
                            <span className="toiloki-switch-thumb" />
                          </span>`
);

fs.writeFileSync(f1, c1, 'utf8');
console.log('Updated FeaturesControlsPanel.tsx');

// 2. FeaturesControlsPanel.css
const f2 = path.join(projectRoot, 'src/components/common/FeaturesControlsPanel.css');
let c2 = fs.readFileSync(f2, 'utf8');

const oldCssPattern = /\.opt-toggle-btn\s*\{[^}]+\}\s*\.toggle-icon\.on\s*\{[^}]+\}/;
const newCss = `.opt-toggle-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.toiloki-switch-track {
  width: 28px;
  height: 16px;
  background-color: var(--border-default, #2a2a2a);
  border: 1px solid var(--border-default, #2a2a2a);
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  padding: 1px;
  transition: background-color 150ms ease, border-color 150ms ease;
  position: relative;
  box-sizing: border-box;
}

.toiloki-switch-track.is-checked {
  background-color: var(--accent, #D4B06A);
  border-color: var(--accent, #D4B06A);
}

.toiloki-switch-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ffffff;
  transition: transform 150ms ease, background-color 150ms ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.toiloki-switch-track.is-checked .toiloki-switch-thumb {
  transform: translateX(12px);
  background-color: #0b0c0f;
}`;

c2 = c2.replace(oldCssPattern, newCss);
fs.writeFileSync(f2, c2, 'utf8');
console.log('Updated FeaturesControlsPanel.css');
