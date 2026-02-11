"""
Seed script to create default development users.
Run this once after setting up the database.
"""
from app import create_app
from models import db, User
from werkzeug.security import generate_password_hash

app = create_app()


def seed_users():
    with app.app_context():
        # Check if users already exist
        existing_farmer = User.query.filter_by(username='farmer@test.com').first()
        existing_expert = User.query.filter_by(username='expert@test.com').first()

        users_created = []

        # Create default Farmer user
        if not existing_farmer:
            farmer = User(
                username='farmer@test.com',
                password=generate_password_hash('password123'),
                role='Farmer',
                full_name='John Farmer',
                phone='+263 77 123 4567',
                meta='Crop Farming'
            )
            db.session.add(farmer)
            users_created.append('Farmer')
            print("✓ Created Farmer user: farmer@test.com")
        else:
            print("→ Farmer user already exists")

        # Create default Expert user
        if not existing_expert:
            expert = User(
                username='expert@test.com',
                password=generate_password_hash('password123'),
                role='Expert',
                full_name='Dr. Sarah Moyo',
                phone='+263 77 987 6543',
                meta='Veterinarian'
            )
            db.session.add(expert)
            users_created.append('Expert')
            print("✓ Created Expert user: expert@test.com")
        else:
            print("→ Expert user already exists")

        if users_created:
            db.session.commit()
            print(f"\n✅ Successfully created {len(users_created)} user(s)")
        else:
            print("\n→ No new users created (all already exist)")

        print("\n" + "="*50)
        print("DEFAULT LOGIN CREDENTIALS")
        print("="*50)
        print("\n🌾 FARMER ACCOUNT:")
        print("   Email:    farmer@test.com")
        print("   Password: password123")
        print("\n👨‍⚕️ EXPERT ACCOUNT:")
        print("   Email:    expert@test.com")
        print("   Password: password123")
        print("="*50 + "\n")


if __name__ == '__main__':
    seed_users()
