from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)  # Hashed password
    role = db.Column(db.String(20), nullable=False)  # 'Client' or 'Expert'
    full_name = db.Column(db.String(120), nullable=True)  # User's full name
    email = db.Column(db.String(120), nullable=True)  # Email address
    phone = db.Column(db.String(20), nullable=True)  # Phone number
    meta = db.Column(db.String(255), nullable=True)  # Farming Type or Specialty
    # Farm-specific fields (for farmers)
    farm_name = db.Column(db.String(120), nullable=True)
    farm_size = db.Column(db.String(50), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    primary_crops = db.Column(db.String(255), nullable=True)
    profile_picture = db.Column(db.Text, nullable=True)  # Base64 data URL
    # Notification preferences (stored as JSON string)
    notification_prefs = db.Column(db.Text, nullable=True)
    last_seen = db.Column(db.DateTime, nullable=True)  # presence tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'meta': self.meta,
            'farm_name': self.farm_name,
            'farm_size': self.farm_size,
            'location': self.location,
            'primary_crops': self.primary_crops,
            'profile_picture': self.profile_picture,
        }


class Consultation(db.Model):
    __tablename__ = 'consultations'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, nullable=False)
    expert_id = db.Column(db.Integer, nullable=True)
    expert_name = db.Column(db.String(200), nullable=True)
    expert_specialty = db.Column(db.String(200), nullable=True)
    expert_photo = db.Column(db.Text, nullable=True)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    duration = db.Column(db.Integer, default=60)  # duration in minutes (30, 60, 90)
    topic = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), default='pending')  # 'pending', 'accepted', 'rejected', 'completed'

    def to_dict(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'expert_id': self.expert_id,
            'expert_name': self.expert_name,
            'expert_specialty': self.expert_specialty,
            'expert_photo': self.expert_photo,
            'date': self.date.isoformat(),
            'duration': self.duration or 60,
            'topic': self.topic,
            'status': self.status,
        }


class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    consultation_id = db.Column(db.Integer, nullable=False)
    sender_id = db.Column(db.Integer, nullable=False)
    message = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default='text')  # 'text', 'image', 'file'
    file_name = db.Column(db.String(255), nullable=True)
    file_url = db.Column(db.Text, nullable=True)  # base64 data URL or path
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    read = db.Column(db.Boolean, default=False)
    deleted = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'consultation_id': self.consultation_id,
            'sender_id': self.sender_id,
            'message': self.message if not self.deleted else '',
            'message_type': self.message_type or 'text',
            'file_name': self.file_name if not self.deleted else None,
            'file_url': self.file_url if not self.deleted else None,
            'timestamp': self.timestamp.isoformat(),
            'read': self.read,
            'deleted': self.deleted,
        }


class Availability(db.Model):
    """Weekly availability schedule for an expert.
    Each row = one day-of-week entry for one expert.
    """
    __tablename__ = 'availability'
    id = db.Column(db.Integer, primary_key=True)
    expert_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)  # monday, tuesday, ...
    enabled = db.Column(db.Boolean, default=True)
    start_time = db.Column(db.String(5), nullable=False, default='09:00')  # HH:MM
    end_time = db.Column(db.String(5), nullable=False, default='17:00')
    slot_duration = db.Column(db.Integer, default=60)  # minutes per slot

    __table_args__ = (
        db.UniqueConstraint('expert_id', 'day_of_week', name='uq_expert_day'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'expert_id': self.expert_id,
            'day_of_week': self.day_of_week,
            'enabled': self.enabled,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'slot_duration': self.slot_duration,
        }


class Payment(db.Model):
    """Tracks payments from farmers to experts for consultations."""
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    consultation_id = db.Column(db.Integer, db.ForeignKey('consultations.id'), nullable=False, unique=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    expert_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    platform_fee = db.Column(db.Float, default=0.0)  # AgroMedicana cut
    expert_payout = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='completed')  # 'completed', 'refunded'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'consultation_id': self.consultation_id,
            'client_id': self.client_id,
            'expert_id': self.expert_id,
            'amount': self.amount,
            'platform_fee': self.platform_fee,
            'expert_payout': self.expert_payout,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
        }


class Notification(db.Model):
    """Real-time notifications for users (farmers & experts)."""
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(30), nullable=False)  # consultation, payment, message, system, alert
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(50), default='ri-notification-3-line')
    color = db.Column(db.String(30), default='bg-teal-500')
    read = db.Column(db.Boolean, default=False)
    link = db.Column(db.String(200), nullable=True)  # optional deep-link path
    ref_id = db.Column(db.Integer, nullable=True)  # consultation_id or payment_id
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        from datetime import datetime as dt
        now = dt.utcnow()
        diff = now - self.created_at
        if diff.total_seconds() < 60:
            time_str = "Just now"
        elif diff.total_seconds() < 3600:
            time_str = f"{int(diff.total_seconds() // 60)} min ago"
        elif diff.total_seconds() < 86400:
            time_str = f"{int(diff.total_seconds() // 3600)} hour{'s' if diff.total_seconds() >= 7200 else ''} ago"
        else:
            days = diff.days
            time_str = f"{days} day{'s' if days > 1 else ''} ago"

        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'description': self.description or '',
            'icon': self.icon,
            'color': self.color,
            'read': self.read,
            'link': self.link,
            'ref_id': self.ref_id,
            'time': time_str,
            'created_at': self.created_at.isoformat(),
        }
