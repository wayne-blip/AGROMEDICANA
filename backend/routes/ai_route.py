from flask import Blueprint, request, jsonify
from ai_service import diagnose_image

ai_bp = Blueprint('ai', __name__, url_prefix='/api/v1/ai')


@ai_bp.route('/diagnose', methods=['POST'])
def diagnose():
    data = request.json or {}
    image_url = data.get('image_url')
    if not image_url:
        return jsonify({'error': 'image_url is required'}), 400

    result = diagnose_image(image_url)
    return jsonify(result)
