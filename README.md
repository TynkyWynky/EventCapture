# EventCapture

EventCapture is an Expo Router nightlife app prototype backed by a FastAPI + YOLOv8 drink detection service. The mobile app focuses on event discovery, social posting, crown rewards, and a camera flow that checks whether a captured drink photo is crown eligible.

## What is in this repo

- A React Native / Expo app with splash, onboarding, login, feed, events, camera, rewards, profile, and settings flows
- A Python detection backend that analyzes drink photos and exposes HTTP + WebSocket endpoints
- A lightweight browser demo in `frontend/` served by the backend for quick detector testing
- Training utilities for exporting a custom YOLO model into `backend/models/drink_detector.pt`

## Current product shape

- The mobile app is the main product surface
- User, event, filter, post, and social state are stored locally with AsyncStorage
- Authentication is local demo auth, not a production identity system
- Crown rewards are awarded from the detector result when a beer-like drink or active drinking moment is found
- The backend also saves the latest analyzed and annotated frames into `backend/debug/`

## Main app flows

- Splash and onboarding route into login or the authenticated tab experience
- Tabs include feed, events, camera, social, rewards, and profile
- The camera screen captures a photo, sends it to the backend, and routes to a success or fail review screen
- Posting a crown-eligible capture increments the local crown counter and reward progression
- Admin and support-style screens exist, but they are part of the prototype flow rather than a production admin backend

## Tech stack

- Expo 54 with Expo Router and React Native 0.81
- FastAPI, Uvicorn, OpenCV, Ultralytics YOLOv8, NumPy, and Torch
- AsyncStorage for local persistence
- TypeScript on the app side, Python on the detector side

## Quick start

### Prerequisites

- Node.js with npm available on Windows
- Python 3.10+ for the backend
- A working backend virtual environment at `backend/.venv`

### Install app dependencies

```bash
npm install
```

### Install backend dependencies

If `backend/.venv` does not exist yet:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
```

### Run the Expo app only

```bash
npm start
```

### Run environment checks only

```bash
npm run check
```

This validates:

- Node.js and npm availability
- `backend/.venv/Scripts/python.exe`
- `backend/yolov8n.pt`
- frontend `node_modules`
- backend imports
- Expo startup wiring

### Run backend and Expo separately

```bash
npm run check
npm run start:services
```

`npm run start:services` skips the checks and opens the backend and Expo in separate PowerShell windows.

### Run checks and start everything in one command

```bash
npm run start:all
```

## Manual backend start

If you want to run the detector without the helper script:

```powershell
cd backend
.\.venv\Scripts\python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

The backend serves:

- the detector API on port `8000`
- the browser tester at `http://localhost:8000/`

## Mobile app to backend connection

The app resolves the detector base URL in this order:

1. `EXPO_PUBLIC_DETECTION_API_URL`
2. Expo-provided local hosts when available, preferring LAN IPs over loopback hosts
3. `http://127.0.0.1:8000` and `http://localhost:8000` as local fallbacks

On network failures the mobile app now retries across those candidates automatically and surfaces the URLs it tried.

If your phone or simulator cannot reach the backend automatically, set `EXPO_PUBLIC_DETECTION_API_URL` before starting Expo.

Example:

```powershell
$env:EXPO_PUBLIC_DETECTION_API_URL="http://192.168.1.20:8000"
npm start
```

## Build a downloadable Android APK

Use this flow if you want an installable Android APK instead of running the app through Expo Go.

### Prerequisites

- An Expo account for EAS builds
- A detector backend that your Android device can reach over the network

### 1. Start the local detector backend

From the project root:

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

For reliable detector access on a phone or any separate device, set `EXPO_PUBLIC_DETECTION_API_URL` to a LAN-reachable backend URL before starting Expo or producing a test build.

Example:

```powershell
$env:EXPO_PUBLIC_DETECTION_API_URL="http://192.168.1.20:8000"
npm run build:apk
```

### Troubleshooting

- If `npm run build:apk` fails before building, make sure you are logged in with `npx eas-cli login`.
- If the APK installs but drink detection fails, confirm the backend is still running and reachable from the same network as your device.
- If you only want the detailed APK build notes, see `APK_BUILD.md`.

## Demo credentials

- Demo user: `demo@eventcapture.app` / `eventcapture123`
- Admin user: `admin` / `admin`

These credentials are local-only and backed by AsyncStorage.

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

## API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Basic backend and model availability |
| `/api/status` | GET | Runtime status, model info, supported drink classes |
| `/api/debug` | GET | Debug snapshot metadata and saved artifact paths |
| `/api/detect` | POST | Analyze a single uploaded image |
| `/ws/detect` | WebSocket | Real-time frame-by-frame detector stream |
| `/` | GET | Browser demo UI from `frontend/` |

## Project structure

```text
app/                  Expo Router screens
components/           Shared UI and review components
constants/            Seed event data, crown definitions, theme values
context/              AsyncStorage-backed demo state providers
services/             App-side API integration for the detector
backend/              FastAPI app, YOLO detector, config, schemas, debug artifacts
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

## Notes and limitations

- Most app data is prototype data with local persistence, not a shared backend
- The browser demo is still present and useful for detector debugging, but the main experience is the Expo app
- The helper scripts are PowerShell-first and currently tailored to this Windows setup
- The repo currently contains some generated backend debug images and Python bytecode artifacts in the working tree
