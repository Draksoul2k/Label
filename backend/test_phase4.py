import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:5043/api"
session = requests.Session()

# 1. Login
login_res = session.post(f"{BASE_URL}/auth/login", json={
    "email": "test@gmail.com",
    "password": "12345678"
})
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
token = login_res.json()["accessToken"]
headers = {"Authorization": f"Bearer {token}"}

print("=== 1. TEST GET SYSTEM TEMPLATES LIBRARY ===")
r_lib = session.get(f"{BASE_URL}/label-templates/library")
print("Library Status:", r_lib.status_code)
assert r_lib.status_code == 200
lib_data = r_lib.json()
print(f"Total Templates in Library: {lib_data['totalCount']}")
assert lib_data["totalCount"] == 24
first_tpl = lib_data["items"][0]
print(f"Sample Template: [{first_tpl['id']}] {first_tpl['name']} ({first_tpl['widthMm']}x{first_tpl['heightMm']}mm) - Cat: {first_tpl['category']}")

print("\n=== 2. TEST GET TEMPLATE CATEGORIES ===")
r_cats = session.get(f"{BASE_URL}/label-templates/categories")
print("Categories Status:", r_cats.status_code)
assert r_cats.status_code == 200
cats = r_cats.json()
print(f"Categories Count: {len(cats)}")
for c in cats[:5]:
    print(f"  - {c['name']} ({c['key']}): {c['count']} templates [Icon: {c['icon']}]")

print("\n=== 3. TEST COPY TEMPLATE FROM LIBRARY TO MINE ===")
r_copy = session.post(f"{BASE_URL}/label-templates/library/{first_tpl['id']}/copy", headers=headers, json={"name": "Tem của tôi từ thư viện"})
print("Copy Status:", r_copy.status_code)
assert r_copy.status_code == 200
copied_tpl = r_copy.json()
print(f"Copied Template: {copied_tpl['id']} - {copied_tpl['name']}")

print("\n=== 4. TEST SAVE CUSTOM TEMPLATE IN DESIGNER ===")
custom_elements = [
    {
        "id": "el-name",
        "type": "text",
        "x": 2.0, "y": 2.0, "width": 46.0, "height": 6.0,
        "text": "{{name}}",
        "fontFamily": "Arial", "fontSize": 8.0, "fontWeight": "bold",
        "textAlign": "left", "color": "#111827", "uppercase": True
    },
    {
        "id": "el-price",
        "type": "text",
        "x": 2.0, "y": 8.5, "width": 46.0, "height": 5.0,
        "text": "Giá: {{price}}",
        "fontFamily": "Arial", "fontSize": 7.5, "fontWeight": "bold",
        "color": "#dc2626"
    },
    {
        "id": "el-barcode",
        "type": "barcode",
        "x": 2.0, "y": 14.0, "width": 46.0, "height": 13.0,
        "value": "{{sku}}",
        "format": "CODE128", "barHeight": 9.0, "showText": True
    }
]

designer_payload = {
    "name": "Tem giá siêu thị 50x30 bo góc",
    "category": "price",
    "widthMm": 50.0,
    "heightMm": 30.0,
    "shape": "rounded",
    "background": "#ffffff",
    "elementsJson": json.dumps(custom_elements),
    "printSettingsJson": json.dumps({"columns": 2, "rows": 1, "colGapMm": 2.5, "cutLine": False})
}

r_designer = session.post(f"{BASE_URL}/label-templates/designer", headers=headers, json=designer_payload)
print("Designer Save Status:", r_designer.status_code)
assert r_designer.status_code == 200
saved_tpl = r_designer.json()
print(f"Saved Custom Template: [{saved_tpl['id']}] {saved_tpl['name']} ({saved_tpl['shape']})")

print("\n=== 5. TEST GET MY TEMPLATES LIST ===")
r_mine = session.get(f"{BASE_URL}/label-templates/mine", headers=headers)
print("Mine Templates Status:", r_mine.status_code)
assert r_mine.status_code == 200
mine_list = r_mine.json()
print(f"My Templates Count: {len(mine_list)}")
assert len(mine_list) == 2

print("\n=== 6. TEST DELETE TEMPLATE ===")
r_del = session.delete(f"{BASE_URL}/label-templates/{copied_tpl['id']}", headers=headers)
print("Delete Status:", r_del.status_code)
assert r_del.status_code == 200

r_mine_after = session.get(f"{BASE_URL}/label-templates/mine", headers=headers)
assert len(r_mine_after.json()) == 1
print("Remaining Mine Templates:", len(r_mine_after.json()))

print("\n>>> ALL PHASE 4 TESTS PASSED PERFECTLY! <<<")
