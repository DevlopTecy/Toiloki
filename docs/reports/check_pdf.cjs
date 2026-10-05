const fs = require('fs');
const allUtils = JSON.parse(fs.readFileSync('docs/reports/all_utilities_raw.json', 'utf8'));
const pdfUtils = allUtils.filter(u => u.workspaceId === 'pdf');
console.log('PDF Utilities (' + pdfUtils.length + '):');
const pdfView = fs.readFileSync('src/workspaces/pdf/PdfWorkspaceView.tsx', 'utf8');

pdfUtils.forEach(u => {
  const inView = pdfView.includes(`'${u.id}'`) || pdfView.includes(`"${u.id}"`);
  console.log(`- ${u.id} (${u.name}) | In view: ${inView} | Group: ${u.groupName}`);
});
