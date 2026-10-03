const fs = require('fs');

// We will read current app-registry.ts, parse WORKSPACES, inject features on every utility, and re-serialize.
const currentCode = fs.readFileSync('src/core/registry/app-registry.ts', 'utf8');

console.log('Read current app-registry.ts:', currentCode.length, 'bytes');
