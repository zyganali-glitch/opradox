#!/usr/bin/env python3
"""
Opradox Visual Studio - Deployment Verification Script
Tests that the frontend and backend are properly configured and running.

Usage:
    python deployment_check.py [--host HOST] [--port PORT]

Default:
    python deployment_check.py --host localhost --port 8100
"""

import sys
import argparse
import time

try:
    import requests
except ImportError:
    print("❌ 'requests' module not found. Install with: pip install requests")
    sys.exit(1)


def check_endpoint(url: str, name: str) -> bool:
    """Check if an endpoint returns 200 OK."""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            print(f"✅ {name}: OK (200)")
            return True
        else:
            print(f"❌ {name}: FAILED ({response.status_code})")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: CONNECTION ERROR - Server not running?")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ {name}: TIMEOUT")
        return False
    except Exception as e:
        print(f"❌ {name}: ERROR - {str(e)}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Opradox Deployment Verification')
    parser.add_argument('--host', default='localhost', help='Server host (default: localhost)')
    parser.add_argument('--port', default='8100', help='Server port (default: 8100)')
    args = parser.parse_args()

    base_url = f"http://{args.host}:{args.port}"
    
    print("=" * 60)
    print("🚀 OPRADOX VISUAL STUDIO - DEPLOYMENT CHECK")
    print("=" * 60)
    print(f"📡 Target: {base_url}")
    print("-" * 60)
    
    results = []
    
    # 1. Check main HTML page
    print("\n📄 [1/6] Checking viz.html...")
    results.append(check_endpoint(f"{base_url}/viz.html", "viz.html"))
    
    # 2. Check core module
    print("\n📦 [2/6] Checking Core Module (viz-state.js)...")
    results.append(check_endpoint(f"{base_url}/js/viz/core/viz-state.js", "viz-state.js"))
    
    # 3. Check statistics module
    print("\n📊 [3/6] Checking Statistics Module (viz-stats-spss.js)...")
    results.append(check_endpoint(f"{base_url}/js/viz/statistics/viz-stats-spss.js", "viz-stats-spss.js"))
    
    # 4. Check charts module
    print("\n📈 [4/6] Checking Charts Module (viz-charts-advanced.js)...")
    results.append(check_endpoint(f"{base_url}/js/viz/charts/viz-charts-advanced.js", "viz-charts-advanced.js"))
    
    # 5. Check PWA module
    print("\n📱 [5/6] Checking PWA Module (viz-pwa.js)...")
    results.append(check_endpoint(f"{base_url}/js/viz/offline/viz-pwa.js", "viz-pwa.js"))
    
    # 6. Check Backend API (optional)
    print("\n🔌 [6/6] Checking Backend API...")
    api_result = check_endpoint(f"{base_url}/api/test", "Backend API /api/test")
    if not api_result:
        # Try alternative endpoints
        api_result = check_endpoint(f"{base_url}/viz/ping", "Backend /viz/ping")
    results.append(api_result)
    
    # Summary
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"🎉 DEPLOYMENT STATUS: ✅ ALL CHECKS PASSED ({passed}/{total})")
        print("=" * 60)
        print("\n🌐 System is LIVE. Open in browser:")
        print(f"   {base_url}/viz.html")
        return 0
    else:
        print(f"⚠️  DEPLOYMENT STATUS: ❌ SOME CHECKS FAILED ({passed}/{total})")
        print("=" * 60)
        print("\n🔧 Troubleshooting:")
        print("   1. Is the backend server running? (uvicorn main:app --port 8100)")
        print("   2. Are static files being served correctly?")
        print("   3. Check firewall/port settings.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
