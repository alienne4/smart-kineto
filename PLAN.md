  # SmartKinetoFit — Project Plan & Technical Specification

> Status: **Draft for discussion**. No application code yet — this document defines the
> architecture, data model, protocols, and roadmap so we can agree before building.

---

## 1. Product overview

A mobile app for guided kinesiotherapy with two roles:

- **Trainer (admin / kinesiotherapist):** creates exercises and training programs, records
  reference motions, assigns programs to patients, and tracks each patient's progress.
- **Patient (user):** completes periodic self-assessments, follows assigned programs, and
  performs exercises while a Bluetooth motion sensor streams their movement to be scored
  against the trainer's reference (a "Just Dance"–style match).

### Confirmed decisions
| Topic | Decision |
|---|---|
| Smart device | **Custom hardware** (ESP32 + IMU). We own the firmware and BLE protocol. |
| Platforms | **Android + iOS** via Expo (Android local on Windows, iOS via EAS cloud build). |
| Movement scoring | **Server-side** — phone streams sensor data to Django; backend scores. |
| Training content | Trainer **records a reference motion** (video + voiceover + sensor track). |
| Sensors (MVP) | **One sensor** on a single limb. |
| Connectivity | **Online-only** sessions for the MVP (no offline capture yet). |
| Onboarding | **Open self-signup**, patient then links to a trainer. |
| First deliverable | This **plan/spec + data model**, then scaffold **M0**. |

---

## 2. Technology stack

### Mobile app
- **React Native + Expo** using **prebuild + a custom dev client** (NOT Expo Go, because we
  need native modules).
- Key libraries:
  - `react-native-ble-plx` — Bluetooth Low Energy.
  - `expo-av` / `react-native-video` — video playback + voiceover audio.
  - `expo-notifications` — push notifications (FCM + APNs via Expo push service).
  - `@react-navigation/*` — navigation, with role-based navigators.
  - `@tanstack/react-query` — server state / caching.
  - `zustand` or Redux Toolkit — local/session state (BLE connection, live session).
  - `react-native-reanimated` — smooth feedback UI.

### Backend
- **Django + Django REST Framework (DRF)** — REST API.
- **djangorestframework-simplejwt** — JWT auth with a `role` claim.
- **Django Channels + Daphne/Uvicorn (ASGI)** — WebSockets for live sensor streaming &
  scoring feedback.
- **PostgreSQL** — primary database.
- **Redis** — Channels layer + Celery broker.
- **Celery** — background jobs (push dispatch, post-session scoring, reminders).
- **Media storage** — local filesystem in dev; S3-compatible bucket in prod (videos/audio/
  reference tracks).
- **Scoring**: NumPy + `fastdtw` (or a custom DTW) over orientation sequences.

### Firmware (custom device)
- **ESP32** (BLE built-in) + IMU with on-chip fusion (recommended **BNO055** or **ICM-20948**)
  → outputs **quaternions** (absolute orientation), much more robust than raw accel/gyro.
- Streams orientation frames over a custom BLE GATT service (spec in §8).

---

## 3. System architecture & data flow

```
                         REST (HTTPS)            ┌───────────────────────────────┐
   ┌──────────────┐  ───────────────────────►   │  DJANGO (ASGI)                │
   │  MOBILE APP   │                              │                               │
   │              │  WebSocket (WSS)             │  • DRF REST API               │
   │  Trainer view │ ◄──────────────────────►    │  • Channels consumers (live)  │
   │  Patient view │   live sensor + feedback     │  • Scoring engine (DTW)       │
   └──────┬───────┘                              │  • Celery workers             │
          │ BLE notify (quaternions)             └──────┬───────────────┬────────┘
          ▼                                              │               │
   ┌──────────────┐                                 PostgreSQL        Redis
   │ ESP32 + IMU  │                                 (data)          (channels +
   │  sensor      │                                 Media store      celery)
   └──────────────┘                                 (video/audio)        │
                                                                          ▼
                                                          Expo Push → FCM / APNs
```

### Two key flows

**A) Trainer records a reference motion**
1. Trainer opens "New exercise", connects the sensor over BLE.
2. App records video (camera) **and** the BLE orientation stream simultaneously, tagging both
   with a shared monotonic timeline (so frame N of sensor ↔ time T of video).
