"""
Scenario Minimal Tests - Selftest runner ile senaryo smoke testleri
"""
import pytest
import sys
from pathlib import Path

# Backend app modülünü import edebilmek için path ekle
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_selftest_quick_passes():
    """Quick mode selftest PASS döndürmeli"""
    from app.selftest_runner import run_selftest
    
    result = run_selftest(mode="quick")
    
    assert result["status"] == "PASS", f"Selftest failed: {result}"
    assert result["mode"] == "quick"
    assert "checks" in result
    assert "summary" in result
    assert result["summary"]["fail"] == 0


def test_selftest_full_passes():
    """Full mode selftest PASS döndürmeli"""
    from app.selftest_runner import run_selftest
    
    result = run_selftest(mode="full")
    
    assert result["status"] == "PASS", f"Selftest failed: {result}"
    assert result["mode"] == "full"
    # Full modda daha fazla check olmalı
    assert len(result["checks"]) >= 7  # 4 import + 2 df + min 1 scenario


def test_selftest_timing():
    """Selftest 5 saniyeden az sürmeli"""
    from app.selftest_runner import run_selftest
    
    result = run_selftest(mode="full")
    
    assert result["duration_ms"] < 5000, f"Too slow: {result['duration_ms']}ms"
