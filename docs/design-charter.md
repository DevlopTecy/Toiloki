# Toiloki – Design Charter
**Version 1.0 · October 2026**

> This document is the single source of truth for all design, UX, and front-end decisions in Toiloki. Where any other document or earlier prompt conflicts with this charter, this charter wins.

---

## Product Feel

**Calm, quick, trustworthy, precise.** "A tool I installed because I trust it" — not a dashboard trying to sell me something.

Toiloki is a local-first, offline-only Windows desktop utility suite. It is not an AI product, a SaaS, or a marketing experience.

---

## Ethical Filter — Never Build

The following patterns are **strictly prohibited**:

- Social proof or testimonials
- Usage statistics from other users
- Loss-aversion, urgency, or expiry nudges
- Streaks, badges, or gamification rewards
- Reminder or push notifications
- Guilt-trip mascots or characters
- Pricing tiers, anchors, or upsell prompts
- Dark patterns of any kind
- Telemetry-driven personalization (only local data, explained in one line, with a Clear control)
- Confetti or celebration animations

---

## 1. Psychology → Rules

### 1.1 Cognitive Load and Decision Fatigue
- One task per screen; work area first; sentence-case labels
- Help text only when the label is not enough — one line max; never show disabled or "Coming soon" controls
- Smart defaults pre-selected; presets for common choices; "More options" collapsed

### 1.2 Hick's Law
- At most 7 top-level nav or menu entries per chunk; group by purpose
- Show 3–4 most relevant suggestions by file type and recent use; rest behind menu or search

### 1.3 Miller's Law
- Chunk lists to 5–7 visible items; settings pages 5 sections max; option groups 5 items max

### 1.4 Gestalt
- Proximity and spacing group items; similarity = same style = same role; alignment on one left edge
- Thin 1px dividers; no nested bordered boxes; one surface level per page

### 1.5 Fitts's Law
- Drop zones fully clickable; primary button min 40px tall, sticky bottom-right
- All targets min 36px; frequent actions near the work; destructive actions never adjacent to primary

### 1.6 Jakob's Law
- Left sidebar navigation; top search (Ctrl+K); menubar for actions
- Standard controls (switches, checkboxes, selects); standard shortcuts (Ctrl+Z, Ctrl+S, Ctrl+A, Delete, Esc)
- Logo top-left; settings bottom-left

### 1.7 Von Restorff (Isolation)
- Exactly ONE visually isolated element per screen: the primary action
- Accent fill (--accent) ONLY on: primary button fill, active nav marker (2px bar), focus rings, progress fill
- Nothing else uses accent fill — not chips, tags, output values, secondary buttons

### 1.8 Serial Position and Peak–End
- Most useful first (Recent, Pinned, Search); key action last (sticky bottom bar)
- Invest in the final moment of every task (see Section 5)

### 1.9 Anchoring
- Recommended option pre-selected and marked "Recommended" (e.g. Compress: Balanced — Recommended)

### 1.10 Temporal Discounting
- One-step utilities run on file drop with defaults; result within 1 second; first result in two actions (drop, save)

### 1.11 Feedback Loops
- Acknowledge every action within 100ms; live previews; determinate progress + Cancel
- Inline validation next to the field; never clear input on error; every task ends in clear success or error state

### 1.12 Zeigarnik (Gentle Resumption)
- Unfinished work is resumable: small dismissible "Resume: Report.pdf (Delete pages)" row at top of Home Recent
- No popups, no modal reminders, no notifications

### 1.13 Framing
- Describe outcomes positively and concretely: "4.1 MB → 1.6 MB, 61% smaller" not "Operation completed"

### 1.14 Emotional Design
- Warm, plain microcopy; contractions allowed; subtle micro-interactions (max 200ms); no mascots
- A calm "Saved to Downloads" moment — brief, then gone

### 1.15 Habit Formation (Ethical)
- Speed is the habit: remembered last options per utility, presets, shortcuts, pinned utilities
- No streaks, no reminders, no engagement nudges

