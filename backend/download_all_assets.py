import requests
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
})

frontend_dir = r'D:\3. Dự Án lung tung\WEB LABEL\frontend'

# Find all assets references in JS and CSS
found_assets = set()
for root, dirs, files in os.walk(frontend_dir):
    for fname in files:
        if fname.endswith('.js') or fname.endswith('.css') or fname.endswith('.html'):
            fpath = os.path.join(root, fname)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                c = f.read()
            # Match assets/...
            matches = re.findall(r'["\'](assets/[^"\']+)["\']', c)
            for m in matches:
                found_assets.add(m.split('?')[0].split('#')[0])

print(f"Found {len(found_assets)} asset paths:")
for a in sorted(found_assets):
    print("  -", a)
    dest = os.path.join(frontend_dir, a.replace('/', os.sep))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        r = session.get(f"https://vnlabel.vn/{a}")
        if r.status_code == 200:
            with open(dest, 'wb') as f:
                f.write(r.content)
            print(f"    Downloaded ({len(r.content)} bytes)")
        else:
            print(f"    Failed ({r.status_code})")
    except Exception as e:
        print(f"    Error: {e}")
