const fs = require('fs');

// We have SEED_FEATURES and DEFAULT_FEATURES generators for each utility.
const SEED_FEATURES = {
  'merge-pdf': [
    { id: 'reorder-drag', name: 'Reorder by drag', description: 'Visually drag and drop PDF files to arrange their merge sequence.', kind: 'action', status: 'ready', aliases: ['Drag reorder', 'Visual file sort', 'Arrange sequence'] },
    { id: 'page-range-per-file', name: 'Page range per file', description: 'Specify individual page ranges (e.g. 1-5, 8, 12-end) for each input file.', kind: 'option', status: 'ready', aliases: ['Subset selection', 'Per-file range', 'Page excerpt'] },
    { id: 'bookmarks-per-file', name: 'Bookmarks per file', description: 'Retain or generate table-of-contents bookmarks for each merged document.', kind: 'option', status: 'soon', aliases: ['Preserve outlines', 'PDF TOC bookmarks', 'Document index'] },
    { id: 'remove-blank-pages', name: 'Remove blank pages', description: 'Automatically detect and discard blank separator pages during merge.', kind: 'option', status: 'soon', aliases: ['Drop blank pages', 'Skip empty pages', 'Blank removal'] },
    { id: 'output-name-template', name: 'Output name template', description: 'Custom pattern for output file name with date and counter tokens.', kind: 'option', status: 'ready', aliases: ['Naming pattern', 'Output filename', 'Filename token'] },
  ],
  'split-pdf': [
    { id: 'split-ranges', name: 'Ranges', description: 'Extract custom page ranges into one or multiple individual PDF documents.', kind: 'mode', status: 'ready', aliases: ['Custom ranges', 'Page spans', 'Interval split'] },
    { id: 'split-every-n', name: 'Every N pages', description: 'Automatically divide document into equal chunks of N pages each.', kind: 'mode', status: 'ready', aliases: ['Fixed chunks', 'Equal splits', 'N-page split'] },
    { id: 'split-by-size', name: 'By size', description: 'Split document into segments not exceeding a maximum target file size in MB.', kind: 'mode', status: 'soon', aliases: ['Max MB split', 'Size limit split', 'Target size partition'] },
    { id: 'split-by-bookmarks', name: 'By bookmarks', description: 'Split document into separate chapters based on top-level outline bookmarks.', kind: 'mode', status: 'soon', aliases: ['Chapter split', 'Bookmark split', 'TOC split'] },
  ],
  'compress-pdf': [
    { id: 'compress-presets', name: 'Presets', description: 'Select between Low, Recommended, and Extreme compression quality profiles.', kind: 'mode', status: 'ready', aliases: ['Compression profiles', 'Quality presets', 'Low medium high'] },
    { id: 'target-size', name: 'Target size', description: 'Specify an exact target file size in MB for iterative compression optimization.', kind: 'option', status: 'soon', aliases: ['Target MB', 'Max size limit', 'Goal size'] },
    { id: 'downsample-images', name: 'Downsample images', description: 'Re-encode raster pictures to 72, 150, or 300 DPI.', kind: 'option', status: 'ready', aliases: ['Image DPI', 'Downscale graphics', 'Raster resolution'] },
    { id: 'strip-metadata', name: 'Strip metadata', description: 'Remove PDF author, software producer, and creation date tracking metadata.', kind: 'option', status: 'soon', aliases: ['Sanitize PDF', 'Clean tags', 'Remove author'] },
    { id: 'before-after', name: 'Before/after comparison', description: 'Inspect side-by-side file size savings and visual page fidelity preview.', kind: 'action', status: 'ready', aliases: ['Compare sizes', 'Delta view', 'Savings preview'] },
    { id: 'batch-compress', name: 'Batch', description: 'Process multiple PDF files concurrently with unified compression settings.', kind: 'batch', status: 'soon', aliases: ['Bulk compression', 'Multi-PDF compress', 'Folder queue'] },
  ],
  'compress-image': [
    { id: 'quality-slider', name: 'Quality', description: 'Fine-tune image compression ratio from 1% to 100% with immediate preview.', kind: 'option', status: 'ready', aliases: ['Compression quality', 'Quality slider', 'JPEG fidelity'] },
    { id: 'target-kb', name: 'Target KB', description: 'Iteratively optimize compression to fit strictly under a maximum KB threshold.', kind: 'option', status: 'soon', aliases: ['Target file size', 'Max KB', 'Size budget'] },
    { id: 'strip-exif', name: 'Strip EXIF', description: 'Remove camera model, geolocation GPS coordinates, and private EXIF tags.', kind: 'option', status: 'ready', aliases: ['Remove metadata', 'Clean EXIF', 'Privacy scrub'] },
    { id: 'format-selection', name: 'Format', description: 'Select output format between original, WebP, JPG, or PNG.', kind: 'output', status: 'ready', aliases: ['Target format', 'Output image type', 'Encode format'] },
    { id: 'batch-folder', name: 'Batch folder', description: 'Compress entire directories of images with recursive subfolder scanning.', kind: 'batch', status: 'soon', aliases: ['Bulk folder', 'Directory compress', 'Batch queue'] },
    { id: 'before-after', name: 'Before/after', description: 'Split-view visual comparison highlighting artifact boundaries and file savings.', kind: 'action', status: 'ready', aliases: ['Side-by-side view', 'Compare preview', 'Artifact check'] },
  ],
  'img-resize': [
    { id: 'resize-unit', name: 'Px / Percent / Preset', description: 'Switch dimension scaling between exact pixels, percentages, and standard presets.', kind: 'mode', status: 'ready', aliases: ['Dimension mode', 'Pixel percentage', 'Standard resolutions'] },
    { id: 'lock-aspect', name: 'Lock aspect', description: 'Constrain width and height proportionally to prevent distortion.', kind: 'option', status: 'ready', aliases: ['Keep aspect ratio', 'Proportional scaling', 'Constrain dimensions'] },
    { id: 'fit-fill', name: 'Fit / Fill', description: 'Choose between letterbox padding or canvas cropping to match target aspect ratio.', kind: 'mode', status: 'ready', aliases: ['Canvas behavior', 'Pad or crop', 'Aspect fitting'] },
    { id: 'batch-resize', name: 'Batch', description: 'Apply dimension transformations across multiple image files in one operation.', kind: 'batch', status: 'soon', aliases: ['Bulk resize', 'Batch scale', 'Queue transform'] },
  ],
  'format-json-code': [
    { id: 'indent-size', name: 'Indent size', description: 'Set indentation spacing to 2 spaces, 4 spaces, or tab characters.', kind: 'option', status: 'ready', aliases: ['Tab size', 'Spaces or tabs', 'Indentation depth'] },
    { id: 'sort-keys', name: 'Sort keys', description: 'Alphabetize object property keys alphabetically at all nesting depths.', kind: 'option', status: 'ready', aliases: ['Order keys', 'Alphabetical JSON', 'Sort properties'] },
    { id: 'minify-json', name: 'Minify', description: 'Remove all unnecessary whitespace, comments, and newlines for compact payloads.', kind: 'action', status: 'ready', aliases: ['Compact JSON', 'Compress JSON', 'One-line JSON'] },
    { id: 'error-line', name: 'Error line', description: 'Pinpoint and highlight syntax errors with line and column indicators.', kind: 'option', status: 'ready', aliases: ['Syntax check', 'Error indicator', 'Line highlight'] },
    { id: 'tree-view', name: 'Tree view', description: 'Switch between formatted code editor and collapsible interactive JSON node tree.', kind: 'mode', status: 'ready', aliases: ['Node explorer', 'Collapsible tree', 'Visual JSON'] },
  ],
  'csv-viewer': [
    { id: 'filter-rows', name: 'Filter', description: 'Quick search across all cells or apply column-specific query filters.', kind: 'option', status: 'ready', aliases: ['Table search', 'Row filter', 'Query cells'] },
    { id: 'sort-columns', name: 'Sort', description: 'Sort table rows in ascending or descending alphanumeric order by column.', kind: 'option', status: 'ready', aliases: ['Order table', 'Sort headers', 'Column ordering'] },
    { id: 'column-toggle', name: 'Column toggle', description: 'Show or hide selected columns to focus on essential data fields.', kind: 'option', status: 'ready', aliases: ['Visible columns', 'Hide fields', 'Column visibility'] },
    { id: 'detect-delimiter', name: 'Delimiter and encoding detect', description: 'Auto-detect whether input is comma, tab, semicolon, or pipe-delimited with UTF-8/ANSI decoding.', kind: 'option', status: 'ready', aliases: ['Delimiter detection', 'Auto delimiter', 'Encoding sniffer'] },
    { id: 'export-view', name: 'Export view', description: 'Export currently filtered and sorted rows to clean CSV, JSON, or Excel file.', kind: 'output', status: 'ready', aliases: ['Download visible', 'Save filtered', 'Export grid'] },
  ],
  'batch-rename-files': [
    { id: 'rename-pattern', name: 'Pattern', description: 'Define file naming templates with prefix, suffix, and metadata tokens.', kind: 'option', status: 'ready', aliases: ['Name template', 'Filename pattern', 'Token formatting'] },
    { id: 'sequential-numbering', name: 'Numbering', description: 'Append sequential index numbers with configurable starting value and zero-padding.', kind: 'option', status: 'ready', aliases: ['Numeric sequence', 'Counter padding', 'File counter'] },
    { id: 'case-conversion', name: 'Case conversion', description: 'Transform file names to lowercase, UPPERCASE, Title Case, or kebab-case.', kind: 'mode', status: 'ready', aliases: ['Change case', 'Filename casing', 'Title case'] },
    { id: 'regex-rename', name: 'Regex', description: 'Perform regular expression find-and-replace on file names using capture groups.', kind: 'option', status: 'ready', aliases: ['RegEx replace', 'Capture group rename', 'Pattern substitution'] },
    { id: 'live-preview', name: 'Live preview', description: 'Display real-time before-and-after table of planned file renames before committing.', kind: 'action', status: 'ready', aliases: ['Preview changes', 'Dry run', 'Rename diff'] },
    { id: 'undo-rename', name: 'Undo', description: 'Revert the most recent batch rename operation back to original file names.', kind: 'action', status: 'soon', aliases: ['Rollback rename', 'Revert filenames', 'History undo'] },
  ]
};