### 1.16 Personalization (Local Only)
- Remembered per utility: last input options and output folder
- Remembered globally: pinned utilities order, recent history, theme, density, font scale, layout, last active workspace
- "Suggested for this file" chips are rule-based, labeled "Suggested", dismissible, can be turned off in Settings > General
- One-line explanation + "Clear" control in Settings > History and Privacy: "Toiloki remembers your last settings per tool. Nothing leaves this device."

### 1.17 Aesthetic–Usability Effect
- Pixel alignment on the 8px grid; consistent border radii from token set
- No clipped or truncated text without a tooltip; zero stray colors (every color maps to a named token)

---

## 2. Know Your User

### Personas
| Persona | Primary Jobs |
|---|---|
| Everyday user | Compress, merge, convert, resize, rename |
| Office / student | PDFs, documents, spreadsheets, calculate |
| Developer / power user | JSON, regex, hashes, batch operations |

### Top 10 Jobs (Target: 3 clicks or fewer from Home)
1. Compress image
2. Merge PDF
3. Convert image format
4. Split PDF
5. Compress PDF
6. Resize image
7. Format JSON
8. Basic calculator
9. Rename files (batch)
10. Convert units

These utilities must always be reachable in 3 clicks or fewer from Home: Home Pinned defaults, suggestion chips, or Ctrl+K ranked by popularity and recency.

---

## 3. Navigation and Information Architecture

**Hierarchy:** Workspace > Group > Utility > Feature

**Always visible:**
- Where am I: small muted breadcrumb — Home / Workspace / Utility
- How do I get out: sidebar, Back button, Esc key

**Naming:** Sentence case; verb or noun phrases matching natural search words ("Merge PDF", "Compress image", "Format JSON"); aliases covering synonyms (see docs/ia-map.md)

**Search ranking:** exact name match → alias match → recent use → fuzzy match

