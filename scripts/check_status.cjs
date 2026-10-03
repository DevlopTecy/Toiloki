const fs = require('fs');
const c = fs.readFileSync('./src/core/registry/app-registry.ts', 'utf8');
const lines = c.split('\n');

const toolsByStatus = { soon: [], beta: [], ready: [] };

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let status = null;
  if (line.includes("status: 'soon'") || line.includes('status: "soon"')) status = 'soon';
  else if (line.includes("status: 'beta'") || line.includes('status: "beta"')) status = 'beta';
  
  if (status) {
    // look backward for id
    for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
      const m = lines[j].match(/id:\s*['"]([^'"]+)['"]/);
      if (m) {
        toolsByStatus[status].push(m[1]);
        break;
      }
    }
  }
}

console.log('=== BETA (' + toolsByStatus.beta.length + ') ===');
toolsByStatus.beta.forEach(t => console.log(' -', t));

console.log('\n=== SOON (' + toolsByStatus.soon.length + ') ===');
// Group by workspace prefix
const byWorkspace = {};
toolsByStatus.soon.forEach(t => {
  const ws = t.split('-')[0];
  if (!byWorkspace[ws]) byWorkspace[ws] = [];
  byWorkspace[ws].push(t);
});
Object.entries(byWorkspace).forEach(([ws, tools]) => {
  console.log('\n[' + ws + ']');
  tools.forEach(t => console.log(' -', t));
});
