# SmartKinetoFit

**Repository:** https://github.com/alienne4/smart-kineto

A connected kinesiotherapy platform that lets a physiotherapist ("Trainer") prescribe exercises
and multi-week training programs to a patient, and lets the patient carry them out under
objective, automated movement assessment — either with a custom Bluetooth motion sensor or with
nothing more than a phone camera. The system is composed of a Django REST/WebSocket API, an Expo
(React Native) mobile app, a React web app, and ESP32-based sensor firmware, and was built as a
diploma project to demonstrate an end-to-end, full-stack telerehabilitation product rather than a
single isolated component.

---

## Table of contents

1. [Motivation](#motivation)
2. [Key features](#key-features)
3. [System architecture](#system-architecture)
4. [Technology stack](#technology-stack)
5. [Repository layout](#repository-layout)
6. [Getting started](#getting-started)
7. [Configuration](#configuration)
8. [Running the test suites](#running-the-test-suites)
9. [Movement-tracking pipelines](#movement-tracking-pipelines)
10. [Roles and permissions](#roles-and-permissions)
11. [Academic context](#academic-context)
12. [License](#license)

---

## Motivation

Home-based physiotherapy commonly suffers from two problems: the patient has no objective
feedback on whether they performed a movement correctly, and the trainer has no visibility into
what happened between clinic visits. SmartKinetoFit addresses both by giving every prescribed
exercise a **quantitative, automated scoring mechanism** — computed either from a purpose-built
IMU sensor or from a recorded video — and by centralising programs, self-assessments, messaging,
and progress history in a single system shared by the trainer, the patient, and a platform
administrator.

## Key features

**Trainer**
- Build a personal exercise library (title, description, body part, difficulty, demo video,
  voiceover, thumbnail) or reuse the shared/public library, and submit exercises for admin review.
- Choose, per exercise, how patient repetitions are validated: with the **hardware wand** (record
  a reference motion once, then every patient repetition is scored against it) or with **camera
  pose tracking** (no reference recording required).
- Compose ordered, multi-exercise **training programs** with sets/reps/targets and assign them to
  specific patients with a schedule.
- Search for and add patients, review each patient's assessment history and progress charts, and
  message them directly.

**Patient**
- Browse and follow assigned programs; play the exercise's demo video with step-by-step written
  instructions.
- Perform an exercise and get feedback on the attempt — an automated, pass/fail similarity score
  for wand-tracked exercises, or a skeleton-overlay recording for camera-tracked ones; see
  [Movement-tracking pipelines](#movement-tracking-pipelines) below for how each works.
- Submit periodic self-assessments (pain level, mobility, free-text notes) and see progress over
  time.
- Chat with their assigned trainer, browse and pick a trainer, receive push and in-app
  notifications, and read platform news/announcements.
- Use a rule-based conversational assistant that reads the chat and the latest self-assessment to
  detect the affected body part, pain level, and goal, and proposes a small set of exercises from
  the library.

**Admin** (Django staff account, surfaced only on the web app)
- Platform-wide statistics dashboard.
- Review queue to approve or reject trainer-submitted exercises and programs before they become
  public.
- User list and announcement (news/events) management.

## System architecture

```
                         REST (HTTPS)                 ┌───────────────────────────────────┐
   ┌───────────────┐  ─────────────────────────────►  │   Django (ASGI, Daphne)            │
   │  Mobile app    │                                  │                                    │
   │  (Expo / RN)   │  BLE (wand IMU frames)            │  • DRF REST API                    │
   │  Trainer view  │ ◄───────────────┐                 │  • Channels (WebSocket) routing     │
   │  Patient view  │                 │                 │  • accounts / training / assessments│
   └───────┬────────┘                 │                 │    pose / wand / assistant / chat /  │
           │                          ┌┴──────────────┐  │    content / notifications / adminapi│
           │ REST (HTTPS)             │  ESP32-S3 +   │  └──────┬───────────────┬─────────────┘
           ▼                         │  MPU6050 wand │         │               │
   ┌───────────────┐                  └───────────────┘     SQLite /        Redis
   │   Web app      │  BLE (Web Bluetooth)     ▲              PostgreSQL   (Channels layer,
   │  (Vite / React)│ ─────────────────────────┘              + media       broker/backend)
   │ Trainer/Patient│                                          storage
   │    /Admin      │
   └───────────────┘
```

Both the mobile app and the web app talk to the **same Django API** over HTTPS/JWT, and both can
pair directly with the wand device over Bluetooth (native BLE via `react-native-ble-plx` on
mobile, Web Bluetooth in supported desktop/Android browsers). The wand streams live IMU samples;
the client buffers each repetition and submits it to the backend, which scores it against a
trainer-recorded reference template. Camera-tracked exercises instead have the patient record a
short clip in-app, which the backend processes with a MediaPipe pose pipeline.

## Technology stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.12, Django 5.1, Django REST Framework, SimpleJWT, Django Channels + Daphne (ASGI/WebSocket), Redis, PostgreSQL (SQLite for local dev), MediaPipe Pose Landmarker, OpenCV, NumPy |
| **Mobile app** | Expo / React Native 0.81, TypeScript, React Navigation, `react-native-ble-plx`, `expo-video`, `expo-notifications`, `expo-secure-store` |
| **Web app** | React 18, TypeScript, Vite, React Router, Recharts, Web Bluetooth API |
| **Firmware** | ESP32-S3 (Arduino framework via PlatformIO), MPU6050 IMU, NimBLE-Arduino (BLE GATT server) |
| **Infra (optional, full stack)** | Docker Compose (PostgreSQL 16 + Redis 7) |

## Repository layout

```
SmartKinetoFit/
  PLAN.md              original architecture/spec draft written before implementation began
  docker-compose.yml   optional Postgres + Redis for full-stack dev
  backend/             Django + DRF + Channels API                  (backend/README.md)
  app/                 Expo / React Native mobile app                (app/README.md)
  web/                 Vite / React web app                          (web/README.md)
  Firmware/            ESP32-S3 + MPU6050 wand firmware (PlatformIO)  (Firmware/README.md)
  Figma UI/            Figma Make export — source of truth for the visual design system
```

### Backend apps (`backend/`)

| App | Responsibility |
|---|---|
| `accounts` | Custom UUID-keyed user model, `role` (`TRAINER`/`PATIENT`), JWT auth (register/login/refresh/me). Admin is a Django `is_staff` flag, not a separate role. |
| `training` | `Exercise`, `TrainingProgram`, `ProgramExercise`, `ProgramAssignment` — the exercise library, program authoring, and per-patient assignment/status/review workflow. |
| `assessments` | Patient self-assessment / check-in records (pain, mobility, free-text notes). |
| `pose` | `PoseJob` + MediaPipe Pose Landmarker pipeline: turns an uploaded exercise video into a skeleton-overlay clip with extracted keypoints. |
| `wand` | `WandReferenceTemplate` / `WandSession` / `WandRepetition` — server-side scoring of hardware-wand repetitions against a trainer-recorded reference (`wand/scoring.py`). |
| `assistant` | Rule-based chat assistant (`assistant/recommend.py`) that reads the conversation and latest assessment to detect body part/pain/goal and proposes exercises from `training`. |
| `chat` | Trainer ↔ patient direct messaging. |
| `content` | `Announcement` (news/events, audience-targeted, pinned/published flags). |
| `notifications` | Push `DeviceToken` registration and the in-app notification feed. |
| `adminapi` | Staff-only endpoints: platform stats, review queue, user list, announcement management. |
| `config` | Settings, URL root, ASGI/Channels wiring. |

## Getting started

### Prerequisites

| Tool | Needed for |
|---|---|
| Python 3.12+ | Backend |
| Node.js 18+ and npm | Mobile app and web app |
| Git | Cloning the repository |
| Android Studio (SDK + emulator) or a physical Android device | Mobile app |
| Docker Desktop (optional) | Full stack with PostgreSQL + Redis instead of SQLite |
| PlatformIO (optional) | Building/flashing the wand firmware |

The backend runs out of the box on **SQLite** with no Docker required; Postgres/Redis are an
opt-in upgrade for a closer-to-production setup (see [Configuration](#configuration)).

### Clone the repository

```bash
git clone https://github.com/alienne4/smart-kineto.git
cd smart-kineto
```

### 1. Backend (Django API)

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

The API is now served at `http://127.0.0.1:8000/`; check `GET /api/health/` to confirm it is up.
`runserver` boots through Daphne (ASGI) automatically, so WebSocket-backed features work in dev
without extra configuration.

### 2. Mobile app (Expo / React Native)

Start the backend first so the API is reachable, then in a second terminal:

```powershell
cd app
npm install
npm run android        # launches in the Android emulator
# or
npm run start           # then press `a` for Android, or scan the QR code with a device
```

`src/config.ts` selects the API host per platform: the Android emulator reaches the backend at
`http://10.0.2.2:8000` automatically; a physical device needs the host changed to your machine's
LAN IP (and that IP added to `DJANGO_ALLOWED_HOSTS` in `backend/.env`).

The BLE wand client (`src/wand/BleWandClient.ts`, built on `react-native-ble-plx`) requires a
native dev-client build and a **physical Android phone** — BLE is not available in Expo Go or on
an emulator. To build the dev client:

```powershell
npx expo prebuild --platform android   # regenerates android/ (gitignored) from app.json
npm run android                        # builds and installs the dev client on the device
```

Under Expo Go the app automatically falls back to a simulated wand client, so every other screen
remains usable without a native build.

### 3. Web app (Vite / React)

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173`. By default the app calls the API at
`http://<current-host>:8000/api`; to point it elsewhere, create `web/.env`:

```
VITE_API_URL=http://192.168.1.50:8000/api
```

The web wand client uses the browser's **Web Bluetooth API**, available in Chromium-based
browsers on desktop and Android (not supported in Safari/iOS).

### 4. Firmware (optional — building the wand hardware)

The wand is an ESP32-S3 devkit with an MPU6050 IMU, built with [PlatformIO](https://platformio.org/):

```bash
cd Firmware
pio run                 # build
pio run -t upload       # flash to the connected board
pio device monitor      # serial console at 115200 baud
```

The device broadcasts as `SmartKineto Wand` over a custom BLE GATT service (contract documented
in `Firmware/README.md`) and simultaneously supports a fully standalone, on-device clinical mode
over USB-serial — a trainer can train and validate a movement template without a phone at all.

### Full stack with PostgreSQL + Redis

```powershell
docker compose up -d        # from the repo root: starts Postgres 16 + Redis 7
```

Then, in `backend/.env`, set:

```
DB_ENGINE=postgres
USE_REDIS_CHANNELS=true
```

and re-run migrations:

```powershell
python manage.py migrate
```

## Configuration

All backend configuration lives in `backend/.env` (copy from `backend/.env.example`):

| Variable | Purpose | Local default |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django cryptographic signing key | dev-only placeholder |
| `DJANGO_DEBUG` | Debug mode toggle | `true` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hostnames | `localhost,127.0.0.1,10.0.2.2` |
| `DB_ENGINE` | `sqlite` or `postgres` | `sqlite` |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_HOST` / `POSTGRES_PORT` | Postgres connection (used when `DB_ENGINE=postgres`) | match `docker-compose.yml` |
| `USE_REDIS_CHANNELS` | Use Redis (instead of the in-memory default) as the Channels layer backend | `false` |
| `REDIS_URL` | Redis connection string (used when `USE_REDIS_CHANNELS=true`) | `redis://127.0.0.1:6379/0` |

The web app reads `VITE_API_URL` from `web/.env` (falls back to `http://<host>:8000/api`); the
mobile app reads its API host from `app/src/config.ts`.

## Running the test suites

Backend unit tests (Django's own test runner, one `tests.py` per app plus a standalone scoring
test module):

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt   # optional: adds coverage + load-testing tooling
python manage.py test
```

To measure coverage:

```powershell
coverage run manage.py test
coverage report
```

The wand scoring algorithm additionally has a pure-NumPy unit test module
(`backend/wand/test_scoring.py`) that is independent of Django and mirrors the on-device firmware
algorithm, so it can be iterated on without a running server.

## Movement-tracking pipelines

Each `Exercise` declares a `tracking_method`, and the patient-facing player adapts accordingly:

- **Hardware wand (`HARDWARE_WAND`).** The trainer performs the movement one or more times while
  wearing the wand; the app streams IMU frames (`t_ms`, roll, pitch, gyro x/y/z at 50 Hz) over
  BLE and the backend resamples and averages them into a single `WandReferenceTemplate`
  (`backend/wand/scoring.py::build_template`). When a patient performs the exercise, each
  repetition is resampled the same way and compared against the template using a weighted
  root-mean-square distance across orientation and angular-velocity channels, plus range-of-motion,
  tempo, and smoothness checks; a repetition is accepted only once it clears a dual threshold
  (`movement_similarity >= 70` and `graph_score >= 75`), otherwise it is rejected with a specific
  reason (e.g. too fast, too short an arc) so the app can prompt the patient to retry. The same
  algorithm exists twice by design: once on the ESP32 firmware itself (`Firmware/src/ExerciseTemplate.cpp`)
  for a fully standalone, no-phone clinical mode, and once in Python (`backend/wand/scoring.py`)
  for the connected app flow — both implement the same weighting and thresholds.
- **Camera pose (`CAMERA_POSE`).** A short video recorded in the app is uploaded to the backend
  and processed, in a background thread, by a MediaPipe Pose Landmarker pipeline
  (`backend/pose/processor.py`): every frame is run through BlazePose, the detected skeleton is
  drawn on top of the frame, and the 33-point landmark sequence is stored alongside the
  re-encoded clip. The client polls the job until it is done and plays back the skeleton-overlay
  result. This is a visual-feedback aid rather than a numeric score — no reference-comparison or
  pass/fail threshold is computed for this method, unlike the wand pipeline — and it needs no
  additional hardware, since any device with a camera can use it.
- **Manual (`MANUAL`).** No automated validation; the exercise is tracked purely by the
  instructions and demo video, for movements that are not well suited to either automated method.

## Roles and permissions

| Capability | Trainer | Patient | Admin (staff) |
|---|:---:|:---:|:---:|
| Create/edit exercises & training programs | ✅ | ❌ | ✅ (own) |
| Record a wand reference template | ✅ | ❌ | ❌ |
| Assign programs to patients | ✅ | ❌ | ❌ |
| Perform exercises (wand / camera) | — | ✅ | — |
| Submit self-assessments | ❌ | ✅ | ❌ |
| Review/approve submitted exercises & programs | ❌ | ❌ | ✅ |
| Platform stats & user list | ❌ | ❌ | ✅ |

Enforced via DRF permission classes keyed off `user.role` (`accounts/models.py`) and object-level
ownership (patient ↔ trainer relationship, `created_by` on exercises/programs).

## Academic context

SmartKinetoFit was developed as a diploma project. `PLAN.md` is the original architecture and
data-model draft written before implementation began, kept in the repository for reference; where
the shipped system differs from that early plan (most notably, the movement-scoring engine grew a
second, camera-based method alongside the originally scoped hardware sensor), this README reflects
the system as actually built and takes precedence.

## License

No open-source license has been assigned to this repository; it is submitted as academic
coursework. Third-party dependencies (Django, React, Expo, MediaPipe, NimBLE-Arduino, etc.) retain
their own respective licenses as declared in `backend/requirements.txt`, `app/package.json`,
`web/package.json`, and `Firmware/platformio.ini`.
