const fs = require('fs');

const md = fs.readFileSync('docs/tool-inventory.md', 'utf8');

const tableLines = md.slice(md.indexOf('## 6. Complete 145-Tool Master Registry Table')).split('\n');
const rows = [];
tableLines.forEach(l => {
  if (l.startsWith('|') && !l.includes('---') && !l.includes('Workspace | Group')) {
    const parts = l.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 7) {
      rows.push({
        workspace: parts[0],
        group: parts[1],
        name: parts[2],
        route: parts[3],
        status: parts[4].replace(/`/g, ''),
        template: parts[5].replace(/`/g, ''),
        formats: parts[6],
        desc: parts[7] || ''
      });
    }
  }
});

console.log('Total table rows parsed:', rows.length);
const statuses = {};
rows.forEach(r => statuses[r.status] = (statuses[r.status] || 0) + 1);
console.log('Status counts in table:', statuses);

console.log('\nSoon tools in table (' + rows.filter(r => r.status === 'soon').length + '):');
rows.filter(r => r.status === 'soon').forEach(r => console.log(`  [${r.workspace}] ${r.name} (${r.route})`));

console.log('\nBeta tools in table (' + rows.filter(r => r.status === 'beta').length + '):');
rows.filter(r => r.status === 'beta').forEach(r => console.log(`  [${r.workspace}] ${r.name} (${r.route})`));
