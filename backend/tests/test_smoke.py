"""
Smoke Tests - Basic import and df operation tests
"""
import pytest


def test_import_pandas():
    """Pandas import edilebilmeli"""
    import pandas as pd
    assert pd.__version__


def test_import_numpy():
    """NumPy import edilebilmeli"""
    import numpy as np
    assert np.__version__


def test_import_openpyxl():
    """openpyxl import edilebilmeli"""
    import openpyxl
    assert openpyxl.__version__


def test_df_sum_mean():
    """DataFrame sum/mean işlemleri çalışmalı"""
    import pandas as pd
    df = pd.DataFrame({"a": [1, 2, 3, 4, 5], "b": [10, 20, 30, 40, 50]})
    assert df["a"].sum() == 15
    assert df["b"].mean() == 30.0


def test_df_groupby():
    """DataFrame groupby işlemi çalışmalı"""
    import pandas as pd
    df = pd.DataFrame({
        "category": ["A", "A", "B", "B"],
        "value": [10, 20, 30, 40]
    })
    grouped = df.groupby("category")["value"].sum()
    assert grouped["A"] == 30
    assert grouped["B"] == 70
