const fs = require('fs');
const allUtils = JSON.parse(fs.readFileSync('docs/reports/all_utilities_raw.json', 'utf8'));
const docUtils = allUtils.filter(u => u.workspaceId === 'documents');
console.log('Documents Utilities (' + docUtils.length + '):');
const docView = fs.readFileSync('src/workspaces/documents/DocumentsWorkspaceView.tsx', 'utf8');

docUtils.forEach(u => {
  const inView = docView.includes(`'${u.id}'`) || docView.includes(`"${u.id}"`);
  console.log(`- ${u.id} (${u.name}) | In view: ${inView} | Group: ${u.groupName}`);
});
