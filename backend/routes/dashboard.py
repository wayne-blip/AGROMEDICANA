from flask import Blueprint, jsonify, request, g
from ai_service import analyze_devices
from models import Consultation, User, db
from datetime import datetime
from auth_utils import require_auth, optional_auth
from routes.notifications import create_notification

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/v1')


@dashboard_bp.route('/dashboard/data', methods=['GET'])
@optional_auth
def dashboard_data():
    devices, alert = analyze_devices()

    # Upcoming consultations: read from DB (latest 5)
    upcoming_qs = Consultation.query.order_by(Consultation.date.desc()).limit(5).all()
    upcoming = [c.to_dict() for c in upcoming_qs]

    return jsonify({
        'devices': devices,
        'alert': alert,
        'upcoming_consultations': upcoming
    })


@dashboard_bp.route('/consultations', methods=['GET'])
@require_auth
def get_consultations():
    """Get all consultations for a user (either as client or expert)"""
    user = g.current_user
    user_id = user.id

    if user.role == 'Expert':
        consultations = Consultation.query.filter(
            Consultation.expert_id == user_id
        ).order_by(Consultation.date.desc()).all()
    else:
        consultations = Consultation.query.filter(
            Consultation.client_id == user_id
        ).order_by(Consultation.date.desc()).all()

    result = []
    for c in consultations:
        data = c.to_dict()
        # Enrich with live user data
        if user.role == 'Expert':
            client = User.query.get(c.client_id)
            if client:
                data['client_name'] = client.full_name or client.username
                data['client_photo'] = client.profile_picture or ''
                data['client_location'] = client.location or ''
                data['client_farm'] = client.farm_name or ''
                data['client_farm_size'] = client.farm_size or ''
        else:
            # For clients, enrich with live expert data (photo from user record)
            expert = User.query.get(c.expert_id) if c.expert_id else None
            if expert:
                data['expert_name'] = expert.full_name or expert.username
                raw_meta = expert.meta or ''
                data['expert_specialty'] = raw_meta.split(' — ')[0].strip() if ' — ' in raw_meta else (raw_meta or 'Agricultural Expert')
                data['expert_photo'] = expert.profile_picture or ''
        result.append(data)

    return jsonify({'consultations': result})


@dashboard_bp.route('/consultations', methods=['POST'])
@require_auth
def book_consultation():
    """Book a new consultation"""
    user = g.current_user
    user_id = user.id
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Expert details come directly from the frontend (hardcoded expert list)
    expert_name = data.get('expert_name')
    if not expert_name:
        return jsonify({'error': 'Expert name is required'}), 400
    
    # Parse date if provided
    date_str = data.get('date')
    consultation_date = datetime.utcnow()
    if date_str:
        try:
            for fmt in ['%Y-%m-%d %H:%M', '%Y-%m-%dT%H:%M', '%Y-%m-%d']:
                try:
                    consultation_date = datetime.strptime(date_str, fmt)
                    break
                except ValueError:
                    continue
        except Exception:
            pass
    
    # Create consultation with expert details stored directly
    consultation = Consultation(
        client_id=user_id,
        expert_id=data.get('expert_id'),
        expert_name=expert_name,
        expert_specialty=data.get('expert_specialty', ''),
        expert_photo='',  # Photos looked up from User record at query time
        date=consultation_date,
        duration=data.get('duration', 60),
        topic=data.get('topic', data.get('description', 'Consultation')),
        status='pending'
    )
    
    db.session.add(consultation)
    db.session.commit()

    # Notify the expert about the new booking request
    if consultation.expert_id:
        create_notification(
            user_id=consultation.expert_id,
            type='consultation',
            title='New Consultation Request',
            description=f'{user.full_name or user.username} requested a consultation on "{consultation.topic or "General"}".',
            icon='ri-calendar-check-line',
            color='bg-teal-500',
            link='/expert-consultations',
            ref_id=consultation.id,
        )

    return jsonify({
        'message': 'Consultation booked successfully',
        'consultation': consultation.to_dict()
    }), 201


