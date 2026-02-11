"""WSGI entry point for production (Render / Gunicorn)."""
import os
from app import create_app
from models import db, User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Ensure instance directory exists for SQLite
    os.makedirs(app.instance_path, exist_ok=True)
    db.create_all()

    # Seed default test users if DB is empty
    if not User.query.filter_by(username='client1').first():
        u = User(username='client1', password=generate_password_hash('password'),
                 role='Client', meta='Smallholder')
        db.session.add(u)
        db.session.commit()

    if not User.query.filter_by(username='expert1').first():
        e = User(username='expert1', password=generate_password_hash('password'),
                 role='Expert', meta='Animal Health Specialist')
        db.session.add(e)
        db.session.commit()
