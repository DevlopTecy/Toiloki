const fs = require('fs');
const path = require('path');
const vm = require('vm');

const {
  PDF_ADDITIONS,
  DOCUMENTS_ADDITIONS,
  IMAGES_ADDITIONS,
  DATA_ADDITIONS,
  TEXT_ADDITIONS,
  DEVELOPER_ADDITIONS,
  CALCULATOR_ADDITIONS,
  FILES_ADDITIONS,
} = require('./phase4_data_core.cjs');

const { NEW_WORKSPACES } = require('./phase4_data_new_workspaces.cjs');

// 1. Read existing app-registry.ts to extract current Phase 3 WORKSPACES
const registryTs = fs.readFileSync('src/core/registry/app-registry.ts', 'utf8');

const sanitized = registryTs
  .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];/g, '')
  .replace(/export const WORKSPACES: WorkspaceDefinition\[\] =/g, 'WORKSPACES =')
  .replace(/: LucideIcon/g, '')
  .replace(/'var\(--[^)]+\)'/g, "''")
  .replace(/export function findUtilityByFeatureId[\s\S]*$/, '');

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

const CORE_WS_IDS = ['pdf', 'documents', 'images', 'data', 'text', 'developer', 'calculator', 'files'];
const currentWorkspaces = sandbox.WORKSPACES.filter(w => CORE_WS_IDS.includes(w.id));

const allAdditionIds = new Set([
  ...PDF_ADDITIONS.map(u => u.id),
  ...DOCUMENTS_ADDITIONS.map(u => u.id),
  ...IMAGES_ADDITIONS.map(u => u.id),
  ...DATA_ADDITIONS.map(u => u.id),
  ...TEXT_ADDITIONS.map(u => u.id),
  ...DEVELOPER_ADDITIONS.map(u => u.id),
  ...CALCULATOR_ADDITIONS.map(u => u.id),
  ...FILES_ADDITIONS.map(u => u.id),
  ...NEW_WORKSPACES.flatMap(w => w.groups.flatMap(g => g.utilities)).map(u => u.id),
]);

// Strip out any previously added tools or dynamically created groups
const DYNAMIC_GROUP_IDS = new Set([
  'pdf-compare', 'doc-metadata', 'img-compose', 'img-animation', 'img-compare',
  'data-query', 'data-compare', 'text-generator', 'dev-utilities', 'dev-compare',
  'calc-date-time', 'calc-finance', 'calc-health', 'calc-everyday'
]);

currentWorkspaces.forEach(ws => {
  ws.groups = ws.groups.filter(g => !DYNAMIC_GROUP_IDS.has(g.id));
  ws.groups.forEach(g => {
    g.utilities = g.utilities.filter(u => !allAdditionIds.has(u.id));
  });
});

console.log('Loaded and cleaned', currentWorkspaces.length, 'baseline core workspaces.');

// Helper to find or add group
function getOrCreateGroup(ws, groupId, groupName, groupDesc, groupIcon, badgeGradient) {
  let g = ws.groups.find(gr => gr.id === groupId);
  if (!g) {
    g = {
      id: groupId,
      name: groupName,
      description: groupDesc,
      icon: groupIcon,
      badgeGradient: badgeGradient,
      utilities: [],
    };
    ws.groups.push(g);
  }
  return g;
}

// 2. Augment Core Workspaces
// --- PDF ---
const pdfWs = currentWorkspaces.find(w => w.id === 'pdf');
const pdfOrg = pdfWs.groups.find(g => g.id === 'page-organizer');
const pdfEdit = pdfWs.groups.find(g => g.id === 'pdf-editor');
const pdfConv = pdfWs.groups.find(g => g.id === 'pdf-converter');
const pdfOpt = pdfWs.groups.find(g => g.id === 'pdf-optimizer');
const pdfSec = pdfWs.groups.find(g => g.id === 'pdf-security');
const pdfComp = getOrCreateGroup(pdfWs, 'pdf-compare', 'Compare', 'Side-by-side visual and textual PDF diffing.', 'GitCompare', 'var(--badge-pdf)');

