# EventCapture

EventCapture is an Expo Router nightlife app backed by a FastAPI + YOLOv8 drink detection service. The mobile app focuses on event discovery, social posting, crown rewards, and a camera flow that checks whether a captured drink photo is crown eligible.

## What is in this repo

- A React Native / Expo app with splash, onboarding, login, feed, events, camera, rewards, profile, and settings flows
- A Python detection backend that analyzes drink photos and exposes HTTP + WebSocket endpoints
- A lightweight browser demo in `frontend/` served by the backend for quick detector testing
- Training utilities for exporting a custom YOLO model into `backend/models/drink_detector.pt`

## Current product shape

- The mobile app is the main product surface
- Auth, profiles, events, posts, likes, comments, event planning state, and persisted captures are backend-driven
- AsyncStorage remains only as local session persistence and offline cache, not as the primary production datastore
- Events, posts, and social state now treat the backend as the source of truth and only fall back to cached data when the API is unavailable
- Drink captures are stored by the backend in SQLite plus media files so posted photos survive app restarts and can be reused later
- Crown rewards are awarded and persisted by the backend when qualifying capture posts are created
- Notifications and support requests are backend-backed and survive reloads across devices
- The backend also saves the latest analyzed and annotated frames into `backend/debug/`

## Main app flows

- Splash and onboarding route into login or the authenticated tab experience
- Primary navigation includes feed, events, camera, social, and rewards, while profile lives in the burger menu
- The camera screen captures a photo, sends it to the backend, and routes to a success or fail review screen
- Posting a crown-eligible capture increments backend-backed crown rewards and reward progression
- Admin and support screens use the same backend APIs as the rest of the app, but admin moderation is still intentionally lightweight

## Tech stack

- Expo 54 with Expo Router and React Native 0.81
- FastAPI, Uvicorn, OpenCV, Ultralytics YOLOv8, NumPy, Torch, and SQLite
- AsyncStorage for offline-first local persistence on the app side
- TypeScript on the app side, Python on the detector side

## Quick start

### Prerequisites

- Node.js with npm available on your machine
- Python 3.10+ for the backend
- PowerShell on Windows

### Environment

Copy `.env.example` values into your shell or your preferred environment file setup.

Important frontend variable:

- `EXPO_PUBLIC_BACKEND_API_URL`

Important backend variables:

- `EVENTCAPTURE_SECRET_KEY`
- `EVENTCAPTURE_DATABASE_PATH`
- `EVENTCAPTURE_ALLOWED_ORIGINS`
- `EVENTCAPTURE_ENV`
- `EVENTCAPTURE_DEBUG`
- `EVENTCAPTURE_PORT`
- `EVENTCAPTURE_EXPOSE_DEV_RESET_TOKEN`
- `EVENTCAPTURE_PASSWORD_RESET_TOKEN_TTL_MINUTES`
- `EVENTCAPTURE_RESET_EMAIL_FROM`
- `EVENTCAPTURE_SMTP_HOST`
- `EVENTCAPTURE_SMTP_PORT`
- `EVENTCAPTURE_SMTP_USERNAME`
- `EVENTCAPTURE_SMTP_PASSWORD`
- `EVENTCAPTURE_SMTP_USE_TLS`
- `EVENTCAPTURE_SMTP_USE_SSL`

### Install app dependencies

```bash
npm install
```

### Install backend dependencies

If `backend/.venv` does not exist yet:

```bash
cd backend
python -m venv .venv
```

On macOS or Linux:

```bash
./.venv/bin/pip install -r requirements.txt
```

On Windows PowerShell:

```powershell
.\.venv\Scripts\pip install -r requirements.txt
```

### Run environment checks only

```bash
npm run check
```

This validates:

- Node.js and npm availability
- backend Python and package imports
- frontend Expo CLI availability
- detector model presence
- Expo startup wiring
- backend health readiness path

### Start backend and Expo together

```powershell
npm run start:all
```

This command:

- prepares missing local setup
- starts the backend first
- waits for `GET /health` to succeed
- then starts Expo in a second PowerShell window
- fails clearly if either side cannot start

### Start with the direct launcher

```powershell
.\launch-dev.cmd
```

### Backend only

```powershell
npm run backend:start
```

### Seed development data

```powershell
npm run backend:seed
```

This creates explicit sample users/events/posts for local development:

- `admin@eventcapture.app` / `AdminPass123!`
- `organizer@eventcapture.app` / `Organizer123!`
- `guest@eventcapture.app` / `GuestPass123!`

### Windows one-click launcher

