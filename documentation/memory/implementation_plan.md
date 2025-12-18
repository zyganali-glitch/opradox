# Implementation Plan - Fix scenarios_catalog.json

The `scenarios_catalog.json` file contains a properly terminated JSON array, but the last item (`zscore-standardization`) has malformed `help_tr` and `help_en` fields. Specifically:
- `help_tr` contains English content (`what_is_en`, etc.) mixed in.
- `help_en` contains Turkish content (`what_is_tr`, etc.) mixed in.
- There are duplicate keys and incorrect nesting.

I will clean up this item to adhere to the schema seen in previous items.

## User Review Required
> [!IMPORTANT]
> Please confirm if this was the last item we were working on. If you intended to add *another* scenario after this, please let me know.

## Proposed Changes

### Backend
#### [MODIFY] [scenarios_catalog.json](file:///C:/Users/ASUS%206410/.gemini/antigravity/scratch/opradox/backend/config/scenarios_catalog.json)
- In the `zscore-standardization` object:
    - Clean `help_tr` to only contain TR keys.
    - Clean `help_en` to only contain EN keys.
    - Ensure no duplicate content.

## Verification Plan

### Automated Tests
- I will verify the JSON syntax by parsing it with a simple Python script to ensure it is valid JSON.
- I will visually inspect the file content using `view_file` to confirm the structure looks correct.
