# EventCapture (BeerReal splash)

Expo Router app showing the BeerReal/BearReal mobile UI: splash, auth, feeds, events, camera, crowns, profile, settings, filters, and supporting modals.

## Get started
1) Install dependencies
```bash
npm install
```
2) Run the app
```bash
npm start
```
Pick iOS/Android/Web in Expo CLI.

## Notes
- Splash: `app/index.tsx` → routes to `app/auth/login.tsx`.
- Main tabs: `app/(tabs)` (home feed, events, camera, crowns, profile).
- Extra screens: filters (`app/filters`), menu (`app/menu`), likes/comments, notifications, FAQ/help, contact, terms, event create/detail, profile create/edit, password reset, onboarding, camera review success/fail.
- Colors: primary `#f68c1f`, dark accent `#ec7c0e`.

## Useful scripts
- `npm start` – start Expo dev server
- `npm run android` – open Android
- `npm run ios` – open iOS simulator
- `npm run web` – open web preview
- `npm run lint` – lint with Expo config
# Drink Detection AI

Real-time drink identification system using YOLOv8 and a web-based interface with live camera feed.

## Features

- **Real-time detection** via webcam using WebSockets
- **8 drink categories**: Water, Coffee, Tea, Soda, Beer, Wine, Juice, Energy Drink
- **Drinking action detection**: Detects when someone is actively drinking
- **Image upload**: Analyze static images
- **Color-based classification**: Infers drink type from visual cues
- **Custom model training**: Fine-tune on your own drink dataset

## Project Structure

```
├── backend/
│   ├── app.py              # FastAPI WebSocket server
│   ├── detector.py         # YOLOv8 drink detection engine
│   ├── requirements.txt    # Python dependencies
│   └── models/             # Custom trained models (auto-created)
├── frontend/
│   ├── index.html          # Web interface
│   ├── style.css           # Styling
│   └── app.js              # Webcam capture & WebSocket client
├── training/
│   ├── train.py            # YOLOv8 fine-tuning script
│   ├── dataset.yaml        # Dataset class configuration
│   └── prepare_data.py     # Data preparation utilities
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

> Requires Python 3.10+. A GPU (CUDA) is recommended but not required — CPU works for ~2-5 FPS.

### 2. Run the Server

```bash
cd backend
python app.py
```

### 3. Open the App

Navigate to **http://localhost:8000** in your browser.

- Click **Start Camera** to begin real-time detection
- Or use **Upload Image** to analyze a photo

## How It Works

### Detection Pipeline

1. **Frame capture**: Browser captures webcam frames at configurable FPS
2. **WebSocket transfer**: Frames sent as base64 JPEG to the server
3. **YOLOv8 inference**: Detects bottles, cups, wine glasses, and people
4. **Color analysis**: HSV-based classification infers specific drink type
5. **Drinking detection**: Checks spatial proximity of drinks to face region
6. **Annotated response**: Sends back labeled frame + detection metadata

### Drink Type Classification

The system uses two approaches:
- **COCO classes**: Detects general categories (bottle, cup, wine glass)
- **Color analysis**: Analyzes the HSV color profile of the detected region to infer the specific drink (e.g., dark liquid in cup → Coffee, clear bottle → Water)

### Drinking Action Detection

Detects when a person is actively drinking by analyzing:
- Person detection (COCO class 0)
- Drink proximity to the face region (top 35% of person bounding box)
- Drink position relative to face center

## Training a Custom Model

For higher accuracy, train on a custom drink dataset:

### 1. Prepare Your Data

```bash
cd training

# Create dataset structure
python prepare_data.py --create-only --output ../datasets/drinks

# Place images in datasets/drinks/images/ and labels in datasets/drinks/labels/
# Then split into train/val/test:
python prepare_data.py --source ./raw_labeled_images --output ../datasets/drinks
```

Label format is YOLO: `class_id center_x center_y width height` (normalized 0-1).

### 2. Train

```bash
python train.py --epochs 100 --batch 16
```

The best model is automatically copied to `backend/models/drink_detector.pt` and will be loaded on next server start.

### 3. Resume Training

```bash
python train.py --resume
```

## Configuration

| Setting | Default | Description |
|---|---|---|
| Confidence threshold | 35% | Min detection confidence (adjustable in UI) |
| Frame rate | 5 FPS | Webcam capture rate (adjustable in UI) |
| Image size | 640px | YOLOv8 inference resolution |
| Server port | 8000 | FastAPI server port |

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Web interface |
| `/api/status` | GET | Server & model status |
| `/api/detect` | POST | Detect drinks in uploaded image |
| `/ws/detect` | WebSocket | Real-time detection stream |
