# SmartKinetoFit — Mobile app (Expo / React Native)

Cross-platform app with **role-based navigation** (Trainer vs Patient), JWT auth against the
Django backend, and secure token storage. See top-level `PLAN.md` for the full roadmap.

## Run it

1. Start the backend first (see `../backend/README.md`) so the API is reachable.
2. Install deps (already done if scaffolded): `npm install`
3. Start the dev server:

```powershell
npm run start          # then press 'a' for Android, or scan the QR with a device
# or directly:
npm run android        # launches in the Android emulator
```

### Talking to the backend
`src/config.ts` sets the API URL per platform:
- **Android emulator** → `http://10.0.2.2:8000` (maps to your PC's localhost).
- **Physical device** → change the host to your computer's **LAN IP** (e.g.
  `http://192.168.1.42:8000`) and make sure the phone is on the same network. Also add that
  host to `DJANGO_ALLOWED_HOSTS` in `backend/.env`.

> **Bluetooth note:** the BLE features (M3+) require a **physical Android phone** with a
> custom dev client — emulators cannot use real Bluetooth, and BLE native modules don't run
> in Expo Go. We'll add `expo-dev-client` + `react-native-ble-plx` at that milestone.

## Structure

```
app/
  App.tsx                     providers + StatusBar
  src/
    config.ts                 API base URL per platform
    api/client.ts             typed fetch wrapper (auth endpoints)
    auth/AuthContext.tsx      session state + SecureStore token persistence
    navigation/RootNavigator  auth gate -> Trainer | Patient stacks
    components/ui.tsx          shared Button / Field / Card
    screens/
      LoginScreen, RegisterScreen
      trainer/TrainerHomeScreen
      patient/PatientHomeScreen
    theme.ts
```

## What works now (M0)
- Register (choose Patient or Trainer), log in, session restored on relaunch, log out.
- The app routes to the Trainer or Patient dashboard based on the role in the JWT.
- Dashboards list upcoming features tagged with their milestone.
