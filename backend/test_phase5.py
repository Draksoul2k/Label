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

# 2. Get a template and a barcode
templates = session.get(f"{BASE_URL}/label-templates/library").json()["items"]
template = templates[0]
tpl_id = template["id"]

barcodes = session.get(f"{BASE_URL}/barcodes", headers=headers).json()["items"]
if not barcodes:
    # create one if empty
    r_create = session.post(f"{BASE_URL}/barcodes", headers=headers, json={
        "sku": "SP-PRINT-001",
        "name": "Áo Thun In Thử Nghiệm",
        "price": 185000
    })
    barcode_id = r_create.json()["id"]
else:
    barcode_id = barcodes[0]["id"]

print(f"Using Template: {template['name']} ({template['widthMm']}x{template['heightMm']}mm)")
print(f"Using Barcode ID: {barcode_id}")

print("\n=== 1. TEST PRINT PREVIEW ===")
print_payload = {
    "templateId": tpl_id,
    "items": [
        {"barcodeId": barcode_id, "quantity": 2}
    ],
    "printerSettings": {
        "columns": 2,
        "rows": 1,
        "colGapMm": 2.0,
        "cutLine": False
    },
    "dpi": 203
}

r_prev = session.post(f"{BASE_URL}/print/preview", headers=headers, json=print_payload)
print("Preview Status:", r_prev.status_code)
assert r_prev.status_code == 200
prev_data = r_prev.json()
print(f"Preview Result: Total Labels = {prev_data['totalLabels']}, Total Pages = {prev_data['totalPages']}")
assert prev_data["totalLabels"] == 2

print("\n=== 2. TEST GENERATE ZPL (ZEBRA) ===")
r_zpl = session.post(f"{BASE_URL}/print/zpl", headers=headers, json=print_payload)
print("ZPL Status:", r_zpl.status_code)
assert r_zpl.status_code == 200
zpl_content = r_zpl.text
print(f"ZPL Size: {len(zpl_content)} characters")
print("ZPL Snippet:\n" + zpl_content[:300].strip())
assert "^XA" in zpl_content
assert "^XZ" in zpl_content

print("\n=== 3. TEST GENERATE WEB PRINT HTML ===")
r_html = session.post(f"{BASE_URL}/print/html", headers=headers, json=print_payload)
print("HTML Print Status:", r_html.status_code)
assert r_html.status_code == 200
assert "<!DOCTYPE html>" in r_html.text
assert "label-card" in r_html.text
print("HTML Size:", len(r_html.text), "characters")

print("\n=== 4. TEST GENERATE PDF VECTOR ===")
r_pdf = session.post(f"{BASE_URL}/print/pdf", headers=headers, json=print_payload)
print("PDF Status:", r_pdf.status_code)
print("Content-Type:", r_pdf.headers.get("Content-Type"))
assert r_pdf.status_code == 200
assert r_pdf.content.startswith(b"%PDF")
print("PDF Binary Size:", len(r_pdf.content), "bytes")

print("\n=== 5. TEST GET PRINT JOBS QUEUE ===")
r_jobs = session.get(f"{BASE_URL}/print-jobs", headers=headers)
print("Print Jobs Status:", r_jobs.status_code)
assert r_jobs.status_code == 200
print("Print Jobs Result:", r_jobs.json())

print("\n>>> ALL PHASE 5 TESTS PASSED PERFECTLY! <<<")
