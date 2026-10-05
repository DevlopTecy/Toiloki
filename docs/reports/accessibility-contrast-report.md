# Accessibility & Full Contrast Audit Report

**Document Status:** Complete & Verified
**Standard:** WCAG 2.1 Level AA (SC 1.4.3 Contrast Minimum, SC 1.4.11 Non-text Contrast)
**Date:** October 2026

## 1. Executive Summary

An automated contrast verification and accessibility audit was executed across all design tokens in `src/styles/tokens.css` for both Dark and Light themes. Every color pairing was evaluated for relative luminance and contrast ratio against WCAG 2.1 AA specifications (4.5:1 for normal text, 3:1 for large text, and 3:1 for non-text UI borders and focus rings).

**Audit Statistics:**
- **Total Token Pairs Audited:** 44
- **Passed WCAG AA:** 33
- **Failures / Non-Compliant Pairs:** 11

## 2. Contrast Failure Analysis

| Theme | UI Element & Pair | Contrast Ratio | Required | Issue & WCAG Violation |
| :--- | :--- | :--- | :--- | :--- |
| **Dark Theme** | UI Border on Background (`border (#2E2E2E) on bg (#111111)`) | **1.39:1** | `3:1` | Subtle/decorative border fails 3:1 non-text boundary threshold (WCAG 2.1 SC 1.4.11). Decorative or card delimiter borders are acceptable if the surface background difference provides sufficient separation. |
| **Dark Theme** | UI Border on Surface (`border (#2E2E2E) on surface (#1A1A1A)`) | **1.28:1** | `3:1` | Subtle/decorative border fails 3:1 non-text boundary threshold (WCAG 2.1 SC 1.4.11). Decorative or card delimiter borders are acceptable if the surface background difference provides sufficient separation. |
| **Light Theme** | On-Accent Text on Accent Button (`onAccent (#FFFFFF) on accent (#E8890C)`) | **2.62:1** | `4.5:1` | Fails WCAG 2.1 AA requirement. |
| **Light Theme** | Accent Text on Background (`accent (#E8890C) on bg (#FAFAF9)`) | **2.51:1** | `4.5:1` | Orange accent used as raw text on dark/light background fails 4.5:1 normal text contrast. Should be restricted to large text, icons, or filled buttons with high-contrast text. |
| **Light Theme** | Accent Text on Surface (`accent (#E8890C) on surface (#FFFFFF)`) | **2.62:1** | `4.5:1` | Orange accent used as raw text on dark/light background fails 4.5:1 normal text contrast. Should be restricted to large text, icons, or filled buttons with high-contrast text. |
| **Light Theme** | Success Text on Surface (`success (#16A34A) on surface (#FFFFFF)`) | **3.30:1** | `4.5:1` | Status color used as text fails 4.5:1 minimum on surface. Requires status pill badge background or darker shade. |
| **Light Theme** | Warning Text on Surface (`warning (#D97706) on surface (#FFFFFF)`) | **3.19:1** | `4.5:1` | Status color used as text fails 4.5:1 minimum on surface. Requires status pill badge background or darker shade. |
| **Light Theme** | UI Border on Background (`border (#E3E3DE) on bg (#FAFAF9)`) | **1.23:1** | `3:1` | Subtle/decorative border fails 3:1 non-text boundary threshold (WCAG 2.1 SC 1.4.11). Decorative or card delimiter borders are acceptable if the surface background difference provides sufficient separation. |
| **Light Theme** | UI Border on Surface (`border (#E3E3DE) on surface (#FFFFFF)`) | **1.29:1** | `3:1` | Subtle/decorative border fails 3:1 non-text boundary threshold (WCAG 2.1 SC 1.4.11). Decorative or card delimiter borders are acceptable if the surface background difference provides sufficient separation. |
| **Light Theme** | Focus Ring on Background (`focusRing (#E8890C) on bg (#FAFAF9)`) | **2.51:1** | `3:1` | Fails WCAG 2.1 AA requirement. |
| **Light Theme** | Focus Ring on Surface (`focusRing (#E8890C) on surface (#FFFFFF)`) | **2.62:1** | `3:1` | Fails WCAG 2.1 AA requirement. |

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
| Dark Theme | text-accent | Accent Text on Background | `accent (#F5A524) on bg (#111111)` | 9.25:1 | 4.5:1 | ✓ PASS |
| Dark Theme | text-accent | Accent Text on Surface | `accent (#F5A524) on surface (#1A1A1A)` | 8.53:1 | 4.5:1 | ✓ PASS |
| Dark Theme | status-text | Success Text on Surface | `success (#4ADE80) on surface (#1A1A1A)` | 9.99:1 | 4.5:1 | ✓ PASS |
| Dark Theme | status-text | Warning Text on Surface | `warning (#F2C94C) on surface (#1A1A1A)` | 10.97:1 | 4.5:1 | ✓ PASS |
| Dark Theme | status-text | Danger Text on Surface | `danger (#F87171) on surface (#1A1A1A)` | 6.29:1 | 4.5:1 | ✓ PASS |
| Dark Theme | border-ui | UI Border on Background | `border (#2E2E2E) on bg (#111111)` | 1.39:1 | 3:1 | ❌ FAIL |
| Dark Theme | border-ui | UI Border on Surface | `border (#2E2E2E) on surface (#1A1A1A)` | 1.28:1 | 3:1 | ❌ FAIL |
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
| Light Theme | text-button | On-Accent Text on Accent Button | `onAccent (#FFFFFF) on accent (#E8890C)` | 2.62:1 | 4.5:1 | ❌ FAIL |
| Light Theme | text-accent | Accent Text on Background | `accent (#E8890C) on bg (#FAFAF9)` | 2.51:1 | 4.5:1 | ❌ FAIL |
| Light Theme | text-accent | Accent Text on Surface | `accent (#E8890C) on surface (#FFFFFF)` | 2.62:1 | 4.5:1 | ❌ FAIL |
| Light Theme | status-text | Success Text on Surface | `success (#16A34A) on surface (#FFFFFF)` | 3.30:1 | 4.5:1 | ❌ FAIL |
| Light Theme | status-text | Warning Text on Surface | `warning (#D97706) on surface (#FFFFFF)` | 3.19:1 | 4.5:1 | ❌ FAIL |
| Light Theme | status-text | Danger Text on Surface | `danger (#DC2626) on surface (#FFFFFF)` | 4.83:1 | 4.5:1 | ✓ PASS |
| Light Theme | border-ui | UI Border on Background | `border (#E3E3DE) on bg (#FAFAF9)` | 1.23:1 | 3:1 | ❌ FAIL |
| Light Theme | border-ui | UI Border on Surface | `border (#E3E3DE) on surface (#FFFFFF)` | 1.29:1 | 3:1 | ❌ FAIL |
| Light Theme | focus-ring | Focus Ring on Background | `focusRing (#E8890C) on bg (#FAFAF9)` | 2.51:1 | 3:1 | ❌ FAIL |
| Light Theme | focus-ring | Focus Ring on Surface | `focusRing (#E8890C) on surface (#FFFFFF)` | 2.62:1 | 3:1 | ❌ FAIL |

## 4. Automated Axe Accessibility Rules Compliance

Automated structural accessibility audit across workspace templates:
1. **Heading Hierarchy (WCAG 1.3.1):** All workspaces feature a single `<h1>` title inside `WorkspaceHeader.tsx`, followed by clean `<h2>` section headings. PASS.
2. **Form Labels & Inputs (WCAG 3.3.2, 4.1.2):** All interactive inputs and select boxes feature explicit `<label>` association or `aria-label` attributes. PASS.
3. **Button Accessible Names (WCAG 4.1.2):** Icon-only buttons (copy buttons, window controls, theme toggle) include descriptive `aria-label` or `title` tooltips. PASS.
4. **Keyboard Focus Rings (WCAG 2.4.7):** Explicit `:focus-visible` outline and box-shadow (`--focus-ring`) styled in `src/styles/global.css` at 2px. PASS.
5. **Color-Blindness & Non-Color Dependence (WCAG 1.4.1):** Status indicators combine color with text labels or iconography (e.g. checkmark, warning triangle, cross icon). PASS.
