# Toiloki Desktop Suite — Motion System Specification

> Comprehensive reference of all animations, transitions, micro-interactions, and accessibility rules for the Toiloki Desktop Utility Suite. Layers seamlessly on top of the clean, flat Light and Dark design system (one orange accent `#E8890C` / `#F5A524`).

---

## 1. Core Principles & Constraints

1. **Subtle, Fast & Purposeful**: Explains state changes; never decorates. No bounce, elastic easing, parallax, looping decorative animations, neon glows, gradient sweeps, particle, or confetti effects.
2. **GPU-Accelerated**: Only `transform` and `opacity` are animated (plus `color`, `background-color`, `border-color` for state changes). Never animate `width`, `height`, `top`, or `left` directly. For expand/collapse, use `grid-template-rows: 0fr -> 1fr`.
3. **60fps Desktop Webview Performance**: Zero heavy blurs or large `backdrop-filter`. Clean, solid surfaces.
4. **Theme Parity**: Works identically in Light and Dark themes through CSS tokens.
5. **Full Accessibility**: Respects `prefers-reduced-motion: reduce`. All movements (translate/scale) become an opacity-only fade of $\le 100$ms, and loops become static or a slow pulse. Persisted "Reduce motion" switch (Auto / On / Off) available in Settings.

---

## 2. Motion Tokens

| Token | Value | Intent |
|---|---|---|
| `--dur-instant` | `80ms` | Key presses, active scale snaps, label fade-outs on collapse |
| `--dur-fast` | `120ms` | Hover states, input focus ring fades, dropdown entrances, copy icon swap |
| `--dur-base` | `180ms` | Modal/palette entrances, group expand/collapse, active indicator slide |
| `--dur-slow` | `260ms` | Drawing strokes, secondary attention settles |
| `--dur-page` | `220ms` | Workspace content route entrance, sidebar width expand/collapse |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Entrances and reveals |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits (~30% faster than entrances) |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | State changes, slider movements, flips |
| `--move-sm` | `4px` | Subtle shifts (dropzone icon lift, error slide down) |
| `--move-md` | `8px` | Modal/workspace route entrances (`translateY`) |
| `--move-lg` | `16px` | Larger drawer movements |

---

## 3. Motion Specification Table

