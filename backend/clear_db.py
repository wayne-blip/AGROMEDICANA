"""Clear all users and consultations from the database."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app import create_app
from models import db, User, Consultation

app = create_app()
with app.app_context():
    c = Consultation.query.delete()
    u = User.query.delete()
    db.session.commit()
    print(f"Deleted {u} users and {c} consultations.")
    print("Database is clean. Ready for fresh registrations.")
