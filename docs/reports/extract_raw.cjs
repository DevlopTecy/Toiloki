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

const records = [];
WORKSPACES.forEach(ws => {
  ws.groups.forEach(g => {
    g.utilities.forEach(u => {
      records.push({
        workspaceId: ws.id,
        workspaceName: ws.name,
        groupId: g.id,
        groupName: g.name,
        id: u.id,
        name: u.name,
        engineId: u.engineId,
        currentStatus: u.status,
        acceptedFormats: (u.acceptedFormats || []).join('; '),
        features: (u.features || []).map(f => f.name).join('; ')
      });
    });
  });
});

console.log('Total utilities:', records.length);
fs.writeFileSync('docs/reports/all_utilities_raw.json', JSON.stringify(records, null, 2));
console.log('Wrote docs/reports/all_utilities_raw.json');
