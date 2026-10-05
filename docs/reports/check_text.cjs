const fs = require('fs');
const allUtils = JSON.parse(fs.readFileSync('docs/reports/all_utilities_raw.json', 'utf8'));
const textUtils = allUtils.filter(u => u.workspaceId === 'text');
console.log('Text Utilities (' + textUtils.length + '):');
const textView = fs.readFileSync('src/workspaces/text/TextWorkspaceView.tsx', 'utf8');

textUtils.forEach(u => {
  const inView = textView.includes(`'${u.id}'`) || textView.includes(`"${u.id}"`);
  console.log(`- ${u.id} (${u.name}) | In view: ${inView} | Group: ${u.groupName}`);
});
