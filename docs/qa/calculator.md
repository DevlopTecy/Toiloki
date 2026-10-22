# QA Audit Report: Calculator & Converters Workspace (Phase 6A)

**Workspace**: Calculator & Converters  
**Date**: October 6, 2026  
**Auditor**: Automated QA Runner & Workspace Auditor  
**Suite**: Toiloki Offline Desktop Suite  
**Commit**: Phase 6A  

---

## Executive Summary

Phase 6A delivered an extensive upgrade and polish to the Calculator & Converters workspace, addressing every requirement in the Universal Calculator & Converter Checklist:
1. **Seamless Keypad & Physical Keyboard Input**: Implemented global `keydown` event routing in `CalcKeypad` and scientific mode (`calc-trig-logs`). Supports digits (`0`–`9`), decimal point (`.`), operators (`+`, `-`, `*`, `/`), evaluation (`Enter` or `=`), backspace deletion (`⌫`), clear (`Escape`), and percent (`%`). Automatically yields when focus is in an input or textarea element.
2. **Floating-Point Precision Elimination**: Upgraded `CalcEngine.evaluateExpression` with precision truncation to 12 significant figures, eliminating IEEE-754 floating-point noise (e.g. `0.1 + 0.2` strictly evaluates to `0.3`, `0.7 + 0.1` to `0.8`).
3. **Divide-by-Zero Protection**: Added proactive zero-division detection (`1 / 0`, `100 / (5 - 5)`). Displays a clear and graceful `'Cannot divide by zero'` message rather than raw `Infinity` or crashing the evaluation pipeline.
4. **Standard Pocket-Calculator Percentage Behavior**: Added percentage pre-processing: `100 + 10%` evaluates to `110`, `200 - 25%` evaluates to `150`, and `50 * 20%` evaluates to `10`. Standalone percentages (`50%`) evaluate to `0.5`.
5. **Persistent History with One-Click Clear**: Connected calculation history to local persistence (`localStorage` key `toiloki_calc_history`). History items can be clicked to load the result directly back into the active display. Provided a dedicated "Clear" button that purges both in-memory and persisted calculation logs.
6. **Scientific Deg / Rad Toggle**: Connected `isRad` state to trigonometric function execution (`sin`, `cos`, `tan`). In DEG mode (`isRad: false`), angles are automatically converted via `(angle * pi / 180)`: `sin(90)` evaluates to `1`, `cos(0)` evaluates to `1`, and `tan(45)` evaluates to `1`. In RAD mode, `sin(pi / 2)` evaluates to `1`.
7. **Number Formatting with Thousands Separators**: Added `CalcEngine.formatNumberWithCommas` to format large numbers with readable commas (e.g. `1,234,567.89`) while preserving intermediate typing states.
8. **Unit Converter Layout with Animated Swap Button**: Unit converter displays two large From / To fields with a 180° rotating Swap button (`⇄`) with smooth 150ms crossfade transitions.
9. **Loan / EMI & Amortization Schedule**: Validated EMI formula $E = P \cdot r \cdot \frac{(1+r)^n}{(1+r)^n - 1}$ and full monthly amortization breakdown with principal, interest, and declining balance reaching 0.
10. **GST / VAT Add & Remove Modes**: Implemented dual-mode tax calculation: "Add tax to amount" ($A + A \times r$) and "Extract tax from price" ($A - A / (1 + r)$) with automatic 50/50 CGST and SGST breakdown.
11. **Date & Age Suite**: Precise date diff, age breakdown in Years, Months, and Days, total days lived, day of week born, next birthday countdown, and business days calculator excluding weekends.

---

## Universal Checklist & Audit Table

| Utility ID | Issue / Requirement | Type | Severity | Status | Test Added | Verification Details |
|---|---|---|---|---|---|---|
| `calc-basic` | Missing keyboard event routing; keypad clicks only | UX / Accessibility | P1 | **Fixed** | Manual / Unit | Global `keydown` listener routes digits, operators, Enter, Backspace, Escape |
| `calc-basic` | `0.1 + 0.2` produced `0.30000000000000004` floating-point noise | Precision / Bug | P1 | **Fixed** | `tests/calculator-workspace-complete.test.cjs` | Precision rounding eliminates IEEE-754 leakage; `0.1 + 0.2 = 0.3` |
| `calc-basic` | `1 / 0` produced `Infinity` or raw crash | Stability / UX | P1 | **Fixed** | `tests/calculator-workspace-complete.test.cjs` | Divide-by-zero guard returns `'Cannot divide by zero'` |
| `calc-basic` | `100 + 10%` evaluated as `100.1` instead of `110` | Feature / Math | P1 | **Fixed** | `tests/calculator-workspace-complete.test.cjs` | Pre-processor translates additive percentages into standard calculator arithmetic |
| `calc-basic` | History lost on window refresh; no persistent storage | UX / Persistence | P2 | **Fixed** | `tests/calculator-workspace-complete.test.cjs` | `localStorage` persistence with one-click Clear history button |
| `calc-trig-logs` | DEG / RAD toggle did not affect trig evaluations | Bug / Math | P1 | **Fixed** | `tests/calculator-workspace-complete.test.cjs` | `isRad: false` scales `sin(90)` to `1`, `cos(0)` to `1`, `tan(45)` to `1` |
| `unit-converter` | Need clear Swap button between From and To units | UX / Layout | P2 | **Fixed** | Visual / E2E | Animated 180° rotation swap button (`⇄`) with 150ms crossfade |
| `calc-loan-emi` | Amortization schedule balance verification | Math / Feature | P1 | **Fixed** | `tests/calculator-workspace-complete.test.cjs` | Verified formula and 0 ending balance on final amortization installment |
| `calc-gst-vat` | Tax extraction mode and CGST/SGST split | Feature | P2 | **Fixed** | `tests/calculator-workspace-complete.test.cjs` | Dual-mode Add/Remove calculation + 50/50 state/central split |
| `calc-age` | Age in exact Y/M/D, total days, next birthday countdown | Feature | P2 | **Fixed** | `tests/calculator-workspace-complete.test.cjs` | Accurate date diff with leap year and calendar day handling |

---

## Responsive & Layout Verification

- **1280x720 Desktop**:
  - Basic calculator renders 360px card alongside 320px history sidebar with smooth 100ms display fade transitions.
  - Scientific calculator expands to 6-column keypad layout with dedicated DEG/RAD toggle chips and clear function groupings.
  - Unit converter renders equal side-by-side input and output cards centered by the interactive swap action icon.
  - Amortization table displays formatted currency values with sticky header rows.
- **800x560 Compact**:
  - Basic calculator wraps cleanly with vertically stacked history panel.
  - Scientific calculator maintains minimum 40px touch targets for buttons.
  - Unit converter panes stack responsively while preserving full conversion accuracy.

---

## Token & Design System Compliance

- **Surface Tokens**: Strictly uses `var(--bg)`, `var(--surface)`, `var(--surface-hover)`, and `var(--surface-active)`.
- **Border Tokens**: `var(--border)` and `var(--border-strong)`. Zero `--border-subtle` usage.
- **Accent Color**: Champagne gold `var(--accent)` (`#D4B06A`) used exclusively on active tokens, primary action keys, and selected state chips.
- **Zero CSS `text-transform: uppercase`**: Fully compliant with Automated Guard 2.
- **WCAG AA Contrast**: All buttons, LCD display text, and table cells pass WCAG AA contrast standards.