3. On stop: upload video + optional separate voiceover + the reference sensor track to Django.
4. Backend stores the `Exercise`, its media, and the `ReferenceMotion` time-series.

**B) Patient performs an exercise (live, server-scored)**
1. Patient opens an assigned exercise; app connects the sensor and the video plays with
   voiceover.
2. App opens a WebSocket to the session consumer and streams sensor frames (batched).
3. Backend aligns incoming frames to the reference (rolling DTW), computes a running score,
   and pushes **feedback events** back over the same socket (e.g., "raise arm higher",
   live % match).
4. On finish, backend computes the authoritative final score + per-segment breakdown and
   stores an `ExerciseAttempt`; results sync to the trainer.

> **Latency note (important for the "Just Dance" feel):** true frame-tight feedback over a
> network is hard. Plan: server pushes feedback on a ~200–300 ms cadence (good enough for
> coaching cues), and the **authoritative score** is computed at the end via full-sequence
> DTW. Optional later optimization: a lightweight on-device "are you moving / liveness" check
> for instant visual response, with the server remaining the source of truth.

---

## 4. Roles & permissions

| Capability | Trainer | Patient |
|---|---|---|
| Create/edit exercises & record reference motions | ✅ | ❌ |
| Create training programs & assign to patients | ✅ | ❌ |
| View list of own patients & their progress | ✅ | ❌ |
| Be assigned to / managed by a trainer | ❌ | ✅ |
| Submit self-assessments | ❌ | ✅ |
| Perform exercises (BLE + live scoring) | ✅ (for recording) | ✅ |
| View own attempts / scores / history | ✅ (all patients) | ✅ (self only) |

Enforced via DRF permissions keyed off `user.role` + object-level ownership
(patient ↔ trainer relationship).

---

## 5. Data model

> Field tables below are the design; exact Django models will be written in the build phase.

### Accounts
**`User`** (custom user, email login)
| field | type | notes |
|---|---|---|
| id | UUID PK | |
| email | email, unique | login |
| role | enum | `TRAINER` \| `PATIENT` |
| full_name | str | |
| is_active / is_staff | bool | |
| date_joined | datetime | |

**`TrainerProfile`** (1–1 User where role=TRAINER): clinic, specialty, bio.
**`PatientProfile`** (1–1 User where role=PATIENT):
| field | type | notes |
|---|---|---|
| assigned_trainer | FK→User(TRAINER) | who tracks them |
| date_of_birth, sex, height, weight | | basic clinical context |
| diagnosis / condition_notes | text | |

### Exercises & reference motion
**`Exercise`**
| field | type | notes |
|---|---|---|
| id | UUID | |
| created_by | FK→User(TRAINER) | |
| title, description | | |
| body_part | enum/tags | shoulder, knee, etc. |
| difficulty | enum | easy/med/hard |
| video | file | demo video |
| voiceover | file (nullable) | optional separate audio |
| thumbnail | file | |
| sensor_placement | enum | where the device is worn |
| created_at | datetime | |

**`ReferenceMotion`** (1–1 or 1–many with Exercise, for re-records)
| field | type | notes |
|---|---|---|
| exercise | FK→Exercise | |
| sample_rate_hz | int | e.g. 50 |
| duration_ms | int | |
| data | file/jsonb | quaternion (+optional accel) time-series |
| schema_version | int | for format evolution |

### Programs (the "trainings")
**`TrainingProgram`**
| field | type | notes |
|---|---|---|
| created_by | FK→User(TRAINER) | |
| name, description | | |
| is_template | bool | reusable vs assigned |

**`ProgramExercise`** (through / ordering)
| field | type | notes |
|---|---|---|
| program | FK→TrainingProgram | |
| exercise | FK→Exercise | |
| order | int | |
| sets, reps | int | |
| target_score | int (nullable) | pass threshold |

**`ProgramAssignment`**
| field | type | notes |
|---|---|---|
| program | FK→TrainingProgram | |
| patient | FK→User(PATIENT) | |
| assigned_by | FK→User(TRAINER) | |
| start_date, end_date | date | |
| schedule | jsonb | e.g. days/week, reminders |
| status | enum | active/paused/done |

