const fs = require('fs');
const ts = require('typescript');

let regCode = fs.readFileSync('src/core/registry/app-registry.ts', 'utf8');
regCode = regCode.replace(/import\s*\{[\s\S]*?\}\s*from\s*'lucide-react';/, '');
regCode = regCode.replace(/import\s*\{[^}]*\}\s*from\s*'\.\.\/types\/workspace';/, '');
const transpiled = ts.transpileModule(regCode, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

const vm = require('vm');
const sandbox = {
  exports: {}, module: { exports: {} }, require: () => ({}), console,
  Object, Array, String, Number, Boolean, RegExp, Date, Math, JSON
};
const context = vm.createContext(new Proxy(sandbox, {
  has: () => true,
  get: (target, prop) => (prop in target ? target[prop] : (global[prop] || prop))
}));
vm.runInContext(transpiled, context);
const WORKSPACES = context.exports.WORKSPACES;

const views = {
  pdf: 'src/workspaces/pdf/PdfWorkspaceView.tsx',
  documents: 'src/workspaces/documents/DocumentsWorkspaceView.tsx',
  images: 'src/workspaces/images/ImagesWorkspaceView.tsx',
  media: 'src/workspaces/media/MediaWorkspaceView.tsx',
  data: 'src/workspaces/data/DataWorkspaceView.tsx',
  text: 'src/workspaces/text/TextWorkspaceView.tsx',
  developer: 'src/workspaces/developer/DeveloperWorkspaceView.tsx',
  calculator: 'src/workspaces/calculator/CalculatorWorkspaceView.tsx',
  files: 'src/workspaces/files/FilesWorkspaceView.tsx',
  security: 'src/workspaces/security/SecurityWorkspaceView.tsx',
  design: 'src/workspaces/design/DesignWorkspaceView.tsx',
  network: 'src/workspaces/network/NetworkWorkspaceView.tsx',
  system: 'src/workspaces/system/SystemWorkspaceView.tsx',
};

const viewContents = {};
for (const [wsId, file] of Object.entries(views)) {
  viewContents[wsId] = fs.readFileSync(file, 'utf8');
}

const unhandled = [];
const handled = [];

WORKSPACES.forEach(ws => {
  const content = viewContents[ws.id] || '';
  ws.groups.forEach(g => {
    g.utilities.forEach(u => {
      // Check if u.id appears in the view content
      const found = content.includes(`'${u.id}'`) || content.includes(`"${u.id}"`) || content.includes(`\`${u.id}\``);
      if (found) {
        handled.push({ ws: ws.id, group: g.name, id: u.id, name: u.name });
      } else {
        unhandled.push({ ws: ws.id, group: g.name, id: u.id, name: u.name });
      }
    });
  });
});

console.log('Total handled in view:', handled.length);
console.log('Total unhandled in view:', unhandled.length);
if (unhandled.length > 0) {
  console.log('Unhandled utilities:');
  unhandled.forEach(u => console.log(`  [${u.ws}] ${u.id} (${u.name})`));
}
