# Parity Audit Remediation and Parity Restoration

## Phase 1: Conflict Detection and Stub Remediation
- [ ] **Detect Duplicates**: Scan for multiple `adapters.js` or `stats.js` files to ensure single source of truth. <!-- id: 0 -->
- [ ] **Fix `adapters.js` Stubs**: <!-- id: 1 -->
    - [ ] Remap `renderViolinPlot`, `renderSparkline`, etc. to `window.addChart`.
    - [ ] Ensure `calculateCorrelationMatrix` and `calculateRegressionCoefficients` are NOT stubbed (delegated to `stats.js`).
- [ ] **Fix `VirtualScrollTable`**: Ensure `init` and `render` methods in `adapters.js` (or sourced file) are functional, not empty stubs. <!-- id: 2 -->

## Phase 2: Stats Toolbar Parity (stats.js)
- [ ] **Implement `toggleFormula`**: Add formula panel toggle logic with collapsible UI. <!-- id: 3 -->
- [ ] **Implement Copy Functions**: <!-- id: 4 -->
    - [ ] `copyStatAsHTML` (Word compatible)
    - [ ] `copyStatAsText` (Plain text)
    - [ ] `copyStatAsImage` (Canvas export)
- [ ] **Update `createStatWidget`**: Inject the full toolbar HTML (APA, fx, Copy Dropdown) into the widget header. <!-- id: 5 -->
- [ ] **APA Mode**: Ensure `toggleStatMode` adds/removes APA styling class. <!-- id: 6 -->

## Phase 3: Engine Gaps & SPSS Quality
- [ ] **Audit Footer**: add `generateAuditNote` usage to all stat renderers (N, missing, engine info). <!-- id: 7 -->
- [ ] **Backend Fallback**: For missing local engines, ensure UI shows "Backend required" toast instead of silent failure. <!-- id: 8 -->

## Phase 4: Verification
- [ ] **Update `selftest.js`**: Add specific checks for `copyStatAs*`, `toggleFormula`, and stub removal. <!-- id: 9 -->
- [ ] **Manual Verification**: Verify widget toolbar buttons and export functionality. <!-- id: 10 -->
