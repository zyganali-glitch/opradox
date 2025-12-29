# Parity Restoration Implementation Plan

## Goal Description
Restore full functionality and parity between `viz_SOURCE.js` and the modular codebase, specifically focusing on the Statistics Widget Toolbar (APA, Formula, Copy) and removing "Stub" implementations for key charts and statistical functions.

## User Review Required
> [!IMPORTANT]
> `viz.html` will NOT be modified. All UI changes will be injected via `stats.js` `createStatWidget` function.

## Proposed Changes

### Logic & Stats (frontend/js/modules/stats.js)
#### [MODIFY] [stats.js](file:///c:/Users/ASUS%206410/.gemini/antigravity/scratch/opradox/frontend/js/modules/stats.js)
- **Functions to Add/Update:**
    - `createStatWidget`: Inject complete toolbar markup (APA toggle, Formula btn, Copy dropdown).
    - `toggleFormula`: Implement logic to show/hide formula panel.
    - `getFormulaForTest`: Return MathJax/HTML formulas for tests.
    - `copyStatAsHTML`, `copyStatAsImage`, `copyStatAsText`: Implement real clipboard logic using `navigator.clipboard` or fallback.
    - `calculateCorrelationMatrix`: Implement Pearson correlation logic (removes Adapter stub).
    - `calculateRegressionCoefficients`: Implement simple linear regression logic (removes Adapter stub).

### Adapters (frontend/js/adapters.js)
#### [MODIFY] [adapters.js](file:///c:/Users/ASUS%206410/.gemini/antigravity/scratch/opradox/frontend/js/adapters.js)
- **Stub Removal:**
    - Remove `window.calculateCorrelationMatrix = ... || function() { return [] };`
    - Remove `window.calculateRegressionCoefficients = ... || function() { return {} };`
- **Chart Aliasing:**
    - Change `renderViolinPlot` alias from `showToast` to `window.addChart('violin')`.
    - Change `renderSparkline` alias from `showToast` to `window.addChart('line')`.

### Verification (frontend/js/selftest.js)
#### [NEW] [selftest.js](file:///c:/Users/ASUS%206410/.gemini/antigravity/scratch/opradox/frontend/js/selftest.js)
- Add automated checks:
    - Verify `window.toggleFormula` exists.
    - Verify `window.copyStatAsHTML` exists.
    - Verify `calculateCorrelationMatrix` returns non-empty array for dummy data.
    - Verify `renderViolinPlot` calls `addChart` (mocked).

## Verification Plan

### Automated Tests
1. **Run Self-Test:**
   - Execute `node frontend/js/selftest.js` (or via browser console if purely DOM dependent).
   - Check for "PASS" on all parity checks.

### Manual Verification
1. **Toolbar Check:**
   - Open Viz.
   - Create any stat widget.
   - Click "fx" button -> Formula panel should appear.
   - Click "APA" button -> Font style should change.
2. **Copy Check:**
   - Select "Copy as Text".
   - Paste into Notepad -> Should see formatted text.
3. **Legacy Chart Check:**
   - Open Console.
   - Run `renderViolinPlot()`.
   - Verify a new chart widget appears (or error related to missing data, but NOT the "geliştirilmekte" toast).
