const fs = require('fs');
const allUtils = JSON.parse(fs.readFileSync('docs/reports/all_utilities_raw.json', 'utf8'));
const devUtils = allUtils.filter(u => u.workspaceId === 'developer');
console.log('Developer Utilities (' + devUtils.length + '):');
const devView = fs.readFileSync('src/workspaces/developer/DeveloperWorkspaceView.tsx', 'utf8');

devUtils.forEach(u => {
  const inView = devView.includes(`'${u.id}'`) || devView.includes(`"${u.id}"`) ||
    (u.id.startsWith('format-') && devView.includes("utilityId.startsWith('format-')"));
  console.log(`- ${u.id} (${u.name}) | In view: ${inView} | Group: ${u.groupName}`);
});
