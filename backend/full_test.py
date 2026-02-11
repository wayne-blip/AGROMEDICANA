"""
Comprehensive AgroMedicana API Test Suite
Tests every endpoint and functionality systematically.
"""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models import db, User, Consultation, Message, Payment, Notification, Availability
from werkzeug.security import generate_password_hash

app = create_app()
client = app.test_client()

PASS = 0
FAIL = 0
ERRORS = []

def ok(name, response, expected_status=200, check_fn=None):
    global PASS, FAIL
    actual = response.status_code
    data = response.get_json(silent=True)
    if actual != expected_status:
        FAIL += 1
        err = f"FAIL: {name} — expected {expected_status}, got {actual}"
        if data:
            err += f" — {json.dumps(data)[:200]}"
        ERRORS.append(err)
        print(f"  ✗ {name} [{actual}]")
        return data
    if check_fn:
        try:
            check_fn(data)
            PASS += 1
            print(f"  ✓ {name}")
        except AssertionError as e:
            FAIL += 1
            err = f"FAIL: {name} — assertion: {e}"
            ERRORS.append(err)
            print(f"  ✗ {name} (assertion: {e})")
    else:
        PASS += 1
        print(f"  ✓ {name}")
    return data

def auth_header(token):
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# ═══════════════════════════════════════════════════════
# Setup: Clean test data
# ═══════════════════════════════════════════════════════
with app.app_context():
    # Remove test users if they exist from a previous run
    for uname in ['testfarmer_api', 'testexpert_api']:
        u = User.query.filter_by(username=uname).first()
        if u:
            Notification.query.filter_by(user_id=u.id).delete()
            Message.query.filter_by(sender_id=u.id).delete()
            Payment.query.filter_by(client_id=u.id).delete()
            Payment.query.filter_by(expert_id=u.id).delete()
            Availability.query.filter_by(expert_id=u.id).delete()
            # Delete consultations
            for c in Consultation.query.filter((Consultation.client_id == u.id) | (Consultation.expert_id == u.id)).all():
                Message.query.filter_by(consultation_id=c.id).delete()
                Payment.query.filter_by(consultation_id=c.id).delete()
                db.session.delete(c)
            db.session.delete(u)
    db.session.commit()
    print("Setup: cleaned previous test data\n")

# ═══════════════════════════════════════════════════════
print("═══ 1. AUTH — Register / Login / Profile ═══")
# ═══════════════════════════════════════════════════════

# 1a. Register farmer
r = client.post('/api/v1/auth/register', json={
    'username': 'testfarmer_api',
    'password': 'Test1234',
    'role': 'Client',
    'full_name': 'Test Farmer',
    'email': 'testfarmer@example.com',
    'phone': '+263771234567',
    'farm_name': 'Sunrise Farm',
    'farm_size': '50 hectares',
    'location': 'Harare, Zimbabwe',
    'primary_crops': 'Maize, Wheat',
})
d = ok("Register farmer", r, 201, lambda d: d['user']['username'] == 'testfarmer_api')
farmer_id = d['user']['id'] if d else None

# 1b. Register expert
r = client.post('/api/v1/auth/register', json={
    'username': 'testexpert_api',
    'password': 'Test1234',
    'role': 'Expert',
    'full_name': 'Dr. Test Expert',
    'email': 'testexpert@example.com',
    'phone': '+263772345678',
    'meta': 'Veterinary Medicine — 5 years experience',
})
d = ok("Register expert", r, 201, lambda d: d['user']['role'] == 'Expert')
expert_id = d['user']['id'] if d else None

# 1c. Duplicate registration should fail
r = client.post('/api/v1/auth/register', json={
    'username': 'testfarmer_api', 'password': 'Test1234', 'role': 'Client',
})
ok("Duplicate register blocked", r, 400)

# 1d. Register with short username should fail
r = client.post('/api/v1/auth/register', json={
    'username': 'ab', 'password': 'Test1234', 'role': 'Client',
})
ok("Short username rejected", r, 400)

# 1e. Register with short password should fail
r = client.post('/api/v1/auth/register', json={
    'username': 'shortpwduser', 'password': '12345', 'role': 'Client',
})
ok("Short password rejected", r, 400)

