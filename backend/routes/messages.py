from flask import Blueprint, jsonify, request
from models import db, Message, Consultation, User

messages_bp = Blueprint('messages', __name__, url_prefix='/api/v1')


@messages_bp.route('/unread-counts', methods=['GET'])
def get_unread_counts():
    """Get unread message counts for the logged-in user"""
    user_id = request.headers.get('user_id')
    if not user_id:
        return jsonify({'total_unread': 0, 'by_consultation': {}}), 200
    
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return jsonify({'total_unread': 0, 'by_consultation': {}}), 200
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'total_unread': 0, 'by_consultation': {}}), 200
    
    # Get all consultations where user is involved
    if user.role == 'Expert':
        consultations = Consultation.query.filter_by(expert_id=user_id).all()
    else:
        consultations = Consultation.query.filter_by(client_id=user_id).all()
    
    unread_by_consultation = {}
    total_unread = 0
    
    for consultation in consultations:
        # Count unread messages where sender is NOT the current user
        unread_count = Message.query.filter(
            Message.consultation_id == consultation.id,
            Message.sender_id != user_id,
            Message.read == False
        ).count()
        
        if unread_count > 0:
            unread_by_consultation[consultation.id] = unread_count
            total_unread += unread_count
    
    return jsonify({
        'total_unread': total_unread,
        'by_consultation': unread_by_consultation
    })


@messages_bp.route('/consultations/<int:consultation_id>/messages', methods=['GET'])
def get_messages(consultation_id):
    """Get all messages for a consultation"""
    consultation = Consultation.query.get(consultation_id)
    if not consultation:
        return jsonify({'error': 'Consultation not found'}), 404
    
    # Get user_id from header if available to mark messages as read
    user_id = request.headers.get('user_id')
    if user_id:
        try:
            user_id = int(user_id)
            # Mark all unread messages from the other person as read
            Message.query.filter(
                Message.consultation_id == consultation_id,
                Message.sender_id != user_id,
                Message.read == False
            ).update({'read': True})
            db.session.commit()
        except (ValueError, TypeError):
            pass  # If user_id is invalid, just skip marking as read
    
    messages = Message.query.filter_by(consultation_id=consultation_id).order_by(Message.timestamp.asc()).all()
    
    # Get sender usernames
    result = []
    for msg in messages:
        sender = User.query.get(msg.sender_id)
        msg_dict = msg.to_dict()
        msg_dict['sender_name'] = sender.username if sender else 'Unknown'
        msg_dict['sender_role'] = sender.role if sender else 'Unknown'
        result.append(msg_dict)
    
    return jsonify({'messages': result})


@messages_bp.route('/consultations/<int:consultation_id>/messages', methods=['POST'])
def send_message(consultation_id):
    """Send a message in a consultation"""
    data = request.json or {}
    sender_id = data.get('sender_id')
    message_text = data.get('message')

    if not sender_id or not message_text:
        return jsonify({'error': 'sender_id and message required'}), 400

    # Verify consultation exists and is accepted
    consultation = Consultation.query.get(consultation_id)
    if not consultation:
        return jsonify({'error': 'Consultation not found'}), 404
    
    if consultation.status != 'accepted':
        return jsonify({'error': 'Consultation must be accepted before messaging'}), 403

    # Verify sender is part of the consultation (convert to int for comparison)
    sender_id = int(sender_id)
    if sender_id not in [consultation.client_id, consultation.expert_id]:
        return jsonify({'error': 'You are not part of this consultation'}), 403

    # Create message
    message = Message(
        consultation_id=consultation_id,
        sender_id=sender_id,
        message=message_text
    )
    db.session.add(message)
    db.session.commit()

    # Return message with sender info
    sender = User.query.get(sender_id)
    msg_dict = message.to_dict()
    msg_dict['sender_name'] = sender.username if sender else 'Unknown'
    msg_dict['sender_role'] = sender.role if sender else 'Unknown'

    return jsonify({'status': 'ok', 'message': msg_dict}), 201
