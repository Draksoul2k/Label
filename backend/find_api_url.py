import os
import re

chunks_dir = r'C:\Users\DarkSouls\.gemini\antigravity\brain\d989eee0-019f-4add-8517-5279e85bdf52\scratch\chunks'

for fname in os.listdir(chunks_dir):
    fpath = os.path.join(chunks_dir, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()
    if 'api.vnlabel.vn' in c:
        print(f"Found 'api.vnlabel.vn' in {fname}:")
        for m in re.finditer(r'.{0,80}api\.vnlabel\.vn.{0,80}', c):
            print("  ", m.group(0))