PDF_ADDITIONS.forEach(tool => {
  if (['pdf-remove-blank-pages', 'pdf-crop-pages'].includes(tool.id)) pdfOrg.utilities.push(tool);
  else if (['pdf-fill-form-fields', 'pdf-bookmarks-editor'].includes(tool.id)) pdfEdit.utilities.push(tool);
  else if (['pdf-to-images'].includes(tool.id)) pdfConv.utilities.push(tool);
  else if (['pdf-repair-pdf'].includes(tool.id)) pdfOpt.utilities.push(tool);
  else if (['pdf-redact'].includes(tool.id)) pdfSec.utilities.push(tool);
  else if (['pdf-compare-pdfs'].includes(tool.id)) pdfComp.utilities.push(tool);
  else pdfOrg.utilities.push(tool);
});

// --- DOCUMENTS ---
const docWs = currentWorkspaces.find(w => w.id === 'documents');
const docEdit = docWs.groups.find(g => g.id === 'doc-editor');
const docMeta = getOrCreateGroup(docWs, 'doc-metadata', 'Metadata & Inspector', 'Inspect, sanitize, and extract Office properties.', 'FileSearch', 'var(--badge-doc)');

DOCUMENTS_ADDITIONS.forEach(tool => {
  if (tool.id === 'doc-office-metadata') docMeta.utilities.push(tool);
  else docEdit.utilities.push(tool);
});

// --- IMAGES ---
const imgWs = currentWorkspaces.find(w => w.id === 'images');
const imgConv = imgWs.groups.find(g => g.id === 'img-converter');
const imgTrans = imgWs.groups.find(g => g.id === 'img-transformer');
const imgCompose = getOrCreateGroup(imgWs, 'img-compose', 'Composition & Layout', 'Collages, contact sheets, and sprite sheet atlases.', 'LayoutGrid', 'var(--badge-img)');
const imgAnim = getOrCreateGroup(imgWs, 'img-animation', 'Animation', 'Animated GIF and WebP builder from frame sequences.', 'Film', 'var(--badge-img)');
const imgComp = getOrCreateGroup(imgWs, 'img-compare', 'Compare', 'Side-by-side and interactive slider visual diffs.', 'GitCompare', 'var(--badge-img)');

IMAGES_ADDITIONS.forEach(tool => {
  if (['img-heic-convert', 'img-avif-convert', 'img-svg-to-png'].includes(tool.id)) imgConv.utilities.push(tool);
  else if (['img-collage-sheet', 'img-sprite-sheet'].includes(tool.id)) imgCompose.utilities.push(tool);
  else if (['img-anim-builder'].includes(tool.id)) imgAnim.utilities.push(tool);
  else if (['img-batch-watermark'].includes(tool.id)) imgTrans.utilities.push(tool);
  else if (['img-before-after'].includes(tool.id)) imgComp.utilities.push(tool);
  else imgTrans.utilities.push(tool);
});

// --- DATA ---
const dataWs = currentWorkspaces.find(w => w.id === 'data');
const dataTrans = dataWs.groups.find(g => g.id === 'data-transformer');
const dataConv = dataWs.groups.find(g => g.id === 'data-converter');
const dataVal = dataWs.groups.find(g => g.id === 'data-validator');
const dataQuery = getOrCreateGroup(dataWs, 'data-query', 'Query & SQL', 'Run local SQL and JSONPath selectors over tables.', 'DatabaseZap', 'var(--badge-data)');
const dataComp = getOrCreateGroup(dataWs, 'data-compare', 'Compare', 'Side-by-side structural differences in JSON datasets.', 'GitCompare', 'var(--badge-data)');

DATA_ADDITIONS.forEach(tool => {
  if (['data-sql-csv', 'data-jsonpath'].includes(tool.id)) dataQuery.utilities.push(tool);
  else if (['data-join-csv', 'data-pivot-group', 'data-split-csv', 'data-encoding-fixer'].includes(tool.id)) dataTrans.utilities.push(tool);
  else if (['data-ndjson-tsv', 'data-json-to-ts'].includes(tool.id)) dataConv.utilities.push(tool);
  else if (['data-schema-validator'].includes(tool.id)) dataVal.utilities.push(tool);
  else if (['data-json-diff'].includes(tool.id)) dataComp.utilities.push(tool);
  else dataTrans.utilities.push(tool);
});

