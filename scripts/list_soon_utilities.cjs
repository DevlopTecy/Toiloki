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

const WORKSPACES = sandbox.WORKSPACES;
const soonList = [];

WORKSPACES.forEach((ws) => {
  ws.groups.forEach((g) => {
    g.utilities.forEach((u) => {
      const st = u.status || 'ready';
      if (st === 'soon') {
        soonList.push({
          workspaceId: ws.id,
          groupId: g.id,
          id: u.id,
          name: u.name,
          featuresCount: u.features ? u.features.length : 0
        });
      }
    });
  });
});

console.log(JSON.stringify(soonList, null, 2));
console.log('Total soon:', soonList.length);
