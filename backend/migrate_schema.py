"""
One-time migration script to add new columns to messages table
and ensure the payments table exists.
Run this once, then restart the backend.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    # Add new columns to messages table (if not already present)
    with db.engine.connect() as conn:
        # Check existing columns in messages table
        result = conn.execute(db.text("PRAGMA table_info(messages)"))
        existing_cols = {row[1] for row in result.fetchall()}
        print(f"Existing messages columns: {existing_cols}")

        new_cols = {
            'message_type': "ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text'",
            'file_name': "ALTER TABLE messages ADD COLUMN file_name VARCHAR(255)",
            'file_url': "ALTER TABLE messages ADD COLUMN file_url TEXT",
            'deleted': "ALTER TABLE messages ADD COLUMN deleted BOOLEAN DEFAULT 0",
        }

        for col_name, sql in new_cols.items():
            if col_name not in existing_cols:
                conn.execute(db.text(sql))
                print(f"  Added column: messages.{col_name}")
            else:
                print(f"  Column already exists: messages.{col_name}")

        conn.commit()

    # Create payments table (and any other new tables)
    db.create_all()
    print("\nAll tables ensured (payments table created if missing).")

    # Verify payments table
    with db.engine.connect() as conn:
        result = conn.execute(db.text("PRAGMA table_info(payments)"))
        cols = [row[1] for row in result.fetchall()]
        print(f"Payments table columns: {cols}")

    print("\nMigration complete!")
