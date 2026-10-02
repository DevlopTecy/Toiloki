# 12-Point Visual Inspection & Regression Checklist

When creating, redesigning, or reviewing any screen or component in Toiloki, systematically evaluate every point on this checklist. Identify and fix visual inconsistencies rather than adding more decorative elements.

---

## The 12-Point Inspection Matrix

### 1. Alignment
- [ ] **Grid Alignment**: Are elements aligned to clean vertical and horizontal lines?
- [ ] **Icon-Label Alignment**: Are icons vertically centered with their accompanying text labels?
- [ ] **Action Bar Alignment**: Are primary actions aligned to the bottom-right or top-right consistently across screens?
- [ ] **Table Column Alignment**: Are textual headers left-aligned, numeric/size metadata right-aligned, and actions right-aligned?

### 2. Spacing (8px Harmonic Grid)
- [ ] **Token Adherence**: Are all margins and paddings using 4px, 8px, 12px, 16px, 24px, 32px, 48px increments?
- [ ] **No Arbitrary Numbers**: Verify there are no random values like `margin: 17px` or `padding: 23px`.
- [ ] **Proportional Balance**: Does the screen avoid both excessive cramming and vast desolate empty space?
- [ ] **Content Padding**: Is horizontal content padding set between 32px and 48px?

### 3. Typography
- [ ] **Hierarchy Compliance**: Page title = `32px / 650`, section header = `18px / 600`, card title = `15px / 600`, body = `14px / 400`, caption = `11px / 600 uppercase 0.08em`.
- [ ] **Font Family**: Is the UI font strictly Inter/Geist?
- [ ] **Monospace Correctness**: Is `JetBrains Mono` used for file sizes, hashes, technical options, page counts, shortcuts, and code?
- [ ] **Anti-Pattern Check**: Are there any giant condensed fonts or marketing headings? (Reject immediately if found).

### 4. Contrast & Readability
- [ ] **WCAG AA Compliance**: Does all text satisfy minimum 4.5:1 contrast against its background?
- [ ] **Text Hierarchy Distinction**: Is `--text-primary` (`#F4F5F7`), `--text-secondary` (`#A3A9B5`), and `--text-tertiary` (`#6B7280`) clearly differentiated?
- [ ] **Border Hairlines**: Are borders visible as subtle separation lines (`rgba(255,255,255,0.06/0.10)`) without overpowering the content?

### 5. Component Consistency
- [ ] **Standard Components**: Does this screen use standard buttons, inputs, selects, toggles, and tables from `references/components.md`?
- [ ] **No Ad-Hoc Variations**: Ensure the developer has not invented a bespoke button style or unique card border for this specific workspace.
- [ ] **Corner Radii**: Are radii constrained to `4px` (tags), `6px` (buttons/inputs), and `8px` (cards/dialogs)? (No pill-shaped cards or 9999px borders).

### 6. Sidebar Consistency
- [ ] **Sidebar Width**: Is the sidebar strictly 240px to 248px wide?
- [ ] **Section Hierarchy**: Does it maintain `Home`, `TOOLS` (8 workspaces), `LIBRARY` (Favorites, History), and bottom `Settings`?
- [ ] **Active Indicator**: Is the active workspace indicated with a subtle raised surface, champagne gold indicator, and category icon tint?
- [ ] **No Glowing Overload**: Ensure there is no giant blue or neon background on active nav items.

### 7. Button Hierarchy
- [ ] **Singular Primary Action**: Is there exactly one primary button (`#D4B06A` Champagne Gold) per screen?
- [ ] **Secondary & Ghost Complement**: Are secondary options properly styled as secondary or ghost buttons?
- [ ] **Hit Targets**: Do all clickable buttons and icons have at least a 36px hit target?
- [ ] **Tooltips**: Do all icon-only buttons include tooltips and `aria-label`?

### 8. Empty-State Quality
- [ ] **Purposeful**: Does the empty state explain what to do next with a clear, concise headline and action?
- [ ] **No Giant Illustrations**: Verify there are no oversized cartoon vectors, 3D clay graphics, or decorative marketing illustrations.
- [ ] **Compact Footprint**: Is the empty state centered without pushing controls off-screen?

### 9. File-Processing Layout
- [ ] **Drop Zone Height**: Is the file drop zone compact (`100px` to `120px` max)?
- [ ] **Drop Zone Notice**: Does it include the privacy reminder: *"Files stay on your computer. Fully offline & local."*?
- [ ] **Structured Table**: Are uploaded files listed in a clean table with compact `34px` to `38px` rows?
- [ ] **File Operations**: Are file size, type/page count, reordering drag handle, and remove buttons clearly positioned?

### 10. Responsive Behavior
- [ ] **Minimum Viewport**: Does the application render cleanly at `1100px × 700px` without horizontal scrolling or clipped controls?
- [ ] **Max-Width Containment**: Does the main workspace stay centered or properly padded up to `1280px` max width?
- [ ] **Flexibility**: Do tables and options panels flex gracefully when the window is resized?

### 11. Dark & Light Theme Parity
- [ ] **Identical DOM & Layout**: Does switching to Light mode preserve exact element positions, padding, spacing, and dimensions?
- [ ] **Token Mapping**: Are light mode tokens properly mapped (`#F8F9FA` bg, `#FFFFFF` surface, `#111318` text, `#B88E3E` accent)?
- [ ] **Contrast Parity**: Is light mode text sharp and readable without washed-out gray-on-white text?

### 12. Visual Noise & Anti-Pattern Audit (Strict Elimination)
- [ ] **No AI/SaaS Tropes**: Reject neon glows, floating blur blobs, saturated gradient cards, and chat boxes.
- [ ] **No Marketing Dashboards**: Reject fake vanity stats ("12,400 files transformed!"), marketing banners, and pricing pills.
- [ ] **Subtle Motion**: Ensure animations are strictly 150–220ms state transitions; respects `prefers-reduced-motion`.
- [ ] **Feature Integrity**: Confirm NO existing functionality or routes were removed to make the interface look simpler.

---

## Visual Verification Process

When performing visual reviews:
1. **Automated Inspection**: Run `python scripts/verify_ui.py` to check token definitions, font declarations, and capture test renders.
2. **Side-by-Side Review**: Compare rendered screenshots against the visual reference rules.
3. **Regression Audit**: Ensure that edits to one workspace (e.g. PDF) did not introduce unintended styling side effects in other workspaces (e.g. Developer or Text).
