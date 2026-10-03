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

const targets = ['design', 'network', 'system', 'media'];
sandbox.WORKSPACES.filter(w => targets.includes(w.id)).forEach(w => {
  console.log(`\n=== WORKSPACE: ${w.id} (${w.name}) ===`);
  w.groups.forEach(g => {
    console.log(` Group: ${g.id} - ${g.name}`);
    g.utilities.forEach(u => console.log(`   * ${u.id} - "${u.name}" (${u.status})`));
  });
});
