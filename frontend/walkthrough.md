# Parity Restoration Walkthrough

## Overview
This walkthrough confirms that the Statistics Widget Toolbar and Statistical Functions have been successfully ported from `viz_SOURCE.js` to the modular `stats.js` and `adapters.js` environment.

## 1. Verify Stats Toolbar (Görev A)
1.  **Open Opradox VIZ Studio**.
2.  **Load Data**: Import any CSV/Excel file.
3.  **Add Stat Widget**: Go to "Özet İstatistikler" > "Betimsel İstatistikler".
4.  **Check Toolbar**: Look at the top-right of the widget header. You should see:
    -   **APA Button**: Click it. Verify fonts change to Times New Roman.
    -   **fx Button**: Click it. Verify a formula panel indicating `Method: Descriptive Statistics` appears.
    -   **Copy Dropdown**: Hover/Click the copy icon. Verify "Word Tablosu", "Resim", "Düz Metin" options appear.

## 2. Verify Stub Removal (Görev B & C)
1.  **Open Console (F12)**.
2.  **Check Correlation**:
    ```javascript
    // Should return a matrix array, NOT an empty [] stub
    window.calculateCorrelationMatrix(['Column1', 'Column2']) 
    ```
3.  **Check Regression**:
    ```javascript
    // Should return coefficients object, NOT an empty {} stub
    window.calculateRegressionCoefficients('YColumn', ['XColumn'])
    ```

## 3. Verify Legacy Handlers (Görev D)
1.  **Run Legacy Chart Command**:
    ```javascript
    // Should trigger addChart flow (or error if no data), but NOT show "Geliştirilmekte" toast
    window.renderViolinPlot() 
    ```
2.  **Verify Toast**: You should NOT see the old "Violin plot - geliştirilmekte" message.

## 4. Automated Self-Test
1.  If enabled, the `selftest.js` will run automatically on load.
2.  Check the console for `[SELFTEST] Status: OK`.
3.  Ensure `criticalFunctions` count is mostly complete (e.g. 95%+).

## Changes Made
-   **`stats.js`**: `createStatWidget` updated with full HTML injection. Added `toggleFormula`, `copyStatAs*`, `calculate*(Math)`.
-   **`adapters.js`**: Removed empty stubs, re-routed legacy handlers to `addChart`.
-   **`selftest.js`**: Added checks for new parity functions.
