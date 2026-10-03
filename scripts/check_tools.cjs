const fs = require('fs');
const c = fs.readFileSync('./src/core/registry/app-registry.ts', 'utf8');

// Parse top-level tool groups: look for pattern: id: 'xxx', name: '...',
// We need to find utilities with a 'component' or 'route' field to distinguish them from features
const lines = c.split('\n');

// Find all groups (workspaces) and their tools
const groups = {};
let currentGroup = null;
let currentTool = null;
let depth = 0;
let inTools = false;

// Simpler approach: use regex to find all tool entries
// Tools have: id, name, description, icon, status fields together
const toolPattern = /^\s{4,8}id:\s*['"]([^'"]+)['"]/;
const namePattern = /^\s*name:\s*['"]([^'"]+)['"]/;
const statusPattern = /^\s*status:\s*['"]([^'"]+)['"]/;
const groupPattern = /^\s{0,4}id:\s*['"]([^'"]+)['"]/;

// Extract all tool-like objects with status
const results = { soon: {}, beta: {}, ready: {} };
let i = 0;

while (i < lines.length) {
  const idMatch = lines[i].match(/^\s+id:\s*['"]([^'"]+)['"]/);
  if (idMatch) {
    const id = idMatch[1];
    // Look ahead for status within next 15 lines
    let status = null;
    let name = null;
    let hasComponent = false;
    for (let j = i+1; j < Math.min(i+20, lines.length); j++) {
      const sm = lines[j].match(/status:\s*['"]([^'"]+)['"]/);
      const nm = lines[j].match(/name:\s*['"]([^'"]+)['"]/);
      if (sm && !status) status = sm[1];
      if (nm && !name) name = nm[1];
      if (lines[j].includes('component:') || lines[j].includes('template:')) hasComponent = true;
      // stop if we hit another id
      if (j > i+1 && lines[j].match(/^\s+id:\s*['"]/) && j !== i) break;
    }
    
    if (status && (status === 'soon' || status === 'beta') && hasComponent) {
      const ws = id.split('-')[0];
      if (!results[status][ws]) results[status][ws] = [];
      results[status][ws].push({ id, name });
    }
  }
  i++;
}

console.log('=== BETA Tools ===');
Object.entries(results.beta).forEach(([ws, tools]) => {
  console.log(`\n[${ws}] (${tools.length})`);
  tools.forEach(t => console.log(`  - ${t.id}: ${t.name}`));
});

console.log('\n=== SOON Tools ===');
let soonTotal = 0;
Object.entries(results.soon).forEach(([ws, tools]) => {
  soonTotal += tools.length;
  console.log(`\n[${ws}] (${tools.length})`);
  tools.forEach(t => console.log(`  - ${t.id}: ${t.name}`));
});
console.log('\nSoon total:', soonTotal);
