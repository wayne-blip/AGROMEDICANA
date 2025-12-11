from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)  # MOCK: plain text for prototype
    role = db.Column(db.String(20), nullable=False)  # 'Client' or 'Expert'
    meta = db.Column(db.String(255), nullable=True)  # Farming Type or Specialty

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'meta': self.meta,
        }


class Consultation(db.Model):
    __tablename__ = 'consultations'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, nullable=False)
    expert_id = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    topic = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), default='pending')  # 'pending', 'accepted', 'rejected', 'completed'

    def to_dict(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'expert_id': self.expert_id,
            'date': self.date.isoformat(),
            'topic': self.topic,
            'status': self.status,
        }


class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    consultation_id = db.Column(db.Integer, nullable=False)
    sender_id = db.Column(db.Integer, nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    read = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'consultation_id': self.consultation_id,
            'sender_id': self.sender_id,
            'message': self.message,
            'timestamp': self.timestamp.isoformat(),
            'read': self.read,
        }
