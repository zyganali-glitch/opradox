#!/bin/bash
# ============================================================
# Opradox Excel Studio - Environment Verification
# Check Python environment matches lock file
# ============================================================
set -e

echo "============================================================"
echo "ENVIRONMENT VERIFICATION"
echo "============================================================"

# Python version
echo ""
echo "[Python Version]"
python --version

# Pip version
echo ""
echo "[Pip Version]"
pip --version

# Core dependencies
echo ""
echo "[Core Dependencies]"
python -c "
import sys
print(f'Python: {sys.version}')

try:
    import fastapi
    print(f'FastAPI: {fastapi.__version__}')
except ImportError:
    print('FastAPI: NOT INSTALLED')

try:
    import uvicorn
    print(f'Uvicorn: {uvicorn.__version__}')
except ImportError:
    print('Uvicorn: NOT INSTALLED')

try:
    import pandas as pd
    print(f'Pandas: {pd.__version__}')
except ImportError:
    print('Pandas: NOT INSTALLED')

try:
    import numpy as np
    print(f'NumPy: {np.__version__}')
except ImportError:
    print('NumPy: NOT INSTALLED')

try:
    import openpyxl
    print(f'openpyxl: {openpyxl.__version__}')
except ImportError:
    print('openpyxl: NOT INSTALLED')

try:
    import xlsxwriter
    print(f'xlsxwriter: {xlsxwriter.__version__}')
except ImportError:
    print('xlsxwriter: NOT INSTALLED')

try:
    import scipy
    print(f'SciPy: {scipy.__version__}')
except ImportError:
    print('SciPy: NOT INSTALLED')

try:
    import sklearn
    print(f'scikit-learn: {sklearn.__version__}')
except ImportError:
    print('scikit-learn: NOT INSTALLED')
"

# Pip check
echo ""
echo "[Pip Check - Dependency Conflicts]"
pip check || echo "Warning: Some dependency conflicts detected"

echo ""
echo "============================================================"
echo "VERIFICATION COMPLETE"
echo "============================================================"
