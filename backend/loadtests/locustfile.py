r"""Locust stress / load tests for the SmartKinetoFit backend.

Each simulated user self-registers and logs in (real JWT) on start, then runs a
realistic, weighted mix of read/write API calls. Two user personas are modelled:

* ``PatientUser``  — browses programs/exercises, submits assessments, chats with
  the AI assistant, reads notifications and the content feed.
* ``TrainerUser``  — manages their library (creates exercises/programs), searches
  patients, assigns programs, reads notifications.

Run the web UI:

    cd backend
    .\.venv\Scripts\Activate.ps1
    pip install -r requirements-dev.txt
    locust -f loadtests/locustfile.py --host http://127.0.0.1:8000

Then open http://localhost:8089 and set the number of users / spawn rate.

Headless example (200 users, spawn 20/s, run 2 minutes):

    locust -f loadtests/locustfile.py --host http://127.0.0.1:8000 \
        --headless -u 200 -r 20 -t 2m --csv results

Tip: seed the library first so read endpoints return data:

    python manage.py seed_library
    python manage.py seed_content
"""
import random
import uuid

from locust import HttpUser, between, task

PASSWORD = "S3cret!load1"

# A small body of text the assistant can parse into a real proposal.
ASSISTANT_PROMPTS = [
    "My right knee hurts about 6/10, I want to improve mobility.",
    "Shoulder pain 4/10 after lifting, need to rebuild strength.",
    "Lower back is stiff in the morning, pain around 3.",
    "Sprained ankle, swelling and pain 7/10.",
    "Neck feels tight from desk work, mild ache.",
]


class _AuthedUser(HttpUser):
    """Base class: registers + logs in a unique user, stores the JWT header."""

    abstract = True
    role = "PATIENT"

    def on_start(self):
        self.email = f"load_{self.role.lower()}_{uuid.uuid4().hex[:12]}@example.com"
        self.token = None
        self.auth = {}
        self._register_and_login()

    def _register_and_login(self):
        with self.client.post(
            "/api/auth/register/",
            json={
                "email": self.email,
                "full_name": f"Load {self.role.title()}",
                "role": self.role,
                "password": PASSWORD,
            },
            name="/api/auth/register/",
            catch_response=True,
        ) as resp:
            # 201 expected; 400 means a (very unlikely) email collision — retry once.
            if resp.status_code not in (201, 400):
                resp.failure(f"register -> {resp.status_code}")
                return
            resp.success()

        with self.client.post(
            "/api/auth/login/",
            json={"email": self.email, "password": PASSWORD},
            name="/api/auth/login/",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                self.token = resp.json().get("access")
                self.auth = {"Authorization": f"Bearer {self.token}"}
                resp.success()
            else:
                resp.failure(f"login -> {resp.status_code}")

    def _get(self, path, name=None):
        if not self.token:
            return None
        return self.client.get(path, headers=self.auth, name=name or path)

    def _post(self, path, payload, name=None):
        if not self.token:
            return None
        return self.client.post(path, json=payload, headers=self.auth, name=name or path)


class PatientUser(_AuthedUser):
    """A patient using the mobile app: mostly reads, some writes."""

    role = "PATIENT"
    weight = 3
    wait_time = between(1, 4)

    @task(5)
    def view_me(self):
        self._get("/api/auth/me/")

    @task(6)
    def browse_assigned_programs(self):
        self._get("/api/programs/")

    @task(4)
    def browse_public_programs(self):
        self._get("/api/programs/public/")

    @task(4)
    def browse_exercises(self):
        self._get("/api/exercises/")

    @task(4)
    def my_assignments(self):
        self._get("/api/assignments/")

    @task(3)
    def read_notifications(self):
        self._get("/api/notifications/")

    @task(3)
    def read_feed(self):
        self._get("/api/content/feed/")

    @task(2)
    def chat_threads(self):
        self._get("/api/chat/threads/")

    @task(2)
    def submit_assessment(self):
        self._post(
            "/api/assessments/",
            {
                "pain_level": random.randint(0, 10),
                "mobility_score": random.randint(0, 10),
                "notes": "load-test self assessment",
            },
        )

    @task(1)
    def ask_assistant(self):
        self._post(
            "/api/assistant/chat/",
            {"content": random.choice(ASSISTANT_PROMPTS)},
        )

    @task(1)
    def self_assign_public_program(self):
        resp = self._get("/api/programs/public/", name="/api/programs/public/")
        if resp is None or resp.status_code != 200:
            return
        programs = resp.json()
        if not programs:
            return
        program = random.choice(programs)
        self._post(
            f"/api/programs/{program['id']}/self_assign/",
            {},
            name="/api/programs/[id]/self_assign/",
        )


class TrainerUser(_AuthedUser):
    """A trainer authoring content and managing patients."""

    role = "TRAINER"
    weight = 1
    wait_time = between(1, 5)

    def on_start(self):
        super().on_start()
        self.exercise_ids = []

    @task(4)
    def view_me(self):
        self._get("/api/auth/me/")

    @task(6)
    def browse_exercise_library(self):
        resp = self._get("/api/exercises/")
        if resp is not None and resp.status_code == 200:
            self.exercise_ids = [e["id"] for e in resp.json()][:10]

    @task(5)
    def browse_programs(self):
        self._get("/api/programs/")

    @task(3)
    def list_my_patients(self):
        self._get("/api/patients/")

    @task(2)
    def search_patients(self):
        self._get(
            f"/api/patients/search/?q={random.choice(['a', 'e', 'load', 'test'])}",
            name="/api/patients/search/?q=[q]",
        )

    @task(3)
    def read_notifications(self):
        self._get("/api/notifications/")

    @task(2)
    def create_exercise(self):
        resp = self._post(
            "/api/exercises/",
            {
                "title": f"Load Exercise {uuid.uuid4().hex[:6]}",
                "description": "Created by locust",
                "body_part": random.choice(["KNEE", "SHOULDER", "BACK", "HIP", "ANKLE"]),
                "difficulty": random.choice(["EASY", "MEDIUM", "HARD"]),
            },
        )
        if resp is not None and resp.status_code == 201:
            self.exercise_ids.append(resp.json()["id"])

    @task(1)
    def create_program(self):
        items = []
        if self.exercise_ids:
            chosen = random.sample(
                self.exercise_ids, k=min(3, len(self.exercise_ids))
            )
            items = [
                {"exercise_id": eid, "order": i, "sets": 3, "reps": 10}
                for i, eid in enumerate(chosen)
            ]
        self._post(
            "/api/programs/",
            {
                "name": f"Load Program {uuid.uuid4().hex[:6]}",
                "description": "Created by locust",
                "program_exercises": items,
            },
        )


class AnonymousUser(HttpUser):
    """Unauthenticated traffic hammering the public health endpoint."""

    weight = 1
    wait_time = between(2, 6)

    @task
    def health(self):
        self.client.get("/api/health/")
