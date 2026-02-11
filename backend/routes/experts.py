from flask import Blueprint, jsonify, request, g
from models import db, Consultation, User, Availability
from auth_utils import require_auth
from datetime import datetime, timedelta

experts_bp = Blueprint('experts', __name__, url_prefix='/api/v1')


@experts_bp.route('/experts', methods=['GET'])
def list_experts():
    """Get all registered experts — public endpoint for farmers to browse."""
    experts = User.query.filter_by(role='Expert').all()
    result = []
    for e in experts:
        # Parse meta: "Veterinary Medicine — 2 years experience"
        specialty = ''
        experience = ''
        if e.meta and ' — ' in e.meta:
            parts = e.meta.split(' — ', 1)
            specialty = parts[0].strip()
            experience = parts[1].strip() if len(parts) > 1 else ''
        elif e.meta:
            specialty = e.meta.strip()

        result.append({
            'id': e.id,
            'name': e.full_name or e.username,
            'specialty': specialty or 'General Agricultural Expert',
            'experience': experience or 'Experienced',
            'photo': e.profile_picture or '',
            'location': e.location or '',
            'phone': e.phone or '',
            'email': e.email or '',
            'available': True,
            'rating': 4.8,
            'reviews': 0,
            'price': '$35',
            'discount': '',
            'focus': specialty or 'Agricultural Consulting',
            'created_at': e.created_at.isoformat() if e.created_at else '',
        })
    return jsonify({'experts': result})


@experts_bp.route('/farmers', methods=['GET'])
def list_farmers():
    """Get all registered farmers — public list."""
    farmers = User.query.filter_by(role='Client').all()
    result = []
    for f in farmers:
        crops_list = [c.strip() for c in (f.primary_crops or '').split(',') if c.strip()]
        result.append({
            'id': f.id,
            'name': f.full_name or f.username,
            'avatar': f.profile_picture or '',
            'location': f.location or '',
            'farmName': f.farm_name or '',
            'farmSize': f.farm_size or '',
            'crops': crops_list,
            'phone': f.phone or '',
            'email': f.email or '',
            'status': 'active',
            'created_at': f.created_at.isoformat() if f.created_at else '',
        })
    return jsonify({'farmers': result})


@experts_bp.route('/my-clients', methods=['GET'])
@require_auth
def my_clients():
    """Return only the farmers this expert has consulted with."""
    user = g.current_user
    if user.role != 'Expert':
        return jsonify({'error': 'Only experts can view their clients'}), 403

    # Get all consultations for this expert
    consults = Consultation.query.filter_by(expert_id=user.id).all()

    # Build a map of unique client_ids with consultation stats
    client_map = {}  # client_id -> {count, last_date, statuses}
    for c in consults:
        cid = c.client_id
        if cid not in client_map:
            client_map[cid] = {'count': 0, 'last_date': None, 'completed': 0, 'topics': []}
        client_map[cid]['count'] += 1
        if c.status == 'completed':
            client_map[cid]['completed'] += 1
        if c.topic:
            client_map[cid]['topics'].append(c.topic)
        if c.date and (client_map[cid]['last_date'] is None or c.date > client_map[cid]['last_date']):
            client_map[cid]['last_date'] = c.date

    if not client_map:
        return jsonify({'clients': []})

    # Fetch the user records for these clients
    farmers = User.query.filter(User.id.in_(client_map.keys())).all()
    result = []
    for f in farmers:
        stats = client_map[f.id]
        crops_list = [c.strip() for c in (f.primary_crops or '').split(',') if c.strip()]
        result.append({
            'id': f.id,
            'name': f.full_name or f.username,
            'avatar': f.profile_picture or '',
            'location': f.location or '',
            'farmName': f.farm_name or '',
            'farmSize': f.farm_size or '',
            'crops': crops_list,
            'phone': f.phone or '',
            'email': f.email or '',
            'status': 'active',
            'consultations': stats['count'],
            'completedConsultations': stats['completed'],
            'lastConsultation': stats['last_date'].isoformat() if stats['last_date'] else '',
            'recentTopics': stats['topics'][:3],
            'created_at': f.created_at.isoformat() if f.created_at else '',
        })
    return jsonify({'clients': result})


# ── Availability endpoints ──────────────────────────────────────────────────

DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']


