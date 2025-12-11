import sqlite3

conn = sqlite3.connect('instance/db.sqlite')
c = conn.cursor()

# Check if messages table exists
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'")
if c.fetchone():
    print("✓ Messages table exists")
    
    # Count messages
    c.execute('SELECT COUNT(*) FROM messages')
    count = c.fetchone()[0]
    print(f"Total messages: {count}")
    
    # Show recent messages
    c.execute('SELECT id, consultation_id, sender_id, message, timestamp FROM messages ORDER BY id DESC LIMIT 5')
    msgs = c.fetchall()
    print("\nRecent messages:")
    for m in msgs:
        print(f"  ID={m[0]}, Consult={m[1]}, Sender={m[2]}, Time={m[4]}")
        print(f"    Message: {m[3][:80]}")
else:
    print("✗ Messages table does NOT exist")

conn.close()
