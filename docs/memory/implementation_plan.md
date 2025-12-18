# Implementation Plan - Refine and Fix Scenarios

**Goal:** Address user feedback regarding scenario categorization, missing metadata, UI rendering (tables), and placeholder functionality.

## User Review Required
> [!NOTE]
> This plan directly addresses the 4 points raised in the feedback.

## Proposed Changes

### 1. Catalog & Metadata (`backend/config/scenarios_catalog.json`)
- **Categorization:**
    - Move `frequency_table-*` scenarios from `other` to `counting_frequency`.
    - Move `sum_multi` and `sum_between_dates` (if in other) to `conditional_aggregation` or `reporting_pivot`.
    - Ensure `other` category is empty or removed.
- **Descriptions:**
    - Replace generic "Otomatik analiz edilen senaryo" texts with specific, action-oriented descriptions for all affected scenarios.
- **Missing Data:**
    - Audit `average-ifs` and others for missing `params` or `help_tr` fields and populate them.

### 2. UI Improvements
- **Layout (`frontend/css/style.css`):**
    - Adjust grid columns: Decrease `middle-pane` width, Increase `right-pane` (Help) width.
- **Markdown Rendering (`frontend/js/app.js`):**
    - Implement a lightweight Markdown Table parser in `loadScenarioHelp`.
    - Detect `| Header |` syntax and convert to `<table class="gm-table">`.
    - Add CSS for `.gm-table`.

### 3. Backend Logic (`backend/app/scenarios/*.py`)
- **Implement Stubs:**
    - Check `basic_summary_stats_column.py`. Currently, it likely returns a static JSON. Implement actual `pandas` logic: `df[col].describe()`.
    - Verify other scenarios moved from "Other" to ensure they have logic, not just placeholders.

## Feature: "Oyun Hamuru" (Dynamic Report Builder)
This feature allows users to build custom reports dynamically by adding filters, groupings, and columns on the fly.

### Frontend (`frontend/js/app.js` & `style.css`)
- [ ] Implement a **Dynamic Parameter Builder** UI.
    - Support adding multiple rows of parameters (e.g., "Add Filter", "Add Sort").
    - Allow distinct types of dynamic blocks (Filter Block, Sort Block, Group Block).
- [ ] Update `renderDynamicForm` to handle a new parameter type: `json_builder`.

### Backend (`backend/app/scenarios/custom_report_builder.py`)
- [ ] Create a generic runner that accepts a complex JSON structure.
- [ ] Implement logic pipeline:
    1. **Select** (Columns)
    2. **Filter** (ConditionBuilder)
    3. **Group** (GroupBy + Aggregation)
    4. **Sort** (Multi-column)

## SEO & New Scenarios
Add high-volume search term scenarios to the catalog:
1. **VLOOKUP Assistant:** "Find values from another table" (already similar to Join/Lookup but refined title).
2. **Text to Date:** "Convert text to date format".
3. **Concatenate:** "Combine text from two columns".
4. **Clean Spaces:** "Trim extra spaces" (Enhanced version).
5. **Case Converter:** "UPPER, lower, Proper Case".

## Refinements
- [x] Fix `basic-summary-stats-column` (Completed).
- [x] Fix UI double bullets (Completed).
- [x] Fix English titles in TR mode (Completed).
- [x] Show Markdown & JSON results (Completed).

## Verification Plan

### Automated/Manual Tests
- [ ] **Catalog Check:** Verify "Other" category is gone in `http://localhost:8080`.
- [ ] **UI Check:** Select "Koşullu Ortalama". Verify the example table looks like a real HTML table, not raw text.
- [ ] **Functionality Check:** Run "Tek bir sütun için temel istatistik özeti oluştur" with a sample file. Verify it returns real stats (mean, min, max), not a "placeholder" message.
