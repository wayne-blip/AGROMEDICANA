from flask import Blueprint, request, jsonify, g
from models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
from auth_utils import generate_token, require_auth
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')


# Validation helpers
def validate_email(email):
    """Basic email validation"""
    if not email:
        return True  # Optional field
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone):
    """Basic phone validation - allows various formats"""
    if not phone:
        return True  # Optional field
    # Remove common separators and check if remaining chars are digits or +
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    return bool(re.match(r'^\+?[0-9]{7,15}$', cleaned))


def validate_password_strength(password):
    """Check password meets minimum requirements"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, None


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    full_name = data.get('full_name')
    phone = data.get('phone')
    email = data.get('email')
    meta = data.get('meta')
    farm_name = data.get('farm_name')
    farm_size = data.get('farm_size')
    location = data.get('location')
    primary_crops = data.get('primary_crops')
    profile_picture = data.get('profile_picture')

    # Validation
    if not username or not password or not role:
        return jsonify({'error': 'username, password, and role are required'}), 400

    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters long'}), 400

    is_valid, error_msg = validate_password_strength(password)
    if not is_valid:
        return jsonify({'error': error_msg}), 400

    if email and not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400

    if phone and not validate_phone(phone):
        return jsonify({'error': 'Invalid phone number format'}), 400

    existing = User.query.filter_by(username=username).first()
    if existing:
        return jsonify({'error': 'username already exists'}), 400

    # Hash the password for the prototype (still not production-ready)
    hashed = generate_password_hash(password)
    user = User(
        username=username,
        password=hashed,
        role=role,
        full_name=full_name,
        phone=phone,
        email=email,
        meta=meta,
        farm_name=farm_name,
        farm_size=farm_size,
        location=location,
        primary_crops=primary_crops,
        profile_picture=profile_picture,
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({'status': 'ok', 'user': user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'username and password required'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'invalid credentials'}), 401

    # Generate JWT token
    token = generate_token(user.id)
    return jsonify({'status': 'ok', 'token': token, 'user': user.to_dict()})


@auth_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile():
    """Get current user's profile"""
    user = g.current_user
    return jsonify({'status': 'ok', 'user': user.to_dict()})


@auth_bp.route('/profile', methods=['PUT'])
@require_auth
def update_profile():
    """Update current user's profile"""
    user = g.current_user

    data = request.json or {}

    # Validate email if provided
    if 'email' in data and data['email'] and not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400

    # Validate phone if provided
    if 'phone' in data and data['phone'] and not validate_phone(data['phone']):
        return jsonify({'error': 'Invalid phone number format'}), 400

    # Update allowed fields
    allowed_fields = ['full_name', 'phone', 'email', 'meta', 'farm_name', 'farm_size', 'location', 'primary_crops', 'profile_picture']
    for field in allowed_fields:
        if field in data:
            setattr(user, field, data[field])

    db.session.commit()

    # Update localStorage with new user data
    return jsonify({'status': 'ok', 'user': user.to_dict(), 'message': 'Profile updated successfully'})


@auth_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():
    """Change user's password"""
    user = g.current_user

    data = request.json or {}
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    if not current_password or not new_password:
        return jsonify({'error': 'Current password and new password are required'}), 400

    if not check_password_hash(user.password, current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401

    if new_password != confirm_password:
        return jsonify({'error': 'New passwords do not match'}), 400

    is_valid, error_msg = validate_password_strength(new_password)
    if not is_valid:
        return jsonify({'error': error_msg}), 400

    user.password = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'status': 'ok', 'message': 'Password changed successfully'})
