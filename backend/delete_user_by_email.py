import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    user = User.query.filter_by(username='tafarampofu01@gmail.com').first()
    if user:
        db.session.delete(user)
        db.session.commit()
        print("Deleted user with username/email 'tafarampofu01@gmail.com'.")
    else:
        print("No user found with username/email 'tafarampofu01@gmail.com'.")