| Element | Trigger / Event | Animated Property | Duration | Easing | Notes |
|---|---|---|---|---|---|
| **Theme Switch** | Theme toggle click (Light/Dark/System) | `background-color`, `color`, `border-color` | `200ms` | `ease` | Disabled during initial paint via `body.preload` |
| **Workspace Content** | Route / Navigation change | `opacity`, `translateY(8px -> 0)` | `220ms` | `--ease-out` | Outgoing content fades out over 100ms; sidebar and titlebar stay static |
| **Tool List Panel** | First entry from Home | `opacity`, `translateX(-12px -> 0)` | `200ms` | `--ease-out` | Slides in smoothly on first category selection |
| **Sidebar Collapse** | Sidebar toggle click | `width` (240px -> 56px) | `220ms` | `--ease-standard` | Labels and counts fade out first (80ms); icon rail remains fixed at 20px |
| **Sidebar Expand** | Sidebar toggle click | `width` (56px -> 240px) | `220ms` | `--ease-standard` | Width expands first; labels fade in with 220ms delay |
| **Sidebar Active Bar** | Navigation change | `transform: translateY(...)` | `180ms` | `--ease-standard` | Single shared 2px accent indicator sliding between items |
| **Tool List Active Bar**| Tool selection | `transform: translateY(...)` | `180ms` | `--ease-standard` | Single shared 2px accent indicator sliding between tools |
| **Tool List Chevron** | Group header click | `transform: rotate(0deg -> 90deg)` | `150ms` | `--ease-standard` | Indicates group open/close |
| **Tool List Group Body**| Group header click | `grid-template-rows: 0fr <-> 1fr` | `180ms` | `--ease-standard` | CSS grid-rows technique; no JS height calculation |
| **Buttons (All)** | Mouse hover | `background-color`, `border-color` | `120ms` | `ease` | Smooth background transition |
| **Buttons (All)** | Mouse press | `transform: scale(0.98)` | `80ms` | `--ease-out` | Released over 120ms `--ease-standard` |
| **Button Loading** | Action execution start | Replace label with 16px spinner | `700ms loop`| `linear` | 1px stroke, zero layout shift (maintains width) |
| **Home Module Cards** | Mouse hover | `background-color`, `transform: translateY(-1px)` | `150ms` | `--ease-standard` | 1px upward move only; no scale or shadow growth |
| **Quick Action Cards** | Mouse hover | `background-color`, `qa-arrow translateX(2px)` | `150ms` | `--ease-standard` | Arrow shifts 2px right; description reveals |
| **Home Recent / QA** | First session load | `opacity`, `translateY(8px -> 0)` | `220ms` | `--ease-out` | Staggered 25ms per item (max 8 items); never replays in session |
| **Inputs / Selects** | Keyboard / click focus | `border-color`, `box-shadow` outline | `120ms` | `ease` | 2px accent outline offset 2px; size does not animate |
| **Favorite Star** | Toggle favorite ON | `transform: scale(1 -> 1.2 -> 1)`, `fill/stroke` | `220ms` | `--ease-out` | Single scale pulse + fill fade; unfavorite is plain fade |
| **Command Palette (Ctrl+K)** | Open shortcut | Backdrop `opacity 0 -> 0.40` | `150ms` | `--ease-standard` | Solid 40% dark surface (no expensive blur) |
| **Command Palette Modal** | Open shortcut | `opacity`, `translateY(8px -> 0)`, `scale(0.98 -> 1)` | `180ms` | `--ease-out` | Exits over 120ms |
| **Palette Result Row**| Arrow key navigation | `background-color` | `100ms` | `ease` | Highlight background fades; selection moves instantly |
| **Toast Notifications**| `showToast(...)` call | `opacity`, `translateY(12px -> 0)` | `180ms` | `--ease-out` | Slides in from bottom-right |
| **Toast Progress Line**| Active auto-dismiss | `transform: scaleX(1 -> 0)` | `3000ms` | `linear` | 1px accent progress bar shrinking along bottom |
| **Toast Dismiss** | Timer or close click | `opacity`, `translateX(0 -> 8px)` | `120ms` | `--ease-in` | Clean exit fade and slight slide |
| **Copy Button** | Click copy | Icon swaps `Copy` -> `Check` | `120ms` | `ease` | Crossfade swap; automatically reverts after 1.5s |
| **Dropzone Idle** | Static state | None | — | — | Completely static; no pulsing |
| **Dropzone Drag-Over** | Drag enter over dropzone | Border -> accent, BG -> 6% tint, Icon `translateY(-4px)`, Label crossfade | `120ms / 150ms` | `--ease-out` | Reverses smoothly on drag leave over 120ms |
| **File Added to List** | File selection / drop | `opacity`, `translateY(6px -> 0)` | `180ms` | `--ease-out` | Staggered 30ms per row (max 8 rows); rest appear together |
| **File Removed from List**| Click remove `X` | `opacity 0`, `max-height 0`, `padding 0` | `160ms` | `--ease-in` | Smooth height collapse; lower rows slide up |
| **Action Bar** | Files present in tool | `opacity`, `translateY(100% -> 0)` | `220ms` | `--ease-out` | Slides up from bottom when files exist |
| **Determinate Progress**| Progress update event | `transform: scaleX(0 -> 1)` | `200ms` | `linear` | Smooth transform scaling between updates |
| **Indeterminate Progress**| Unknown duration job | `translateX(-100% -> 200%)` | `1400ms loop`| `linear` | 2px slide within track; only for unmeasured jobs |
| **Success Banner** | Job completes 100% | Crossfade into 10% success tint | `160ms` | `--ease-out` | Inline notification banner |
| **Self-Drawing Circle Check**| Success trigger | Circle stroke (`280ms`), Check stroke (`180ms`) | `460ms total` | `--ease-out` | Plays once; zero confetti; zero sound |
| **Download Attention Nudge** | Success complete | `transform: scale(1 -> 1.03 -> 1)` | `300ms` | `--ease-standard` | Runs once after 480ms delay to draw attention |
| **Error Banner** | Job error occurred | `opacity`, `translateY(-4px -> 0)` | `180ms` | `--ease-out` | Slides down gently into view |
| **Error Field Shake** | Job error occurred | `transform: translateX(-4px <-> 4px)` | `240ms` | `--ease-standard` | 2-cycle horizontal shake (skipped under reduced motion) |
| **Text Output Pane** | Text / code tool update | `opacity (0.35 -> 1.0)` | `120ms` | `--ease-out` | Skipped when output > 50KB to preserve 60fps |
| **Status Bar Stats** | Output update | Numeric text transition | `150ms` | `ease` | Number tweening for word/line/char stats |
| **Unit Converter Swap** | Click swap button | `transform: rotate(0deg -> 180deg)` | `200ms` | `--ease-standard` | Both unit select values crossfade over 150ms |
| **Data Table Sort** | Header click | `transform: rotate(0deg -> 180deg)` | `150ms` | `--ease-standard` | Sort arrow rotates; rows hover over 100ms |
| **Data Table Initial Rows**| Initial table load | `opacity`, `translateY(8px -> 0)` | `180ms` | `--ease-out` | Staggered 20ms for first 10 rows only |
| **Calculator Keypad** | Key button click | `transform: scale(0.96)`, BG flash | `80ms` | `--ease-out` | Snappy mechanical feedback |
| **Calculator Display** | Key calculation / digit | `opacity (0.35 -> 1.0)` | `100ms` | `--ease-out` | Previous value fades smoothly |
| **Calculator History** | Calculation completed | `opacity`, `translateY(-8px -> 0)` | `160ms` | `--ease-out` | Slides in from top; prior entries shift down |
| **Skeleton Placeholder**| Async loading > 150ms | `opacity (0.6 <-> 1.0)` | `1400ms loop`| `ease-in-out` | Flat border-tinted block pulse; no gradient shimmer sweep |
| **Local Cache Bar** | Storage change | `transform: scaleX(...)` | `400ms` | `--ease-out` | Smooth width change from left origin |

