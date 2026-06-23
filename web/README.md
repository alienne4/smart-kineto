# SmartKinetoFit — Web

React + Vite + TypeScript single-page app that talks to the same Django REST API as the
mobile app. It mirrors every app feature (trainer + patient) and adds an **admin dashboard**.

## Run it

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173.

By default the app calls the API at `http://<current-host>:8000/api`. To point elsewhere,
create `web/.env` with:

```
VITE_API_URL=http://192.168.1.50:8000/api
```

Make sure the Django backend is running (`python manage.py runserver 0.0.0.0:8000`).

## Roles

- **Patient** — dashboard, assigned programs + exercise player, progress check-ins, news/events,
  chat with trainer, notifications, pick a trainer.
- **Trainer** — dashboard, exercise & program library (mine + predefined), create/edit/publish,
  find & add patients, patient detail with assessment charts, assign programs, chat, notifications.
- **Admin** (Django superuser / `is_staff`) — sees all trainer features **plus** an Admin section:
  platform stats, review queue (approve/reject published exercises & programs), news & events
  management, and a users table.

## Creating an admin

```bash
cd backend
.\.venv\Scripts\python.exe manage.py createsuperuser
```

Log in with that account on the website to access the **Admin** section in the sidebar.
```
