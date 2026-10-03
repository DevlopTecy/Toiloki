const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('src/core/registry/app-registry.ts', 'utf8');
let sanitized = code
  .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];/g, '')
  .replace(/export const WORKSPACES: WorkspaceDefinition\[\] =/g, 'WORKSPACES =')
  .replace(/: LucideIcon/g, '')
  .replace(/'var\(--[^)]+\)'/g, "''");

const endIdx = sanitized.lastIndexOf('];');
if (endIdx !== -1) {
  sanitized = sanitized.slice(0, endIdx + 2);
}

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

const wsId = process.argv[2] || 'text';
const ws = sandbox.WORKSPACES.find(w => w.id === wsId);
if (ws) {
  console.log(`Workspace: ${ws.name} (${ws.id})`);
  ws.groups.forEach(g => {
    console.log(`  Group: ${g.name} (${g.id})`);
    g.utilities.forEach(u => {
      console.log(`    - [${u.status || 'ready'}] ${u.id}: ${u.name}`);
    });
  });
} else {
  console.log('Not found:', wsId);
}
