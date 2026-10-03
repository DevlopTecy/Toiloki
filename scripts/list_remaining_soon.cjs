const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('src/core/registry/app-registry.ts', 'utf8');

let sanitized = code
  .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];/g, '')
  .replace(/export const WORKSPACES: WorkspaceDefinition\[\] =/g, 'WORKSPACES =')
  .replace(/: LucideIcon/g, '')
  .replace(/'var\(--[^)]+\)'/g, "''");

const endIdx = sanitized.lastIndexOf('];');
if (endIdx !== -1) sanitized = sanitized.slice(0, endIdx + 2);

const sandbox = new Proxy({ WORKSPACES: [] }, {
  has() { return true; },
  get(t, p) { return p in t ? t[p] : p; },
  set(t, p, v) { t[p] = v; return true; }
});

vm.createContext(sandbox);
vm.runInContext(sanitized, sandbox);

sandbox.WORKSPACES.forEach(w => {
  const soons = w.groups.flatMap(g => g.utilities).filter(u => u.status === 'soon');
  if (soons.length > 0) {
    console.log(`\n${w.name} (${w.id}) - ${soons.length} soon:`);
    soons.forEach(u => console.log(`  - ${u.id} ("${u.name}")`));
  }
});
