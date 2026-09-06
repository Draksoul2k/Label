import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:5043/api"
session = requests.Session()

# 1. Login to get token
login_res = session.post(f"{BASE_URL}/auth/login", json={
    "email": "test@gmail.com",
    "password": "12345678"
})
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
token = login_res.json()["accessToken"]
headers = {"Authorization": f"Bearer {token}"}

print("=== 1. TEST CREATE CATEGORY ===")
import time
cat_name = f"Thời Trang Nam {int(time.time())}"
r_cat = session.post(f"{BASE_URL}/categories", headers=headers, json={"name": cat_name})
print("Create Cat Status:", r_cat.status_code)
assert r_cat.status_code == 200
cat_id = r_cat.json()["id"]

print("\n=== 2. TEST GET CATEGORIES ===")
r_cats = session.get(f"{BASE_URL}/categories", headers=headers)
print("Categories:", r_cats.json())
assert len(r_cats.json()) >= 1

print("\n=== 3. TEST CREATE BARCODE ===")
ts = int(time.time())
r_bc = session.post(f"{BASE_URL}/barcodes", headers=headers, json={
    "sku": f"SP-POLO-{ts}",
    "name": "Áo Polo Nam Classic",
    "barcodeType": "Code128",
    "price": 250000,
    "description": "Áo polo chất liệu cotton cao cấp",
    "categoryId": cat_id
})
print("Create Barcode Status:", r_bc.status_code)
if r_bc.status_code != 201:
    print("Error:", r_bc.text)
assert r_bc.status_code == 201
bc_data = r_bc.json()
bc_id = bc_data["id"]
print("Created Barcode:", bc_data["sku"], "-", bc_data["name"])

print("\n=== 4. TEST RENDER BARCODE SVG ===")
r_render = session.get(f"{BASE_URL}/barcodes/{bc_id}/render")
print("Render Status:", r_render.status_code)
print("Content-Type:", r_render.headers.get("Content-Type"))
assert r_render.status_code == 200
assert "<svg" in r_render.text
print("Rendered SVG size:", len(r_render.text), "bytes")

print("\n=== 5. TEST BULK IMPORT VIA CSV ===")
csv_sample = f"""SKU,Name,Price,Category
SP-JEAN-{ts},Quần Jean Slimfit,450000,Quần Nam
SP-SHIRT-{ts},Áo Sơ Mi Trắng,320000,Áo Sơ Mi
SP-JACKET-{ts},Áo Khoác Bomber,590000,Áo Khoác
"""
r_bulk = session.post(f"{BASE_URL}/barcodes/bulk-import", headers=headers, json={"csvContent": csv_sample})
print("Bulk Import Status:", r_bulk.status_code)
print("Bulk Result:", r_bulk.json())
assert r_bulk.status_code == 200
assert r_bulk.json()["successCount"] == 3

print("\n=== 6. TEST GET BARCODES PAGED LIST ===")
r_list = session.get(f"{BASE_URL}/barcodes", headers=headers)
print("Total Barcodes:", r_list.json()["totalCount"])
assert r_list.json()["totalCount"] >= 4

print("\n=== 7. TEST EXPORT BARCODES CSV ===")
r_export = session.get(f"{BASE_URL}/barcodes/export", headers=headers)
print("Export Status:", r_export.status_code)
print("CSV Export Content Snippet:\n" + r_export.text[:200].strip())
assert r_export.status_code == 200
assert f"SP-POLO-{ts}" in r_export.text

print("\n>>> ALL PHASE 3 TESTS PASSED PERFECTLY! <<<")