**Navigation rules:**
- Max 7 workspace entries in the sidebar; overflow behind "More" expander
- Settings icon at the bottom of the sidebar (Jakob's Law)

---

## 4. Task Orientation and Forms

Each screen = one task; remove anything that does not help the current task.

**Form field rules:**
- Label above or inline-left of the field
- Realistic example placeholder (a real value, not "Enter value...")
- Units shown inline (e.g. "px", "KB")
- Defaults always pre-filled
- Inline validation next to the field; never clears valid input on error
- Enter submits; Esc cancels; logical tab order; last values remembered per utility
- Fewer than 4 choices: segmented controls or tiles — never a dropdown
- 4 or more choices: select or searchable combobox
- Numeric inputs: include stepper arrows and accept typed units

---

## 5. Peak–End: The Finish

Every successful task ends with a calm result state:

| Element | Specification |
|---|---|
| What changed | Concrete numbers: "2 pages deleted · 3.2 MB saved" |
| Primary action | "Save as…" (accent fill, 40px+, prominent) |
| Secondary action | "Open folder" (ghost or secondary style) |
| One next step | ONE relevant follow-up (not a list): "Compress this too?" |

**Error states:**
- One sentence: cause + fix: "Couldn't open this PDF. It's password-protected. Enter the password to continue."
- Retry button — always present
- "Show details" expander for technical info — collapsed by default, not shown to ordinary users

---

## 6. Writing and Content

| Rule | Do | Don't |
|---|---|---|
| Grade 8 reading level | "Remove blank pages" | "Eliminate extraneous folios" |
| Verbs first | "Compress image" | "Image compression" |
| Contractions allowed | "You'll get the result in seconds" | "You will receive the result" |
| Sentence case | "Merge PDF" | "MERGE PDF" or "Merge Pdf Files" |
| No terminal period on labels | "Output folder" | "Output folder." |
| No "successfully" | "Merged" | "Successfully merged" |
| No "please" | "Enter a password" | "Please enter a password" |
| No exclamation marks | "Done" | "Done!" |
| No jargon in primary text | "Remove background" | "Alpha-channel extraction" |
| No ampersands in labels | "Save and close" | "Save & Close" |

**Error pattern:** "[Couldn't do X]. [Reason]. [Fix]."
Example: "Couldn't open this PDF. It's password-protected. Enter the password to continue."

**Empty state pattern:** headline names the space → one line explains → one action button.

All user-facing strings must live in a centralized resource file (i18n-ready). Language setting in Settings > General (English only now; structure ready for RTL via CSS logical properties).

---

## 7. Inclusivity and Accessibility

**Keyboard:** Full keyboard operation; logical tab order; Esc closes dialogs and cancels operations.

**Focus:** Visible :focus-visible rings — 2px outline from --focus-ring color; never suppressed.

**ARIA:**
- Sidebar: role="navigation" with aria-label
- Menubar: role="menubar"
- Dialogs: role="dialog" with aria-labelledby and aria-modal
- Status messages: role="status" or aria-live="polite"
- Progress: role="progressbar" with aria-valuenow
- Icon-only buttons: aria-label on every one
- Drop targets: aria-label="Drop files here"
- Thumbnails and images: descriptive alt text

**Visual:**
- Reduced motion: @media (prefers-reduced-motion: reduce) disables all animations
- Font scale: 90–125% via Settings > Appearance
- High Contrast theme: available in Settings > Appearance; ignores image/translucent themes
- Color is never the only signal — always paired with icon or text label
- Minimum target size: 36x36px; minimum text size: 12px
- WCAG AA: 4.5:1 for text; 3:1 for non-text UI

**Automated:** Axe (or equivalent) integrated into npm test.
**Manual checklist:** docs/accessibility-checklist.md (keyboard-only pass, screen reader pass, contrast pass, 200% zoom pass, reduced-motion pass).

---

## 8. Trust, Security, and Support

**Trust:**
- Say "Everything runs on this device" exactly ONCE: sidebar footer dot with tooltip + one line in Settings > History and Privacy
- Show "Your original isn't changed" near Save/Export actions

**About page:** app name, version, build date, licenses of bundled libraries, open-source notices.

**Security:**
| Requirement | Implementation |
|---|---|
| Context isolation | contextIsolation: true (Electron preload) |
| Node integration | nodeIntegration: false |
| CSP | Strict Content Security Policy, no remote sources |
| No remote code | No eval, no remote scripts, no CDN assets at runtime |
| File validation | Validate type, extension, and size on every input file |
| Temp file cleanup | Temp files deleted on job completion and on app close |
| Secure delete | Optional: overwrite before delete (user setting) |

**Support:** Help > "Report a problem" creates a local diagnostics file (version, OS, last errors — no file contents). User attaches it to an email. No automatic sending.

---

## Color System

All token pairs verified for WCAG AA compliance.

### Light Theme
```css
--bg:            #FAFAF9;
--sidebar:       #F3F3F1;
--surface:       #FFFFFF;
--surface-hover: #F3F3F0;
--border:        #E3E3DE;
--text:          #171717;
--text-2:        #54544F;
--text-muted:    #6B6B65;
--accent:        #E8890C;
--accent-hover:  #D17A06;
--on-accent:     #1A1100;
--accent-text:   #9A5B00;
--accent-soft:   rgba(232,137,12,.10);
--focus-ring:    #C26F00;
--success:       #1F7A45;
--success-bg:    #E6F4EC;
--warning:       #7A5C00;
--warning-bg:    #FFF4D6;
--danger:        #C62828;
--danger-bg:     #FDECEC;
```

### Dark Theme (Neutral — no blue tint)
```css
--bg:            #111111;
--sidebar:       #151515;
--surface:       #1A1A1A;
--surface-hover: #222222;
--border:        #2E2E2E;
--text:          #EDEDED;
--text-2:        #B0B0B0;
--text-muted:    #8E8E8E;
--accent:        #F5A524;
--accent-hover:  #FFB84A;
--on-accent:     #1A1100;
--accent-text:   #F5A524;
--accent-soft:   rgba(245,165,36,.12);
--focus-ring:    #F5A524;
--success:       #4ADE80;
--success-bg:    rgba(74,222,128,.12);
--warning:       #F2C94C;
--warning-bg:    rgba(242,201,76,.12);
--danger:        #F87171;
--danger-bg:     rgba(248,113,113,.12);
```

### Accent Rules
Orange accent (--accent) appears ONLY as:
1. Single primary button fill (--on-accent text, never white)
2. Active nav/menu marker (2px bar or underline)
3. Focus rings (2px outline, --focus-ring color)
4. Progress fill

Never as: body text on light surfaces (use --accent-text), secondary button outlines, chips, tags, output values, or illustrations.

### Status Signals (always color + icon + word)
| Status | Colors | Icon | Word examples |
|---|---|---|---|
| Success | --success / --success-bg | Check | "Saved", "Done" |
| Warning | --warning / --warning-bg | Triangle | "Large file", "Low disk" |
| Danger | --danger / --danger-bg | Octagon-X | "Failed", "Error" |

Warning and accent must never share the same element. Warnings are tinted banners with a triangle icon.

### Diff / Compare Views
Added: --success-bg background + "+" gutter. Removed: --danger-bg background + "–" gutter. Color is never the only cue.

### Disabled = 40% opacity — but prefer explanatory behavior: explain on click rather than greying out.

---

## Visual Priority Ladder

| Priority | Role | Treatment |
|---|---|---|
| P1 | Primary action | Accent fill, min 40px tall, sticky bottom-right. Exactly ONE per screen. |
| P2 | Work area and results | Highest text contrast, most visual space |
| P3 | Secondary actions | 1px border or ghost style, neutral color |
| P4 | Supporting info | --text-2 or --text-muted, 12–13px, one line |
| P5 | Chrome (nav, borders, window controls) | Lowest visual weight |

Transient exception: Error and success banners may temporarily outrank P2.

**Squint test:** blur a screenshot — P1 (primary action) and P2 (work area) must be the only two elements still visible.

---

## Typography and Spacing

**Font:** Inter only (400, 500, 600). Monospace (JetBrains Mono) only for code editors, file names/paths, hashes, keyboard shortcut indicators.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Page title | 22px | 600 | One h1 per screen |
| Section heading | 16px | 600 | — |
| Body text | 14px | 400 | Default |
| Meta / supporting | 12px | 400–500 | --text-muted, +0.01em letter-spacing |

**Rules:** Line height 1.5; letter-spacing +0.01em at 12–13px; no uppercase labels; no tracked (wide-spaced) text in UI elements.

**8px grid tokens:**
- --space-1: 8px
- --space-2: 16px
- --space-3: 24px
- --space-4: 32px
- --space-5: 40px

**Layout:** page padding 32px; rows 44–48px (interactive), 34–38px (data table); section gap 32px; max width 1100px (forms), 1280px (wide layouts). Icons: Lucide outline 18px in --text-2 color. No sparkle or filled icons.

---

## Compliance Checklist (Per Screen Before Ship)

- [ ] One h1 per screen
- [ ] Breadcrumb visible (muted)
- [ ] Primary action count = exactly 1 (accent fill)
- [ ] Accent-colored elements total <= 3
- [ ] No uppercase labels
- [ ] No disabled controls shown (removed or replaced with explanatory behavior)
- [ ] No "Coming soon" items visible
- [ ] All interactive targets >= 36x36px
- [ ] Primary button >= 40px tall
- [ ] Destructive action not adjacent to primary action
- [ ] All icon buttons have aria-label
- [ ] Focus rings visible during keyboard navigation
- [ ] Success and error states present for every operation
- [ ] All strings use sentence case
- [ ] No hardcoded hex values (all from token file)
- [ ] Text contrast >= 4.5:1; UI element contrast >= 3:1
- [ ] Color signal always paired with icon or text

---

*End of Design Charter v1.0*