If you want a script that prepares the environment and launches both backend and Expo for you on Windows:

```powershell
.\launch-dev.cmd
```

Or run the PowerShell version directly:

```powershell
.\scripts\launch-dev.ps1
```

This launcher will:

- create `backend/.venv` if it does not exist yet
- install backend requirements
- install frontend dependencies if `node_modules` is missing
- verify the backend imports and Expo startup
- wait for backend health before opening Expo
- open backend and Expo in separate PowerShell windows

For a dry run without launching services:

```powershell
npm run dev:check
```

## Import official Brussels events

The repo includes an importer that reads the official `visit.brussels` agenda feed and maps it into the app's event shape.

Preview the mapped payloads without writing anything:

```bash
npm run events:brussels:preview
```

Import a smaller batch into `backend/eventcapture.db`:

```bash
npm run events:brussels:import
```

Sync the currently available Brussels nightlife-style feed into both the generated seed file and SQLite, pruning stale official-feed rows from SQLite on each sync:

```bash
npm run events:brussels:sync
```

If you want the broad all-categories official feed instead:

```bash
npm run events:brussels:sync:all
```

The Expo app keeps imported Brussels events drink-friendly by default. To override that and show the full imported feed, set the env toggle before starting Expo:

```powershell
$env:EXPO_PUBLIC_BRUSSELS_DRINKABLE_ONLY="false"
npm start
```

Leave it unset, or set it to `true`, to keep only drink-friendly Brussels events.

Useful options:

```bash
python ./scripts/import_brussels_events.py --limit 5 --date-from 2026-05-06 --output ./tmp/brussels-events.json --dry-run
```

## Backend health and networking

Health endpoint:

```text
GET /health
```

The backend serves:

- the detector API on port `8000`
- the auth, users, events, posts, social state, and persisted captures API on port `8000`
- stored media files from `/media/...`
- the browser tester at `http://localhost:8000/`

## Mobile app to backend connection

The app resolves the backend base URL in this order:

1. `EXPO_PUBLIC_BACKEND_API_URL`
2. `EXPO_PUBLIC_DETECTION_API_URL`
3. Expo-provided local hosts when available, preferring LAN IPs over loopback hosts
4. `http://10.0.2.2:8000` for Android emulator
5. `http://127.0.0.1:8000` and `http://localhost:8000` as local fallbacks

On network failures the mobile app now retries across those candidates automatically and surfaces the URLs it tried.

If your phone or simulator cannot reach the backend automatically, set `EXPO_PUBLIC_BACKEND_API_URL` before starting Expo.

Example:

```powershell
$env:EXPO_PUBLIC_BACKEND_API_URL="http://192.168.1.20:8000"
npm start
```

Networking guidance:

- Expo web: use `http://localhost:8000`
- Android emulator: use `http://10.0.2.2:8000`
- iOS simulator: use `http://127.0.0.1:8000` or `http://localhost:8000`
- Physical phone: use your computer's LAN IP, for example `http://192.168.1.20:8000`

## Build a downloadable Android APK

Use this flow if you want an installable Android APK instead of running the app through Expo Go.

### Prerequisites

- An Expo account for EAS builds
- A detector backend that your Android device can reach over the network

### 1. Start the local detector backend

From the project root:

```bash
cd backend
./.venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

On Windows PowerShell:

```powershell
cd backend
.\.venv\Scripts\python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Keep this running while you test the APK.

### 2. Log in to Expo EAS

From the project root:

```powershell
npx eas-cli login
```

### 3. Build the Android APK

From the project root:

```powershell
npm run build:apk
```

This creates a cloud Android build using the `preview` profile from `eas.json`.

### 4. Download the APK

When the build finishes, EAS prints a build URL. Open it and download the generated `.apk` file to your machine.

### 5. Install the APK on your Android device

Transfer the downloaded `.apk` file to your device and open it there. Android may ask you to allow installs from that source before the installation can continue.

### 6. Point the app at a reachable detector server

For reliable detector access on a phone or any separate device, set `EXPO_PUBLIC_BACKEND_API_URL` to a LAN-reachable backend URL before starting Expo or producing a test build.

Example:

```powershell
$env:EXPO_PUBLIC_BACKEND_API_URL="http://192.168.1.20:8000"
npm run build:apk
```

### Troubleshooting

- If `npm run build:apk` fails before building, make sure you are logged in with `npx eas-cli login`.
- If the APK installs but drink detection fails, confirm the backend is still running and reachable from the same network as your device.
- If you only want the detailed APK build notes, see `APK_BUILD.md`.

## Detector behavior

The backend currently combines several signals:

