# SmartKinetoFit — Backend (Django)

Django + DRF API with JWT auth, role-based users (Trainer / Patient, plus staff-flag Admins),
and ASGI/Channels wired via Daphne. Serves both the Expo mobile app (`../app`) and the Vite web
app (`../web`). See the top-level `README.md` for the app inventory and how this diverges from
the original `PLAN.md` draft (notably: no BLE/ESP32 hardware — patient movement is analysed from
an uploaded video via the `pose` app's MediaPipe pipeline, not a physical sensor).

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

## Auth

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/api/health/` | none | service check |
| POST | `/api/auth/register/` | none | create user (role: TRAINER\|PATIENT) |
| POST | `/api/auth/login/` | none | obtain JWT access + refresh (+ user info) |
| POST | `/api/auth/refresh/` | none | refresh access token |
| GET  | `/api/auth/me/` | Bearer | current user (`is_admin` reflects `is_staff`) |

Example register:

```json
POST /api/auth/register/
{ "email": "pat@example.com", "full_name": "Pat", "role": "PATIENT", "password": "S3cret!pass" }
```

Every other domain endpoint (training/exercises/programs, assessments, chat, content,
notifications, admin, assistant, pose) is mounted under `/api/` by the app of the same name in
`config/urls.py` — read each app's `urls.py`/`views.py` for the exact routes; there's no
generated API doc yet.

## Project layout

```
backend/
  config/          settings, urls, asgi (Channels), celery, ws routing
  accounts/        custom User + roles, profiles, JWT auth endpoints
  training/        Exercise, TrainingProgram, ProgramExercise, ProgramAssignment
  assessments/     patient self-assessment / check-in records
  pose/            PoseJob + MediaPipe pose-landmarker video processing pipeline
  assistant/       rule-based chat assistant (training program recommender)
  chat/            trainer <-> patient messaging
  content/         Announcement (news/events)
  notifications/   push device tokens + in-app notification feed
  adminapi/        staff-only stats, review queue, user list, announcement admin
  ml_models/       MediaPipe pose-landmarker model file(s) used by pose/
  requirements.txt
```
