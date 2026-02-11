import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    users = User.query.all()
    print("Usernames and emails in DB:")
    for u in users:
        print(f"- username: {u.username} | email: {u.email}")