// --- TEXT ---
const textWs = currentWorkspaces.find(w => w.id === 'text');
const textTrans = textWs.groups.find(g => g.id === 'text-transformer');
const textClean = textWs.groups.find(g => g.id === 'text-cleaner');
const textAnaly = textWs.groups.find(g => g.id === 'text-analyzer');
const textGen = getOrCreateGroup(textWs, 'text-generator', 'Generators', 'Generate filler text, placeholder copy, and dummy prose.', 'Wand2', 'var(--badge-text)');

TEXT_ADDITIONS.forEach(tool => {
  if (['text-extract-patterns', 'text-word-frequency', 'text-dup-paragraphs'].includes(tool.id)) textAnaly.utilities.push(tool);
  else if (['text-slugify', 'text-natural-sort', 'text-to-table'].includes(tool.id)) textTrans.utilities.push(tool);
  else if (['text-multifile-regex'].includes(tool.id)) textClean.utilities.push(tool);
  else if (['text-lorem-ipsum'].includes(tool.id)) textGen.utilities.push(tool);
  else textTrans.utilities.push(tool);
});

// --- DEVELOPER ---
const devWs = currentWorkspaces.find(w => w.id === 'developer');
const devGen = devWs.groups.find(g => g.id === 'dev-generators');
const devWeb = devWs.groups.find(g => g.id === 'dev-web');
const devUtil = getOrCreateGroup(devWs, 'dev-utilities', 'Utilities & Units', 'Cron scheduling, permission calculators, and typography math.', 'Wrench', 'var(--badge-dev)');
const devComp = getOrCreateGroup(devWs, 'dev-compare', 'Environment Compare', 'Diff environment configuration files and audit secrets.', 'FileDiff', 'var(--badge-dev)');

DEVELOPER_ADDITIONS.forEach(tool => {
  if (['dev-qr-generator', 'dev-qr-scanner', 'dev-barcode-gen', 'dev-gitignore-gen'].includes(tool.id)) devGen.utilities.push(tool);
  else if (['dev-user-agent'].includes(tool.id)) devWeb.utilities.push(tool);
  else if (['dev-cron-explainer', 'dev-chmod-calc', 'dev-px-rem'].includes(tool.id)) devUtil.utilities.push(tool);
  else if (['dev-env-diff'].includes(tool.id)) devComp.utilities.push(tool);
  else devGen.utilities.push(tool);
});

// Secondary cross-listing: Hash & HMAC (Primary in security, also in Developer)
const hashHmacPrimary = NEW_WORKSPACES.find(w => w.id === 'security').groups.flatMap(g => g.utilities).find(u => u.id === 'sec-hash-hmac');
if (hashHmacPrimary) {
  const hashHmacSecondary = {
    ...hashHmacPrimary,
    engineId: 'developer',
    isSecondaryListing: true,
    primaryWorkspaceId: 'security',
    primaryGroupId: 'sec-crypto',
  };
  devUtil.utilities.push(hashHmacSecondary);
}

// --- CALCULATOR ---
const calcWs = currentWorkspaces.find(w => w.id === 'calculator');
const calcDateTime = getOrCreateGroup(calcWs, 'calc-date-time', 'Date & Time', 'Calendar calculations, durations, age, timezone conversion, and timers.', 'Clock', 'var(--badge-calc)');
const calcFinance = getOrCreateGroup(calcWs, 'calc-finance', 'Finance', 'Loan EMI, amortization schedules, compound interest, SIP, GST, and profit margins.', 'DollarSign', 'var(--badge-calc)');
const calcHealth = getOrCreateGroup(calcWs, 'calc-health', 'Health', 'Body Mass Index and basal metabolic rate expenditure calculations.', 'HeartPulse', 'var(--badge-calc)');
const calcEveryday = getOrCreateGroup(calcWs, 'calc-everyday', 'Everyday', 'Base conversions, Roman numerals, and written number word phrasing.', 'Coins', 'var(--badge-calc)');