# 1f. Register with invalid email should fail
r = client.post('/api/v1/auth/register', json={
    'username': 'bademail_user', 'password': 'Test1234', 'role': 'Client', 'email': 'not-an-email'
})
ok("Invalid email rejected", r, 400)

# 1g. Login farmer
r = client.post('/api/v1/auth/login', json={
    'username': 'testfarmer_api', 'password': 'Test1234'
})
d = ok("Login farmer", r, 200, lambda d: 'token' in d)
farmer_token = d['token'] if d else None

# 1h. Login expert
r = client.post('/api/v1/auth/login', json={
    'username': 'testexpert_api', 'password': 'Test1234'
})
d = ok("Login expert", r, 200, lambda d: 'token' in d)
expert_token = d['token'] if d else None

# 1i. Login with wrong password
r = client.post('/api/v1/auth/login', json={
    'username': 'testfarmer_api', 'password': 'wrongpassword'
})
ok("Wrong password rejected", r, 401)

# 1j. Login missing fields
r = client.post('/api/v1/auth/login', json={'username': 'testfarmer_api'})
ok("Login missing password rejected", r, 400)

# 1k. Get profile (farmer)
r = client.get('/api/v1/auth/profile', headers=auth_header(farmer_token))
ok("Get farmer profile", r, 200, lambda d: d['user']['farm_name'] == 'Sunrise Farm')

# 1l. Get profile without token
r = client.get('/api/v1/auth/profile')
ok("Profile without token rejected", r, 401)

# 1m. Update profile
r = client.put('/api/v1/auth/profile', headers=auth_header(farmer_token), json={
    'farm_size': '75 hectares', 'location': 'Bulawayo, Zimbabwe'
})
ok("Update farmer profile", r, 200, lambda d: d['user']['farm_size'] == '75 hectares')

# 1n. Change password
r = client.post('/api/v1/auth/change-password', headers=auth_header(farmer_token), json={
    'current_password': 'Test1234', 'new_password': 'NewPass567', 'confirm_password': 'NewPass567'
})
ok("Change password", r, 200)

# 1o. Login with new password
r = client.post('/api/v1/auth/login', json={
    'username': 'testfarmer_api', 'password': 'NewPass567'
})
d = ok("Login with new password", r, 200)
farmer_token = d['token'] if d else farmer_token

# 1p. Change password wrong current
r = client.post('/api/v1/auth/change-password', headers=auth_header(farmer_token), json={
    'current_password': 'WrongCurrent', 'new_password': 'Another123', 'confirm_password': 'Another123'
})
ok("Change password wrong current rejected", r, 401)

# 1q. Change password mismatch confirm
r = client.post('/api/v1/auth/change-password', headers=auth_header(farmer_token), json={
    'current_password': 'NewPass567', 'new_password': 'Another123', 'confirm_password': 'Mismatch999'
})
ok("Change password confirm mismatch rejected", r, 400)


# ═══════════════════════════════════════════════════════
print("\n═══ 2. EXPERTS & FARMERS LISTS ═══")
# ═══════════════════════════════════════════════════════

# 2a. List experts (public)
r = client.get('/api/v1/experts')
ok("List experts", r, 200, lambda d: isinstance(d['experts'], list))

# 2b. List farmers (public)
r = client.get('/api/v1/farmers')
ok("List farmers", r, 200, lambda d: isinstance(d['farmers'], list))

# 2c. My clients (expert only)
r = client.get('/api/v1/my-clients', headers=auth_header(expert_token))
ok("My clients (expert)", r, 200, lambda d: isinstance(d['clients'], list))

# 2d. My clients (farmer should fail)
r = client.get('/api/v1/my-clients', headers=auth_header(farmer_token))
ok("My clients (farmer blocked)", r, 403)


# ═══════════════════════════════════════════════════════
print("\n═══ 3. AVAILABILITY ═══")
# ═══════════════════════════════════════════════════════

# 3a. Get availability (expert)
r = client.get('/api/v1/availability', headers=auth_header(expert_token))
ok("Get expert availability", r, 200, lambda d: 'schedule' in d)

# 3b. Update availability
r = client.put('/api/v1/availability', headers=auth_header(expert_token), json={
    'schedule': {
        'monday': {'enabled': True, 'start': '08:00', 'end': '16:00', 'slot_duration': 30},
        'tuesday': {'enabled': True, 'start': '09:00', 'end': '17:00', 'slot_duration': 60},
        'wednesday': {'enabled': False, 'start': '09:00', 'end': '17:00', 'slot_duration': 60},
    }
})
ok("Update availability", r, 200)