- YOLOv8n COCO detections for bottle, cup, wine glass, and person
- optional custom model detections from `backend/models/drink_detector.pt`
- simple HSV-based drink type inference
- fallback person estimation from face detection when person boxes are weak
- mouth-zone proximity plus short streak smoothing for active drinking detection

A capture is considered crown eligible when either:

- active drinking is detected
- a beer-like drink is detected

When the app uses the persisted capture endpoint, the backend also:

- saves the original uploaded photo into `backend/storage/media/captures/...`
- saves the annotated detector output beside it
- stores detection summaries and individual detections in `backend/eventcapture.db`
- returns a stable media URL that the posting flow can reuse

## API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Backend readiness, environment, version, and database availability |
| `/api/health` | GET | Compatibility health endpoint |
| `/api/status` | GET | Runtime status, model info, supported drink classes |
| `/api/debug` | GET | Debug snapshot metadata and saved artifact paths |
| `/api/auth/register` | POST | Register a new account and return a session token |
| `/api/auth/login` | POST | Log in and return a session token |
| `/api/auth/logout` | POST | Revoke the current session token |
| `/api/auth/me` | GET | Load the currently signed-in user |
| `/api/auth/profile` | PUT | Update the current user's profile |
| `/api/auth/change-password` | POST | Change the current user's password |
| `/api/auth/reset-password/request` | POST | Create a one-time password reset token flow without revealing account existence |
| `/api/auth/reset-password/confirm` | POST | Redeem a one-time password reset token |
| `/api/users` | GET | List users for admins |
| `/api/users/{userId}` | DELETE | Remove a user as admin |
| `/api/rewards/me` | GET | Load the current user's crown count and reward history |
| `/api/notifications` | GET | Load backend-backed notifications and unread count |
| `/api/notifications/read-all` | POST | Mark all notifications as read |
| `/api/notifications/activity` | POST | Persist user activity items that should survive reloads |
| `/api/detect` | POST | Analyze a single uploaded image |
| `/api/captures/analyze` | POST | Analyze an image, persist original + annotated media, and store the detection result |
| `/api/captures` | GET | List recent persisted capture summaries |
| `/api/events` | GET/POST | Read and create shared events in SQLite |
| `/api/events/{eventId}` | DELETE | Delete an event as owner/admin |
| `/api/events/social` | GET | Load backend-driven event likes/comments/plans for the current user |
| `/api/events/{eventId}/likes/toggle` | POST | Toggle the current user's event like |
| `/api/events/{eventId}/save-toggle` | POST | Toggle the current user's saved event state |
| `/api/events/{eventId}/plan` | POST | Set the current user's plan state |
| `/api/events/{eventId}/plan-note` | POST | Save the current user's plan note |
| `/api/events/{eventId}/comments` | POST | Add an event comment as the current user |
| `/api/events/plans` | GET | Load the current user's saved/planned events |
| `/api/posts` | GET/POST | Read and create feed posts in SQLite |
| `/api/posts/{postId}/likes/toggle` | POST | Toggle the current user's like on a post |
| `/api/posts/{postId}/comments` | POST | Add a post comment as the current user |
| `/api/posts/{postId}` | DELETE | Delete a post |
| `/api/support/contact` | POST | Persist a support/contact submission |
| `/ws/detect` | WebSocket | Real-time frame-by-frame detector stream |
| `/` | GET | Browser demo UI from `frontend/` |

## Project structure

```text
app/                  Expo Router screens
components/           Shared UI and review components
constants/            Crown definitions, translations, theme values
context/              Authenticated app state with backend-backed data and explicit offline cache
services/             App-side backend and detector API integration
backend/              FastAPI app, YOLO detector, SQLite storage, config, schemas, debug artifacts
frontend/             Simple browser detector demo
training/             Dataset prep and YOLO training helpers
scripts/              Windows startup helpers for checks + multi-service launch
```

## Training a custom model

Prepare a dataset and train with the provided scripts:

```powershell
cd training
python prepare_data.py --source .\raw_labeled_images --output ..\datasets\drinks
python train.py --epochs 100 --batch 16
```

The best exported weights are copied to:

```text
backend/models/drink_detector.pt
```

That model is loaded automatically when present.

## Troubleshooting

### npm certificate errors

If `npm install` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, your machine or network is intercepting TLS traffic. Safe first steps:

```powershell
npm config get registry
npm config get strict-ssl
npm config delete cafile
npm config set strict-ssl true
npm cache clean --force
```

If your company or school uses SSL inspection, configure npm to trust that root CA instead of disabling SSL checks globally.

