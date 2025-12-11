from flask import Blueprint, jsonify, request
from models import db, Consultation, User

experts_bp = Blueprint('experts', __name__, url_prefix='/api/v1')


@experts_bp.route('/experts', methods=['GET'])
def list_experts():
    # Get all users with role 'Expert'
    experts = User.query.filter_by(role='Expert').all()
    return jsonify({'experts': [
        {
            'id': e.id,
            'name': e.username,
            'specialty': e.meta or 'General Agricultural Expert',
            'years_experience': 5  # Mock data for now
        } for e in experts
    ]})


@experts_bp.route('/consultations', methods=['POST'])
def book_consultation():
    data = request.json or {}
    client_id = data.get('client_id')
    expert_id = data.get('expert_id')
    topic = data.get('topic') or 'General Consultation'

    if not client_id or not expert_id:
        return jsonify({'error': 'client_id and expert_id required'}), 400

    consult = Consultation(client_id=client_id, expert_id=expert_id, topic=topic, status='pending')
    db.session.add(consult)
    db.session.commit()

    return jsonify({'status': 'ok', 'consultation': consult.to_dict()}), 201


@experts_bp.route('/consultations/<int:consultation_id>/accept', methods=['POST'])
def accept_consultation(consultation_id):
    consult = Consultation.query.get(consultation_id)
    if not consult:
        return jsonify({'error': 'Consultation not found'}), 404
    
    consult.status = 'accepted'
    db.session.commit()
    
    return jsonify({'status': 'ok', 'consultation': consult.to_dict()})


@experts_bp.route('/consultations/<int:consultation_id>/reject', methods=['POST'])
def reject_consultation(consultation_id):
    consult = Consultation.query.get(consultation_id)
    if not consult:
        return jsonify({'error': 'Consultation not found'}), 404
    
    consult.status = 'rejected'
    db.session.commit()
    
    return jsonify({'status': 'ok', 'consultation': consult.to_dict()})


@experts_bp.route('/consultations/<int:consultation_id>/complete', methods=['POST'])
def complete_consultation(consultation_id):
    consult = Consultation.query.get(consultation_id)
    if not consult:
        return jsonify({'error': 'Consultation not found'}), 404
    
    consult.status = 'completed'
    db.session.commit()
    
    return jsonify({'status': 'ok', 'consultation': consult.to_dict()})
