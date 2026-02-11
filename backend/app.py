from flask import Flask
from flask_cors import CORS
from models import db, User, Consultation
from werkzeug.security import generate_password_hash
from routes.auth import auth_bp
from routes.experts import experts_bp
from routes.dashboard import dashboard_bp
from routes.ai_route import ai_bp
from routes.messages import messages_bp
from routes.notifications import notifications_bp
from routes.presence import presence_bp
import os
from flask import send_from_directory


def create_app(config=None):
    app = Flask(__name__, static_folder=None, instance_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance'))
    db_path = os.path.join(app.instance_path, 'db.sqlite')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', f'sqlite:///{db_path}')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['JWT_EXPIRATION_HOURS'] = 24  # Token expires in 24 hours

    CORS(app, origins=os.environ.get('CORS_ORIGINS', '*').split(','),
         expose_headers=['user_id', 'Authorization'],
         allow_headers=['Content-Type', 'user_id', 'Authorization'])
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(experts_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(messages_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(presence_bp)

    @app.route('/')
    def root():
        # If the frontend has been built into ../frontend/dist, serve it.
        dist_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
        index_file = os.path.join(dist_path, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(dist_path, 'index.html')
        return {'status': 'AgroMedicana API running'}

    return app


if __name__ == '__main__':
    app = create_app()
    # Ensure DB exists and create tables
    with app.app_context():
        db.create_all()

        # Insert a default client user for quick testing if not present
        if not User.query.filter_by(username='client1').first():
            hashed = generate_password_hash('password')
            u = User(username='client1', password=hashed, role='Client', meta='Smallholder')
            db.session.add(u)
            db.session.commit()
        
        # Insert a default expert user for testing if not present
        if not User.query.filter_by(username='expert1').first():
            hashed = generate_password_hash('password')
            expert = User(username='expert1', password=hashed, role='Expert', meta='Animal Health Specialist')
            db.session.add(expert)
            db.session.commit()

    # Run development server
    # NOTE: For stable local testing we disable the auto-reloader and debug mode
    # so the process remains in a single running instance that tests can reliably target.
    app.run(host='127.0.0.1', port=5000, debug=True, use_reloader=False, threaded=True)
