from flask import Blueprint, jsonify
from ai_service import analyze_devices
from models import Consultation

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/v1')


@dashboard_bp.route('/dashboard/data', methods=['GET'])
def dashboard_data():
    devices, alert = analyze_devices()

    # Upcoming consultations: read from DB (latest 5)
    upcoming_qs = Consultation.query.order_by(Consultation.date.desc()).limit(5).all()
    upcoming = [c.to_dict() for c in upcoming_qs]

    # Provide the static device data plus alert and upcoming consultations
    return jsonify({
        'devices': devices,
        'alert': alert,
        'upcoming_consultations': upcoming
    })
