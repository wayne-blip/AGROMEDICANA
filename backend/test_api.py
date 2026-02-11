import urllib.request, json

print("=== Testing /api/v1/experts ===")
r = urllib.request.urlopen("http://127.0.0.1:5000/api/v1/experts")
d = json.loads(r.read().decode())
print(f"Status: {r.status}, Count: {len(d['experts'])}")
for e in d["experts"]:
    print(f"  id={e['id']}: {e['name']} | {e['specialty']} | photo_len={len(e['photo'])}")

print()
print("=== Testing /api/v1/farmers ===")
r2 = urllib.request.urlopen("http://127.0.0.1:5000/api/v1/farmers")
d2 = json.loads(r2.read().decode())
print(f"Status: {r2.status}, Count: {len(d2['farmers'])}")
for f in d2["farmers"]:
    print(f"  id={f['id']}: {f['name']} | {f['location']} | crops={f['crops']} | avatar_len={len(f['avatar'])}")
