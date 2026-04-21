# EventCapture

EventCapture is an Expo Router mobile app for discovering events, capturing drink moments, earning crowns, and managing a local nightlife/social feed. The repository also includes a FastAPI + YOLOv8 drink-detection backend with a browser-based webcam interface for real-time drink and drinking-action detection.

The project currently has two main runnable surfaces:

- `Expo mobile app`: React Native / Expo Router app in `app/`, `components/`, `context/`, `constants/`, `services/`, and `hooks/`.
- `Drink Detection AI`: FastAPI backend in `backend/` plus plain HTML/CSS/JS frontend in `frontend/`.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Startup Commands](#startup-commands)
- [Accounts](#accounts)
- [Mobile App Documentation](#mobile-app-documentation)
- [Drink Detection Backend](#drink-detection-backend)
- [Training a Custom YOLO Model](#training-a-custom-yolo-model)
- [Configuration](#configuration)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)

## Features

### Expo Mobile App

- Onboarding, sign-in, profile creation, reset password, and change password flows.
- Demo user and admin user flows stored locally with AsyncStorage.
- Event discovery, filtering, saving, planning, liking, commenting, and event detail views.
- Capture flow using `expo-camera`.
- Capture review screens that let users post a result to an event.
- Crowns/rewards system for successful captures.
- Social feed, likes, comments, notifications, FAQ, contact, terms, settings, and language selection.
- Admin area for local event, post, and user management.
- English, Dutch, and French translations in `constants/translations.ts`.

### Drink Detection AI

- FastAPI server with REST and WebSocket endpoints.
- Webcam detection through the web UI at `http://localhost:8000`.
- Static image upload detection.
- YOLOv8n base model support.
- Optional custom model loading from `backend/models/drink_detector.pt`.
- Drink object detection for bottles, cups, and wine glasses.
- Color-based drink type inference.
- Drinking-action heuristic using person/face/mouth-zone proximity.
- Debug snapshots saved to `backend/debug/latest_frame.jpg` and `backend/debug/latest_annotated.jpg`.
- Training scripts for a custom YOLO drink detector.

## Tech Stack

### Mobile

- Expo SDK 54
- React 19
- React Native 0.81
- Expo Router 6
- TypeScript 5.9
- Expo Camera
- Expo Image
- Expo Haptics
- Expo Splash Screen
- React Navigation
- AsyncStorage

### Backend and AI

- Python 3.10+
- FastAPI
- Uvicorn
- Ultralytics YOLOv8
- OpenCV
- NumPy
- Pillow
- PyTorch / Torchvision
- WebSockets

### Browser Detector Frontend

- HTML
- CSS
- Vanilla JavaScript
- Browser webcam APIs
- WebSocket client

## Project Structure

```text
.
|-- app/                         # Expo Router screens and route groups
|   |-- (tabs)/                  # Main tab navigation
|   |-- admin/                   # Admin nested screens
|   |-- auth/                    # Login, reset, change password
|   |-- camera/                  # Capture review result screens
|   |-- event/                   # Event create/detail/my events screens
|   |-- profile/                 # Profile create/edit screens
|   |-- _layout.tsx              # Root providers, stack, auth guard
|   `-- index.tsx                # Splash/start route
|-- assets/                      # App images and icons
|-- backend/                     # FastAPI + YOLO detector
|   |-- app.py                   # API server and WebSocket handling
|   |-- detector.py              # DrinkDetector implementation
|   |-- requirements.txt         # Python dependencies
|   |-- yolov8n.pt               # Default YOLO model
|   |-- debug/                   # Latest debug frames
|   `-- models/                  # Optional custom model location
|-- components/                  # Shared React Native components
|   `-- ui/                      # Reusable UI primitives
|-- constants/                   # Events, posts, crowns, theme, translations
|-- context/                     # App state providers
|-- frontend/                    # Browser UI for drink detection backend
|-- hooks/                       # Theme/color-scheme hooks
|-- scripts/                     # Expo reset script
|-- services/                    # Mobile service helpers
|-- training/                    # Dataset prep and YOLO training scripts
|-- app.json                     # Expo app config
|-- package.json                 # Node scripts and dependencies
|-- package-lock.json            # npm lockfile
|-- tsconfig.json                # TypeScript config
`-- README.md
```

## Prerequisites

Install these before running the project:

- Node.js LTS and npm.
- Expo CLI through `npx expo ...` or the local npm scripts.
- Expo Go on a physical iOS/Android device, or an Android emulator / iOS simulator.
- Python 3.10 or newer for the backend and training scripts.
- A webcam for the browser-based detection UI.
- Optional: CUDA-compatible GPU for faster YOLO inference and training.

On Windows PowerShell, the commands in this README can be run from the repository root:

```powershell
cd C:\Unique_Projects\EventCapture
```

## Quick Start

### 1. Install mobile app dependencies

```bash
npm install
```

### 2. Start the Expo app

```bash
npm start
```

Then choose a target in the Expo terminal:

- Press `a` for Android.
- Press `i` for iOS simulator on macOS.
- Press `w` for web.
- Scan the QR code with Expo Go for a physical device.

### 3. Start the drink detection backend

Open a second terminal:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

```bash
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS/Linux
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Run the server:

```bash
python app.py
```

Open the detector web UI:

```text
http://localhost:8000
```

## Startup Commands

### Mobile App Scripts

Run these from the repository root.

| Command | Description |
|---|---|
| `npm install` | Install Node dependencies from `package-lock.json`. |
| `npm start` | Start the Expo development server. |
| `npm run android` | Start Expo and open Android. |
| `npm run ios` | Start Expo and open iOS simulator. |
| `npm run web` | Start Expo web preview. |
| `npm run lint` | Run Expo linting. |
| `npm run reset-project` | Reset the Expo sample structure. This can move or delete app folders, so only use it intentionally. |

### Backend Commands

Run these from the repository root unless noted.

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Alternative Uvicorn command:

```bash
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

When using the `uvicorn backend.app:app` form, run it from the repository root.

### Running Mobile and Backend Together

Use two terminals:

```bash
# Terminal 1
npm start
```

```bash
# Terminal 2
cd backend
.\.venv\Scripts\Activate.ps1
python app.py
```

Important: the Expo mobile capture flow currently uses `services/beerDetection.ts`, which simulates analysis locally. The YOLO backend is available through the separate browser UI in `frontend/` and through the backend API. The mobile capture flow is not yet wired to upload photos to `/api/detect`.

## Accounts

The app uses local demo credentials. No external auth service is required.

| Account | Email / Username | Password | Notes |
|---|---|---|---|
| Demo user | `demo@eventcapture.app` | `eventcapture123` | Standard user account. |
| Admin | `admin` | `admin` | Opens admin-only functionality. |

The login screen includes tappable cards that fill these credentials automatically.

## Mobile App Documentation

### Routing

The app uses Expo Router.

| Area | Path |
|---|---|
| Splash/start | `app/index.tsx` |
| Root layout and auth guard | `app/_layout.tsx` |
| Onboarding | `app/onboarding.tsx` |
| Login | `app/auth/login.tsx` |
| Password reset | `app/auth/reset.tsx` |
| Change password | `app/auth/change-password.tsx` |
| Profile create/edit | `app/profile/create.tsx`, `app/profile/edit.tsx` |
| Main tabs | `app/(tabs)/` |
| Event screens | `app/event/` |
| Camera review screens | `app/camera/` |
| Admin screen | `app/admin.tsx` |
| Admin event edit | `app/admin/event-edit.tsx` |
| Settings/support/legal | `app/settings.tsx`, `app/contact.tsx`, `app/faq.tsx`, `app/terms.tsx` |

### Main Tabs

The tab layout is defined in `app/(tabs)/_layout.tsx`.

| Tab | File | Purpose |
|---|---|---|
| Feed | `app/(tabs)/index.tsx` | Home feed and capture prompts. |
| Explore | `app/(tabs)/events.tsx` | Event browsing and filtering entry points. |
| Capture | `app/(tabs)/camera.tsx` | Camera capture flow. |
| Social | `app/(tabs)/socialfeed.tsx` | Social/event activity feed. |
| Rewards | `app/(tabs)/achievements.tsx` | Crown progress and rewards. |
| Profile | `app/(tabs)/profile.tsx` | User profile and saved state. |

### Auth Guard

`AuthNavigatorGuard` in `app/_layout.tsx` controls access:

- Public routes: splash, auth screens, profile creation, onboarding.
- Unauthenticated users are redirected to `/onboarding`.
- Authenticated users are redirected away from login/reset/create/onboarding into `/(tabs)`.
- User state is hydrated from AsyncStorage before redirects are applied.

### Local State Providers

The root layout wraps the app in these providers:

| Provider | File | Responsibility |
|---|---|---|
| `LanguageProvider` | `context/LanguageContext.tsx` | Current app language. |
| `UserProvider` | `context/UserContext.tsx` | Local user, credentials, auth state. |
| `EventProvider` | `context/EventContext.tsx` | Seed and custom events. |
| `FilterProvider` | `context/FilterContext.tsx` | Event filtering state. |
| `ToastProvider` | `context/ToastContext.tsx` | Toast notifications. |
| `PostProvider` | `context/PostContext.tsx` | Captures, posts, likes, comments, crowns. |
| `SocialProvider` | `context/SocialContext.tsx` | Event likes, saves, comments, planning, notifications. |

### AsyncStorage Keys

Local persistence uses these keys:

| Key | Stored Data |
|---|---|
| `eventcapture.language` | Selected language. |
| `eventcapture.user` | User profile, credentials, auth state. |
| `eventcapture.events` | Custom/merged events. |
| `eventcapture.filters` | Event filter settings. |
| `eventcapture.post-state` | Posts and crown count. |
| `eventcapture.social` | Event social state and notifications. |

To reset local app data during development, clear app storage from the simulator/device, uninstall/reinstall the app, or clear site storage when running on web.

### Camera Capture Flow

Mobile camera flow:

1. `app/(tabs)/camera.tsx` requests camera permission through `expo-camera`.
2. The user captures a photo.
3. `services/beerDetection.ts` simulates analysis with a short delay and random boolean result.
4. A successful result routes to `/camera/review-success`.
5. A failed result routes to `/camera/review-fail`.
6. `components/capture-review-screen.tsx` lets the user select an event and post the capture.
7. Successful captures can award crowns through `PostProvider`.

Backend detector flow:

1. Browser UI opens from `backend/app.py` at `http://localhost:8000`.
2. `frontend/app.js` requests webcam access.
3. Frames are sent to `/ws/detect`.
4. YOLO runs detection on the server.
5. The server returns detections, debug regions, FPS, and an annotated image frame.
6. The browser overlays detection boxes and updates the detection list/log.

### Admin Flow

Admin credentials:

```text
username: admin
password: admin
```

Admin features are local/demo features:

- View counts for events, posts, and users.
- Create events.
- Edit events.
- Delete local events.
- Delete local posts.
- Remove non-admin users from the demo user list.

The admin screen redirects non-admin users back to the main tabs.

### Styling and UI

Shared visual constants live in:

- `constants/theme.ts`
- `components/ui/`
- `components/logo-mark.tsx`

Translations live in:

- `constants/translations.ts`

Seed data lives in:

- `constants/events.ts`
- `constants/posts.ts`
- `constants/crowns.ts`

## Drink Detection Backend

### Server Files

| File | Purpose |
|---|---|
| `backend/app.py` | FastAPI app, static frontend serving, REST endpoints, WebSocket endpoint. |
| `backend/detector.py` | YOLO model loading, detection, drink type inference, drinking-action detection, annotation. |
| `backend/requirements.txt` | Python dependencies. |
| `backend/yolov8n.pt` | Default model used by the app. |
| `backend/models/drink_detector.pt` | Optional custom trained model. |
| `backend/debug/` | Latest debug snapshots. |

### API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Serves `frontend/index.html`. |
| `/style.css` | GET | Serves the detector UI stylesheet. |
| `/app.js` | GET | Serves the detector UI JavaScript. |
| `/api/status` | GET | Returns server/model status and supported drink classes. |
| `/api/debug` | GET | Returns model paths and last debug snapshot metadata. |
| `/api/detect` | POST | Accepts an uploaded image file and returns detections plus an annotated image. |
| `/ws/detect` | WebSocket | Receives webcam frames and returns live detection results. |

### `/api/status` Response

Example shape:

```json
{
  "status": "running",
  "model": "YOLOv8n",
  "model_path": "backend/yolov8n.pt",
  "custom_model": false,
  "custom_model_path": null,
  "drink_classes": ["Water", "Coffee", "Tea", "Soda", "Beer", "Wine", "Juice", "Energy Drink"]
}
```

### `/api/detect` Request

Use multipart form data with the field name `file`. In Windows PowerShell, use `curl.exe` instead of the `curl` alias:

```bash
curl.exe -X POST http://localhost:8000/api/detect -F "file=@path/to/image.jpg"
```

The server rejects files larger than 10 MB and invalid images.

### `/api/detect` Response

Example shape:

```json
{
  "detections": [
    {
      "label": "bottle",
      "drink_type": "Beer",
      "confidence": 0.82,
      "bbox": [120, 80, 210, 360],
      "is_drinking": false
    }
  ],
  "debug": {
    "persons": [],
    "mouth_zones": [],
    "faces": []
  },
  "annotated_image": "data:image/jpeg;base64,..."
}
```

### WebSocket Message

Client to server:

```json
{
  "type": "frame",
  "data": "data:image/jpeg;base64,...",
  "conf_threshold": 0.35
}
```

Server to client:

```json
{
  "type": "detection",
  "frame": "data:image/jpeg;base64,...",
  "detections": [],
  "debug": {
    "persons": [],
    "mouth_zones": [],
    "faces": []
  },
  "fps": 5.0,
  "drinking_detected": false
}
```

### Detection Logic

`DrinkDetector` uses:

- COCO class `0` for people.
- COCO class `39` for bottle.
- COCO class `40` for wine glass.
- COCO class `41` for cup.
- Optional custom model classes from `backend/models/drink_detector.pt`.
- HSV color analysis to infer drink type.
- Face detection fallback with OpenCV Haar cascades.
- Mouth-zone approximation for drinking-action detection.
- Short streak smoothing before marking `is_drinking = true`.

### Debugging Backend Output

After a successful upload or WebSocket frame, the backend writes:

```text
backend/debug/latest_frame.jpg
backend/debug/latest_annotated.jpg
```

You can also inspect:

```text
http://localhost:8000/api/debug
```

## Training a Custom YOLO Model

Training files are in `training/`.

| File | Purpose |
|---|---|
| `training/dataset.yaml` | YOLO dataset config and class names. |
| `training/prepare_data.py` | Creates YOLO folder structure and splits data. |
| `training/train.py` | Fine-tunes a YOLOv8 model and copies the best model into the backend. |

### Dataset Classes

`training/dataset.yaml` defines these classes:

```text
0  water_bottle
1  coffee_cup
2  tea_cup
3  soda_can
4  soda_bottle
5  beer_bottle
6  beer_can
7  wine_glass
8  wine_bottle
9  juice_box
10 juice_bottle
11 energy_drink
12 cocktail
13 mug
14 tumbler
```

### Expected Dataset Structure

```text
datasets/drinks/
|-- images/
|   |-- train/
|   |-- val/
|   `-- test/
`-- labels/
    |-- train/
    |-- val/
    `-- test/
```

YOLO label format:

```text
class_id center_x center_y width height
```

All coordinates must be normalized from `0` to `1`.

Example:

```text
5 0.512000 0.488000 0.180000 0.420000
```

### Create Dataset Folders

The current `prepare_data.py` CLI requires `--source` even when using `--create-only`, so pass any existing folder as the source:

```bash
cd training
python prepare_data.py --source . --create-only --output ../datasets/drinks
```

### Split Raw Labeled Images

Put images and matching `.txt` YOLO label files in a source folder, then run:

```bash
cd training
python prepare_data.py --source ./raw_labeled_images --output ../datasets/drinks
```

Optional split ratios:

```bash
python prepare_data.py --source ./raw_labeled_images --output ../datasets/drinks --train-ratio 0.7 --val-ratio 0.2
```

The remaining data goes to the test split.

### Train

```bash
cd training
python train.py
```

Custom parameters:

```bash
python train.py --epochs 100 --batch 16 --imgsz 640 --patience 20
```

Use a different base model:

```bash
python train.py --model yolov8s.pt --epochs 150 --batch 16
```

### Resume Training

```bash
cd training
python train.py --resume
```

If `runs/drink_detector/weights/last.pt` exists, training resumes from that checkpoint. Otherwise, it starts fresh.

### Model Output

After training, the best model is copied to:

```text
backend/models/drink_detector.pt
```

On the next backend start, `backend/app.py` automatically loads that custom model if the file exists.

## Configuration

### Expo Configuration

Main config file:

```text
app.json
```

Important values:

| Setting | Value |
|---|---|
| App name | `EventCapture` |
| Slug | `EventCapture` |
| Version | `1.0.0` |
| Orientation | `portrait` |
| Scheme | `eventcapture` |
| UI style | `automatic` |
| New architecture | enabled |
| Web output | `static` |
| Typed routes | enabled |
| React compiler | enabled |

Splash/icon assets:

```text
assets/images/splash-icon.png
assets/images/favicon.png
```

### TypeScript Configuration

`tsconfig.json` extends Expo defaults, enables strict mode, and maps `@/*` to the repository root.

Example import:

```ts
import { Colors } from '@/constants/theme';
```

### Backend Configuration

Backend values are currently defined directly in `backend/app.py`.

| Setting | Default |
|---|---|
| Host | `0.0.0.0` |
| Port | `8000` |
| Default model | `backend/yolov8n.pt` |
| Custom model | `backend/models/drink_detector.pt` |
| Debug directory | `backend/debug` |
| Upload size limit | 10 MB |
| Default confidence threshold | `0.35` |

The browser UI lets you change confidence threshold and frame rate.

## Development Workflow

### Install

```bash
npm install
```

### Lint

```bash
npm run lint
```

### Type Check

There is no dedicated `typecheck` npm script at the moment, but TypeScript can be run directly:

```bash
npx tsc --noEmit
```

### Backend Smoke Checks

After starting the backend:

```bash
curl.exe http://localhost:8000/api/status
```

Open:

```text
http://localhost:8000
```

Then try:

- Start Camera
- Upload Image
- Visit `/api/debug`

### Static Web Export

The Expo config uses static web output. To export web assets:

```bash
npx expo export --platform web
```

### Production Backend Start

For a simple production-style backend launch:

```bash
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

Make sure the server environment has:

- Python dependencies installed.
- Access to `backend/yolov8n.pt`.
- Optional custom model at `backend/models/drink_detector.pt`.
- Enough CPU/GPU resources for YOLO inference.

## Troubleshooting

### Expo does not start cleanly

Try clearing the Metro cache:

```bash
npx expo start -c
```

### Mobile camera permission does not appear

- Confirm the target supports camera access.
- On a physical device, check system app permissions.
- On web, allow camera access in the browser.
- On simulators/emulators, make sure a camera source is available.

### Android device cannot reach a local backend

`localhost` on a physical phone points to the phone, not your computer. Use your computer LAN IP address, or use an Expo tunnel for mobile app network work.

The current mobile camera flow does not call the backend yet, but this matters if you wire `services/beerDetection.ts` to `/api/detect`.

### Backend install is slow or fails

PyTorch, Torchvision, OpenCV, and Ultralytics can be large. Use a clean virtual environment and make sure your Python version is 3.10+.

```bash
python --version
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### `python app.py` cannot find model files

Run the command from inside `backend/`:

```bash
cd backend
python app.py
```

Or run Uvicorn from the repository root:

```bash
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

### Browser webcam does not start

- Use `http://localhost:8000` locally.
- Allow camera permission in the browser.
- Close other apps using the webcam.
- If hosted remotely, use HTTPS because browsers restrict camera APIs on insecure origins.

### WebSocket disconnects

- Confirm the backend is still running.
- Refresh `http://localhost:8000`.
- Lower the frame rate in the detector UI.
- Lower the model size if you trained a heavier custom model.

### No detections appear

- Lower the confidence threshold in the detector UI.
- Improve lighting and keep the bottle/cup/glass visible.
- Confirm `backend/yolov8n.pt` exists.
- Check `/api/debug` and `backend/debug/latest_annotated.jpg`.
- For better drink-specific results, train a custom model and place it at `backend/models/drink_detector.pt`.

## Known Limitations

- The mobile app uses local/demo data and AsyncStorage, not a remote production database.
- The mobile capture analyzer in `services/beerDetection.ts` is currently simulated and random.
- The FastAPI YOLO backend is separate from the mobile app until the mobile service is wired to `/api/detect`.
- The admin user system is local/demo only.
- There is no dedicated automated test suite in `package.json` yet.
- The browser detector is designed for local development and demos; production hosting needs HTTPS, resource sizing, and model deployment planning.
