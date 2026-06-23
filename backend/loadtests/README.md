# Load & stress testing (Locust)

[Locust](https://locust.io) drives realistic, concurrent traffic against the
running backend to find throughput limits, latency cliffs and error rates.

## Install

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
```

## Prepare data (recommended)

Seed the library so read endpoints return real payloads:

```powershell
python manage.py migrate
python manage.py seed_library
python manage.py seed_content
```

> For a meaningful stress test, run the server with a production-like setup
> (Postgres + Redis, `DEBUG=false`) rather than SQLite. SQLite serializes
> writes and will bottleneck quickly — useful to *see* the bottleneck, not to
> measure real capacity.

## Run the server

```powershell
python manage.py runserver 0.0.0.0:8000
# or, closer to prod:
# daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

## Run Locust (interactive web UI)

```powershell
locust -f loadtests/locustfile.py --host http://127.0.0.1:8000
```

Open http://localhost:8089, then choose the number of users and spawn rate.

## Run Locust headless (CI / scripted)

```powershell
locust -f loadtests/locustfile.py --host http://127.0.0.1:8000 `
  --headless -u 200 -r 20 -t 2m --csv results
```

- `-u 200` peak concurrent users
- `-r 20` users spawned per second
- `-t 2m` total run time
- `--csv results` writes `results_*.csv` (stats, failures, history)

## Personas

The file defines weighted user classes (see `locustfile.py`):

| Class            | Weight | Behaviour |
|------------------|:------:|-----------|
| `PatientUser`    |   3    | Browse programs/exercises, assignments, feed, notifications; submit assessments; chat with the AI assistant; self-assign public programs. |
| `TrainerUser`    |   1    | Browse + author exercises/programs, search/list patients, read notifications. |
| `AnonymousUser`  |   1    | Hammer the unauthenticated `/api/health/` endpoint. |

Every authenticated user self-registers and logs in on start, so no fixtures
are required — but each run creates new users in the target DB. Use a throwaway
database for load runs.

## Reading results

Watch the **median (p50)** and **95th percentile (p95)** response times and the
**failure rate**. Throughput is reported as RPS. A healthy run keeps failures at
~0% while p95 stays flat as users ramp; rising p95 + climbing failures marks the
saturation point.
