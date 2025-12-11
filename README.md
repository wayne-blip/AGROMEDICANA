# AgroMedicana-MVP

Prototype monolithic codebase for the AgroMedicana platform (Web MVP).

This repository contains a lightweight Flask backend and a Vite + React frontend styled with Tailwind CSS. All mock logic is deliberately simple and contains comments where production code would be required.

Quick overview

- Frontend: `frontend/` (React + Vite + Tailwind)
- Backend: `backend/` (Flask, SQLAlchemy, AI stub)

Requirements

- Python 3.8+ (for backend)
- Node 16+ and npm/yarn (for frontend)

High-level commands

1. Backend: Create virtualenv, install requirements, and run server

PowerShell commands:

```
cd AgroMedicana-MVP/backend
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Initialize DB (first run will create the sqlite file)
python app.py
```

When the backend runs it will create `db.sqlite` and expose APIs on `http://127.0.0.1:5000`.

2. Frontend: Install and run

PowerShell commands:

```
cd ..\frontend
npm install
npm run dev
```

Open the app at the URL shown by Vite (usually `http://localhost:5173`). The frontend expects the backend at `http://127.0.0.1:5000` by default.

Notes and mock behavior

- MOCK: Passwords are hashed using Werkzeug for the prototype (still not production-ready). Do NOT use this approach in production without proper security audits.
- AI/diagnostics are simulated in `backend/ai_service.py` and included in `/api/v1/dashboard/data`.
- Booking a consultation (from the frontend) sends a POST to `/api/v1/consultations` which creates a Consultation record in SQLite and will be returned in the dashboard upcoming consultations.

Seeding

- On first run the backend will create the SQLite database and seed a default client user (`client1` / password `password`) and two example consultations (Veterinarian and Agronomist) so the dashboard shows initial data.

If you want me to (pick one):

- run quick smoke tests, or
- add Docker files for local dev, or
- wire JWT tokens for auth

— End of README
