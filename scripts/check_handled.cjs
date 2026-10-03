const fs = require('fs');
const c = fs.readFileSync('src/workspaces/calculator/CalculatorWorkspaceView.tsx','utf8');
const matches = [...c.matchAll(/utilityId === ['"]([^'"]+)['"]/g)];
const handled = [...new Set(matches.map(m => m[1]))];
console.log('Handled in calc view:');
handled.forEach(h => console.log(' -', h));

// Check developer view
const dc = fs.readFileSync('src/workspaces/developer/DeveloperWorkspaceView.tsx','utf8');
const dmatches = [...dc.matchAll(/utilityId === ['"]([^'"]+)['"]/g)];
const dhandled = [...new Set(dmatches.map(m => m[1]))];
console.log('\nHandled in dev view:');
dhandled.forEach(h => console.log(' -', h));
