from flask import Blueprint, jsonify, request, g
from models import db, Message, Consultation, User, Payment
from auth_utils import require_auth
from routes.notifications import create_notification
import re

messages_bp = Blueprint('messages', __name__, url_prefix='/api/v1')


# Contact information detection patterns
BLOCKED_PATTERNS = [
    # Phone number patterns
    (r'\b\d{10,}\b', 'phone number'),
    (r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', 'phone number'),
    (r'\b\+\d{1,3}[-\s]?\d{6,}\b', 'phone number'),
    (r'\b0\d{2}[-\s]?\d{3}[-\s]?\d{4}\b', 'phone number'),
    (r'\b\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}\b', 'phone number'),
    (r'\b\d{3}\s\d{3}\s\d{4}\b', 'phone number'),
    # Messaging apps and contact requests
    (r'whatsapp|telegram|signal|viber', 'messaging app reference'),
    (r'call\s*me|text\s*me|phone|mobile', 'contact request'),
    # Email patterns
    (r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', 'email address'),
    # Social media
    (r'@[a-zA-Z0-9_]{3,}', 'social media handle'),
    (r'facebook|instagram|twitter|snapchat|tiktok', 'social media reference'),
]


def check_for_contact_info(text):
    """Check if text contains blocked contact information"""
    text_lower = text.lower()
    for pattern, reason in BLOCKED_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return True, reason
    return False, None


@messages_bp.route('/unread-counts', methods=['GET'])
@require_auth
def get_unread_counts():
    """Get unread message counts for the logged-in user"""
    user = g.current_user
    user_id = user.id
    
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
@require_auth
def get_messages(consultation_id):
    """Get all messages for a consultation"""
    user = g.current_user
    user_id = user.id
    
    consultation = Consultation.query.get(consultation_id)
    if not consultation:
        return jsonify({'error': 'Consultation not found'}), 404
    
    # Verify user is part of this consultation
    if user_id not in [consultation.client_id, consultation.expert_id]:
        return jsonify({'error': 'Not authorized to view these messages'}), 403
    
    # Mark all unread messages from the other person as read
    Message.query.filter(
        Message.consultation_id == consultation_id,
        Message.sender_id != user_id,
        Message.read == False
    ).update({'read': True})
    db.session.commit()
    
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
@require_auth
def send_message(consultation_id):
    """Send a message in a consultation"""
    user = g.current_user
    sender_id = user.id
    
    data = request.json or {}
    message_text = data.get('message')

    if not message_text:
        return jsonify({'error': 'message is required'}), 400

    # Check for contact information (server-side validation)
    is_blocked, reason = check_for_contact_info(message_text)
    if is_blocked:
        return jsonify({
            'error': f'Message blocked: contains {reason}. Sharing contact information is not allowed.',
            'policy_violation': True
        }), 403

    # Verify consultation exists and is accepted
    consultation = Consultation.query.get(consultation_id)
    if not consultation:
        return jsonify({'error': 'Consultation not found'}), 404
    
    if consultation.status != 'accepted':
        return jsonify({'error': 'Consultation must be accepted before messaging'}), 403

    # Verify payment exists before allowing messages
    payment = Payment.query.filter_by(consultation_id=consultation_id).first()
    if not payment:
        return jsonify({'error': 'Payment required before starting chat'}), 403

    # Verify sender is part of the consultation
    if sender_id not in [consultation.client_id, consultation.expert_id]:
        return jsonify({'error': 'You are not part of this consultation'}), 403

    # Create message
    message = Message(
        consultation_id=consultation_id,
        sender_id=sender_id,
        message=message_text,
        message_type=data.get('message_type', 'text'),
        file_name=data.get('file_name'),
        file_url=data.get('file_url'),
    )
    db.session.add(message)
    db.session.commit()

    # Notify the OTHER party about the new message (throttled: max 1 per 2 min per consultation)
    from routes.notifications import create_notification
    from datetime import datetime, timedelta
    recipient_id = consultation.expert_id if sender_id == consultation.client_id else consultation.client_id
    recipient = User.query.get(recipient_id)
    sender_display = user.full_name or user.username
    preview = (message_text[:60] + '...') if len(message_text) > 60 else message_text

    # Check if a message notification for this consultation was sent recently
    from models import Notification
    recent_notif = Notification.query.filter_by(
        user_id=recipient_id,
        type='message',
        ref_id=consultation.id,
    ).order_by(Notification.created_at.desc()).first()

    should_notify = True
    if recent_notif and recent_notif.created_at:
        if (datetime.utcnow() - recent_notif.created_at).total_seconds() < 120:
            should_notify = False

    if should_notify:
        create_notification(
            user_id=recipient_id,
            type='message',
            title=f'New message from {sender_display}',
            description=preview,
            icon='ri-chat-3-line',
            color='teal',
            link='/expert-chats' if (recipient and recipient.role == 'Expert') else '/chats',
            ref_id=consultation.id,
        )

    # Return message with sender info
    msg_dict = message.to_dict()
    msg_dict['sender_name'] = user.username
    msg_dict['sender_role'] = user.role

    return jsonify({'status': 'ok', 'message': msg_dict}), 201


@messages_bp.route('/messages/<int:message_id>', methods=['DELETE'])
@require_auth
def delete_message(message_id):
    """Soft-delete a message (only sender can delete)"""
    user = g.current_user
    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    if message.sender_id != user.id:
        return jsonify({'error': 'You can only delete your own messages'}), 403
    message.deleted = True
    message.message = ''
    message.file_url = None
    message.file_name = None
    db.session.commit()
    return jsonify({'status': 'ok'})


# ── Payment endpoints ──

@messages_bp.route('/payments', methods=['POST'])
@require_auth
def create_payment():
    """Record a payment for a consultation"""
    user = g.current_user
    data = request.json or {}
    consultation_id = data.get('consultation_id')
    amount = data.get('amount', 0)

    if not consultation_id or not amount:
        return jsonify({'error': 'consultation_id and amount are required'}), 400

    consultation = Consultation.query.get(consultation_id)
    if not consultation:
        return jsonify({'error': 'Consultation not found'}), 404
    if consultation.client_id != user.id:
        return jsonify({'error': 'Only the client can pay'}), 403
    if consultation.status != 'accepted':
        return jsonify({'error': 'Consultation must be accepted before payment'}), 400

    # Check if already paid
    existing = Payment.query.filter_by(consultation_id=consultation_id).first()
    if existing:
        return jsonify({'error': 'Already paid', 'payment': existing.to_dict()}), 400

    platform_fee = round(amount * 0.10, 2)  # 10% platform fee
    expert_payout = round(amount - platform_fee, 2)

    payment = Payment(
        consultation_id=consultation_id,
        client_id=user.id,
        expert_id=consultation.expert_id,
        amount=amount,
        platform_fee=platform_fee,
        expert_payout=expert_payout,
        status='completed',
    )
    db.session.add(payment)
    db.session.commit()

    # Notify the expert about the payment
    if consultation.expert_id:
        client = User.query.get(user.id)
        client_name = (client.full_name if client else None) or 'A farmer'
        create_notification(
            user_id=consultation.expert_id,
            type='payment',
            title='Payment Received',
            description=f'{client_name} paid ${amount:.2f} for consultation on "{consultation.topic or "General"}". Your payout: ${expert_payout:.2f}',
            icon='ri-money-dollar-circle-line',
            color='bg-green-500',
            link='/expert-earnings',
            ref_id=payment.id,
        )
    # Notify the farmer
    create_notification(
        user_id=user.id,
        type='payment',
        title='Payment Successful',
        description=f'Your payment of ${amount:.2f} for consultation has been processed successfully.',
        icon='ri-bank-card-line',
        color='bg-green-500',
        link='/consultation',
        ref_id=payment.id,
    )

    return jsonify({'status': 'ok', 'payment': payment.to_dict()}), 201


@messages_bp.route('/payments/consultation/<int:consultation_id>', methods=['GET'])
@require_auth
def get_payment_for_consultation(consultation_id):
    """Check if a consultation has been paid"""
    payment = Payment.query.filter_by(consultation_id=consultation_id).first()
    if payment:
        return jsonify({'paid': True, 'payment': payment.to_dict()})
    return jsonify({'paid': False})


@messages_bp.route('/earnings', methods=['GET'])
@require_auth
def get_earnings():
    """Get earnings summary for the logged-in expert"""
    user = g.current_user
    if user.role != 'Expert':
        return jsonify({'error': 'Only experts can view earnings'}), 403

    payments = Payment.query.filter_by(expert_id=user.id).order_by(Payment.created_at.desc()).all()

    total_earned = sum(p.expert_payout for p in payments)
    total_platform_fees = sum(p.platform_fee for p in payments)

    transactions = []
    for p in payments:
        consultation = Consultation.query.get(p.consultation_id)
        client = User.query.get(p.client_id) if p.client_id else None
        transactions.append({
            **p.to_dict(),
            'client_name': (client.full_name or client.username) if client else 'Unknown',
            'client_photo': client.profile_picture if client else '',
            'topic': consultation.topic if consultation else '',
            'consultation_date': consultation.date.isoformat() if consultation else '',
        })

    return jsonify({
        'total_earned': round(total_earned, 2),
        'total_platform_fees': round(total_platform_fees, 2),
        'total_payments': len(payments),
        'transactions': transactions,
    })


@messages_bp.route('/my-payments', methods=['GET'])
@require_auth
def get_my_payments():
    """Get payment history for the logged-in farmer/client"""
    user = g.current_user
    payments = Payment.query.filter_by(client_id=user.id).order_by(Payment.created_at.desc()).all()

    total_spent = sum(p.amount for p in payments)

    transactions = []
    for p in payments:
        consultation = Consultation.query.get(p.consultation_id)
        expert = User.query.get(p.expert_id) if p.expert_id else None
        transactions.append({
            **p.to_dict(),
            'expert_name': (expert.full_name or expert.username) if expert else 'Unknown',
            'expert_photo': expert.profile_picture if expert else '',
            'topic': consultation.topic if consultation else 'Consultation',
            'consultation_date': consultation.date.isoformat() if consultation else '',
        })

    return jsonify({
        'total_spent': round(total_spent, 2),
        'total_payments': len(payments),
        'transactions': transactions,
    })
