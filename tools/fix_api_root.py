# Fix login.html and admin.js to use same origin
import os

# Fix login.html
login_html_path = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\frontend\login.html"

with open(login_html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace API_ROOT logic to use window.location.origin when on same port as backend
old_api_root = """        // API root - development: localhost:8100, production: window.location.origin
        const API_ROOT = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://127.0.0.1:8100'
            : window.location.origin;"""

new_api_root = """        // API root - use same origin when running from backend server
        const API_ROOT = window.location.origin;"""

content = content.replace(old_api_root, new_api_root)

with open(login_html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("login.html fixed!")

# Fix admin.js
admin_js_path = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\frontend\js\admin.js"

with open(admin_js_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_admin_api = """// API root - development: localhost:8100, production: window.location.origin
const API_ROOT = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8100'
    : window.location.origin;"""

new_admin_api = """// API root - use same origin
const API_ROOT = window.location.origin;"""

content = content.replace(old_admin_api, new_admin_api)

with open(admin_js_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("admin.js fixed!")
print("Both files now use window.location.origin")