// Image converter seed features for convert-jpg, convert-png, convert-webp, convert-bmp, convert-tiff
const IMAGE_CONVERTER_FEATURES = [
  { id: 'converter-quality', name: 'Quality', description: 'Fine-tune export compression quality and visual sharpness.', kind: 'option', status: 'ready', aliases: ['Export fidelity', 'Compression ratio', 'Quality setting'] },
  { id: 'bg-transparency', name: 'Background for transparency', description: 'Specify matte background color (white, black, or custom hex) when converting transparent PNGs.', kind: 'option', status: 'ready', aliases: ['Matte color', 'Alpha replacement', 'Flatten transparency'] },
  { id: 'keep-metadata', name: 'Keep metadata', description: 'Preserve camera settings, timestamps, and color profiles in converted file.', kind: 'option', status: 'soon', aliases: ['Retain EXIF', 'Preserve tags', 'Copy metadata'] },
  { id: 'batch-zip', name: 'Batch zip', description: 'Convert multiple files simultaneously and bundle all outputs into a single ZIP archive.', kind: 'batch', status: 'ready', aliases: ['Download ZIP', 'Batch conversion', 'Archive bundle'] },
];

['convert-jpg', 'convert-png', 'convert-webp', 'convert-bmp', 'convert-tiff'].forEach(id => {
  SEED_FEATURES[id] = IMAGE_CONVERTER_FEATURES;
});

