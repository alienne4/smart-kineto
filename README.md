# SmartKinetoFit

A rehabilitation/kinesiotherapy platform with three surfaces sharing one Django API:

- **`app/`** — Expo/React Native mobile app for **Patients** and **Trainers**.
- **`web/`** — Vite/React web app for **Patients**, **Trainers**, and **Admins**.
- **`backend/`** — Django + DRF (+ Channels) API used by both.

Trainers build exercises and multi-week training programs and assign them to patients.
Patients follow the assigned exercises, record a short video of themselves performing the
movement, and get it analysed by a server-side **MediaPipe pose pipeline** (skeleton overlay +
rep/ROM extraction) instead of the physical BLE sensor originally scoped in `PLAN.md` — see
[Status](#status--deviations-from-plan) below. Patients also get an AI assistant (rule-based
exercise recommender), progress tracking, in-app messaging with their trainer, push/in-app
notifications, and a news/announcements feed. Admins (Django `is_staff` users) get a review
queue, user list, and announcements management on the web app.

> 📋 Original architecture/spec draft: **[`PLAN.md`](./PLAN.md)** (see Status section for how the
> shipped implementation diverges from it).

## Repo layout

```
SmartKinetoFit/
  PLAN.md              original architecture/spec draft (partially superseded, see Status)
  docker-compose.yml   optional Postgres + Redis for full-stack dev
  backend/             Django + DRF + Channels API        (see backend/README.md)
  app/                 Expo / React Native mobile app (Patient + Trainer)
  web/                 Vite / React web app (Patient + Trainer + Admin)
  Figma UI/            Figma Make export — source of truth for the current visual design system
```

## Backend apps (`backend/`)

| App | Purpose |
|---|---|
| `accounts` | Custom UUID-keyed user, `role` (`TRAINER`/`PATIENT`), JWT auth (register/login/refresh/me). Admin = Django `is_staff`, not a separate role. |
| `training` | `Exercise`, `TrainingProgram`, `ProgramExercise`, `ProgramAssignment` — the exercise library, programs, and per-patient assignment/status/review workflow. |
| `assessments` | Patient self-assessment / check-in records (pain, mobility, etc.). |
| `pose` | `PoseJob` + MediaPipe Pose Landmarker pipeline — processes an uploaded exercise video into a skeleton-overlay clip, run in a background thread and polled by the client. |
| `assistant` | Rule-based chat assistant (`assistant/recommend.py`) — parses the conversation + latest assessment to detect body part/pain/goal and proposes exercises from `training`. Designed to be swappable for an LLM later. |
| `chat` | Trainer ↔ patient direct messaging. |
| `content` | `Announcement` (news/events, audience-targeted, pinned/published flags). |
| `notifications` | Push `DeviceToken` registration + in-app `Notification` feed. |
| `adminapi` | Staff-only endpoints: platform stats, review queue, user list, announcement management. |
| `config` | Settings, URL root, ASGI/Channels wiring, Celery config. |

## Current status

- **Backend:** all apps above are implemented and wired into `config/urls.py`; JWT auth, ASGI
  (Channels/Daphne) enabled by default in dev.
- **Mobile (`app/`):** full patient + trainer navigation and screens (home, programs, exercise
  player + video capture, progress, AI assistant, chat, profile, notifications, news, and the
  trainer-side exercise/program/patient management flows).
- **Web (`web/`):** full patient + trainer + admin page set, mirroring the mobile feature set
  plus the admin console (review queue, announcements, users).
- **Visual design:** both `app/` and `web/` are mid-rollout of a redesign to match the
  `Figma UI/` export — a dark editorial system (Barlow Condensed / JetBrains Mono / Inter,
  lime accent, sharp corners, lucide icon set) with a cream/light variant on select screens.
  Shared theme/UI primitives (`app/src/theme.ts`, `app/src/components/ui.tsx`,
  `web/src/index.css`, `web/src/components/ui.tsx`) are done; page-by-page rollout across the
  web app is still in progress.

### Status — deviations from `PLAN.md`

`PLAN.md` is the original pre-build spec and is no longer fully accurate:

- **No BLE/ESP32/IMU hardware.** The plan called for a custom ESP32+IMU sensor streaming
  motion data over BLE for server-side DTW scoring. That was **not built** — movement analysis
  instead runs on a video the patient records in-app, processed server-side by MediaPipe Pose
  Landmarker (`backend/pose/`). Any BLE/ESP32/MPU6050 references in the new `Figma UI/` mockups
  are aspirational design copy, not implemented functionality — don't treat them as real when
  building UI against live data.
- **Web app** (`web/`) exists and is a first-class surface with its own Admin role; the original
  plan only scoped the mobile app.
- **Admin** is a third de-facto role (staff users, `adminapi`), not mentioned in the original
  two-role (Trainer/Patient) plan.

## Quick start

```powershell
# 1) Backend (terminal A)
cd backend
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver

# 2) Mobile app (terminal B)
cd app
npm install
npm run android        # Android emulator, or `npm run start` and scan QR on a device

# 3) Web app (terminal C)
cd web
npm install
npm run dev             # http://localhost:5173
```

By default the backend runs on SQLite with no Docker required. For Postgres + Redis
(Channels layer, closer to prod), see `backend/README.md` and `docker-compose.yml`.

## Notes for development

- **iOS** mobile builds require macOS/Xcode or **EAS Build** (cloud); Android is fully local on
  Windows via Expo.
- **Video capture/upload** (not BLE) is how patient movement reaches the backend — any device
  with a camera works; no special hardware is required to exercise the full flow.
- `app/AGENTS.md` has a standing instruction to check the exact versioned Expo docs
  (`docs.expo.dev/versions/...`) before relying on any Expo/React Native API from training data,
  since the SDK moves fast.