CALCULATOR_ADDITIONS.forEach(tool => {
  if (['calc-age', 'calc-date-diff', 'calc-add-sub-dates', 'calc-business-days', 'calc-time-duration', 'calc-tz-convert', 'calc-timer-stopwatch'].includes(tool.id)) {
    calcDateTime.utilities.push(tool);
  } else if (['calc-loan-emi', 'calc-amortization', 'calc-compound-interest', 'calc-sip', 'calc-gst-vat', 'calc-margin-markup', 'calc-tip-split', 'calc-currency-rates'].includes(tool.id)) {
    calcFinance.utilities.push(tool);
  } else if (['calc-bmi', 'calc-calorie-bmr'].includes(tool.id)) {
    calcHealth.utilities.push(tool);
  } else if (['calc-number-base', 'calc-roman-numerals', 'calc-num-to-words'].includes(tool.id)) {
    calcEveryday.utilities.push(tool);
  } else {
    calcDateTime.utilities.push(tool);
  }
});

// --- FILES ---
const filesWs = currentWorkspaces.find(w => w.id === 'files');
const filesOps = filesWs.groups.find(g => g.id === 'files-operations');
const filesAnaly = filesWs.groups.find(g => g.id === 'files-analyzer');
const filesComp = filesWs.groups.find(g => g.id === 'files-comparison');
const filesArch = filesWs.groups.find(g => g.id === 'files-archives');

FILES_ADDITIONS.forEach(tool => {
  if (['files-organize-type-date', 'files-split-join'].includes(tool.id)) filesOps.utilities.push(tool);
  else if (['files-folder-tree-txt'].includes(tool.id)) filesAnaly.utilities.push(tool);
  else if (['files-folder-compare'].includes(tool.id)) filesComp.utilities.push(tool);
  else if (['files-7z-extract'].includes(tool.id)) filesArch.utilities.push(tool);
  else filesOps.utilities.push(tool);
});

// 3. Append the 5 New Workspaces
const ALL_WORKSPACES = [...currentWorkspaces, ...NEW_WORKSPACES];
console.log('Total workspaces now:', ALL_WORKSPACES.length);

// Calculate totals
let catalogCount = 0;
const uniqueIdSet = new Set();
let readyCount = 0;
let betaCount = 0;
let soonCount = 0;

ALL_WORKSPACES.forEach(ws => {
  ws.groups.forEach(g => {
    g.utilities.forEach(u => {
      catalogCount++;
      uniqueIdSet.add(u.id);
      if (u.status === 'ready' || !u.status) readyCount++;
      else if (u.status === 'beta') betaCount++;
      else if (u.status === 'soon') soonCount++;
    });
  });
});

console.log('Catalog entries:', catalogCount);
console.log('Unique utilities:', uniqueIdSet.size);
console.log('Ready:', readyCount, 'Beta:', betaCount, 'Soon:', soonCount);

// 4. Collect all Lucide icons used across all workspaces, groups, and utilities
const allIcons = new Set([
  'FileText', 'FileSpreadsheet', 'Image', 'Database', 'Type', 'Code2', 'Calculator', 'FolderArchive',
  'Layers', 'Edit3', 'FileCheck', 'Minimize2', 'FileSearch', 'Lock', 'Info', 'ArrowRightLeft',
  'GitCompare', 'Download', 'Crop', 'Sliders', 'Sparkles', 'Binary', 'Table', 'CheckCircle', 'Code',
  'Key', 'Wand2', 'Globe', 'Sigma', 'Cpu', 'Ruler', 'Search', 'Archive', 'Files', 'Scissors', 'Copy',
  'RotateCw', 'Trash2', 'FilePlus', 'PenTool', 'Highlighter', 'Stamp', 'Hash', 'Eye', 'ShieldCheck',
  'ShieldAlert', 'Unlock', 'KeyRound', 'FileDigit', 'Maximize2', 'Palette', 'EyeOff', 'Sun', 'Contrast',
  'FileCode', 'FileJson', 'RefreshCw', 'Filter', 'CheckCheck', 'AlignLeft', 'WrapText', 'Clock', 'Link',
  'Variable', 'Terminal', 'Server', 'Percent', 'Divide', 'Scale', 'Zap', 'FolderOpen', 'FileCheck2',
  'FolderGit2', 'PackageOpen', 'FileDiff', 'Shield', 'Film', 'DatabaseZap', 'CheckSquare', 'Bookmark',
  'Images', 'Wrench', 'Briefcase', 'DollarSign', 'HeartPulse', 'Coins', 'LayoutGrid', 'FolderTree',
  'FolderSync', 'FolderX', 'ArrowDownAZ', 'Replace', 'FileX', 'QrCode', 'ScanLine', 'Barcode',
  'FileCode2', 'Smartphone', 'Hourglass', 'Receipt', 'Activity', 'PiggyBank', 'TrendingUp',
  'Users', 'User', 'Music', 'Volume2', 'Subtitles', 'Link2', 'Network', 'Wifi', 'Pipette',
  'Box', 'FileImage', 'Tag', 'TableProperties', 'HardDrive', 'ClipboardList', 'AppWindow', 'Power',
  'RotateCcw', 'CopyCheck', 'PlusCircle', 'FileQuestion', 'Split', 'GitMerge'
]);

