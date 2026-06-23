# SmartKinetoFit — Backend (Django)

Django + DRF API with JWT auth, role-based users (Trainer / Patient), and ASGI/Channels
wired for future live training sessions. See the top-level `PLAN.md` for the full spec.

## Quick start (Windows, SQLite — no Docker needed)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API is then at http://127.0.0.1:8000/ — health check: `GET /api/health/`.

> Note: `runserver` uses Daphne (ASGI) automatically because `daphne` is the first
> installed app, so WebSockets are supported in dev too.

## Full stack (Postgres + Redis)

```powershell
docker compose up -d        # from repo root
# in backend/.env set:
#   DB_ENGINE=postgres
#   USE_REDIS_CHANNELS=true
python manage.py migrate
```

Run Celery worker (when background tasks are added):

```powershell
.\.venv\Scripts\Activate.ps1
celery -A config worker -l info -P solo   # -P solo for Windows
```

## API (M0)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/api/health/` | none | service check |
| POST | `/api/auth/register/` | none | create user (role: TRAINER\|PATIENT) |
| POST | `/api/auth/login/` | none | obtain JWT access + refresh (+ user info) |
| POST | `/api/auth/refresh/` | none | refresh access token |
| GET  | `/api/auth/me/` | Bearer | current user |

Example register:

```json
POST /api/auth/register/
{ "email": "pat@example.com", "full_name": "Pat", "role": "PATIENT", "password": "S3cret!pass" }
```

## Project layout

```
backend/
  config/        settings, urls, asgi (Channels), celery, ws routing
  accounts/      custom User + roles, profiles, JWT auth endpoints
  requirements.txt
```
