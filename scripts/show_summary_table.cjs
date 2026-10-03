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
const perWs = [];
let totalReady = 0, totalBeta = 0, totalSoon = 0;

WORKSPACES.forEach((ws) => {
  const allUtils = ws.groups.flatMap((g) => g.utilities);
  let r = 0, b = 0, s = 0;
  allUtils.forEach((u) => {
    const st = u.status || 'ready';
    if (st === 'ready') r++;
    else if (st === 'beta') b++;
    else if (st === 'soon') s++;
  });
  totalReady += r; totalBeta += b; totalSoon += s;
  perWs.push({
    id: ws.id,
    name: ws.name,
    total: allUtils.length,
    ready: r,
    beta: b,
    soon: s
  });
});

console.table(perWs);
console.log(`GRAND TOTAL: Ready: ${totalReady}, Beta: ${totalBeta}, Soon: ${totalSoon}, Total: ${totalReady + totalBeta + totalSoon}`);
