const fs = require('fs');
const path = require('path');

const code = fs.readFileSync('src/core/registry/app-registry.ts', 'utf8');
const vm = require('vm');

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

console.log('Workspaces count:', sandbox.WORKSPACES.length);
sandbox.WORKSPACES.forEach(ws => {
  console.log(`Workspace: ${ws.id} (${ws.name})`);
  ws.groups.forEach(g => {
    console.log(`  Group: ${g.id} (${g.name}) - ${g.utilities.length} utils`);
    g.utilities.forEach(u => {
      console.log(`    - ${u.id}: ${u.name} [${u.status}]`);
    });
  });
});
