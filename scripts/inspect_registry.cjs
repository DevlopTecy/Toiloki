const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('src/core/registry/app-registry.ts', 'utf8');

// Strip imports and types
let sanitized = code
  .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];/g, '')
  .replace(/export const WORKSPACES: WorkspaceDefinition\[\] =/g, 'WORKSPACES =')
  .replace(/: LucideIcon/g, '')
  .replace(/'var\(--[^)]+\)'/g, "''");

// Truncate at findUtilityByFeatureId or end of WORKSPACES array
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

console.log('--- Current Registry Summary ---');
let totalListed = 0;
const allUniqueIds = new Set();
const statusCounts = { ready: 0, beta: 0, soon: 0 };
const perWs = [];

WORKSPACES.forEach((ws) => {
  const allUtils = ws.groups.flatMap((g) => g.utilities);
  const uniqueUtils = Array.from(new Set(allUtils.map((u) => u.id)));
  totalListed += allUtils.length;
  const wsStatus = { ready: 0, beta: 0, soon: 0 };
  allUtils.forEach((u) => {
    allUniqueIds.add(u.id);
    const s = u.status || 'ready';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
    wsStatus[s] = (wsStatus[s] || 0) + 1;
  });

  perWs.push({
    id: ws.id,
    name: ws.name,
    groups: ws.groups.length,
    listed: allUtils.length,
    unique: uniqueUtils.length,
    ready: wsStatus.ready,
    beta: wsStatus.beta,
    soon: wsStatus.soon,
  });
});

console.table(perWs);

console.log('\n--- Totals ---');
console.log(`Total Listed Utilities: ${totalListed}`);
console.log(`Total Unique Utility IDs: ${allUniqueIds.size}`);
console.log('Status counts (by listed):', statusCounts);

// List all soon and beta utilities
console.log('\n--- Current Soon Utilities ---');
WORKSPACES.forEach(ws => {
  ws.groups.forEach(g => {
    g.utilities.filter(u => u.status === 'soon').forEach(u => {
      console.log(`[${ws.id} -> ${g.id}] ${u.id}: "${u.name}"`);
    });
  });
});

console.log('\n--- Current Beta Utilities ---');
WORKSPACES.forEach(ws => {
  ws.groups.forEach(g => {
    g.utilities.filter(u => u.status === 'beta').forEach(u => {
      console.log(`[${ws.id} -> ${g.id}] ${u.id}: "${u.name}"`);
    });
  });
});

// Check for single-utility groups
console.log('\n--- Groups with exactly 1 utility ---');
WORKSPACES.forEach(ws => {
  ws.groups.filter(g => g.utilities.length === 1).forEach(g => {
    console.log(`[${ws.id}] Group "${g.name}" (${g.id}) -> 1 util: "${g.utilities[0].name}" (${g.utilities[0].id})`);
  });
});
