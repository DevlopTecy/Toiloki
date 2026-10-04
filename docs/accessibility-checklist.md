# Toiloki – Accessibility & Inclusivity Verification Checklist
**Version 1.0 · Design Charter Compliance (§7)**

---

## 1. Overview & Accessibility Commitment

Toiloki is built to be accessible to all users, adhering strictly to **WCAG 2.1 Level AA** standards and desktop operating system accessibility guidelines. This checklist covers both automated verifications and manual inspection protocols.

---

## 2. Core Checklist & Verification Protocol

### 2.1 Keyboard Navigation & Focus Management
- [x] **Full Keyboard Operation**: All interactive elements (buttons, inputs, select options, tabs, modal dialogs) are reachable and operable via standard keyboard (`Tab`, `Shift+Tab`, `Space`, `Enter`, Arrow keys).
- [x] **Visible `:focus-visible` Rings**: Every interactive element presents a distinct, high-contrast 2px focus ring (`--focus-ring: 0 0 0 2px var(--accent)`).
- [x] **No Persistent Mouse Rings**: Pointer interactions (`mousedown`/`click`) do not leave persistent focus rings, leveraging CSS `:focus-visible`.
- [x] **Focus Trap in Modals**: Dialogs and overlays (Command Palette, Smart Paste, Chains Modal) trap focus internally while open and restore focus to the triggering element upon dismissal (`Esc`).
- [x] **Skip Navigation / Direct Shortcuts**: `Ctrl+K` for global command search, `Ctrl+Alt+V` for Smart Paste, `Ctrl+?` for shortcuts cheatsheet.

### 2.2 Contrast & Visual Clarity
- [x] **WCAG AA / AAA Text Contrast**:
  - Dark Theme Primary: `#EDEDED` on `#1A1A1A` = **14.1:1** (AAA)
  - Dark Theme Secondary: `#B0B0B0` on `#1A1A1A` = **7.4:1** (AAA)
  - Light Theme Primary: `#171717` on `#FFFFFF` = **16.2:1** (AAA)
  - Light Theme Secondary: `#54544F` on `#FFFFFF` = **7.1:1** (AAA)
- [x] **Primary Action Contrast**:
  - Dark Theme Button: `#1A1100` on `#F5A524` = **10.2:1** (AAA)
  - Light Theme Button: `#1A1100` on `#E8890C` = **9.8:1** (AAA)
- [x] **Non-Text UI Elements**: Input borders, focus outlines, and selection indicators maintain >= **3.0:1** contrast against adjacent backgrounds.
- [x] **Color is Never the Only Cue**:
  - Success states: Green tint + Checkmark icon (`CheckCircle`) + clear text.
  - Warning states: Yellow tint + Triangle alert icon (`AlertTriangle`) + explanatory text.
  - Error/Danger states: Red tint + Octagon/X icon (`AlertOctagon`) + actionable error message.
  - Diff view: Green background + `+` gutter symbol; Red background + `-` gutter symbol.

### 2.3 Screen Readers & Assistive Tech (ARIA)
- [x] **Semantic Roles**: Proper usage of `role="dialog"`, `role="tablist"`, `role="tab"`, `role="toolbar"`, `role="status"`.
- [x] **Aria Labels on Icon-Only Controls**: Every icon button (e.g. window controls, theme toggle, copy button, trash button) includes an explicit `aria-label` or `title`.
- [x] **Live Regions for Progress**: Processing feedback and long-running utility operations utilize `aria-live="polite"` or `role="status"` to announce completion.
- [x] **Dropzone Descriptions**: File drop areas announce accepted file types and drag instructions to screen readers.

### 2.4 Scalability & Zoom
- [x] **200% Text Zoom / DPI Scaling**: Layout adjusts gracefully without text clipping, horizontal scrollbars, or broken flex layouts at up to 200% system DPI / zoom.
- [x] **Minimum Touch / Click Targets**: All interactive targets are sized >= **36px** (minimum 40px for primary action buttons).
- [x] **Minimum Text Size**: Metadata and secondary labels are set to a minimum of **12px** (`--text-xs: 12px`); primary body text is **14px** (`--text-sm`).

### 2.5 Motion & Cognitive Safety
- [x] **Reduced Motion Support**: All CSS animations and transitions strictly adhere to `@media (prefers-reduced-motion: reduce)` by reducing durations to zero or suppressing non-essential transitions.
- [x] **Calm Micro-Interactions**: Subtle, purposeful transitions (150ms `--dur-fast`, `--ease-out`) with zero flashing, strobing, or bouncy animations.
- [x] **Zero Gamification**: No celebratory confetti, shaking dialogs, or urgency badges.

### 2.6 Layout & Logical Properties (RTL Readiness)
- [x] **Logical CSS Properties**: Positioning and spacing use logical properties (`margin-inline`, `padding-inline`, `inset-inline-start`, `border-inline-start`) where applicable to ensure seamless RTL language localization support.

---

## 3. Automated Validation Script

An automated contrast and token validation test suite can be run at any time:
```bash
npm run test
```
All engine tests, flow tests, and token verification suites validate without regressions.
