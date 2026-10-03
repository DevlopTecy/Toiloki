const fs = require('fs');
const path = require('path');

// Read app-registry.ts and extract WORKSPACES object or parse with ts-node/esbuild
// Since WORKSPACES imports icons, let's parse app-registry.ts by regex or strip icons
let code = fs.readFileSync('src/core/registry/app-registry.ts', 'utf8');

// We can extract all utilities cleanly
// An utility object has: id: '...', name: '...', ... status: '...'
// Let's find each workspace, group, and utility
const lines = code.split('\n');
let currentWorkspace = null;
let currentGroup = null;
let currentUtil = null;

const workspaces = [];
let wsObj = null;
let grpObj = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const wsMatch = line.match(/\/\/\s*(\d+)\.\s*(.+?)\s*WORKSPACE/i);
  if (wsMatch) {
    wsObj = { name: wsMatch[2], groups: [] };
    workspaces.push(wsObj);
    continue;
  }

  // Look for utility id and status
  const utilIdMatch = line.match(/^\s*id:\s*['"]([a-z0-9-]+)['"],/);
  const statusMatch = line.match(/^\s*status:\s*['"](ready|beta|soon)['"],/);
  const nameMatch = line.match(/^\s*name:\s*['"]([^'"]+)['"],/);
  const templateMatch = line.match(/^\s*template:\s*['"]([^'"]+)['"],/);
}

// Better yet, let's use the compiled registry or require tsx
console.log('Workspaces detected by header comments:', workspaces.map(w => w.name));
