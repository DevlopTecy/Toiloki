const fs = require('fs');
const path = require('path');

const views = [
  'src/workspaces/pdf/PdfWorkspaceView.tsx',
  'src/workspaces/documents/DocumentsWorkspaceView.tsx',
  'src/workspaces/images/ImagesWorkspaceView.tsx',
  'src/workspaces/media/MediaWorkspaceView.tsx',
  'src/workspaces/data/DataWorkspaceView.tsx',
  'src/workspaces/text/TextWorkspaceView.tsx',
  'src/workspaces/developer/DeveloperWorkspaceView.tsx',
  'src/workspaces/calculator/CalculatorWorkspaceView.tsx',
  'src/workspaces/files/FilesWorkspaceView.tsx',
  'src/workspaces/security/SecurityWorkspaceView.tsx',
  'src/workspaces/design/DesignWorkspaceView.tsx',
  'src/workspaces/network/NetworkWorkspaceView.tsx',
  'src/workspaces/system/SystemWorkspaceView.tsx',
];

for (const v of views) {
  if (!fs.existsSync(v)) {
    console.log('File does not exist:', v);
    continue;
  }
  const content = fs.readFileSync(v, 'utf8');
  const lines = content.split('\n').length;
  // Match utilityId checks
  const utilMatches = [...content.matchAll(/utilityId\s*===?\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  // Match switch cases if any
  const switchMatches = [...content.matchAll(/case\s+['"]([^'"]+)['"]\s*:/g)].map(m => m[1]);
  const handled = Array.from(new Set([...utilMatches, ...switchMatches]));
  console.log(`\n=== ${path.basename(v)} (${lines} lines) ===`);
  console.log(`Handled utility IDs count: ${handled.length}`);
  console.log(`Handled IDs: ${handled.join(', ')}`);
}
