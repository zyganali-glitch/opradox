
import requests

def test_admin_api():
    base_url = "http://localhost:8100"
    
    # Login
    print("Trying to login...")
    try:
        r = requests.post(f"{base_url}/auth/login", data={'username': 'admin', 'password': 'opradox2024'})
        r.raise_for_status()
        data = r.json()
        token = data['access_token']
        print(f"Login successful. Token starts with: {token[:10]}...")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    # Check Stats
    print("\nChecking stats...")
    try:
        r = requests.get(f"{base_url}/admin/stats", headers={'Authorization': f'Bearer {token}'})
        r.raise_for_status()
        print("Stats:", r.json())
    except Exception as e:
        print(f"Stats failed: {e}")

    # Check Feedback List
    print("\nChecking feedback list...")
    try:
        r = requests.get(f"{base_url}/admin/feedback", headers={'Authorization': f'Bearer {token}'})
        r.raise_for_status()
        items = r.json()
        print(f"Feedback list items: {len(items)}")
        for item in items[:5]:
            print(f"- {item['id']}: {item['message']}")
    except Exception as e:
        print(f"Feedback list failed: {e}")

if __name__ == "__main__":
    test_admin_api()