---

## 4. Accessibility & Reduced Motion Handling

Toiloki provides strict WCAG AA compliant motion controls:
- **System Synchronization**: Automatically detects OS `prefers-reduced-motion: reduce`.
- **In-App Control**: Settings -> Appearance includes an explicit **Reduce Motion** radio group:
  - `Auto`: Follows OS system preferences.
  - `On`: Forces reduced motion on root (`data-motion="on"`).
  - `Off`: Enables full motion system (`data-motion="off"`).
- **Reduced Motion Transformations**:
  - All positional movement (`translateY`, `translateX`, `scale`) collapses to `0px` / `scale(1)`.
  - Durations become at most `100ms` opacity-only fades (`--dur-fast: 60ms`, `--dur-base: 80ms`, `--dur-slow: 100ms`, `--dur-page: 100ms`).
  - Looping animations (skeletons, spinners) collapse to static states or slow low-contrast pulses.
  - Form field error shakes are completely skipped (`animation: none !important`).
  - No elements flash more than 3 times per second. Focus rings appear instantly with zero delay.

---

## 5. Developer Review Mode

Press `Ctrl+Shift+M` at any time to toggle **Review Mode (5x Slow Motion)**:
- Sets `data-motion-slow="true"` on root, which scales `--motion-speed: 5`.
- All CSS variable-based durations dynamically scale 5x for visual audit and frame-by-frame inspection.
- Displays a toast confirmation upon toggling.