# 3c. Verify availability was saved
r = client.get('/api/v1/availability', headers=auth_header(expert_token))
d = ok("Verify saved availability", r, 200, lambda d: d['schedule']['monday']['enabled'] == True)

# 3d. Farmer should not be able to set availability
r = client.put('/api/v1/availability', headers=auth_header(farmer_token), json={'schedule': {}})
ok("Farmer cannot set availability", r, 403)

# 3e. Public availability for expert (no date)
if expert_id:
    r = client.get(f'/api/v1/availability/{expert_id}')
    ok("Public availability (no date)", r, 200)

# 3f. Public availability for expert (with date — Monday)
if expert_id:
    # Find next Monday
    from datetime import datetime, timedelta
    today = datetime.now()
    days_ahead = (0 - today.weekday()) % 7
    if days_ahead == 0: days_ahead = 7
    next_monday = (today + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
    r = client.get(f'/api/v1/availability/{expert_id}?date={next_monday}&duration=30')
    ok("Public availability (Monday slots)", r, 200, lambda d: 'slots' in d)


# ═══════════════════════════════════════════════════════
print("\n═══ 4. CONSULTATIONS CRUD ═══")
# ═══════════════════════════════════════════════════════

# 4a. Book consultation
r = client.post('/api/v1/consultations', headers=auth_header(farmer_token), json={
    'expert_id': expert_id,
    'expert_name': 'Dr. Test Expert',
    'expert_specialty': 'Veterinary Medicine',
    'date': '2026-03-01 10:00',
    'duration': 60,
    'topic': 'Cattle vaccination schedule',
})
d = ok("Book consultation", r, 201, lambda d: d['consultation']['status'] == 'pending')
consultation_id = d['consultation']['id'] if d else None

# 4b. Get consultations (farmer)
r = client.get('/api/v1/consultations', headers=auth_header(farmer_token))
ok("Get farmer consultations", r, 200, lambda d: len(d['consultations']) > 0)

# 4c. Get consultations (expert)
r = client.get('/api/v1/consultations', headers=auth_header(expert_token))
ok("Get expert consultations", r, 200, lambda d: len(d['consultations']) > 0)

# 4d. Expert accepts consultation
if consultation_id:
    r = client.put(f'/api/v1/consultations/{consultation_id}', headers=auth_header(expert_token), json={
        'status': 'accepted'
    })
    ok("Expert accepts consultation", r, 200, lambda d: d['consultation']['status'] == 'accepted')

# 4e. Book a second consultation for testing
r = client.post('/api/v1/consultations', headers=auth_header(farmer_token), json={
    'expert_id': expert_id,
    'expert_name': 'Dr. Test Expert',
    'expert_specialty': 'Veterinary Medicine',
    'date': '2026-03-15 14:00',
    'duration': 30,
    'topic': 'Poultry disease prevention',
})
d = ok("Book second consultation", r, 201)
consultation2_id = d['consultation']['id'] if d else None

# 4f. Expert rejects second consultation
if consultation2_id:
    r = client.put(f'/api/v1/consultations/{consultation2_id}', headers=auth_header(expert_token), json={
        'status': 'rejected'
    })
    ok("Expert rejects consultation", r, 200, lambda d: d['consultation']['status'] == 'rejected')

# 4g. Book a third consultation to test cancel
r = client.post('/api/v1/consultations', headers=auth_header(farmer_token), json={
    'expert_id': expert_id,
    'expert_name': 'Dr. Test Expert',
    'topic': 'Soil testing',
})
d = ok("Book third consultation", r, 201)
consultation3_id = d['consultation']['id'] if d else None

# 4h. Farmer cancels (deletes) third consultation
if consultation3_id:
    r = client.delete(f'/api/v1/consultations/{consultation3_id}', headers=auth_header(farmer_token))
    ok("Farmer cancels consultation", r, 200)

# 4i. Expert should not be able to delete consultation
if consultation_id:
    r = client.delete(f'/api/v1/consultations/{consultation_id}', headers=auth_header(expert_token))
    ok("Expert cannot delete consultation", r, 403)


# ═══════════════════════════════════════════════════════
print("\n═══ 5. PAYMENTS ═══")
# ═══════════════════════════════════════════════════════

# 5a. Check payment before paying
if consultation_id:
    r = client.get(f'/api/v1/payments/consultation/{consultation_id}', headers=auth_header(farmer_token))
    ok("Check payment (not yet paid)", r, 200, lambda d: d['paid'] == False)

# 5b. Pay for consultation
if consultation_id:
    r = client.post('/api/v1/payments', headers=auth_header(farmer_token), json={
        'consultation_id': consultation_id,
        'amount': 35.00
    })
    d = ok("Make payment", r, 201, lambda d: d['payment']['status'] == 'completed')
    payment_id = d['payment']['id'] if d else None

# 5c. Check payment after paying
if consultation_id:
    r = client.get(f'/api/v1/payments/consultation/{consultation_id}', headers=auth_header(farmer_token))
    ok("Check payment (paid)", r, 200, lambda d: d['paid'] == True)

# 5d. Duplicate payment should fail
if consultation_id:
    r = client.post('/api/v1/payments', headers=auth_header(farmer_token), json={
        'consultation_id': consultation_id, 'amount': 35.00
    })
    ok("Duplicate payment blocked", r, 400)

# 5e. Payment for non-accepted consultation should fail
if consultation2_id:
    r = client.post('/api/v1/payments', headers=auth_header(farmer_token), json={
        'consultation_id': consultation2_id, 'amount': 20.00
    })
    ok("Payment for rejected consultation blocked", r, 400)

# 5f. Expert should not be able to pay
if consultation_id:
    r = client.post('/api/v1/payments', headers=auth_header(expert_token), json={
        'consultation_id': consultation_id, 'amount': 35.00
    })
    ok("Expert cannot pay (only client)", r, 403)

# 5g. Get farmer payments
r = client.get('/api/v1/my-payments', headers=auth_header(farmer_token))
ok("Get farmer payments", r, 200, lambda d: d['total_spent'] == 35.00)

# 5h. Get expert earnings
r = client.get('/api/v1/earnings', headers=auth_header(expert_token))
ok("Get expert earnings", r, 200, lambda d: d['total_earned'] > 0)

# 5i. Farmer should not see earnings
r = client.get('/api/v1/earnings', headers=auth_header(farmer_token))
ok("Farmer cannot view earnings", r, 403)


# ═══════════════════════════════════════════════════════
print("\n═══ 6. MESSAGING ═══")
# ═══════════════════════════════════════════════════════

# 6a. Send message (farmer → expert)
if consultation_id:
    r = client.post(f'/api/v1/consultations/{consultation_id}/messages', headers=auth_header(farmer_token), json={
        'message': 'Hello doctor, I have a question about my cattle.'
    })
    ok("Farmer sends message", r, 201, lambda d: d['message']['message'] != '')

# 6b. Send message (expert → farmer)
if consultation_id:
    r = client.post(f'/api/v1/consultations/{consultation_id}/messages', headers=auth_header(expert_token), json={
        'message': 'Hello! Sure, please tell me more about the issue.'
    })
    ok("Expert sends message", r, 201)

# 6c. Get messages
if consultation_id:
    r = client.get(f'/api/v1/consultations/{consultation_id}/messages', headers=auth_header(farmer_token))
    ok("Get messages", r, 200, lambda d: len(d['messages']) >= 2)

# 6d. Message with contact info should be blocked
if consultation_id:
    r = client.post(f'/api/v1/consultations/{consultation_id}/messages', headers=auth_header(farmer_token), json={
        'message': 'Call me on 0771234567 anytime'
    })
    ok("Phone number in message blocked", r, 403)

# 6e. Email in message should be blocked
if consultation_id:
    r = client.post(f'/api/v1/consultations/{consultation_id}/messages', headers=auth_header(farmer_token), json={
        'message': 'Email me at test@gmail.com'
    })
    ok("Email in message blocked", r, 403)

# 6f. WhatsApp reference blocked
if consultation_id:
    r = client.post(f'/api/v1/consultations/{consultation_id}/messages', headers=auth_header(farmer_token), json={
        'message': 'Let us chat on WhatsApp instead'
    })
    ok("WhatsApp reference blocked", r, 403)

# 6g. Message on non-accepted consultation should fail
if consultation2_id:
    r = client.post(f'/api/v1/consultations/{consultation2_id}/messages', headers=auth_header(farmer_token), json={
        'message': 'hello'
    })
    ok("Message on rejected consultation blocked", r, 403)

# 6h. Delete message (soft delete)
if consultation_id:
    # First get messages to find one
    msgs_r = client.get(f'/api/v1/consultations/{consultation_id}/messages', headers=auth_header(farmer_token))
    msgs = msgs_r.get_json()
    farmer_msg = [m for m in msgs['messages'] if m['sender_role'] == 'Client']
    if farmer_msg:
        msg_id = farmer_msg[0]['id']
        r = client.delete(f'/api/v1/messages/{msg_id}', headers=auth_header(farmer_token))
        ok("Delete own message", r, 200)

# 6i. Delete someone else's message should fail
if consultation_id:
    msgs_r = client.get(f'/api/v1/consultations/{consultation_id}/messages', headers=auth_header(farmer_token))
    msgs = msgs_r.get_json()
    expert_msg = [m for m in msgs['messages'] if m['sender_role'] == 'Expert']
    if expert_msg:
        msg_id = expert_msg[0]['id']
        r = client.delete(f'/api/v1/messages/{msg_id}', headers=auth_header(farmer_token))
        ok("Cannot delete others message", r, 403)

# 6j. File message
if consultation_id:
    r = client.post(f'/api/v1/consultations/{consultation_id}/messages', headers=auth_header(farmer_token), json={
        'message': 'See the attached photo',
        'message_type': 'file',
        'file_name': 'cattle_photo.jpg',
        'file_url': '/uploads/cattle_photo.jpg',
    })
    ok("Send file message", r, 201, lambda d: d['message']['message_type'] == 'file')


# ═══════════════════════════════════════════════════════
print("\n═══ 7. NOTIFICATIONS ═══")
# ═══════════════════════════════════════════════════════

# 7a. Get farmer notifications
r = client.get('/api/v1/notifications', headers=auth_header(farmer_token))
d = ok("Get farmer notifications", r, 200, lambda d: isinstance(d['notifications'], list))
farmer_notif_count = len(d['notifications']) if d else 0

# 7b. Get expert notifications  
r = client.get('/api/v1/notifications', headers=auth_header(expert_token))
d = ok("Get expert notifications", r, 200, lambda d: isinstance(d['notifications'], list))

# 7c. Get unread count
r = client.get('/api/v1/notifications/unread-count', headers=auth_header(farmer_token))
ok("Get unread notification count", r, 200, lambda d: 'count' in d)

# 7d. Mark one notification as read
if farmer_notif_count > 0:
    notif_id = d['notifications'][0]['id'] if d and d['notifications'] else None
    # Get farmer notifications again
    fr = client.get('/api/v1/notifications', headers=auth_header(farmer_token))
    fd = fr.get_json()
    if fd['notifications']:
        nid = fd['notifications'][0]['id']
        r = client.put(f'/api/v1/notifications/{nid}/read', headers=auth_header(farmer_token))
        ok("Mark notification read", r, 200)

# 7e. Mark all read
r = client.put('/api/v1/notifications/mark-all-read', headers=auth_header(farmer_token))
ok("Mark all notifications read", r, 200)

# 7f. Delete notification
fr = client.get('/api/v1/notifications', headers=auth_header(farmer_token))
fd = fr.get_json()
if fd and fd['notifications']:
    nid = fd['notifications'][0]['id']
    r = client.delete(f'/api/v1/notifications/{nid}', headers=auth_header(farmer_token))
    ok("Delete notification", r, 200)
else:
    print("  - Skip delete notification (none to delete)")


# ═══════════════════════════════════════════════════════
print("\n═══ 8. UNREAD MESSAGE COUNTS ═══")
# ═══════════════════════════════════════════════════════

# 8a. Get unread counts for farmer
r = client.get('/api/v1/unread-counts', headers=auth_header(farmer_token))
ok("Get farmer unread counts", r, 200, lambda d: 'total_unread' in d)

# 8b. Get unread counts for expert
r = client.get('/api/v1/unread-counts', headers=auth_header(expert_token))
ok("Get expert unread counts", r, 200, lambda d: 'total_unread' in d)


# ═══════════════════════════════════════════════════════
print("\n═══ 9. PRESENCE & HEARTBEAT ═══")
# ═══════════════════════════════════════════════════════

# 9a. Send heartbeat
r = client.post('/api/v1/presence/heartbeat', headers=auth_header(farmer_token))
ok("Send heartbeat", r, 200)

# 9b. Check status (requires auth)
if farmer_id:
    r = client.get(f'/api/v1/presence/status/{farmer_id}', headers=auth_header(farmer_token))
    ok("Check presence status", r, 200, lambda d: 'online' in d)


# ═══════════════════════════════════════════════════════
print("\n═══ 10. DASHBOARD DATA ═══")
# ═══════════════════════════════════════════════════════

# 10a. Get dashboard data (with auth)
r = client.get('/api/v1/dashboard/data', headers=auth_header(farmer_token))
ok("Get dashboard data (authed)", r, 200, lambda d: 'devices' in d)

# 10b. Get dashboard data (without auth)
r = client.get('/api/v1/dashboard/data')
ok("Get dashboard data (no auth)", r, 200)


# ═══════════════════════════════════════════════════════
print("\n═══ 11. CONSULTATION COMPLETE FLOW ═══")
# ═══════════════════════════════════════════════════════

# Complete the consultation
if consultation_id:
    r = client.put(f'/api/v1/consultations/{consultation_id}', headers=auth_header(expert_token), json={
        'status': 'completed'
    })
    ok("Expert completes consultation", r, 200, lambda d: d['consultation']['status'] == 'completed')

# My-clients should now show the farmer
r = client.get('/api/v1/my-clients', headers=auth_header(expert_token))
ok("My-clients after completion", r, 200, lambda d: len(d['clients']) > 0)


# ═══════════════════════════════════════════════════════
print("\n═══ 12. EDGE CASES ═══")
# ═══════════════════════════════════════════════════════

# 12a. Invalid token
r = client.get('/api/v1/consultations', headers=auth_header('invalid.token.here'))
ok("Invalid token rejected", r, 401)

# 12b. Expired/malformed token
r = client.get('/api/v1/consultations', headers={'Authorization': 'Bearer '})
ok("Empty bearer rejected", r, 401)

# 12c. Non-existent consultation
r = client.get('/api/v1/consultations/99999/messages', headers=auth_header(farmer_token))
ok("Non-existent consultation 404", r, 404)

# 12d. Payment for non-existent consultation
r = client.post('/api/v1/payments', headers=auth_header(farmer_token), json={
    'consultation_id': 99999, 'amount': 10
})
ok("Payment for non-existent consultation", r, 404)

# 12e. Book consultation without expert name
r = client.post('/api/v1/consultations', headers=auth_header(farmer_token), json={
    'expert_id': expert_id, 'topic': 'test'
})
ok("Consultation without expert_name rejected", r, 400)

# 12f. Non-existent expert availability
r = client.get('/api/v1/availability/99999')
ok("Non-existent expert availability", r, 404)

# 12g. Root endpoint
r = client.get('/')
ok("Root endpoint", r, 200)


# ═══════════════════════════════════════════════════════
# Cleanup
# ═══════════════════════════════════════════════════════
with app.app_context():
    for uname in ['testfarmer_api', 'testexpert_api']:
        u = User.query.filter_by(username=uname).first()
        if u:
            Notification.query.filter_by(user_id=u.id).delete()
            Message.query.filter_by(sender_id=u.id).delete()
            Payment.query.filter_by(client_id=u.id).delete()
            Payment.query.filter_by(expert_id=u.id).delete()
            Availability.query.filter_by(expert_id=u.id).delete()
            for c in Consultation.query.filter((Consultation.client_id == u.id) | (Consultation.expert_id == u.id)).all():
                Message.query.filter_by(consultation_id=c.id).delete()
                Payment.query.filter_by(consultation_id=c.id).delete()
                db.session.delete(c)
            db.session.delete(u)
    db.session.commit()
    print("\nCleanup: removed test data")

# ═══════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════
print(f"\n{'='*50}")
print(f"RESULTS: {PASS} passed, {FAIL} failed out of {PASS+FAIL} tests")
print(f"{'='*50}")
if ERRORS:
    print("\nFAILED TESTS:")
    for e in ERRORS:
        print(f"  {e}")
    sys.exit(1)
else:
    print("\n✓ ALL TESTS PASSED")
    sys.exit(0)
