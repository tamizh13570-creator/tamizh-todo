import re

html_path = r'd:\TODO\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract <style>...</style>
style_pattern = re.compile(r'<style>([\s\S]*?)<\/style>')
style_match = style_pattern.search(content)

if style_match:
    css_content = style_match.group(1).strip()
    with open(r'd:\TODO\styles.css', 'w', encoding='utf-8') as f:
        f.write(css_content)
    content = content[:style_match.start()] + '<link rel="stylesheet" href="styles.css">' + content[style_match.end():]

# Extract main <script>...</script>
script_pattern = re.compile(r'<script>([\s\S]*?)<\/script>')
# We might have multiple script tags, some might be empty or small, but usually one big one.
# Let's find all script tags without src, and pick the longest one.
matches = list(script_pattern.finditer(content))
if matches:
    longest_match = max(matches, key=lambda m: len(m.group(1)))
    js_content = longest_match.group(1).strip()
    with open(r'd:\TODO\script.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    content = content[:longest_match.start()] + '<script src="script.js"></script>' + content[longest_match.end():]

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Extraction complete.")
