"""Clear all users except the default test users from the database."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app import create_app
from models import db, User, Consultation

app = create_app()
with app.app_context():
    # Delete all consultations
    Consultation.query.delete()
    # Keep only client1 and expert1
    keep = ['client1', 'expert1']
    deleted = User.query.filter(~User.username.in_(keep)).delete(synchronize_session=False)
    db.session.commit()
    print(f"Deleted {deleted} users (except client1/expert1). Database is clean except test users.")