function normalizeIcon(ic) {
  if (ic === 'ExcelIcon') return 'FileSpreadsheet';
  if (ic === 'Image') return 'ImageIcon';
  return ic;
}

ALL_WORKSPACES.forEach(ws => {
  ws.icon = normalizeIcon(ws.icon);
  if (ws.icon && typeof ws.icon === 'string') allIcons.add(ws.icon);
  ws.groups.forEach(g => {
    g.icon = normalizeIcon(g.icon);
    if (g.icon && typeof g.icon === 'string') allIcons.add(g.icon);
    g.utilities.forEach(u => {
      u.icon = normalizeIcon(u.icon);
      if (u.icon && typeof u.icon === 'string') allIcons.add(u.icon);
    });
  });
});

allIcons.delete('Image'); // we use Image as ImageIcon
allIcons.delete('ExcelIcon'); // we use FileSpreadsheet

// 5. Generate TypeScript file
let ts = `import {\n`;
ts += `  Image as ImageIcon,\n`;
Array.from(allIcons).sort().forEach(ic => {
  if (ic === 'Image' || ic === 'ImageIcon' || ic === 'ExcelIcon') return;
  ts += `  ${ic},\n`;
});
ts += `} from 'lucide-react';\n`;
ts += `import { WorkspaceDefinition, GroupDefinition, UtilityDefinition, FeatureDefinition } from '../types/workspace';\n\n`;

ts += `export const WORKSPACES: WorkspaceDefinition[] = [\n`;

