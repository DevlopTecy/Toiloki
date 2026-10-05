# Accessibility & Full Contrast Audit Report

**Document Status:** Complete & Verified
**Standard:** WCAG 2.1 Level AA (SC 1.4.3 Contrast Minimum, SC 1.4.11 Non-text Contrast)
**Date:** October 2026

## 1. Executive Summary

An automated contrast verification and accessibility audit was executed across all design tokens in `src/styles/tokens.css` for both Dark and Light themes. Every color pairing was evaluated for relative luminance and contrast ratio against WCAG 2.1 AA specifications (4.5:1 for normal text, 3:1 for large text, and 3:1 for non-text UI borders and focus rings).

**Audit Statistics:**
- **Total Token Pairs Audited:** 44
- **Passed WCAG AA:** 44
- **Failures / Non-Compliant Pairs:** 0

## 2. Contrast Failure Analysis

All audited pairs passed WCAG 2.1 AA thresholds.

## 3. Full Token Contrast Audit Table

| Theme | Category | Description | Foreground / Background | Ratio | Requirement | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Dark Theme | text-normal | Primary Text on Background | `text (#EDEDED) on bg (#111111)` | 16.13:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-normal | Primary Text on Surface Card | `text (#EDEDED) on surface (#1A1A1A)` | 14.87:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-normal | Primary Text on Sidebar | `text (#EDEDED) on sidebar (#151515)` | 15.60:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-normal | Primary Text on Surface Hover | `text (#EDEDED) on surfaceHover (#222222)` | 13.59:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-normal | Secondary Text on Background | `text2 (#B0B0B0) on bg (#111111)` | 8.71:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-normal | Secondary Text on Surface Card | `text2 (#B0B0B0) on surface (#1A1A1A)` | 8.03:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-normal | Secondary Text on Sidebar | `text2 (#B0B0B0) on sidebar (#151515)` | 8.42:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-normal | Secondary Text on Surface Hover | `text2 (#B0B0B0) on surfaceHover (#222222)` | 7.34:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-muted | Muted Text on Background | `textMuted (#8E8E8E) on bg (#111111)` | 5.76:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-muted | Muted Text on Surface Card | `textMuted (#8E8E8E) on surface (#1A1A1A)` | 5.31:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-muted | Muted Text on Sidebar | `textMuted (#8E8E8E) on sidebar (#151515)` | 5.57:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-muted | Muted Text on Surface Hover | `textMuted (#8E8E8E) on surfaceHover (#222222)` | 4.86:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-button | On-Accent Text on Accent Button | `onAccent (#1A1100) on accent (#F5A524)` | 9.15:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-accent | Accent Text on Background | `accentText (#F5A524) on bg (#111111)` | 9.25:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-accent | Accent Text on Surface | `accentText (#F5A524) on surface (#1A1A1A)` | 8.53:1 | 4.5:1 | ✓ PASS |
| Dark Theme | status-text | Success Text on Surface | `success (#4ADE80) on surface (#1A1A1A)` | 9.99:1 | 4.5:1 | ✓ PASS |
| Dark Theme | status-text | Warning Text on Surface | `warning (#F2C94C) on surface (#1A1A1A)` | 10.97:1 | 4.5:1 | ✓ PASS |
| Dark Theme | status-text | Danger Text on Surface | `danger (#F87171) on surface (#1A1A1A)` | 6.29:1 | 4.5:1 | ✓ PASS |
| Dark Theme | control-border-ui | Control Boundary on Background | `borderStrong (#6B6B6B) on bg (#111111)` | 3.54:1 | 3:1 | ✓ PASS |
| Dark Theme | control-border-ui | Control Boundary on Surface | `borderStrong (#6B6B6B) on surface (#1A1A1A)` | 3.27:1 | 3:1 | ✓ PASS |
| Dark Theme | focus-ring | Focus Ring on Background | `focusRing (#F5A524) on bg (#111111)` | 9.25:1 | 3:1 | ✓ PASS |
| Dark Theme | focus-ring | Focus Ring on Surface | `focusRing (#F5A524) on surface (#1A1A1A)` | 8.53:1 | 3:1 | ✓ PASS |
| Light Theme | text-normal | Primary Text on Background | `text (#171717) on bg (#FAFAF9)` | 17.17:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-normal | Primary Text on Surface Card | `text (#171717) on surface (#FFFFFF)` | 17.93:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-normal | Primary Text on Sidebar | `text (#171717) on sidebar (#F3F3F1)` | 16.14:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-normal | Primary Text on Surface Hover | `text (#171717) on surfaceHover (#F3F3F0)` | 16.13:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-normal | Secondary Text on Background | `text2 (#54544F) on bg (#FAFAF9)` | 7.29:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-normal | Secondary Text on Surface Card | `text2 (#54544F) on surface (#FFFFFF)` | 7.61:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-normal | Secondary Text on Sidebar | `text2 (#54544F) on sidebar (#F3F3F1)` | 6.85:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-normal | Secondary Text on Surface Hover | `text2 (#54544F) on surfaceHover (#F3F3F0)` | 6.85:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-muted | Muted Text on Background | `textMuted (#6B6B65) on bg (#FAFAF9)` | 5.13:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-muted | Muted Text on Surface Card | `textMuted (#6B6B65) on surface (#FFFFFF)` | 5.36:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-muted | Muted Text on Sidebar | `textMuted (#6B6B65) on sidebar (#F3F3F1)` | 4.83:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-muted | Muted Text on Surface Hover | `textMuted (#6B6B65) on surfaceHover (#F3F3F0)` | 4.82:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-button | On-Accent Text on Accent Button | `onAccent (#1A1100) on accent (#E8890C)` | 7.13:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-accent | Accent Text on Background | `accentText (#9A5B00) on bg (#FAFAF9)` | 5.20:1 | 4.5:1 | ✓ PASS |
| Light Theme | text-accent | Accent Text on Surface | `accentText (#9A5B00) on surface (#FFFFFF)` | 5.43:1 | 4.5:1 | ✓ PASS |
| Light Theme | status-text | Success Text on Surface | `success (#1F7A45) on surface (#FFFFFF)` | 5.35:1 | 4.5:1 | ✓ PASS |
| Light Theme | status-text | Warning Text on Surface | `warning (#7A5C00) on surface (#FFFFFF)` | 6.25:1 | 4.5:1 | ✓ PASS |
| Light Theme | status-text | Danger Text on Surface | `danger (#C62828) on surface (#FFFFFF)` | 5.62:1 | 4.5:1 | ✓ PASS |
| Light Theme | control-border-ui | Control Boundary on Background | `borderStrong (#8A8A84) on bg (#FAFAF9)` | 3.32:1 | 3:1 | ✓ PASS |
| Light Theme | control-border-ui | Control Boundary on Surface | `borderStrong (#8A8A84) on surface (#FFFFFF)` | 3.47:1 | 3:1 | ✓ PASS |
| Light Theme | focus-ring | Focus Ring on Background | `focusRing (#C26F00) on bg (#FAFAF9)` | 3.61:1 | 3:1 | ✓ PASS |
| Light Theme | focus-ring | Focus Ring on Surface | `focusRing (#C26F00) on surface (#FFFFFF)` | 3.77:1 | 3:1 | ✓ PASS |

## 4. Automated Axe Accessibility Rules Compliance

Automated structural accessibility audit across workspace templates:
1. **Heading Hierarchy (WCAG 1.3.1):** All workspaces feature a single `<h1>` title inside `WorkspaceHeader.tsx`, followed by clean `<h2>` section headings. PASS.
2. **Form Labels & Inputs (WCAG 3.3.2, 4.1.2):** All interactive inputs and select boxes feature explicit `<label>` association or `aria-label` attributes. PASS.
3. **Button Accessible Names (WCAG 4.1.2):** Icon-only buttons (copy buttons, window controls, theme toggle) include descriptive `aria-label` or `title` tooltips. PASS.
4. **Keyboard Focus Rings (WCAG 2.4.7):** Explicit `:focus-visible` outline and box-shadow (`--focus-ring`) styled in `src/styles/global.css` at 2px. PASS.
5. **Color-Blindness & Non-Color Dependence (WCAG 1.4.1):** Status indicators combine color with text labels or iconography (e.g. checkmark, warning triangle, cross icon). PASS.
