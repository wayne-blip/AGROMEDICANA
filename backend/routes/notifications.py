from flask import Blueprint, jsonify, request, g
from models import db, Notification
from auth_utils import require_auth

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/v1')


def create_notification(user_id, type, title, description='', icon='ri-notification-3-line', color='bg-teal-500', link=None, ref_id=None):
    """Helper: create a notification for a user. Can be called from other routes."""
    n = Notification(
        user_id=user_id,
        type=type,
        title=title,
        description=description,
        icon=icon,
        color=color,
        link=link,
        ref_id=ref_id,
    )
    db.session.add(n)
    db.session.commit()
    return n


@notifications_bp.route('/notifications', methods=['GET'])
@require_auth
def get_notifications():
    """Get all notifications for the current user, newest first."""
    user = g.current_user
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    filter_type = request.args.get('type', None)

    query = Notification.query.filter_by(user_id=user.id)
    if filter_type and filter_type != 'all':
        if filter_type == 'unread':
            query = query.filter_by(read=False)
        else:
            query = query.filter_by(type=filter_type)

    notifications = query.order_by(Notification.created_at.desc()).limit(per_page).offset((page - 1) * per_page).all()
    unread_count = Notification.query.filter_by(user_id=user.id, read=False).count()

    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count,
    })


@notifications_bp.route('/notifications/unread-count', methods=['GET'])
@require_auth
def get_unread_count():
    """Quick endpoint for badge count."""
    user = g.current_user
    count = Notification.query.filter_by(user_id=user.id, read=False).count()
    return jsonify({'unread_count': count})


@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@require_auth
def mark_read(notification_id):
    """Mark a single notification as read."""
    user = g.current_user
    n = Notification.query.filter_by(id=notification_id, user_id=user.id).first()
    if not n:
        return jsonify({'error': 'Notification not found'}), 404
    n.read = True
    db.session.commit()
    return jsonify({'status': 'ok'})


@notifications_bp.route('/notifications/mark-all-read', methods=['PUT'])
@require_auth
def mark_all_read():
    """Mark all notifications as read for the current user."""
    user = g.current_user
    Notification.query.filter_by(user_id=user.id, read=False).update({'read': True})
    db.session.commit()
    return jsonify({'status': 'ok'})


@notifications_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@require_auth
def delete_notification(notification_id):
    """Delete a single notification."""
    user = g.current_user
    n = Notification.query.filter_by(id=notification_id, user_id=user.id).first()
    if not n:
        return jsonify({'error': 'Notification not found'}), 404
    db.session.delete(n)
    db.session.commit()
    return jsonify({'status': 'ok'})
