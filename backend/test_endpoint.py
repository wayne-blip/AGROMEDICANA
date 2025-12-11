from app import create_app
from models import db, Message, User, Consultation

app = create_app()

with app.app_context():
    # Test getting messages for consultation 8
    consultation = Consultation.query.get(8)
    print(f"Consultation 8: {consultation}")
    if consultation:
        print(f"  Client: {consultation.client_id}, Expert: {consultation.expert_id}")
        print(f"  Status: {consultation.status}")
        print(f"  Topic: {consultation.topic}")
    
    messages = Message.query.filter_by(consultation_id=8).order_by(Message.timestamp.asc()).all()
    print(f"\nFound {len(messages)} messages:")
    for msg in messages:
        sender = User.query.get(msg.sender_id)
        print(f"  [{msg.timestamp}] {sender.username if sender else 'Unknown'}: {msg.message[:50]}")
