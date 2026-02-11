"""
JWT Authentication utilities for AgroMedicana.
Provides token generation, verification, and route protection.
"""

import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, current_app, g
from models import User


def generate_token(user_id: int) -> str:
    """Generate a JWT token for a user.
    
    Args:
        user_id: The database ID of the user
        
    Returns:
        Encoded JWT token string
    """
    expiration_hours = current_app.config.get('JWT_EXPIRATION_HOURS', 24)
    payload = {
        'user_id': user_id,
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(hours=expiration_hours)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def verify_token(token: str) -> dict | None:
    """Verify and decode a JWT token.
    
    Args:
        token: The JWT token string
        
    Returns:
        Decoded payload dict if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_token_from_header() -> str | None:
    """Extract JWT token from Authorization header.
    
    Expects format: "Bearer <token>"
    
    Returns:
        Token string if found, None otherwise
    """
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header[7:]  # Remove 'Bearer ' prefix
    return None


def require_auth(f):
    """Decorator to protect routes with JWT authentication.
    
    Sets g.current_user to the authenticated User object.
    Returns 401 if token is missing, invalid, or expired.
    
    Usage:
        @app.route('/protected')
        @require_auth
        def protected_route():
            user = g.current_user  # Access authenticated user
            return jsonify({'user_id': user.id})
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        
        if not token:
            return jsonify({'error': 'Authentication required', 'code': 'NO_TOKEN'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token', 'code': 'INVALID_TOKEN'}), 401
        
        user_id = payload.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found', 'code': 'USER_NOT_FOUND'}), 401
        
        # Store user in Flask's g object for access in the route
        g.current_user = user
        
        return f(*args, **kwargs)
    
    return decorated


def optional_auth(f):
    """Decorator that attempts auth but doesn't require it.
    
    Sets g.current_user to User if authenticated, None otherwise.
    Useful for routes that behave differently for logged-in users.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        g.current_user = None
        token = get_token_from_header()
        
        if token:
            payload = verify_token(token)
            if payload:
                user_id = payload.get('user_id')
                g.current_user = User.query.get(user_id)
        
        return f(*args, **kwargs)
    
    return decorated
