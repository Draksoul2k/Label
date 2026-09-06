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
os.makedirs(frontend_dir, exist_ok=True)

print("=== 1. DOWNLOADING EXACT INDEX.HTML ===")
r_index = session.get('https://vnlabel.vn/dashboard')
with open(os.path.join(frontend_dir, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(r_index.text)
print("Saved index.html")

# Find all assets linked in HTML
scripts = re.findall(r'src=["\']([^"\']+)["\']', r_index.text)
links = re.findall(r'href=["\']([^"\']+)["\']', r_index.text)
all_assets = set()

for s in scripts:
    if not s.startswith('http'): all_assets.add(s.lstrip('/'))

for l in links:
    if not l.startswith('http') and l != '/' and not l.startswith('#'):
        all_assets.add(l.lstrip('/'))

# Add all known chunks from scratch directory
scratch_chunks_dir = r'C:\Users\DarkSouls\.gemini\antigravity\brain\d989eee0-019f-4add-8517-5279e85bdf52\scratch\chunks'
if os.path.exists(scratch_chunks_dir):
    for f in os.listdir(scratch_chunks_dir):
        all_assets.add(f)

print(f"Total initial assets to download: {len(all_assets)}")

downloaded = set()
to_download = list(all_assets)

while to_download:
    asset = to_download.pop(0)
    if asset in downloaded: continue
    downloaded.add(asset)

    dest_path = os.path.join(frontend_dir, asset.replace('/', os.sep))
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    url = f"https://vnlabel.vn/{asset}"
    try:
        r = session.get(url)
        if r.status_code == 200:
            with open(dest_path, 'wb') as f:
                f.write(r.content)
            print(f"Downloaded: {asset} ({len(r.content)} bytes)")

            # If it's JS or CSS, find any more chunk-*.js or assets
            if asset.endswith('.js') or asset.endswith('.css'):
                text = r.text
                new_chunks = set(re.findall(r'chunk-[A-Za-z0-9_\-]+\.js', text))
                new_assets = set(re.findall(r'assets/[a-zA-Z0-9_\-./]+', text))
                for nc in new_chunks | new_assets:
                    if nc not in downloaded and nc not in to_download:
                        to_download.append(nc)
        else:
            print(f"Failed ({r.status_code}): {url}")
    except Exception as e:
        print(f"Error downloading {url}: {e}")

print(f"\nDownloaded total {len(downloaded)} assets.")

# Patch chunk-JAIA4NYE.js to point to local API /api
target_chunk = os.path.join(frontend_dir, 'chunk-JAIA4NYE.js')
if os.path.exists(target_chunk):
    with open(target_chunk, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'https://api.vnlabel.vn/api' in content:
        # Replace apiUrl with relative /api or http://localhost:5043/api
        patched = content.replace('https://api.vnlabel.vn/api', '/api')
        with open(target_chunk, 'w', encoding='utf-8') as f:
            f.write(patched)
        print("--> SUCCESS: Patched chunk-JAIA4NYE.js to route API calls to local backend (/api)!")
    else:
        print("Notice: 'https://api.vnlabel.vn/api' not found or already patched.")
