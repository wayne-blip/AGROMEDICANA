from flask import Blueprint, jsonify, g
from models import db, User
from auth_utils import require_auth
from datetime import datetime, timedelta

presence_bp = Blueprint('presence', __name__, url_prefix='/api/v1')


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
