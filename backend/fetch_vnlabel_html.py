import requests
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
})

r = session.get('https://vnlabel.vn/dashboard')
print("=== HTML of https://vnlabel.vn/dashboard ===")
print(r.text)

# Find all scripts, links, images, fonts
scripts = re.findall(r'src=["\']([^"\']+)["\']', r.text)
links = re.findall(r'href=["\']([^"\']+)["\']', r.text)

print("Scripts:", scripts)
print("Links:", links)
