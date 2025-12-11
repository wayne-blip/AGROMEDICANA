from flask import Blueprint, request, jsonify
from models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    meta = data.get('meta')

    if not username or not password or not role:
        return jsonify({'error': 'username, password, and role are required'}), 400

    existing = User.query.filter_by(username=username).first()
    if existing:
        return jsonify({'error': 'username already exists'}), 400

    # Hash the password for the prototype (still not production-ready)
    hashed = generate_password_hash(password)
    user = User(username=username, password=hashed, role=role, meta=meta)
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

    # Return a mock token
    token = str(uuid.uuid4())
    return jsonify({'status': 'ok', 'token': token, 'user': user.to_dict()})
