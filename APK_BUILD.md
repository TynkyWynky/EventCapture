# Android APK build

This project can now produce a downloadable Android APK with Expo Application Services.

## What gets packaged

The APK contains the Expo mobile app only.

The FastAPI + YOLO detector in `backend/` is **not** bundled into the APK, so the installed app still needs a reachable detector server over the network.

## First-time setup

1. Install dependencies:

```powershell
npm install
```

2. Log in to Expo:

```powershell
npx eas-cli login
```

3. If EAS asks to link or create a project for this app, accept it.

## Build a downloadable APK

```powershell
npm run build:apk
```

This uses the `preview` build profile in [eas.json](/c:/Users/EXT2076997/Game/EventCapture/eas.json) and produces an `.apk` you can download and install directly.

## Build a Play Store bundle

```powershell
npm run build:aab
```

## Detector backend note

If you install the APK on a real Android phone, point the app at a detector server your phone can actually reach. A local machine on the same Wi-Fi network is the usual setup.

Example:

```powershell
$env:EXPO_PUBLIC_DETECTION_API_URL="http://192.168.1.20:8000"
npm run build:apk
```

The Android build now explicitly allows cleartext HTTP traffic so local non-HTTPS detector URLs can still work during testing.

## Android app id

The current Android package name is `com.eventcapture.mobile`.

If you plan to publish this app, change that before release if you want a different permanent application id.
