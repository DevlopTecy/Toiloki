const fs = require('fs');
const vm = require('vm');
const { generateFeaturesForTool } = require('./feature_catalog_data.cjs');

// 1. Read and parse current app-registry.ts
const code = fs.readFileSync('src/core/registry/app-registry.ts', 'utf8');
const sanitized = code
  .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];/g, '')
  .replace(/export const WORKSPACES: WorkspaceDefinition\[\] =/g, 'WORKSPACES =')
  .replace(/: LucideIcon/g, '')
  .replace(/'var\(--[^)]+\)'/g, "''");

const sandbox = new Proxy({ WORKSPACES: [] }, {
  has() { return true; },
  get(target, prop) {
    if (prop in target) return target[prop];
    return prop;
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  }
});

vm.createContext(sandbox);
vm.runInContext(sanitized, sandbox);
const WORKSPACES = sandbox.WORKSPACES;

// 2. Attach features to each utility
let totalFeatures = 0;
const kindCounts = { option: 0, mode: 0, action: 0, output: 0, batch: 0 };
const statusCounts = { ready: 0, soon: 0 };
const allFeaturesList = [];

WORKSPACES.forEach(ws => {
  ws.groups.forEach(g => {
    g.utilities.forEach(u => {
      const feats = generateFeaturesForTool(u, ws.id, g.id);
      u.features = feats;
      feats.forEach(f => {
        totalFeatures++;
        kindCounts[f.kind] = (kindCounts[f.kind] || 0) + 1;
        statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
        allFeaturesList.push({
          workspace: ws.name,
          workspaceId: ws.id,
          group: g.name,
          groupId: g.id,
          utility: u.name,
          utilityId: u.id,
          featureName: f.name,
          featureId: f.id,
          kind: f.kind,
          status: f.status,
          aliases: f.aliases ? f.aliases.join(', ') : '',
          description: f.description,
        });
      });
    });
  });
});

console.log(`Total Features: ${totalFeatures}`);
console.log('Kind Breakdown:', kindCounts);
console.log('Status Breakdown:', statusCounts);

// 3. Write docs/feature-inventory.csv
let csvContent = 'Workspace,Group,Utility,UtilityID,FeatureName,FeatureID,Kind,Status,Aliases,Description\n';
allFeaturesList.forEach(row => {
  const escapeCsv = (str) => {
    if (!str) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };
  csvContent += `${escapeCsv(row.workspace)},${escapeCsv(row.group)},${escapeCsv(row.utility)},${escapeCsv(row.utilityId)},${escapeCsv(row.featureName)},${escapeCsv(row.featureId)},${escapeCsv(row.kind)},${escapeCsv(row.status)},${escapeCsv(row.aliases)},${escapeCsv(row.description)}\n`;
});
fs.writeFileSync('docs/feature-inventory.csv', csvContent, 'utf8');
console.log('Generated docs/feature-inventory.csv');

// 4. Write docs/feature-inventory.md
let mdContent = `# Toiloki Suite Complete Feature Inventory\n\n`;
mdContent += `**Hierarchy**: \`Workspace > Group > Utility > Feature > Engine\`  \n`;
mdContent += `**Total Catalog Utilities**: ${WORKSPACES.reduce((acc, ws) => acc + ws.groups.reduce((a, g) => a + g.utilities.length, 0), 0)}  \n`;
mdContent += `**Total Registered Features**: ${totalFeatures}  \n`;
mdContent += `**Feature Status**: \`${statusCounts.ready} ready · ${statusCounts.soon} coming soon\`  \n\n`;
mdContent += `---\n\n`;