@dashboard_bp.route('/consultations/<int:consultation_id>', methods=['PUT'])
@require_auth
def update_consultation(consultation_id):
    """Update consultation status (accept/reject/complete)"""
    user = g.current_user
    user_id = user.id
    
    consultation = Consultation.query.get(consultation_id)
    if not consultation:
        return jsonify({'error': 'Consultation not found'}), 404
    
    # Only the expert or client can update the consultation
    if consultation.client_id != user_id and consultation.expert_id != user_id:
        return jsonify({'error': 'Not authorized'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update allowed fields
    old_status = consultation.status
    new_status = data.get('status')
    if new_status:
        allowed_statuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled']
        if new_status in allowed_statuses:
            consultation.status = new_status
    
    if 'topic' in data:
        consultation.topic = data['topic']
    
    if 'date' in data:
        try:
            for fmt in ['%Y-%m-%d %H:%M', '%Y-%m-%dT%H:%M', '%Y-%m-%d']:
                try:
                    consultation.date = datetime.strptime(data['date'], fmt)
                    break
                except ValueError:
                    continue
        except Exception:
            pass
    
    db.session.commit()

    # Auto-generate notifications on status change
    if new_status and new_status != old_status:
        expert = User.query.get(consultation.expert_id) if consultation.expert_id else None
        client = User.query.get(consultation.client_id) if consultation.client_id else None
        expert_name = (expert.full_name if expert else None) or consultation.expert_name or 'Expert'
        client_name = (client.full_name if client else None) or 'Farmer'

        if new_status == 'accepted':
            # Notify the farmer
            create_notification(
                user_id=consultation.client_id,
                type='consultation',
                title='Consultation Accepted',
                description=f'{expert_name} accepted your consultation request on "{consultation.topic or "General"}".',
                icon='ri-chat-check-line',
                color='bg-teal-500',
                link='/consultation',
                ref_id=consultation.id,
            )
        elif new_status == 'rejected':
            create_notification(
                user_id=consultation.client_id,
                type='consultation',
                title='Consultation Declined',
                description=f'{expert_name} declined your consultation on "{consultation.topic or "General"}".',
                icon='ri-close-circle-line',
                color='bg-red-500',
                link='/consultation',
                ref_id=consultation.id,
            )
        elif new_status == 'completed':
            # Notify farmer that expert marked it done
            create_notification(
                user_id=consultation.client_id,
                type='consultation',
                title='Consultation Completed',
                description=f'Your consultation with {expert_name} has been marked as completed.',
                icon='ri-checkbox-circle-line',
                color='bg-green-500',
                link='/consultation',
                ref_id=consultation.id,
            )
            # Notify expert too
            if consultation.expert_id:
                create_notification(
                    user_id=consultation.expert_id,
                    type='consultation',
                    title='Consultation Completed',
                    description=f'Consultation with {client_name} has been completed successfully.',
                    icon='ri-checkbox-circle-line',
                    color='bg-green-500',
                    link='/expert-consultations',
                    ref_id=consultation.id,
                )
    
    return jsonify({
        'message': 'Consultation updated successfully',
        'consultation': consultation.to_dict()
    })


@dashboard_bp.route('/consultations/<int:consultation_id>', methods=['DELETE'])
@require_auth
def cancel_consultation(consultation_id):
    """Cancel/delete a consultation"""
    user = g.current_user
    user_id = user.id
    
    consultation = Consultation.query.get(consultation_id)
    if not consultation:
        return jsonify({'error': 'Consultation not found'}), 404
    
    # Only the client can delete/cancel
    if consultation.client_id != user_id:
        return jsonify({'error': 'Not authorized'}), 403

    # Notify the expert about cancellation
    if consultation.expert_id:
        client = User.query.get(consultation.client_id)
        client_name = (client.full_name if client else None) or 'A farmer'
        create_notification(
            user_id=consultation.expert_id,
            type='consultation',
            title='Consultation Cancelled',
            description=f'{client_name} cancelled the consultation on "{consultation.topic or "General"}".',
            icon='ri-close-circle-line',
            color='bg-amber-500',
            link='/expert-consultations',
            ref_id=consultation.id,
        )

    db.session.delete(consultation)
    db.session.commit()
    
    return jsonify({'message': 'Consultation cancelled successfully'})