### pip certificate errors

If `pip install -r backend/requirements.txt` fails with certificate validation errors, the machine likely needs the same root CA fix at the Python level.

### Expo device networking

- Web cannot reach `localhost` from a phone
- Android emulator should use `10.0.2.2`
- Physical devices need the computer's LAN IP
- If detection works in the browser but not on-device, the backend URL is usually the cause

### Password reset in development vs production

- In development, `POST /api/auth/reset-password/request` can return a temporary reset token when `EVENTCAPTURE_EXPOSE_DEV_RESET_TOKEN=true`
- In production, insecure direct password resets are disabled
- Production reset delivery should be configured with SMTP environment variables
- The backend never returns reset tokens in production responses

Recommended SMTP variables:

- `EVENTCAPTURE_RESET_EMAIL_FROM`
- `EVENTCAPTURE_SMTP_HOST`
- `EVENTCAPTURE_SMTP_PORT`
- `EVENTCAPTURE_SMTP_USERNAME`
- `EVENTCAPTURE_SMTP_PASSWORD`
- `EVENTCAPTURE_SMTP_USE_TLS`
- `EVENTCAPTURE_SMTP_USE_SSL`

If production reset delivery is requested without mailer configuration, the API returns a safe configuration error instead of exposing reset tokens.

### Production safety

- Set a real `EVENTCAPTURE_SECRET_KEY` before running with `EVENTCAPTURE_ENV=production`
- Keep `EVENTCAPTURE_DEBUG=false` in production
- Restrict `EVENTCAPTURE_ALLOWED_ORIGINS` to your deployed frontend origins
- Configure `EXPO_PUBLIC_BACKEND_API_URL` for your production frontend or device builds

### SQLite backup and restore

For single-node or local production use, SQLite remains acceptable.

Backup guidance:

- Stop writes if possible before copying `backend/eventcapture.db`
- Back up `backend/eventcapture.db`
- Back up `backend/storage/` because captures and media files live there
- Optionally back up `backend/debug/` if detector debugging artifacts matter to your team

Restore guidance:

- Replace the database file with the backup copy
- Restore the matching `backend/storage/` directory so capture records and files stay aligned
- Restart the backend and confirm `GET /health` returns a healthy database state

### PostgreSQL migration path

Current persistence lives in SQLite tables for:

- `users`
- `sessions`
- `events`
- `event_reactions`
- `event_comments`
- `posts`
- `post_likes`
- `post_comments`
- `captures`
- `reward_transactions`
- `password_reset_tokens`
- `notifications`
- `support_requests`

Recommended production migration path for multi-instance deployments:

1. Introduce SQLAlchemy plus Alembic for explicit models and migrations.
2. Replace the direct `sqlite3` helper layer with a repository or ORM-backed data layer that supports both SQLite and PostgreSQL.
3. Add an `EVENTCAPTURE_DATABASE_URL` style configuration for PostgreSQL deployments while preserving the current SQLite path for local development.
4. Export existing SQLite data, import it into PostgreSQL, and validate auth, posts, events, rewards, notifications, and support data before cutover.

### Monitoring and logging

- The backend now emits request-level logs with a request ID header (`X-Request-Id`) for each HTTP response
- Avoid logging bearer tokens, passwords, reset tokens, or full reset links in production
- Capture backend stdout/stderr in your process manager or hosting platform
- Monitor:
  - `GET /health`
  - backend process restarts
  - password reset delivery failures
  - database file growth and backup success
  - media storage growth in `backend/storage/`

### Production checklist

- Set `EVENTCAPTURE_ENV=production`
- Set `EVENTCAPTURE_DEBUG=false`
- Set a real `EVENTCAPTURE_SECRET_KEY`
- Restrict `EVENTCAPTURE_ALLOWED_ORIGINS`
- Set `EXPO_PUBLIC_BACKEND_API_URL` for the deployed frontend or Expo build
- Configure SMTP variables for password reset delivery
- Decide whether SQLite backups are sufficient or whether you need PostgreSQL before launch
- Run `npm run check`
- Run backend tests
- Complete manual QA for auth, events, posts, comments, rewards, notifications, support, and camera capture

## Notes and limitations

- The browser detector demo is still present and useful for detector debugging, but the main experience is the Expo app
- Notifications are backend-backed and persist across reloads, but they still refresh through polling/manual reload rather than realtime push
- The helper scripts are PowerShell-first and currently tailored to this Windows setup
- Runtime-generated backend data now lives in `backend/eventcapture.db`, `backend/storage/`, and `backend/debug/` and is ignored by git
