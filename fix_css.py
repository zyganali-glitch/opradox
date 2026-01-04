import re

with open('frontend/css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# The second .viz-toast block needs height: auto and max-height
# Current pattern around line 12843:
# .viz-toast {
#     position: fixed;
#     top: auto;
#     bottom: 20px;
#     right: 20px;
#     min-width: 280px;
#     max-width: 400px;

# Add height: auto !important after max-width
old_pattern = '''    max-width: 400px;
    padding: 14px 20px;'''

new_pattern = '''    max-width: 400px;
    height: auto !important;
    max-height: 15vh;
    padding: 14px 20px;'''

content = content.replace(old_pattern, new_pattern, 1)

with open('frontend/css/style.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('CSS height constraint added')
