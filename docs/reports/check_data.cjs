const fs = require('fs');
const allUtils = JSON.parse(fs.readFileSync('docs/reports/all_utilities_raw.json', 'utf8'));
const dataUtils = allUtils.filter(u => u.workspaceId === 'data');
console.log('Data Utilities (' + dataUtils.length + '):');
const dataView = fs.readFileSync('src/workspaces/data/DataWorkspaceView.tsx', 'utf8');

dataUtils.forEach(u => {
  const inView = dataView.includes(`'${u.id}'`) || dataView.includes(`"${u.id}"`);
  console.log(`- ${u.id} (${u.name}) | In view: ${inView} | Group: ${u.groupName}`);
});
