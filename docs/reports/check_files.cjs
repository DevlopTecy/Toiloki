const fs = require('fs');
const allUtils = JSON.parse(fs.readFileSync('docs/reports/all_utilities_raw.json', 'utf8'));
const filesUtils = allUtils.filter(u => u.workspaceId === 'files');
console.log('Files Utilities (' + filesUtils.length + '):');
const filesView = fs.readFileSync('src/workspaces/files/FilesWorkspaceView.tsx', 'utf8');

filesUtils.forEach(u => {
  const inView = filesView.includes(`'${u.id}'`) || filesView.includes(`"${u.id}"`);
  console.log(`- ${u.id} (${u.name}) | In view: ${inView} | Group: ${u.groupName}`);
});
