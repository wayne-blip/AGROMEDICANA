import sqlite3
import os

db_path = 'instance/db.sqlite'
if not os.path.exists(db_path):
    print(f'Database not found at {db_path}')
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('PRAGMA table_info(messages)')
cols = cursor.fetchall()
print('Messages table columns:')
for col in cols:
    print(f'  {col[1]} ({col[2]})')

# Add read column if it doesn't exist
column_names = [col[1] for col in cols]
if 'read' not in column_names:
    print('\nAdding read column...')
    cursor.execute('ALTER TABLE messages ADD COLUMN read BOOLEAN DEFAULT 0')
    conn.commit()
    print('✓ Added read column')
else:
    print('\n✓ read column already exists')

conn.close()
