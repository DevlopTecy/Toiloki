const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

// 1. NetworkWorkspaceView.css
const f1 = path.join(projectRoot, 'src/workspaces/network/NetworkWorkspaceView.css');
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace('text-transform: uppercase;', 'text-transform: none;\n  letter-spacing: normal;');
c1 = c1.replace('color: var(--accent, #d4b06a);', 'color: var(--text-primary);');
fs.writeFileSync(f1, c1, 'utf8');

// 2. DeveloperWorkspaceView.css
const f2 = path.join(projectRoot, 'src/workspaces/developer/DeveloperWorkspaceView.css');
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/\.jwt-card-badge\s*\{[^}]+\}/, `.jwt-card-badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: normal;
  color: var(--text-tertiary);
  text-transform: none;
  font-family: var(--font-sans);
}`);
fs.writeFileSync(f2, c2, 'utf8');

// 3. DataWorkspaceView.css
const f3 = path.join(projectRoot, 'src/workspaces/data/DataWorkspaceView.css');
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(/\.editor-lang-badge\s*\{[^}]+\}/, `.editor-lang-badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: normal;
  color: var(--text-tertiary);
  text-transform: none;
  font-family: var(--font-sans);
}`);
fs.writeFileSync(f3, c3, 'utf8');

// 4. ToilokiLogo.css
const f4 = path.join(projectRoot, 'src/components/common/ToilokiLogo.css');
let c4 = fs.readFileSync(f4, 'utf8');
c4 = c4.replace('text-transform: uppercase;', 'text-transform: none;');
c4 = c4.replace('letter-spacing: 0.22em;', 'letter-spacing: 0.04em;');
fs.writeFileSync(f4, c4, 'utf8');

console.log('Final uppercase cleanup complete');
