# Fix admin.js API_ROOT
import os

admin_js_path = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\frontend\js\admin.js"

with open(admin_js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the API_ROOT line
old_line = "const API_ROOT = window.location.origin;"
new_lines = """// API root - development: localhost:8100, production: window.location.origin
const API_ROOT = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8100'
    : window.location.origin;"""

content = content.replace(old_line, new_lines)

with open(admin_js_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("admin.js API_ROOT fixed!")