### Self-assessment
**`Assessment`**
| field | type | notes |
|---|---|---|
| patient | FK→User(PATIENT) | |
| created_at | datetime | |
| pain_level | int 0–10 | VAS scale |
| mobility_score | int | |
| answers | jsonb | flexible questionnaire |
| notes | text | |

### Sessions & attempts
**`TrainingSession`** (one sitting)
| field | type | notes |
|---|---|---|
| patient | FK | |
| assignment | FK (nullable) | |
| started_at / ended_at | datetime | |
| status | enum | in_progress/completed/abandoned |

**`ExerciseAttempt`**
| field | type | notes |
|---|---|---|
| session | FK→TrainingSession | |
| exercise | FK→Exercise | |
| reference_motion | FK→ReferenceMotion | which version scored against |
| final_score | float | 0–100 |
| segment_scores | jsonb | per-phase breakdown for feedback |
| sensor_capture | file (nullable) | patient's raw track (for review) |
| completed | bool | |
| created_at | datetime | |

### Notifications & devices
**`DeviceToken`**: user FK, expo_push_token, platform, last_seen.
**`Notification`**: recipient FK, type (assignment / reminder / progress / assessment_due),
payload jsonb, created_at, read_at, sent_at.

---

## 6. REST API surface (initial)

```
Auth
  POST /api/auth/register/            (role chosen at signup or trainer-invites)
  POST /api/auth/login/               -> access + refresh JWT
  POST /api/auth/refresh/
  POST /api/devices/                  register Expo push token

Trainer
  CRUD /api/exercises/                + media upload, reference-motion upload
  CRUD /api/programs/  /api/programs/{id}/exercises/
  POST /api/assignments/              assign program to patient
  GET  /api/patients/                 my patients
  GET  /api/patients/{id}/progress/   attempts, assessments, trends

Patient
  GET  /api/me/assignments/           my programs
  GET  /api/exercises/{id}/           detail + media URLs + reference meta
  POST /api/assessments/              submit self-assessment
  POST /api/sessions/                 start a session
  GET  /api/me/history/               my attempts & scores
```

WebSocket (Channels):
```
WSS /ws/session/{session_id}/   bidirectional: client streams sensor frames,
                                server streams feedback + running score.
```

---

## 7. Realtime / WebSocket protocol (live session)

Client → server (batched every ~100 ms):
```json
{ "type": "frames", "t0_ms": 12340, "rate_hz": 50,
  "q": [[w,x,y,z], ...], "exercise_id": "..." }
```
Server → client:
```json
{ "type": "feedback", "t_ms": 12500, "running_score": 78,
  "cue": "raise_left_arm", "match_pct": 0.78 }
{ "type": "final", "score": 84, "segments": [...] }
```

---

## 8. BLE GATT protocol (custom ESP32 device)

Custom service (128-bit UUID, TBD):
| Characteristic | Props | Payload |
|---|---|---|
| Orientation | Notify | packed frames: `seq(u16) | t_ms(u32) | quat w,x,y,z (int16 ×4, scaled)` — batch several per notification to fit MTU |
| Control | Write | start/stop streaming, set rate, calibrate, zero |
| Battery | Read/Notify | standard battery service |
| Device info | Read | firmware version, sensor type |

- Target rate: **50 Hz** (tunable 25–100). Batch frames per BLE notification to respect MTU
  (~180–240 bytes after negotiation).
- Firmware does fusion on the IMU (BNO055) and sends normalized quaternions.
- A calibration / "zero pose" step at session start aligns the patient's sensor frame to the
  reference's frame.

---

## 9. Scoring engine (server-side)

1. **Resample** both reference and patient quaternion streams to a common rate.
2. **Align** with **Dynamic Time Warping** (handles patients moving faster/slower).
3. **Distance metric**: quaternion **geodesic distance** per aligned pair (angle between
   orientations), optionally weighted by exercise phase.
4. **Score** = mapping of mean aligned distance → 0–100 (smaller distance → higher score).
5. **Segment breakdown**: split the reference timeline into phases; report per-segment scores
   to drive specific coaching cues ("hold at top longer", "left arm 20° off").
