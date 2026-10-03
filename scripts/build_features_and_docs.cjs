const fs = require('fs');
const path = require('path');

// Seed feature specifications
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

// Image converter features for convert-jpg, convert-png, convert-webp, convert-bmp, convert-tiff
const IMAGE_CONVERTER_FEATURES = [
  { id: 'converter-quality', name: 'Quality', description: 'Fine-tune export compression quality and visual sharpness.', kind: 'option', status: 'ready', aliases: ['Export fidelity', 'Compression ratio', 'Quality setting'] },
  { id: 'bg-transparency', name: 'Background for transparency', description: 'Specify matte background color (white, black, or custom hex) when converting transparent PNGs.', kind: 'option', status: 'ready', aliases: ['Matte color', 'Alpha replacement', 'Flatten transparency'] },
  { id: 'keep-metadata', name: 'Keep metadata', description: 'Preserve camera settings, timestamps, and color profiles in converted file.', kind: 'option', status: 'soon', aliases: ['Retain EXIF', 'Preserve tags', 'Copy metadata'] },
  { id: 'batch-zip', name: 'Batch zip', description: 'Convert multiple files simultaneously and bundle all outputs into a single ZIP archive.', kind: 'batch', status: 'ready', aliases: ['Download ZIP', 'Batch conversion', 'Archive bundle'] },
];

console.log('Seed features configured successfully.');
