import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:5043/api"
session = requests.Session()

# 1. Login with Admin account
admin_res = session.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@vnlabel.vn",
    "password": "Admin@123456"
})
assert admin_res.status_code == 200, f"Admin Login failed: {admin_res.text}"
admin_token = admin_res.json()["accessToken"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}

print("=== 1. TEST GET SUPER ADMIN STATS ===")
r_stats = session.get(f"{BASE_URL}/admin/stats", headers=admin_headers)
print("Stats Status:", r_stats.status_code)
assert r_stats.status_code == 200
stats = r_stats.json()
print(f"Stats: Total Users = {stats['totalUsers']}, Orgs = {stats['totalOrganizations']}, Barcodes = {stats['totalBarcodes']}, Pending Requests = {stats['pendingRequests']}")

print("\n=== 2. TEST GET ADMIN SUBSCRIPTION REQUESTS ===")
r_reqs = session.get(f"{BASE_URL}/admin/subscription-requests", headers=admin_headers)
print("Requests Status:", r_reqs.status_code)
assert r_reqs.status_code == 200
requests_list = r_reqs.json()
pending_reqs = [r for r in requests_list if r["status"] == "Pending"]
print(f"Pending Requests Count: {len(pending_reqs)}")

if pending_reqs:
    target_req = pending_reqs[0]
    print(f"Approving Request: [{target_req['id']}] for Org: {target_req['orgName']} -> Plan: {target_req['plan']}")
    
    print("\n=== 3. TEST APPROVE SUBSCRIPTION UPGRADE REQUEST ===")
    r_appr = session.post(f"{BASE_URL}/admin/subscription-requests/{target_req['id']}/approve", headers=admin_headers, json={
        "cycle": "year",
        "note": "Đã nhận chuyển khoản qua Zalo. Kích hoạt gói Pro 1 năm!"
    })
    print("Approve Status:", r_appr.status_code)
    assert r_appr.status_code == 200
    print("Approve Result:", r_appr.json())

    # Verify user's subscription is now upgraded
    login_user = session.post(f"{BASE_URL}/auth/login", json={"email": "test@gmail.com", "password": "12345678"}).json()
    user_headers = {"Authorization": f"Bearer {login_user['accessToken']}"}
    r_user_sub = session.get(f"{BASE_URL}/subscriptions/current", headers=user_headers).json()
    print(f"User Sub After Approval: Plan = {r_user_sub['planName']}, Status = {r_user_sub['status']}, Amount = {r_user_sub['amount']:,} đ")
    assert r_user_sub["plan"].lower() == "pro"

print("\n=== 4. TEST ADMIN TEMPLATES ===")
r_admin_tpls = session.get(f"{BASE_URL}/admin/templates", headers=admin_headers)
print("Admin Templates Status:", r_admin_tpls.status_code)
assert r_admin_tpls.status_code == 200
print(f"Total Admin Templates: {len(r_admin_tpls.json())}")

print("\n=== 5. TEST SERVING FRONTEND SPA AT ROOT URL ===")
r_frontend = session.get("http://localhost:5043/")
print("Frontend Root Status:", r_frontend.status_code)
assert r_frontend.status_code == 200
assert "<title>VNLabel" in r_frontend.text
assert "app.js" in r_frontend.text
print("Frontend HTML Size:", len(r_frontend.text), "bytes")

print("\n>>> ALL PHASE 8 TESTS PASSED PERFECTLY! <<<")
