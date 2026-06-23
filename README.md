# SmartKinetoFit

A mobile app for guided kinesiotherapy with two roles — **Trainer** (kinesiotherapist) and
**Patient** — backed by a Django API. Patients follow video+voiceover exercises while a custom
Bluetooth motion sensor streams their movement to be scored against the trainer's recorded
reference (a "Just Dance"–style match).

> 📋 Full architecture, data model, protocols, and roadmap: see **[`PLAN.md`](./PLAN.md)**.

## Repo layout

```
SmartKinetoFit/
  PLAN.md            project plan & technical spec (read this first)
  docker-compose.yml optional Postgres + Redis for full-stack dev
  backend/           Django + DRF + Channels API   (see backend/README.md)
  app/               Expo / React Native mobile app (see app/README.md)
```

## Current status — M0 scaffold (done)
- **Backend:** custom role-based user (Trainer/Patient), JWT auth (`register` / `login` /
  `refresh` / `me`), DRF, ASGI + Channels wired, SQLite by default (Postgres via Docker).
- **App:** Expo + TypeScript, secure JWT storage, **role-based navigation** routing to the
  Trainer or Patient dashboard, auth screens. Bundles and typechecks cleanly.

## Quick start

```powershell
# 1) Backend (terminal A)
cd backend
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver

# 2) App (terminal B)
cd app
npm install
npm run android        # Android emulator, or `npm run start` and scan QR on a device
```

## Roadmap (next)
M1 content/video → M2 assessments + push → M3 BLE (ESP32) → M4 reference recording →
M5 live scoring (WebSocket + DTW) → M6 iOS via EAS + polish.

## Notes for development
- **iOS** builds require macOS/Xcode or **EAS Build** (cloud); Android is fully local on Windows.
- **Bluetooth** features need a **physical Android phone** — emulators can't do real BLE.
