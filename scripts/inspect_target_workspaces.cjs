const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('src/core/registry/app-registry.ts', 'utf8');

const sanitized = code
  .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];/g, '')
  .replace(/export const WORKSPACES: WorkspaceDefinition\[\] =/g, 'WORKSPACES =')
  .replace(/: LucideIcon/g, '')
  .replace(/'var\(--[^)]+\)'/g, "''");

const sandbox = new Proxy({ WORKSPACES: [] }, {
  has() { return true; },
  get(target, prop) {
    if (prop in target) return target[prop];
    return prop;
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  }
});

vm.createContext(sandbox);
vm.runInContext(sanitized, sandbox);

['pdf', 'documents', 'data', 'text', 'developer'].forEach(wsId => {
  const ws = sandbox.WORKSPACES.find(w => w.id === wsId);
  console.log(`\n=== WORKSPACE: ${ws.id} (${ws.name}) ===`);
  ws.groups.forEach(g => {
    console.log(`  Group: [${g.id}] "${g.name}"`);
    g.utilities.forEach(u => console.log(`    - [${u.id}] "${u.name}" (status: ${u.status || 'ready'})`));
  });
});