ALL_WORKSPACES.forEach((ws, wsIdx) => {
  const wsIconStr = normalizeIcon(typeof ws.icon === 'string' ? ws.icon : 'Files');
  ts += `  // ${wsIdx + 1}. ${ws.name.toUpperCase()} WORKSPACE\n`;
  ts += `  {\n`;
  ts += `    id: '${ws.id}',\n`;
  ts += `    name: '${ws.name.replace(/'/g, "\\'")}',\n`;
  ts += `    description: '${ws.description.replace(/'/g, "\\'")}',\n`;
  ts += `    icon: ${wsIconStr},\n`;
  ts += `    badgeGradient: '${ws.badgeGradient}',\n`;
  ts += `    groups: [\n`;

  ws.groups.forEach(g => {
    const gIconStr = normalizeIcon(typeof g.icon === 'string' ? g.icon : 'Layers');
    ts += `      {\n`;
    ts += `        id: '${g.id}',\n`;
    ts += `        name: '${g.name.replace(/'/g, "\\'")}',\n`;
    ts += `        description: '${g.description.replace(/'/g, "\\'")}',\n`;
    ts += `        icon: ${gIconStr},\n`;
    ts += `        badgeGradient: '${g.badgeGradient}',\n`;
    ts += `        utilities: [\n`;

    g.utilities.forEach(u => {
      const uIconStr = normalizeIcon(typeof u.icon === 'string' ? u.icon : 'FileText');
      const tmpl = u.template || (ws.id === 'calculator' ? 'calculator' : ws.id === 'data' ? 'table' : ws.id === 'text' || ws.id === 'developer' ? 'text' : ws.id === 'media' ? 'media' : 'file');
      const st = u.status || 'ready';
      ts += `          {\n`;
      ts += `            id: '${u.id}',\n`;
      ts += `            name: '${u.name.replace(/'/g, "\\'")}',\n`;
      ts += `            description: '${u.description.replace(/'/g, "\\'")}',\n`;
      ts += `            engineId: '${u.engineId}',\n`;
      ts += `            icon: ${uIconStr},\n`;
      ts += `            status: '${st}',\n`;
      ts += `            template: '${tmpl}',\n`;
      ts += `            acceptedFormats: [${(u.acceptedFormats || []).map(f => `'${f}'`).join(', ')}],\n`;
      ts += `            aliases: [${(u.aliases || []).map(a => `'${a.replace(/'/g, "\\'")}'`).join(', ')}],\n`;
      ts += `            keywords: [${(u.keywords || []).map(k => `'${k.replace(/'/g, "\\'")}'`).join(', ')}],\n`;

      if (u.alsoListedIn && u.alsoListedIn.length > 0) {
        ts += `            alsoListedIn: [${u.alsoListedIn.map(a => `'${a}'`).join(', ')}],\n`;
      }
      if (u.primaryWorkspaceId) {
        ts += `            primaryWorkspaceId: '${u.primaryWorkspaceId}',\n`;
      }
      if (u.primaryGroupId) {
        ts += `            primaryGroupId: '${u.primaryGroupId}',\n`;
      }
      if (u.isSecondaryListing) {
        ts += `            isSecondaryListing: true,\n`;
      }

      if (u.features && u.features.length > 0) {
        ts += `            features: [\n`;
        u.features.forEach(f => {
          ts += `              {\n`;
          ts += `                id: '${f.id}',\n`;
          ts += `                name: '${f.name.replace(/'/g, "\\'")}',\n`;
          ts += `                description: '${f.description.replace(/'/g, "\\'")}',\n`;
          ts += `                kind: '${f.kind}',\n`;
          ts += `                status: '${f.status}',\n`;
          if (f.aliases && f.aliases.length > 0) {
            ts += `                aliases: [${f.aliases.map(a => `'${a.replace(/'/g, "\\'")}'`).join(', ')}],\n`;
          }
          ts += `              },\n`;
        });
        ts += `            ],\n`;
      }

      ts += `          },\n`;
    });

    ts += `        ],\n`;
    ts += `      },\n`;
  });

  ts += `    ],\n`;
  ts += `  },\n`;
});

ts += `];\n\n`;

// Append findUtilityByFeatureId helper
ts += `export function findUtilityByFeatureId(featureId: string): {\n`;
ts += `  workspace: WorkspaceDefinition;\n`;
ts += `  group: GroupDefinition;\n`;
ts += `  utility: UtilityDefinition;\n`;
ts += `  feature: FeatureDefinition;\n`;
ts += `} | undefined {\n`;
ts += `  for (const ws of WORKSPACES) {\n`;
ts += `    for (const group of ws.groups) {\n`;
ts += `      for (const utility of group.utilities) {\n`;
ts += `        const feature = utility.features?.find((f) => f.id === featureId);\n`;
ts += `        if (feature) {\n`;
ts += `          return { workspace: ws, group, utility, feature };\n`;
ts += `        }\n`;
ts += `      }\n`;
ts += `    }\n`;
ts += `  }\n`;
ts += `  return undefined;\n`;
ts += `}\n`;

fs.writeFileSync('src/core/registry/app-registry.ts', ts, 'utf8');
console.log('Successfully wrote src/core/registry/app-registry.ts!');

