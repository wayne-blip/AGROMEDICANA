import sqlite3, os

paths = [
    r"c:\AgroMedicana-MVP\backend\db.sqlite",
    r"c:\AgroMedicana-MVP\backend\instance\db.sqlite",
    r"c:\AgroMedicana-MVP\instance\db.sqlite",
]

for p in paths:
    print(f"\n=== {p} ===")
    if not os.path.exists(p):
        print("  FILE NOT FOUND")
        continue
    print(f"  Size: {os.path.getsize(p)} bytes")
    try:
        conn = sqlite3.connect(p)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r[0] for r in cur.fetchall()]
        print(f"  Tables: {tables}")
        if 'users' in tables:
            cur.execute("SELECT id, username, email, role FROM users")
            rows = cur.fetchall()
            print(f"  Users ({len(rows)}):")
            for r in rows:
                print(f"    id={r[0]} username='{r[1]}' email='{r[2]}' role='{r[3]}'")
        conn.close()
    except Exception as e:
        print(f"  ERROR: {e}")
