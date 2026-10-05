const fs = require('fs');
const allUtils = JSON.parse(fs.readFileSync('docs/reports/all_utilities_raw.json', 'utf8'));

['design', 'network', 'system'].forEach(wsId => {
  const utils = allUtils.filter(u => u.workspaceId === wsId);
  const viewFile = `src/workspaces/${wsId}/${wsId.charAt(0).toUpperCase() + wsId.slice(1)}WorkspaceView.tsx`;
  const viewContent = fs.readFileSync(viewFile, 'utf8');
  console.log(`\n=== ${wsId.toUpperCase()} (${utils.length} utilities) ===`);
  utils.forEach(u => {
    const inView = viewContent.includes(`'${u.id}'`) || viewContent.includes(`"${u.id}"`);
    console.log(`- ${u.id} (${u.name}) | In view: ${inView} | Group: ${u.groupName}`);
  });
});