// Helper to generate context-aware features for any tool
function generateFeaturesForTool(util, wsId, groupId) {
  if (SEED_FEATURES[util.id]) {
    return SEED_FEATURES[util.id];
  }

  const features = [];
  const name = util.name;
  const desc = util.description;
  const isSoon = util.status === 'soon';
  const isBeta = util.status === 'beta';
  const defaultStatus = isSoon ? 'soon' : 'ready';

  if (wsId === 'pdf') {
    if (groupId === 'page-organizer') {
      features.push({ id: 'page-selection', name: 'Page selection', description: 'Interactive thumbnail selector to choose specific pages.', kind: 'option', status: defaultStatus, aliases: ['Select pages', 'Thumbnails'] });
      features.push({ id: 'page-range-input', name: 'Page range input', description: 'Specify page numbers or comma-separated ranges (e.g. 1-3, 5, 7).', kind: 'option', status: defaultStatus, aliases: ['Range input', 'Page numbers'] });
      features.push({ id: 'apply-operation', name: 'Apply to document', description: 'Execute reorganization and save new PDF file.', kind: 'action', status: defaultStatus, aliases: ['Run action', 'Execute'] });
    } else if (groupId === 'pdf-editor') {
      features.push({ id: 'style-customizer', name: 'Style & Appearance', description: 'Customize font size, color, opacity, and positioning coordinates.', kind: 'option', status: defaultStatus, aliases: ['Styling', 'Appearance'] });
      features.push({ id: 'apply-all-pages', name: 'All pages toggle', description: 'Apply modification to entire document or only specific pages.', kind: 'option', status: defaultStatus, aliases: ['Page scope', 'Batch apply'] });
      features.push({ id: 'preview-canvas', name: 'Canvas preview', description: 'Live interactive PDF preview with draggable element anchors.', kind: 'action', status: defaultStatus, aliases: ['Interactive preview', 'Visual edit'] });
    } else if (groupId === 'pdf-converter') {
      features.push({ id: 'page-orientation', name: 'Orientation', description: 'Select Portrait, Landscape, or Auto page orientation.', kind: 'mode', status: defaultStatus, aliases: ['Page layout', 'Landscape Portrait'] });
      features.push({ id: 'page-margins', name: 'Margins preset', description: 'Configure document margins (None, Normal, Wide).', kind: 'option', status: defaultStatus, aliases: ['Margin size', 'Padding'] });
      features.push({ id: 'export-pdf-file', name: 'Generate PDF', description: 'Convert input document into standard PDF/A compliant document.', kind: 'output', status: defaultStatus, aliases: ['Save PDF', 'Compile PDF'] });
    } else if (groupId === 'pdf-optimizer') {
      features.push({ id: 'optimization-level', name: 'Optimization level', description: 'Choose balance between speed, file size, and visual clarity.', kind: 'mode', status: defaultStatus, aliases: ['Quality level', 'Aggressive'] });
      features.push({ id: 'strip-annotations', name: 'Strip extra layers', description: 'Discard non-essential PDF annotation streams and form data.', kind: 'option', status: defaultStatus, aliases: ['Remove comments', 'Discard layers'] });
      features.push({ id: 'run-optimizer', name: 'Execute optimization', description: 'Process file and display byte savings report.', kind: 'action', status: defaultStatus, aliases: ['Optimize file', 'Compress'] });
    } else if (groupId === 'pdf-extractor') {
      features.push({ id: 'extract-scope', name: 'Extraction scope', description: 'Extract from all pages, current page, or custom range.', kind: 'option', status: defaultStatus, aliases: ['Page filter', 'Target range'] });
      features.push({ id: 'output-format-extract', name: 'Output format', description: 'Select output format (Plain text, JSON metadata, or PNG).', kind: 'output', status: defaultStatus, aliases: ['Export type', 'File format'] });
      features.push({ id: 'copy-extracted', name: 'Copy to clipboard', description: 'Copy extracted content directly to system clipboard.', kind: 'action', status: defaultStatus, aliases: ['Clipboard copy', 'Quick copy'] });
    } else if (groupId === 'pdf-security') {
      features.push({ id: 'password-input', name: 'Password entry', description: 'Set or enter document encryption password.', kind: 'option', status: defaultStatus, aliases: ['Key input', 'Security passphrase'] });
      features.push({ id: 'encryption-strength', name: 'Encryption level', description: 'Select 128-bit AES or 256-bit AES cryptographic standard.', kind: 'mode', status: defaultStatus, aliases: ['Cipher strength', 'AES level'] });
      features.push({ id: 'apply-security', name: 'Apply security policy', description: 'Write permissions and encrypt or unlock PDF file.', kind: 'action', status: defaultStatus, aliases: ['Lock unlock', 'Save secure PDF'] });
    } else {
      features.push({ id: 'inspect-details', name: 'Inspect document', description: 'Read detailed PDF headers, dictionary values, and metrics.', kind: 'action', status: defaultStatus, aliases: ['Inspect info', 'Scan details'] });
      features.push({ id: 'export-summary', name: 'Export report', description: 'Save document metadata and page properties to text file.', kind: 'output', status: defaultStatus, aliases: ['Save report', 'Dump info'] });
    }
  } else if (wsId === 'documents') {
    if (groupId === 'doc-converter') {
      features.push({ id: 'page-size-preset', name: 'Page size', description: 'Choose target page format (A4, US Letter, Legal).', kind: 'mode', status: defaultStatus, aliases: ['Document dimensions', 'Paper size'] });
      features.push({ id: 'font-styling', name: 'Typography theme', description: 'Select clean typography styling for generated document.', kind: 'option', status: defaultStatus, aliases: ['Font theme', 'Document styling'] });
      features.push({ id: 'convert-output', name: 'Convert document', description: 'Transform document and download converted result.', kind: 'output', status: defaultStatus, aliases: ['Save document', 'Run converter'] });
    } else if (groupId === 'doc-editor') {
      features.push({ id: 'word-wrap', name: 'Word wrap', description: 'Toggle line wrapping in the document editing buffer.', kind: 'option', status: defaultStatus, aliases: ['Wrap lines', 'Soft wrap'] });
      features.push({ id: 'editor-preview', name: 'Live preview', description: 'Side-by-side formatted preview of document text.', kind: 'mode', status: defaultStatus, aliases: ['Formatted view', 'Rendered preview'] });
      features.push({ id: 'clear-editor', name: 'Clear editor', description: 'Reset document buffer to empty state.', kind: 'action', status: defaultStatus, aliases: ['Reset buffer', 'Clear text'] });
    } else if (groupId === 'doc-compare') {
      features.push({ id: 'diff-view-mode', name: 'Side-by-side / Inline', description: 'Toggle between dual-pane comparison and unified inline diff view.', kind: 'mode', status: defaultStatus, aliases: ['View mode', 'Dual pane'] });
      features.push({ id: 'ignore-whitespace-diff', name: 'Ignore whitespace', description: 'Disregard indentation, spaces, and line-ending differences.', kind: 'option', status: defaultStatus, aliases: ['Whitespace sensitivity', 'Trim diff'] });
      features.push({ id: 'copy-diff-patch', name: 'Copy diff summary', description: 'Copy delta statistics and changed lines to clipboard.', kind: 'action', status: defaultStatus, aliases: ['Copy patch', 'Delta report'] });
    } else {
      features.push({ id: 'include-header', name: 'Include metadata header', description: 'Prepend document title and export timestamp to file.', kind: 'option', status: defaultStatus, aliases: ['Header banner', 'Export header'] });
      features.push({ id: 'save-exported-doc', name: 'Download file', description: 'Save generated document directly to disk.', kind: 'output', status: defaultStatus, aliases: ['Export save', 'Write file'] });
    }
  } else if (wsId === 'images') {
    if (groupId === 'img-transformer') {
      features.push({ id: 'transform-mode', name: 'Transform mode', description: 'Select exact dimensions or scale percentage.', kind: 'mode', status: defaultStatus, aliases: ['Operation mode', 'Scale mode'] });
      features.push({ id: 'maintain-aspect', name: 'Maintain aspect ratio', description: 'Preserve original image width-to-height ratio.', kind: 'option', status: defaultStatus, aliases: ['Constrain proportions', 'Aspect lock'] });
      features.push({ id: 'apply-transform', name: 'Apply transformation', description: 'Render image modifications to canvas and export.', kind: 'action', status: defaultStatus, aliases: ['Render image', 'Apply'] });
    } else if (groupId === 'img-optimizer') {
      features.push({ id: 'compression-slider', name: 'Compression level', description: 'Adjust quality slider to optimize byte size.', kind: 'option', status: defaultStatus, aliases: ['Quality', 'Optimization strength'] });
      features.push({ id: 'output-image-type', name: 'Output format', description: 'Save as WebP, JPG, or optimized PNG.', kind: 'output', status: defaultStatus, aliases: ['Target format', 'Save format'] });
      features.push({ id: 'preview-delta', name: 'Savings preview', description: 'Calculate percentage file size reduction.', kind: 'action', status: defaultStatus, aliases: ['Byte savings', 'File size check'] });
    } else if (groupId === 'img-adjustments') {
      features.push({ id: 'adjustment-slider', name: 'Intensity slider', description: 'Fine-tune filter value from 0% to 200%.', kind: 'option', status: defaultStatus, aliases: ['Filter strength', 'Level'] });
      features.push({ id: 'reset-adjustments', name: 'Reset to neutral', description: 'Revert all color values back to original defaults.', kind: 'action', status: defaultStatus, aliases: ['Revert colors', 'Reset filter'] });
      features.push({ id: 'export-adjusted', name: 'Export image', description: 'Save color-adjusted picture to image file.', kind: 'output', status: defaultStatus, aliases: ['Save photo', 'Render picture'] });
    } else if (groupId === 'img-metadata') {
      features.push({ id: 'view-exif-tags', name: 'Tag inspector', description: 'Display table of all embedded camera and GPS parameters.', kind: 'action', status: defaultStatus, aliases: ['Inspect tags', 'Read metadata'] });
      features.push({ id: 'copy-metadata-json', name: 'Export as JSON', description: 'Export complete metadata dictionary as structured JSON.', kind: 'output', status: defaultStatus, aliases: ['Save JSON', 'Copy metadata'] });
    } else {
      features.push({ id: 'fit-page-mode', name: 'Fit to page', description: 'Scale pictures to fit cleanly on PDF canvas without clipping.', kind: 'mode', status: defaultStatus, aliases: ['Auto fit', 'Scale to page'] });
      features.push({ id: 'generate-pdf-doc', name: 'Build PDF document', description: 'Compile all selected photos into a unified PDF file.', kind: 'output', status: defaultStatus, aliases: ['Compile PDF', 'Export album'] });
    }
  } else if (wsId === 'data') {
    if (groupId === 'data-viewer') {
      features.push({ id: 'search-data', name: 'Search & filter', description: 'Instant search across all keys, fields, and records.', kind: 'option', status: defaultStatus, aliases: ['Quick search', 'Filter data'] });
      features.push({ id: 'expand-collapse-tree', name: 'Expand / collapse', description: 'Toggle all nested hierarchy branches simultaneously.', kind: 'action', status: defaultStatus, aliases: ['Toggle nodes', 'Expand all'] });
      features.push({ id: 'export-view-data', name: 'Export view', description: 'Save current table or tree view to disk.', kind: 'output', status: defaultStatus, aliases: ['Save view', 'Export data'] });
    } else if (groupId === 'data-converter') {
      features.push({ id: 'parse-options', name: 'Parse options', description: 'Configure headers, delimiter characters, and type inferencing.', kind: 'option', status: defaultStatus, aliases: ['Conversion settings', 'Type casting'] });
      features.push({ id: 'output-schema', name: 'Output format', description: 'Select target serialization format and indentation.', kind: 'output', status: defaultStatus, aliases: ['Target structure', 'Save format'] });
      features.push({ id: 'copy-converted', name: 'Copy converted data', description: 'Copy converted data structure directly to clipboard.', kind: 'action', status: defaultStatus, aliases: ['Quick copy', 'Clipboard export'] });
    } else if (groupId === 'data-transformer') {
      features.push({ id: 'transformation-rule', name: 'Transformation rule', description: 'Select sort criteria, filter expressions, or column mappings.', kind: 'option', status: defaultStatus, aliases: ['Rules', 'Transform query'] });
      features.push({ id: 'case-sensitivity', name: 'Case sensitivity', description: 'Match data values with strict or lenient case comparison.', kind: 'option', status: defaultStatus, aliases: ['Case match', 'Strict comparison'] });
      features.push({ id: 'apply-data-transform', name: 'Apply transform', description: 'Process table records and show updated dataset.', kind: 'action', status: defaultStatus, aliases: ['Run transform', 'Execute data query'] });
    } else if (groupId === 'data-validator') {
      features.push({ id: 'jump-to-error', name: 'Jump to error', description: 'Locate and focus cursor on exact line of syntax error.', kind: 'action', status: defaultStatus, aliases: ['Find error', 'Go to line'] });
      features.push({ id: 'strict-validation', name: 'Strict schema check', description: 'Enforce strict schema rules and type conformity.', kind: 'option', status: defaultStatus, aliases: ['Strict mode', 'Linter check'] });
    } else {
      features.push({ id: 'format-indent-setting', name: 'Indentation spacing', description: 'Set indentation to 2 spaces, 4 spaces, or tabs.', kind: 'option', status: defaultStatus, aliases: ['Indent size', 'Format spacing'] });
      features.push({ id: 'sort-formatted-keys', name: 'Sort dictionary keys', description: 'Alphabetize object property keys alphabetically.', kind: 'option', status: defaultStatus, aliases: ['Sort keys', 'Order properties'] });
      features.push({ id: 'copy-formatted-code', name: 'Copy formatted output', description: 'Copy clean indented text to clipboard.', kind: 'action', status: defaultStatus, aliases: ['Copy code', 'Export formatted'] });
    }
  } else if (wsId === 'text') {
    if (groupId === 'text-transformer') {
      features.push({ id: 'conversion-target', name: 'Case / direction mode', description: 'Select target case styling or reversal orientation.', kind: 'mode', status: defaultStatus, aliases: ['Transform mode', 'Case target'] });
      features.push({ id: 'apply-text-transform', name: 'Transform text', description: 'Apply transformation to active text buffer.', kind: 'action', status: defaultStatus, aliases: ['Execute transform', 'Update text'] });
      features.push({ id: 'copy-text-result', name: 'Copy result', description: 'Copy transformed string to clipboard.', kind: 'action', status: defaultStatus, aliases: ['Copy string', 'Quick copy'] });
    } else if (groupId === 'text-cleaner') {
      features.push({ id: 'cleaner-scope', name: 'Cleaning scope', description: 'Select which whitespace or control characters to strip.', kind: 'option', status: defaultStatus, aliases: ['Clean rules', 'Whitespace filter'] });
      features.push({ id: 'run-cleaner', name: 'Clean buffer', description: 'Normalize text and remove unwanted characters.', kind: 'action', status: defaultStatus, aliases: ['Sanitize buffer', 'Clean text'] });
    } else if (groupId === 'text-analyzer') {
      features.push({ id: 'live-metrics', name: 'Live metric counter', description: 'Continuously recalculate counts as you type.', kind: 'option', status: defaultStatus, aliases: ['Realtime stats', 'Auto update'] });
      features.push({ id: 'copy-metrics', name: 'Copy metrics report', description: 'Copy text summary statistics to clipboard.', kind: 'action', status: defaultStatus, aliases: ['Copy report', 'Save counts'] });
    } else if (groupId === 'text-encoder') {
      features.push({ id: 'codec-direction', name: 'Encode / Decode', description: 'Toggle between encoding raw string and decoding encoded representation.', kind: 'mode', status: defaultStatus, aliases: ['Direction', 'Encode or decode'] });
      features.push({ id: 'url-safe-mode', name: 'URL-safe variant', description: 'Use URL-safe character replacements (- and _) for web compatibility.', kind: 'option', status: defaultStatus, aliases: ['Web safe', 'URL safe'] });
      features.push({ id: 'copy-encoded-output', name: 'Copy output', description: 'Copy resulting encoded or decoded string.', kind: 'action', status: defaultStatus, aliases: ['Copy result', 'Clipboard'] });
    } else {
      features.push({ id: 'text-diff-mode', name: 'Side-by-side / Inline', description: 'Switch between split view and unified line diff.', kind: 'mode', status: defaultStatus, aliases: ['Diff mode', 'Dual pane'] });
      features.push({ id: 'ignore-casing', name: 'Ignore case differences', description: 'Treat uppercase and lowercase characters as equal.', kind: 'option', status: defaultStatus, aliases: ['Case insensitive', 'Ignore case'] });
    }
  } else if (wsId === 'developer') {
    if (groupId === 'dev-formatter') {
      features.push({ id: 'code-indent-size', name: 'Indentation spacing', description: 'Select 2 spaces, 4 spaces, or tab indentation.', kind: 'option', status: defaultStatus, aliases: ['Indentation depth', 'Tabs spaces'] });
      features.push({ id: 'minify-code-action', name: 'Minify code', description: 'Strip all comments and whitespace for production distribution.', kind: 'action', status: defaultStatus, aliases: ['Minify', 'Compact code'] });
      features.push({ id: 'copy-code-result', name: 'Copy formatted code', description: 'Copy beautified syntax to clipboard.', kind: 'action', status: defaultStatus, aliases: ['Copy code', 'Export'] });
    } else if (groupId === 'dev-encode') {
      features.push({ id: 'codec-mode-select', name: 'Encode / Decode', description: 'Switch between encoding and decoding operations.', kind: 'mode', status: defaultStatus, aliases: ['Mode', 'Direction'] });
      features.push({ id: 'jwt-verify-sig', name: 'Inspect claims', description: 'Inspect token expiration timestamp and payload claims.', kind: 'action', status: defaultStatus, aliases: ['Token claims', 'Check expiry'] });
      features.push({ id: 'copy-decoded-token', name: 'Copy payload JSON', description: 'Copy decoded JWT claims as formatted JSON.', kind: 'output', status: defaultStatus, aliases: ['Copy claims', 'Export JSON'] });
    } else if (groupId === 'dev-generators') {
      features.push({ id: 'generator-count', name: 'Quantity count', description: 'Number of random values or UUIDs to generate at once.', kind: 'option', status: defaultStatus, aliases: ['Batch count', 'Amount'] });
      features.push({ id: 'include-special-chars', name: 'Character complexity', description: 'Toggle uppercase, lowercase, numbers, and symbols.', kind: 'option', status: defaultStatus, aliases: ['Symbols', 'Complexity'] });
      features.push({ id: 'generate-new-batch', name: 'Regenerate', description: 'Generate fresh set of random values.', kind: 'action', status: defaultStatus, aliases: ['Refresh values', 'Reroll'] });
    } else if (groupId === 'dev-regex') {
      features.push({ id: 'regex-flags', name: 'Regex flags (g, i, m, s)', description: 'Toggle Global, Case-Insensitive, Multiline, and DotAll flags.', kind: 'option', status: defaultStatus, aliases: ['Flags', 'Modifiers'] });
      features.push({ id: 'group-inspector', name: 'Capture groups inspector', description: 'Inspect matched capture groups and index offsets in real time.', kind: 'action', status: defaultStatus, aliases: ['Groups view', 'Capture list'] });
      features.push({ id: 'substitution-preview', name: 'Replacement preview', description: 'Test regex substitution templates with $1 and $2 tokens.', kind: 'option', status: defaultStatus, aliases: ['Replace preview', 'Substitution test'] });
    } else {
      features.push({ id: 'url-query-builder', name: 'Query param editor', description: 'Interactive key-value table to modify URL parameters.', kind: 'option', status: defaultStatus, aliases: ['Params editor', 'Query table'] });
      features.push({ id: 'copy-parsed-url', name: 'Copy parsed JSON', description: 'Export URL breakdown into structured JSON object.', kind: 'output', status: defaultStatus, aliases: ['Copy URL JSON', 'Export breakdown'] });
    }
  } else if (wsId === 'calculator') {
    features.push({ id: 'calculation-mode', name: 'Calculation mode', description: 'Select arithmetic formula or conversion unit.', kind: 'mode', status: defaultStatus, aliases: ['Mode switcher', 'Operation type'] });
    features.push({ id: 'copy-math-result', name: 'Copy result', description: 'Copy numeric calculation result to clipboard.', kind: 'action', status: defaultStatus, aliases: ['Copy answer', 'Save result'] });
    features.push({ id: 'precision-slider', name: 'Decimal precision', description: 'Control number of decimal places in calculated output.', kind: 'option', status: defaultStatus, aliases: ['Decimals', 'Rounding'] });
  } else if (wsId === 'files') {
    if (groupId === 'files-archives') {
      features.push({ id: 'compression-method', name: 'Archive compression', description: 'Select Store, Standard, or Best compression level.', kind: 'mode', status: defaultStatus, aliases: ['ZIP compression', 'Archive level'] });
      features.push({ id: 'search-archive-files', name: 'Search archive tree', description: 'Filter files and folders inside archive without extracting.', kind: 'option', status: defaultStatus, aliases: ['Find file in zip', 'Search archive'] });
      features.push({ id: 'extract-archive-action', name: 'Extract archive', description: 'Unpack files to destination directory.', kind: 'action', status: defaultStatus, aliases: ['Unzip files', 'Unpack'] });
    } else {
      features.push({ id: 'hash-algorithm-select', name: 'Hash algorithm (SHA256, MD5)', description: 'Select cryptographic hash algorithm for comparison and integrity checks.', kind: 'mode', status: defaultStatus, aliases: ['Checksum type', 'Hash algorithm'] });
      features.push({ id: 'export-checksum-file', name: 'Export checksums', description: 'Save calculated checksums to .sha256 or .md5 verification file.', kind: 'output', status: defaultStatus, aliases: ['Save checksum', 'Hash report'] });
      features.push({ id: 'copy-hash-result', name: 'Copy hash', description: 'Copy calculated fingerprint to clipboard.', kind: 'action', status: defaultStatus, aliases: ['Copy fingerprint', 'Copy digest'] });
    }
  }

  return features;
}

module.exports = {
  SEED_FEATURES,
  generateFeaturesForTool,
};
