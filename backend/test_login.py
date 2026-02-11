"""Quick test of the login endpoint."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    users = User.query.all()
    print(f"Users in DB: {len(users)}")
    for u in users:
        print(f"  id={u.id} username='{u.username}' role='{u.role}' name='{u.full_name}'")

    # Test login endpoint internally
    with app.test_client() as client:
        r = client.post('/api/v1/auth/login', json={'username': 'test', 'password': 'test'})
        print(f"\nLogin test (user='test'): {r.status_code} {r.json}")
