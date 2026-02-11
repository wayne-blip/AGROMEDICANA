"""Clean ALL db.sqlite files across the project."""
import sqlite3, os

paths = [
    r"c:\AgroMedicana-MVP\backend\db.sqlite",
    r"c:\AgroMedicana-MVP\backend\instance\db.sqlite",
    r"c:\AgroMedicana-MVP\instance\db.sqlite",
]

for p in paths:
    if not os.path.exists(p):
        continue
    try:
        conn = sqlite3.connect(p)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r[0] for r in cur.fetchall()]
        if 'consultations' in tables:
            cur.execute("DELETE FROM consultations")
        if 'messages' in tables:
            cur.execute("DELETE FROM messages")
        if 'users' in tables:
            cur.execute("DELETE FROM users")
        conn.commit()
        conn.close()
        print(f"Cleaned: {p}")
    except Exception as e:
        print(f"Error on {p}: {e}")

print("\nAll databases cleared. You can register fresh.")