6. Running feedback uses a windowed/online DTW; final score uses the full sequence in Celery.

Edge cases: dropped BLE frames (interpolate / flag), sensor disconnect (pause + resume),
miscalibration (reject + prompt re-zero).

---

## 10. Push notifications

- App registers an **Expo push token** per device (`/api/devices/`).
- Django enqueues Celery tasks that call the **Expo Push API**, which fans out to FCM
  (Android) / APNs (iOS).
- Triggers: new program assigned, scheduled exercise reminders, assessment-due reminders,
  trainer alerts (patient completed / score below threshold / missed sessions).
- Prod prerequisites: FCM project (Android) and an Apple Developer account + APNs key (iOS).

---

## 11. Mobile app structure & screens

```
src/
  api/            REST + WS clients, react-query hooks
  auth/           login, token storage, role gate
  ble/            BLE manager (scan, connect, subscribe, calibrate)
  features/
    trainer/      exercise editor, reference recorder, programs, patients, progress
    patient/      home, assignments, exercise player + live scoring, assessments, history
  components/     shared UI
  navigation/     RoleNavigator -> TrainerStack | PatientStack
```

Notable screens:
- **Trainer:** Patient list & detail (progress charts), Exercise editor, **Reference recorder**
  (camera + BLE capture), Program builder, Assignments.
- **Patient:** Home/today, **Exercise player** (video + voiceover + live BLE scoring HUD),
  Self-assessment form, History/progress.

---

## 12. Dev environment (Windows + Cursor)

One-time installs:
- **git**, **Android Studio** (SDK + emulator), **Python 3.12** (present), **Node** (present),
- **PostgreSQL** + **Redis** (Docker Desktop recommended to run both easily),
- **Expo CLI / EAS CLI** (`npm i -g eas-cli`).

Run loop (from Cursor's integrated terminal):
- Backend: `python manage.py runserver` (+ `daphne`/`uvicorn` for ASGI, Redis, Celery worker).
- App UI: `npx expo run:android` → Android **emulator** (fine for UI).
- **BLE/sensor testing: requires a physical Android phone** (USB debugging) — emulators
  cannot use real Bluetooth. iOS builds go through **EAS Build** (cloud) since you're on
  Windows.

---

## 13. Phased roadmap

- **M0 — Scaffolding:** init git, Django project + DRF + custom User/roles + JWT; Expo app with
  role-based navigation and login. Docker for Postgres/Redis. *(hello-world end to end)*
- **M1 — Content (no BLE):** Exercise + media upload, program builder, assignment; patient can
  view assigned programs and play video+voiceover.
- **M2 — Assessments + push:** self-assessment flow; Expo push token registration + assignment/
  reminder notifications.
- **M3 — BLE bring-up:** ESP32 firmware + GATT; app connects, calibrates, displays live
  orientation. (Parallel hardware track.)
- **M4 — Reference recording:** trainer records video + synced sensor track; store
  `ReferenceMotion`.
- **M5 — Live scoring:** WebSocket session consumer + DTW scoring + feedback HUD + attempt
  storage + trainer progress views.
- **M6 — Polish & iOS:** EAS iOS build, error handling, offline buffering, analytics.

---

## 14. Open questions / risks

**Resolved for MVP:**
- ✅ **Sensor count:** one sensor on a single limb.
- ✅ **Connectivity:** online-only sessions (offline capture deferred).
- ✅ **Onboarding:** open self-signup; patient links to a trainer afterward.

**Still open:**
1. **IMU choice:** BNO055 (easy, on-chip fusion, quaternions) vs ICM-20948 (cheaper, fuse
   ourselves). Recommend BNO055 for MVP.
2. **Self-assessment content:** which clinical scales/questionnaires (VAS pain, ROM, custom)?
3. **Video recording vs upload:** record in-app only, or also allow uploading existing files?
4. **Data/privacy:** health data implies retention + consent considerations (GDPR-style).
5. **Trainer linking UX:** how a patient discovers/selects their trainer at signup (search,
   code, admin-assign).
```

---
*Next step after we align on the open questions: I'll scaffold M0 (git init, Django + DRF + JWT
roles, Expo app with role navigation, Docker for Postgres/Redis).*
