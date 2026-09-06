import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:5043/api"
session = requests.Session()

# 1. Login with test account (Owner)
login_res = session.post(f"{BASE_URL}/auth/login", json={
    "email": "test@gmail.com",
    "password": "12345678"
})
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
token = login_res.json()["accessToken"]
headers = {"Authorization": f"Bearer {token}"}

print("=== 1. TEST GET PUBLIC FONTS (DESIGNER DROPDOWN) ===")
r_fonts = session.get(f"{BASE_URL}/fonts")
print("Public Fonts Status:", r_fonts.status_code)
assert r_fonts.status_code == 200
fonts_data = r_fonts.json()
print("Font Groups Count:", len(fonts_data["groups"]))
for g in fonts_data["groups"]:
    print(f"  - Nhóm [{g['label']}]: {len(g['fonts'])} fonts ({', '.join(f['label'] for f in g['fonts'])})")

print("\n=== 2. TEST GET ADMIN FONTS LIST ===")
r_admin_fonts = session.get(f"{BASE_URL}/admin/fonts", headers=headers)
print("Admin Fonts Status:", r_admin_fonts.status_code)
assert r_admin_fonts.status_code == 200
admin_fonts = r_admin_fonts.json()
print(f"Total Admin Fonts: {len(admin_fonts)}")
assert len(admin_fonts) >= 7

print("\n=== 3. TEST CREATE NEW FONT ===")
new_font_payload = {
    "name": "Open Sans",
    "familyCss": "Open Sans",
    "source": "Google",
    "groupLabel": "Google Fonts",
    "supportsVietnamese": True,
    "weights": "300,400,600,700",
    "note": "Phông chữ sans-serif thân thiện và hiện đại"
}
r_create_font = session.post(f"{BASE_URL}/admin/fonts", headers=headers, json=new_font_payload)
print("Create Font Status:", r_create_font.status_code)
assert r_create_font.status_code == 200
created_font = r_create_font.json()
font_id = created_font["id"]
print(f"Created Font: [{font_id}] {created_font['name']} (Active: {created_font['isActive']})")

print("\n=== 4. TEST TOGGLE FONT ACTIVE ===")
r_toggle = session.put(f"{BASE_URL}/admin/fonts/{font_id}/active", headers=headers, json={"isActive": False})
print("Toggle Active Status:", r_toggle.status_code)
assert r_toggle.status_code == 200
print("Toggle Result:", r_toggle.json())

print("\n=== 5. TEST GET FONT CORPUS (FOR OCR) ===")
r_corpus = session.get(f"{BASE_URL}/admin/fonts/corpus")
print("Corpus Status:", r_corpus.status_code)
assert r_corpus.status_code == 200
print("Corpus Items Count:", len(r_corpus.json()))

print("\n=== 6. TEST FONT RECOGNITION (OCR) ===")
r_rec = session.post(f"{BASE_URL}/admin/fonts/recognize", json={"imageUrl": "https://example.com/label.jpg"})
print("Recognize Status:", r_rec.status_code)
assert r_rec.status_code == 200
print("Recognize Result:", r_rec.json())

print("\n=== 7. TEST BATCH IMPORT FONTS ===")
import_payload = {
    "items": [
        {"family": "Oswald", "groupLabel": "Google Fonts", "supportsVietnamese": True},
        {"family": "Lora", "groupLabel": "Serif Fonts", "supportsVietnamese": True}
    ]
}
r_import = session.post(f"{BASE_URL}/admin/fonts/import", headers=headers, json=import_payload)
print("Import Status:", r_import.status_code)
assert r_import.status_code == 200
print("Import Result:", r_import.json())

print("\n>>> ALL PHASE 6 TESTS PASSED PERFECTLY! <<<")
