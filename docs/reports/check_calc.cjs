const fs = require('fs');
const allUtils = JSON.parse(fs.readFileSync('docs/reports/all_utilities_raw.json', 'utf8'));
const calcUtils = allUtils.filter(u => u.workspaceId === 'calculator');
console.log('Calculator Utilities (' + calcUtils.length + '):');
const calcView = fs.readFileSync('src/workspaces/calculator/CalculatorWorkspaceView.tsx', 'utf8');

calcUtils.forEach(u => {
  const inView = calcView.includes(`'${u.id}'`) || calcView.includes(`"${u.id}"`);
  console.log(`- ${u.id} (${u.name}) | In view: ${inView} | Group: ${u.groupName}`);
});
