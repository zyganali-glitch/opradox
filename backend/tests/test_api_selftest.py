"""
API Selftest Tests - /selftest endpoint sözleşme testleri
"""
import pytest
import sys
import os
from pathlib import Path
from fastapi.testclient import TestClient

# Backend app modülünü import edebilmek için path ekle
sys.path.insert(0, str(Path(__file__).parent.parent))

# Test token ayarla
TEST_TOKEN = "test_selftest_token_12345"
os.environ["SELFTEST_TOKEN"] = TEST_TOKEN

from app.main import app

client = TestClient(app)


def test_selftest_run_without_token_returns_403():
    """Token olmadan 403 dönmeli"""
    response = client.get("/selftest/run")
    assert response.status_code == 403


def test_selftest_run_with_wrong_token_returns_403():
    """Yanlış token ile 403 dönmeli"""
    response = client.get(
        "/selftest/run",
        headers={"X-SELFTEST-TOKEN": "wrong_token"}
    )
    assert response.status_code == 403


def test_selftest_run_quick_with_valid_token():
    """Doğru token ile quick mode çalışmalı"""
    response = client.get(
        "/selftest/run?mode=quick",
        headers={"X-SELFTEST-TOKEN": TEST_TOKEN}
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
    assert data["mode"] == "quick"
    assert "checks" in data
    assert "summary" in data
    assert "ts_utc" in data
    assert "duration_ms" in data


def test_selftest_run_full_with_valid_token():
    """Doğru token ile full mode çalışmalı"""
    response = client.get(
        "/selftest/run?mode=full",
        headers={"X-SELFTEST-TOKEN": TEST_TOKEN}
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["mode"] == "full"
    # Full modda daha fazla check
    assert len(data["checks"]) >= 7


def test_selftest_run_invalid_mode_returns_400():
    """Geçersiz mode ile 400 dönmeli"""
    response = client.get(
        "/selftest/run?mode=invalid",
        headers={"X-SELFTEST-TOKEN": TEST_TOKEN}
    )
    assert response.status_code == 400


def test_selftest_last_returns_cached_result():
    """Son sonuç cache'den dönmeli"""
    # Önce bir selftest çalıştır
    client.get(
        "/selftest/run?mode=quick",
        headers={"X-SELFTEST-TOKEN": TEST_TOKEN}
    )
    
    # Sonra /last ile al
    response = client.get(
        "/selftest/last",
        headers={"X-SELFTEST-TOKEN": TEST_TOKEN}
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
    assert "checks" in data
