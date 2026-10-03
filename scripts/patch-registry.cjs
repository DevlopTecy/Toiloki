const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/core/registry/app-registry.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add workspace.workbench
content = content.replace(
  "id: 'pdf',\n    name: 'PDF',",
  "id: 'pdf',\n    workbench: 'file',\n    name: 'PDF',"
);

content = content.replace(
  "id: 'images',\n    name: 'Images',",
  "id: 'images',\n    workbench: 'file',\n    name: 'Images',"
);

// We need to inject modes for PDF utilities.
// This is tedious via regex, so we'll just replace the specific utilities.
const replacements = [
  { id: 'merge-pdf', mode: 'tray', accepts: 'many' },
  { id: 'split-pdf', mode: 'markers', accepts: 'one' },
  { id: 'extract-pages', mode: 'pages' },
  { id: 'delete-pages', mode: 'pages' },
  { id: 'reorder-pages', mode: 'pages' },
  { id: 'rotate-pages', mode: 'pages' },
  { id: 'duplicate-pages', mode: 'pages' },
  { id: 'replace-pages', mode: 'pages' },
  { id: 'remove-blank-pages', mode: 'pages' },
  { id: 'crop-pages', mode: 'pages' },
  
  { id: 'add-text', mode: 'annotate' },
  { id: 'add-image', mode: 'annotate' },
  { id: 'draw-shapes', mode: 'annotate' },
  { id: 'highlight-underline', mode: 'annotate' },
  { id: 'watermark', mode: 'annotate' },
  { id: 'page-numbers', mode: 'annotate' },
  { id: 'fill-form-fields', mode: 'annotate' },
  { id: 'bookmarks-editor', mode: 'annotate' },
  { id: 'sign-pdf', mode: 'annotate' },
  
  { id: 'images-to-pdf', mode: 'tray', accepts: 'many' },
  { id: 'docx-to-pdf', mode: 'panel' },
  { id: 'txt-to-pdf', mode: 'panel' },
  { id: 'md-to-pdf', mode: 'panel' },
  { id: 'html-to-pdf', mode: 'panel' },
  { id: 'pdf-to-doc', mode: 'panel' },
  { id: 'pdf-to-images', mode: 'panel' },
  
  { id: 'compress-pdf', mode: 'panel' },
  { id: 'optimize-images', mode: 'panel' },
  { id: 'flatten-pdf', mode: 'panel' },
  { id: 'remove-metadata', mode: 'panel' },
  
  { id: 'extract-text', mode: 'info' },
  { id: 'extract-images', mode: 'info' },
  { id: 'extract-metadata', mode: 'info' },
  { id: 'search-pdf-text', mode: 'info' },
  
  { id: 'password-protect', mode: 'panel' },
  { id: 'encrypt-pdf', mode: 'panel' },
  { id: 'remove-password', mode: 'panel' },
  
  { id: 'file-information', mode: 'info' },
  { id: 'page-count-stats', mode: 'info' },
  { id: 'document-properties', mode: 'info' },
];

for (const { id, mode, accepts } of replacements) {
  const acceptsStr = accepts ? `,\n            accepts: '${accepts}'` : '';
  const regex = new RegExp(`(id: '${id}',\\s*\\n\\s*name: '[^']+',)`, 'g');
  content = content.replace(regex, `$1\n            mode: '${mode}'${acceptsStr},`);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Registry patched');
