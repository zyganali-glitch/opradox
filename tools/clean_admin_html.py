# Fix admin.html layout
import re

html_path = r"C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\frontend\admin.html"

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Regular expression to clean bad lines like "100: " or "101: <div..."
# Pattern: newline followed by spaces, then digits, then colon, then maybe spaces
content = re.sub(r'^\s*\d+:\s*', '', content, flags=re.MULTILINE)

# Also fix specific lines if regex misses
content = content.replace('100:', '')
content = content.replace('101: <!--', '<!--')
content = content.replace('102: <div', '<div')
content = content.replace('103: <a', '<a')
content = content.replace('104: <div', '<div')
content = content.replace('105: <i', '<i')
content = content.replace('106: <div', '<div')
content = content.replace('107: <h3', '<h3')
content = content.replace('108: <p', '<p')
content = content.replace('109: </div', '</div')
content = content.replace('110: </div', '</div')
content = content.replace('111: <i', '<i')
content = content.replace('112: </a', '</a')
content = content.replace('113: </div', '</div')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("admin.html cleaned!")