// 6. Generate docs/utility-roadmap.md
let md = `# Toiloki Utility Roadmap & Catalog

> **Local Suite • 100% Offline • Zero AI/Cloud Dependencies**  
> Complete inventory of all 13 workspaces, 274 unique utilities, and implementation status roadmap.

---

## 1. Architecture & Release Principles

Toiloki is built as a deterministic, privacy-first desktop utility engine for macOS, Linux, and Windows. Every tool executes directly on host hardware with zero remote calls, zero analytics, and zero external model dependencies.

### Status Tiers:
- **Ready (\`ready\`)**: Production quality, fully wired with client-side WebAssembly, canvas, or Web Crypto engines.
- **Beta (\`beta\`)**: Operational with partial parameter tuning or core file workflows active.
- **Upcoming (\`soon\`)**: Registered with defined templates, accepted file formats, aliases, and feature definitions. Hidden by default under **Settings > Advanced > "Show upcoming utilities"** until implemented. Clicking a \`soon\` utility opens the clean **Not available yet** state.

### Safety Guarantee on Destructive Actions:
All file operations that modify, overwrite, or delete user files (such as **Secure Shred**, **Temp & Cache Cleaner**, and **Empty Folder Cleaner**) strictly require:
1. **Interactive Preview**: Detailed inspection of candidate items before execution.
2. **Explicit Confirmation**: Action button with typed or deliberate confirmation step.
3. **Toiloki Trash Safety**: Non-destructive quarantine option to restore files if needed.

### AI & Cloud Fluff Policy:
**Zero OCR, speech recognition, background removal, translation, summarizing, or neural network inference.** Every utility relies on deterministic parsing, arithmetic, cryptographic primitives, and format conversions.

---

## 2. Workspace Overview

| # | Workspace | Section | Icon | Groups | Total Listed | Ready | Beta | Soon | Primary Scope |
|---|-----------|---------|------|--------|--------------|-------|------|------|---------------|
`;

ALL_WORKSPACES.forEach((ws, idx) => {
  const section = idx < 8 ? 'Core' : 'More';
  const allUtils = ws.groups.flatMap(g => g.utilities);
  const r = allUtils.filter(u => u.status === 'ready' || !u.status).length;
  const b = allUtils.filter(u => u.status === 'beta').length;
  const s = allUtils.filter(u => u.status === 'soon').length;
  md += `| ${idx + 1} | **${ws.name}** | ${section} | \`${ws.icon}\` | ${ws.groups.length} | ${allUtils.length} | ${r} | ${b} | ${s} | ${ws.description} |\n`;
});

md += `| **TOTALS** | **13 Workspaces** | **Core (8) + More (5)** | — | **${ALL_WORKSPACES.reduce((a, w) => a + w.groups.length, 0)} Groups** | **${catalogCount} Listings (${uniqueIdSet.size} Unique)** | **${readyCount}** | **${betaCount}** | **${soonCount}** | **Local Desktop Suite** |\n\n`;

md += `---\n\n`;
md += `## 3. Detailed Workspace Catalog & Roadmap\n\n`;

ALL_WORKSPACES.forEach((ws, idx) => {
  const section = idx < 8 ? 'Core Workspace' : 'More Workspace';
  md += `### ${idx + 1}. ${ws.name} (${section})\n\n`;
  md += `*${ws.description}*\n\n`;

  ws.groups.forEach(g => {
    md += `#### Group: ${g.name} (\`${g.id}\`)\n`;
    md += `*${g.description}*\n\n`;
    md += `| Utility | Status | Template | Accepted Formats | Aliases | Key Features |\n`;
    md += `|---------|--------|----------|------------------|---------|--------------|\n`;

    g.utilities.forEach(u => {
      const formats = u.acceptedFormats && u.acceptedFormats.length > 0 ? u.acceptedFormats.join(', ') : '*';
      const aliases = u.aliases && u.aliases.length > 0 ? u.aliases.slice(0, 3).join(', ') : '—';
      const featuresStr = u.features && u.features.length > 0
        ? u.features.map(f => f.name).join('; ')
        : 'Standard features';
      const statusBadge = u.status === 'ready' ? '**Ready**' : u.status === 'beta' ? '*Beta*' : '\`Soon\`';
      const crossTag = u.isSecondaryListing ? ' *(Secondary listing)*' : '';

      md += `| **${u.name}**${crossTag} | ${statusBadge} | \`${u.template}\` | \`${formats}\` | ${aliases} | ${featuresStr} |\n`;
    });
    md += `\n`;
  });
});

fs.writeFileSync('docs/utility-roadmap.md', md, 'utf8');
console.log('Successfully wrote docs/utility-roadmap.md!');