mdContent += `## 1. Summary Statistics\n\n`;
mdContent += `### (1) Breakdown by Feature Kind\n`;
mdContent += `| Kind | Count | Percentage | UI Control Representation |\n`;
mdContent += `| :--- | :---: | :---: | :--- |\n`;
mdContent += `| **Option** | ${kindCounts.option} | ${((kindCounts.option/totalFeatures)*100).toFixed(1)}% | Input fields, checkboxes, toggles, quality sliders |\n`;
mdContent += `| **Mode** | ${kindCounts.mode} | ${((kindCounts.mode/totalFeatures)*100).toFixed(1)}% | Segmented controls, view toggles, calculation modes |\n`;
mdContent += `| **Action** | ${kindCounts.action} | ${((kindCounts.action/totalFeatures)*100).toFixed(1)}% | Direct action buttons, clipboard copy, jump-to-error |\n`;
mdContent += `| **Output** | ${kindCounts.output} | ${((kindCounts.output/totalFeatures)*100).toFixed(1)}% | Format dropdowns, export selectors, save targets |\n`;
mdContent += `| **Batch** | ${kindCounts.batch} | ${((kindCounts.batch/totalFeatures)*100).toFixed(1)}% | Multi-file queue, directory processing, ZIP bundling |\n`;
mdContent += `| **Total** | **${totalFeatures}** | **100.0%** | All controls rendered contextually in options panel |\n\n`;

mdContent += `### (2) Breakdown by Workspace\n`;
mdContent += `| Workspace | Utilities | Features | Ready Features | Soon Features |\n`;
mdContent += `| :--- | :---: | :---: | :---: | :---: |\n`;

WORKSPACES.forEach(ws => {
  const wsUtils = ws.groups.flatMap(g => g.utilities);
  const wsFeatures = wsUtils.flatMap(u => u.features || []);
  const readyF = wsFeatures.filter(f => f.status === 'ready').length;
  const soonF = wsFeatures.filter(f => f.status === 'soon').length;
  mdContent += `| **${ws.name}** | ${wsUtils.length} | **${wsFeatures.length}** | ${readyF} | ${soonF} |\n`;
});
mdContent += `| **Suite Total** | **${WORKSPACES.reduce((a, w) => a + w.groups.reduce((acc, g) => acc + g.utilities.length, 0), 0)}** | **${totalFeatures}** | **${statusCounts.ready}** | **${statusCounts.soon}** |\n\n`;

mdContent += `---\n\n`;
mdContent += `## 2. Seed Utilities Feature Audit\n\n`;
mdContent += `The 9 seed utilities specified in Phase 3 are fully mapped below:\n\n`;

const seedKeys = [
  'merge-pdf', 'split-pdf', 'compress-pdf', 'compress-image',
  'img-resize', 'convert-jpg', 'format-json-code', 'csv-viewer', 'batch-rename-files'
];

seedKeys.forEach(seedId => {
  let foundUtil, foundWs, foundGroup;
  for (const ws of WORKSPACES) {
    for (const g of ws.groups) {
      const u = g.utilities.find(util => util.id === seedId);
      if (u) {
        foundUtil = u;
        foundWs = ws;
        foundGroup = g;
        break;
      }
    }
    if (foundUtil) break;
  }

  if (foundUtil) {
    mdContent += `### ${foundUtil.name} (\`${foundWs.name} › ${foundGroup.name}\`)\n`;
    mdContent += `| Feature Name | Feature ID | Kind | Status | Description |\n`;
    mdContent += `| :--- | :--- | :---: | :---: | :--- |\n`;
    foundUtil.features.forEach(f => {
      mdContent += `| **${f.name}** | \`${f.id}\` | \`${f.kind}\` | \`${f.status}\` | ${f.description} |\n`;
    });
    mdContent += `\n`;
  }
});

mdContent += `---\n\n`;
mdContent += `## 3. Complete Master Feature Registry Table\n\n`;
mdContent += `| Workspace | Utility | Feature Name | Feature ID | Kind | Status | Aliases | Description |\n`;
mdContent += `| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |\n`;

allFeaturesList.forEach(r => {
  mdContent += `| ${r.workspace} | ${r.utility} | **${r.featureName}** | \`${r.featureId}\` | \`${r.kind}\` | \`${r.status}\` | ${r.aliases || '—'} | ${r.description} |\n`;
});

fs.writeFileSync('docs/feature-inventory.md', mdContent, 'utf8');
console.log('Generated docs/feature-inventory.md');
