const fs = require('fs');
const allUtils = JSON.parse(fs.readFileSync('docs/reports/all_utilities_raw.json', 'utf8'));
const secUtils = allUtils.filter(u => u.workspaceId === 'security');
console.log('Security Utilities (' + secUtils.length + '):');
const secView = fs.readFileSync('src/workspaces/security/SecurityWorkspaceView.tsx', 'utf8');

secUtils.forEach(u => {
  const inView = secView.includes(`'${u.id}'`) || secView.includes(`"${u.id}"`);
  console.log(`- ${u.id} (${u.name}) | In view: ${inView} | Group: ${u.groupName}`);
});
