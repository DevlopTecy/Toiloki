const fs = require('fs');
const c = fs.readFileSync('src/core/registry/app-registry.ts', 'utf8');

// Find all utility blocks and their statuses
const utilityBlocks = [...c.matchAll(/\{\s*id:\s*['"]([^'"]+)['"],[^{}]*?status:\s*['"]([^'"]+)['"]/gs)];

const statuses = {};
for (const [, id, status] of utilityBlocks) {
  statuses[id] = status;
}

const soon = Object.entries(statuses).filter(([,s]) => s === 'soon');
const beta = Object.entries(statuses).filter(([,s]) => s === 'beta');
const ready = Object.entries(statuses).filter(([,s]) => s === 'ready');

console.log(`Total utilities: ${Object.keys(statuses).length}`);
console.log(`Ready: ${ready.length}`);
console.log(`Beta: ${beta.length}`);
console.log(`Soon: ${soon.length}`);
console.log('\nSoon utilities:');
soon.forEach(([id]) => console.log(' -', id));
console.log('\nBeta utilities:');
beta.forEach(([id]) => console.log(' -', id));
