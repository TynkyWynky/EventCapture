# EventCapture

EventCapture is a mobile-first nightlife and social experience built with Expo Router. The app lets users discover events, capture drink moments, share activity, and earn rewards. The repository also includes a FastAPI + YOLOv8 backend used for drink detection and a lightweight browser demo for testing the model.

## Project Overview

- `Mobile app`: event discovery, social feed, capture flow, rewards, profile, and admin/demo features.
- `AI backend`: image and webcam-based drink detection with FastAPI, WebSockets, and YOLOv8.
- `Browser demo`: a simple frontend connected to the backend for live testing.

## Tech Stack

- `Frontend`: Expo, React Native, Expo Router, TypeScript
- `Backend`: Python, FastAPI, Uvicorn
- `AI`: YOLOv8, OpenCV, PyTorch
- `Storage`: local app state with AsyncStorage

## Quick Start

Install the mobile app dependencies from the project root:

```bash
npm install
```

Start the Expo app:

```bash
npm start
```

Start the detection backend in a second terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

If you test the mobile app on a physical device, set the backend URL before starting Expo:

```powershell
$env:EXPO_PUBLIC_API_URL="http://YOUR_LAN_IP:8000"
```

## Project Structure

```text
app/          Expo Router screens
components/   Shared UI components
context/      App state providers
constants/    Theme, translations, seed data
services/     Frontend service helpers
backend/      FastAPI + YOLOv8 detection server
frontend/     Browser-based detector demo
training/     Model training scripts
```

## Status

This README is intentionally short and works as a project presentation. A full frontend documentation pass will be added later.
