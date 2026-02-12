from flask import Blueprint, jsonify, request, g
from models import db, User
from auth_utils import require_auth
from datetime import datetime, timedelta

presence_bp = Blueprint('presence', __name__, url_prefix='/api/v1')

# In-memory typing status: { (consultation_id, user_id): datetime }
_typing_map = {}
TYPING_TIMEOUT = 4  # seconds before "typing" expires


@presence_bp.route('/presence/heartbeat', methods=['POST'])
@require_auth
def heartbeat():
    """Called periodically by the frontend to signal the user is online."""
    user = g.current_user
    user.last_seen = datetime.utcnow()
    db.session.commit()
    return jsonify({'status': 'ok'})


@presence_bp.route('/presence/status/<int:user_id>', methods=['GET'])
@require_auth
def get_status(user_id):
    """Return online/last-seen for a given user."""
    target = User.query.get(user_id)
    if not target or not target.last_seen:
        return jsonify({'online': False, 'last_seen_utc': None})

    now = datetime.utcnow()
    diff = now - target.last_seen
    online = diff.total_seconds() < 120

    return jsonify({
        'online': online,
        'last_seen_utc': target.last_seen.isoformat() + 'Z'
    })


@presence_bp.route('/presence/typing', methods=['POST'])
@require_auth
def set_typing():
    """Signal that the current user is typing in a consultation."""
    data = request.get_json(silent=True) or {}
    consultation_id = data.get('consultation_id')
    if not consultation_id:
        return jsonify({'error': 'consultation_id required'}), 400
    _typing_map[(int(consultation_id), g.current_user.id)] = datetime.utcnow()
    return jsonify({'status': 'ok'})


@presence_bp.route('/presence/typing/<int:consultation_id>/<int:user_id>', methods=['GET'])
@require_auth
def get_typing(consultation_id, user_id):
    """Check if a specific user is currently typing in a consultation."""
    ts = _typing_map.get((consultation_id, user_id))
    if ts and (datetime.utcnow() - ts).total_seconds() < TYPING_TIMEOUT:
        return jsonify({'typing': True})
    return jsonify({'typing': False})
