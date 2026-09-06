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

print("=== 1. TEST GET PLANS & 17 FEATURE FLAGS ===")
r_plans = session.get(f"{BASE_URL}/subscriptions/plans")
print("Plans Status:", r_plans.status_code)
assert r_plans.status_code == 200
plans = r_plans.json()
print("Total Plans:", len(plans))
for p in plans:
    print(f"  - Plan '{p['key']}': {p['name']} | Monthly: {p['priceMonthly']:,} đ | Flags: {len(p['featureFlags'])} flags")
    assert len(p["featureFlags"]) == 17

print("\n=== 2. TEST GET TERMS & PRICING CYCLES ===")
r_terms = session.get(f"{BASE_URL}/subscriptions/terms")
print("Terms Status:", r_terms.status_code)
assert r_terms.status_code == 200
terms = r_terms.json()
print("Terms:", [f"{t['name']} ({t['months']}m)" for t in terms])
assert len(terms) == 3

print("\n=== 3. TEST GET SUPPORT CONTACT ===")
r_contact = session.get(f"{BASE_URL}/subscriptions/contact")
print("Contact Status:", r_contact.status_code)
assert r_contact.status_code == 200
contact = r_contact.json()
print(f"Hotline: {contact['hotline']} | Zalo: {contact['zaloOaName']} | Email: {contact['email']}")
assert contact["hotline"] == "0901555547"

print("\n=== 4. TEST GET CURRENT SUBSCRIPTION ===")
r_cur = session.get(f"{BASE_URL}/subscriptions/current", headers=headers)
print("Current Sub Status:", r_cur.status_code)
assert r_cur.status_code == 200
cur_sub = r_cur.json()
print(f"Active Plan: {cur_sub['planName']} | Status: {cur_sub['status']} | Term: {cur_sub['termName']}")
assert cur_sub["plan"].lower() == "free"

print("\n=== 5. TEST CREATE SUBSCRIPTION UPGRADE REQUEST ===")
req_payload = {
    "plan": "pro",
    "cycle": "year",
    "contactName": "Nguyễn Xuân Nam",
    "contactPhone": "0874845488",
    "note": "Nâng cấp gói Pro 1 năm để in tem không watermark"
}
r_req = session.post(f"{BASE_URL}/subscriptions/requests", headers=headers, json=req_payload)
print("Create Request Status:", r_req.status_code)
assert r_req.status_code == 200
req_data = r_req.json()
req_id = req_data["id"]
print(f"Created Request: [{req_id}] Plan: {req_data['plan']} | Status: {req_data['status']}")

print("\n=== 6. TEST GET MY SUBSCRIPTION REQUESTS ===")
r_my_reqs = session.get(f"{BASE_URL}/subscriptions/requests", headers=headers)
print("My Requests Count:", len(r_my_reqs.json()))
assert len(r_my_reqs.json()) >= 1

print("\n=== 7. TEST GET DASHBOARD OVERVIEW ===")
r_dash = session.get(f"{BASE_URL}/dashboard/overview", headers=headers)
print("Dashboard Status:", r_dash.status_code)
assert r_dash.status_code == 200
dash = r_dash.json()
print(f"Dashboard: Plan = {dash['planName']} | Barcode Limit = {dash['barcodeLimit']} | Products = {dash['productCount']} | Members = {dash['memberCount']}")
assert dash["plan"].lower() == "free"
assert len(dash["features"]) == 17

print("\n>>> ALL PHASE 7 TESTS PASSED PERFECTLY! <<<")
