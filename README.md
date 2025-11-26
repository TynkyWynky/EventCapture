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
