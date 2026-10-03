const fs = require('fs');
const { generateFeaturesForTool } = require('./feature_catalog_data.cjs');

// Read app-registry.ts and inject features cleanly
const code = fs.readFileSync('src/core/registry/app-registry.ts', 'utf8');

// We can parse with vm to get the exact data, and then re-generate the TypeScript file cleanly
const vm = require('vm');
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

// Extract all icon mappings from the original file by regex
const iconMap = {};
const iconRegex = /id:\s*'([^']+)'[\s\S]*?icon:\s*([A-Za-z0-9]+)/g;
let match;
while ((match = iconRegex.exec(code)) !== null) {
  iconMap[match[1]] = match[2];
}

const groupIconMap = {};
const groupIconRegex = /id:\s*'([a-z0-9-]+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?icon:\s*([A-Za-z0-9]+)/g;
while ((match = groupIconRegex.exec(code)) !== null) {
  groupIconMap[match[1]] = match[3];
}

const wsIconMap = {
  pdf: 'FileText',
  documents: 'FileSpreadsheet',
  images: 'ImageIcon',
  data: 'Database',
  text: 'Type',
  developer: 'Code2',
  calculator: 'Calculator',
  files: 'FolderArchive',
};

// Now format the new TypeScript content
let ts = `import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Database,
  Type,
  Code2,
  Calculator,
  FolderArchive,
  Layers,
  Edit3,
  FileCheck,
  Minimize2,
  FileSearch,
  Lock,
  Info,
  ArrowRightLeft,
  GitCompare,
  Download,
  Crop,
  Sliders,
  Sparkles,
  Binary,
  Table,
  CheckCircle,
  Code,
  Key,
  Wand2,
  Globe,
  Sigma,
  Cpu,
  Ruler,
  Search,
  Archive,
  Files,
  Scissors,
  Copy,
  RotateCw,
  Trash2,
  FilePlus,
  PenTool,
  Highlighter,
  Stamp,
  Hash,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Unlock,
  KeyRound,
  FileDigit,
  Maximize2,
  Palette,
  EyeOff,
  Sun,
  Contrast,
  FileCode,
  FileJson,
  FileSpreadsheet as ExcelIcon,
  RefreshCw,
  Filter,
  CheckCheck,
  AlignLeft,
  WrapText,
  Clock,
  Link,
  Variable,
  Terminal,
  Server,
  Percent,
  Divide,
  Scale,
  Zap,
  FolderOpen,
  FileCheck2,
  FolderGit2,
  PackageOpen,
} from 'lucide-react';
import { WorkspaceDefinition } from '../types/workspace';

export const WORKSPACES: WorkspaceDefinition[] = [
`;

WORKSPACES.forEach((ws, wsIdx) => {
  const badgeSuffix = ws.id === 'calculator' ? 'calc' : ws.id === 'documents' ? 'doc' : ws.id === 'images' ? 'img' : ws.id;
  const wsBadge = 'var(--badge-' + badgeSuffix + ')';
  ts += `  // ${wsIdx + 1}. ${ws.name.toUpperCase()} WORKSPACE
  {
    id: '${ws.id}',
    name: '${ws.name}',
    description: '${ws.description}',
    icon: ${wsIconMap[ws.id] || 'Files'},
    badgeGradient: '${wsBadge}',
    groups: [
`;

  ws.groups.forEach(g => {
    const gIcon = groupIconMap[g.id] || 'Layers';
    ts += `      {
        id: '${g.id}',
        name: '${g.name.replace(/'/g, "\\'")}',
        description: '${g.description.replace(/'/g, "\\'")}',
        icon: ${gIcon},
        badgeGradient: '${wsBadge}',
        utilities: [
`;

    g.utilities.forEach(u => {
      const uIcon = iconMap[u.id] || 'Files';
      const features = generateFeaturesForTool(u, ws.id, g.id);
      
      ts += `          {
            id: '${u.id}',
            name: '${u.name.replace(/'/g, "\\'")}',
            description: '${u.description.replace(/'/g, "\\'")}',
            engineId: '${u.engineId}',
            icon: ${uIcon},
            status: '${u.status}',
            template: '${u.template}',
            acceptedFormats: [${u.acceptedFormats.map(f => `'${f}'`).join(', ')}],
            aliases: [${u.aliases.map(a => `'${a.replace(/'/g, "\\'")}'`).join(', ')}],
            keywords: [${(u.keywords || []).map(k => `'${k.replace(/'/g, "\\'")}'`).join(', ')}],
`;

      if (u.alsoListedIn) {
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

      ts += `            features: [\n`;
      features.forEach(f => {
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

      ts += `          },\n`;
    });

    ts += `        ],
      },
`;
  });

  ts += `    ],
  },
`;
});

ts += `];
`;

fs.writeFileSync('src/core/registry/app-registry.ts', ts, 'utf8');
console.log('Successfully wrote app-registry.ts with complete FeatureDefinition lists.');
