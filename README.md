# EventCapture (BeerReal splash)

Expo Router app showing the BeerReal splash screen (orange gradient, card, beer/camera icon, welcome CTA).

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
- Splash screen lives in `app/index.tsx`; router stack hides headers via `app/_layout.tsx`.
- Button `onPress` is a placeholder; wire it to your navigator or next screen.
- Colors: primary `#f68c1f`, dark accent `#ec7c0e` (also set in `app.json` splash background).

## Useful scripts
- `npm start` – start Expo dev server
- `npm run android` – open Android
- `npm run ios` – open iOS simulator
- `npm run web` – open web preview
- `npm run lint` – lint with Expo config
