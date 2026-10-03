const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '../src/core/registry/app-registry.ts');

function flipToReady(ids) {
  let content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  let flippedCount = 0;

  for (const id of ids) {
    const idPattern = new RegExp(
      `(id:\\s*['"]${id}['"][^}]{0,600}?status:\\s*['"])(soon|beta)(['"])`,
      'gs'
    );

    const before = content;
    content = content.replace(idPattern, (match, prefix, status, suffix) => {
      console.log(`  Flipping ${id}: ${status} → ready`);
      flippedCount++;
      return `${prefix}ready${suffix}`;
    });

    if (content === before) {
      console.warn(`  Note: Already ready or pattern not matched: ${id}`);
    }
  }

  fs.writeFileSync(REGISTRY_PATH, content, 'utf8');
  console.log(`\n✓ Successfully flipped ${flippedCount} utilities to 'ready' in app-registry.ts`);
}

module.exports = { flipToReady };

if (require.main === module) {
  const ids = process.argv.slice(2);
  if (ids.length > 0) {
    flipToReady(ids);
  }
}
