import io
import json
from fastapi.testclient import TestClient
from backend.app.main import app  # Adjust import if app entry point differs

client = TestClient(app)

# Helper to create a simple CSV file
def create_csv(content: str) -> bytes:
    return content.encode('utf-8')

# Sample data for tests
csv_content = """col1,col2,group
1,10,A
2,20,A
3,30,B
4,40,B
5,50,C
"""

def test_ttest_independent():
    files = {
        "file": ("test.csv", create_csv(csv_content), "text/csv")
    }
    data = {
        "value_column": "col2",
        "group_column": "group",
        "group1": "A",
        "group2": "B",
        "test_type": "independent"
    }
    response = client.post("/viz/ttest", files=files, data=data)
    assert response.status_code == 200
    result = response.json()
    # Verify key fields
    assert "t_statistic" in result
    assert "p_value" in result
    assert "groups" in result

def test_anova():
    files = {"file": ("test.csv", create_csv(csv_content), "text/csv")}
    data = {"value_column": "col2", "group_column": "group"}
    response = client.post("/viz/anova", files=files, data=data)
    assert response.status_code == 200
    result = response.json()
    assert "f_statistic" in result
    assert "p_value" in result
    assert "group_stats" in result

def test_chi_square():
    files = {"file": ("test.csv", create_csv(csv_content), "text/csv")}
    data = {"column1": "col1", "column2": "group"}
    response = client.post("/viz/chi-square", files=files, data=data)
    assert response.status_code == 200
    result = response.json()
    assert "chi2_statistic" in result
    assert "p_value" in result

# Additional tests can be added for other endpoints similarly
