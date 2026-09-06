import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:5043/api"
session = requests.Session()

print("=== 1. TEST LOGIN WITH EMAIL ===")
r_login = session.post(f"{BASE_URL}/auth/login", json={
    "email": "test@gmail.com",
    "password": "12345678"
})
print("Login Status:", r_login.status_code)
assert r_login.status_code == 200, f"Login failed: {r_login.text}"
login_data = r_login.json()
token = login_data["accessToken"]
print("User:", login_data["user"]["name"], "| Role:", login_data["user"]["role"], "| Org:", login_data["user"]["orgName"])

print("\n=== 2. TEST LOGIN WITH PHONE ===")
r_phone_login = session.post(f"{BASE_URL}/auth/login", json={
    "email": "0874845488",
    "password": "12345678"
})
print("Phone Login Status:", r_phone_login.status_code)
assert r_phone_login.status_code == 200

headers = {"Authorization": f"Bearer {token}"}

print("\n=== 3. TEST GET PROFILE ===")
r_profile = session.get(f"{BASE_URL}/profile", headers=headers)
print("Profile Status:", r_profile.status_code)
print("Profile Data:", r_profile.json())
assert r_profile.status_code == 200

print("\n=== 4. TEST GET ORGANIZATION ===")
r_org = session.get(f"{BASE_URL}/organization", headers=headers)
print("Org Status:", r_org.status_code)
print("Org Data:", r_org.json())
assert r_org.status_code == 200

print("\n=== 5. TEST GET MEMBERS ===")
r_members = session.get(f"{BASE_URL}/organization/users", headers=headers)
print("Members Count:", len(r_members.json()))
print("Members:", r_members.json())
assert r_members.status_code == 200

print("\n=== 6. TEST CREATE API KEY ===")
r_apikey = session.post(f"{BASE_URL}/apikeys", headers=headers, json={"name": "KiotViet Integration Key"})
print("Create API Key Status:", r_apikey.status_code)
print("Key Response:", r_apikey.json())
assert r_apikey.status_code == 200

print("\n=== 7. TEST LIST API KEYS ===")
r_keys_list = session.get(f"{BASE_URL}/apikeys", headers=headers)
print("Keys Count:", len(r_keys_list.json()))
assert len(r_keys_list.json()) == 1

print("\n>>> ALL PHASE 2 TESTS PASSED PERFECTLY! <<<")