@experts_bp.route('/availability', methods=['GET'])
@require_auth
def get_own_availability():
    """Expert fetches their own weekly schedule."""
    user = g.current_user
    if user.role != 'Expert':
        return jsonify({'error': 'Only experts can manage availability'}), 403

    rows = Availability.query.filter_by(expert_id=user.id).all()
    schedule = {d: {'enabled': False, 'start': '09:00', 'end': '17:00', 'slot_duration': 60} for d in DAYS}
    for r in rows:
        schedule[r.day_of_week] = {
            'enabled': r.enabled,
            'start': r.start_time,
            'end': r.end_time,
            'slot_duration': r.slot_duration,
        }
    return jsonify({'schedule': schedule})


@experts_bp.route('/availability', methods=['PUT'])
@require_auth
def update_availability():
    """Expert saves their weekly schedule.
    Expects: { schedule: { monday: { enabled, start, end, slot_duration }, ... } }
    """
    user = g.current_user
    if user.role != 'Expert':
        return jsonify({'error': 'Only experts can manage availability'}), 403

    data = request.get_json() or {}
    schedule = data.get('schedule', {})

    for day in DAYS:
        day_data = schedule.get(day)
        if day_data is None:
            continue

        row = Availability.query.filter_by(expert_id=user.id, day_of_week=day).first()
        if row is None:
            row = Availability(expert_id=user.id, day_of_week=day)
            db.session.add(row)

        row.enabled = bool(day_data.get('enabled', False))
        row.start_time = day_data.get('start', '09:00')
        row.end_time = day_data.get('end', '17:00')
        row.slot_duration = int(day_data.get('slot_duration', 60))

    db.session.commit()
    return jsonify({'message': 'Availability saved successfully'})


@experts_bp.route('/availability/<int:expert_id>', methods=['GET'])
def get_expert_availability(expert_id):
    """Public: farmers fetch an expert's available slots for a given date.
    Query params: ?date=YYYY-MM-DD
    Returns available time slots not already booked.
    """
    expert = User.query.get(expert_id)
    if not expert or expert.role != 'Expert':
        return jsonify({'error': 'Expert not found'}), 404

    date_str = request.args.get('date')
    if not date_str:
        # Return raw weekly schedule
        rows = Availability.query.filter_by(expert_id=expert_id).all()
        schedule = {}
        for r in rows:
            schedule[r.day_of_week] = {
                'enabled': r.enabled,
                'start': r.start_time,
                'end': r.end_time,
                'slot_duration': r.slot_duration,
            }
        return jsonify({'schedule': schedule})

    # Parse the date and look up which day of week it is
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400

    day_name = target_date.strftime('%A').lower()  # e.g. 'monday'
    avail = Availability.query.filter_by(expert_id=expert_id, day_of_week=day_name).first()

    if not avail or not avail.enabled:
        return jsonify({'slots': [], 'message': 'Expert is not available on this day'})

    # Allow the client to request a specific duration (farmer picks 30/60/90)
    requested_duration = request.args.get('duration', type=int)
    slot_minutes = requested_duration if requested_duration and requested_duration > 0 else (avail.slot_duration or 60)
    start_h, start_m = map(int, avail.start_time.split(':'))
    end_h, end_m = map(int, avail.end_time.split(':'))
    start_total = start_h * 60 + start_m
    end_total = end_h * 60 + end_m

    slots = []
    current = start_total
    while current + slot_minutes <= end_total:
        slot_start = f"{current // 60:02d}:{current % 60:02d}"
        slot_end_min = current + slot_minutes
        slot_end = f"{slot_end_min // 60:02d}:{slot_end_min % 60:02d}"
        slots.append({'start': slot_start, 'end': slot_end})
        current = slot_end_min

    # Remove already-booked slots
    day_start = target_date.replace(hour=0, minute=0, second=0)
    day_end = day_start + timedelta(days=1)
    booked = Consultation.query.filter(
        Consultation.expert_id == expert_id,
        Consultation.date >= day_start,
        Consultation.date < day_end,
        Consultation.status.in_(['pending', 'accepted']),
    ).all()

    booked_times = set()
    for b in booked:
        if b.date:
            booked_times.add(b.date.strftime('%H:%M'))

    # Check if the requested date is today — mark past slots
    now = datetime.now()
    is_today = target_date.date() == now.date()
    current_minutes = now.hour * 60 + now.minute if is_today else -1

    available_slots = []
    for s in slots:
        sh, sm = map(int, s['start'].split(':'))
        slot_minutes = sh * 60 + sm
        available_slots.append({
            **s,
            'booked': s['start'] in booked_times,
            'past': is_today and slot_minutes <= current_minutes,
        })

    return jsonify({'slots': available_slots, 'day': day_name})
