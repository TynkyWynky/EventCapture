# EventCapture - frontenddocumentatie

## Doel

Deze documentatie beschrijft de frontend van EventCapture zoals die vandaag in de repository staat. Ze is geschreven als overdraagbare frontenddocumentatie voor een demo- en prototypefase. De focus ligt op de Expo/React Native applicatie, de gedeelde UI-laag, de lokale state, de capture-ervaring en de aparte browserdemo in `frontend/`.

EventCapture is een mobile-first nightlife-app. Gebruikers kunnen evenementen in Brussel ontdekken, filters bewaren, drankmomenten vastleggen, posts delen, reacties plaatsen en "crowns" verdienen via de capture-flow.

## Frontendstack

- Framework: Expo met React Native
- Routing: Expo Router
- Taal: TypeScript
- UI: React Native componenten, `expo-image`, `expo-linear-gradient`, `@expo/vector-icons`
- Camera: `expo-camera`
- Afbeeldingen kiezen: `expo-image-picker`
- Lokale opslag: `@react-native-async-storage/async-storage`
- Webondersteuning: `react-native-web` via Expo
- Demo webfrontend: plain HTML, CSS en JavaScript in `frontend/`

## Projectstructuur

```text
app/                 Expo Router schermen en routes
app/(tabs)/          Hoofdnavigatie met tabbladen
components/          Herbruikbare componenten
components/ui/       Design-system componenten
constants/           Thema, vertalingen, demo-events, posts en crowns
context/             Appbrede stateproviders
hooks/               Expo template hooks voor kleurenschema
services/            Frontend services voor capture en data-afhandeling
assets/images/       App-iconen en splash assets
frontend/            Browserdemo voor live drink detection
```

## Opstarten

Installeer dependencies vanuit de root:

```bash
npm install
```

Start de mobiele app:

```bash
npm start
```

Andere nuttige scripts:

```bash
npm run ios
npm run android
npm run web
npm run lint
```

## Applicatie-architectuur

De rootlayout staat in `app/_layout.tsx`. Daar worden alle globale providers rond de app gezet:

- `LanguageProvider`: taalkeuze en vertalingen
- `UserProvider`: demo-authenticatie en profiel
- `EventProvider`: seed events en aangemaakte events
- `FilterProvider`: zoek-, genre-, datum-, prijs- en sorteerfilters
- `ToastProvider`: tijdelijke feedbackmeldingen
- `PostProvider`: social posts en crown-telling
- `SocialProvider`: likes, saves, comments, plannerstatus en notificaties

De rootlayout bevat ook `AuthNavigatorGuard`. Die stuurt niet-ingelogde gebruikers naar `/onboarding` en stuurt ingelogde gebruikers weg van login/onboarding/profile-create routes naar `/(tabs)`.

## Navigatie

De app gebruikt file-based routing met Expo Router.

### Publieke en auth-routes

- `/` - splash screen met merkintro en call-to-action.
- `/onboarding` - korte productintro met sign-in en accountcreatie.
- `/auth/login` - lokale demo-login.
- `/auth/reset` - lokaal wachtwoord resetten.
- `/auth/change-password` - lokaal wachtwoord wijzigen.
- `/profile/create` - profiel aanmaken met avatar uit de image picker.

### Hoofdtabbladen

De tabbar staat in `app/(tabs)/_layout.tsx`. De app heeft een eigen floating tabbar. Op het camerascherm wordt die tabbar verborgen zodat de capture-UI alle ruimte krijgt.

- `/(tabs)/index` - homefeed met hero, zoekveld, filters, featured event, crown spotlight, laatste capture en trending events.
- `/(tabs)/events` - discovery/explore-lijst met featured nights, presets en eventkaarten.
- `/(tabs)/camera` - camera capture-flow met fotoname en review-doorstroom.
- `/(tabs)/socialfeed` - Instagram-achtige feed met posts, likes, comments en crown badges.
- `/(tabs)/achievements` - crown vault met voortgang, levels, rewards en recente wins.
- `/(tabs)/profile` - profiel, statistieken, actieve crown-perk en accountoverzicht.

### Extra routes

- `/filters` - uitgebreid filterpaneel.
- `/event/detail` - eventdetail met likes, saves, comments, planner en ticket CTA.
- `/event/create` - nieuw event aanmaken.
- `/event/my` - "My Night" planner met going/maybe/skip, saved events en notities.
- `/comments` - comments op een event.
- `/likes` - lijst van gebruikers die een event liketen.
- `/post-comments` - comments op een social post.
- `/notifications` - lokale notificatiefeed.
- `/menu` - side sheet met extra opties.
- `/settings` - taal, notificatie toggles, account en support.
- `/faq`, `/contact`, `/terms` - support en legal flows.
- `/admin` - admin dashboard.
- `/admin/event-edit` - event bewerken vanuit admin.
- `/camera/review-success` en `/camera/review-fail` - review na detectie.

## State en data

De frontend gebruikt geen echte database. De meeste data is seed data plus lokale mutaties in AsyncStorage.

### UserContext

Bestand: `context/UserContext.tsx`

Beheert:

- huidige gebruiker
- authenticatiestatus
- lokaal opgeslagen credentials
- profiel aanmaken en bewerken
- sign-in, sign-out, reset password en change password

Demo-accounts:

```text
Demo gebruiker:
email: demo@eventcapture.app
wachtwoord: eventcapture123

Admin:
email: admin
wachtwoord: admin
```

Opslagkey:

```text
eventcapture.user
```

### EventContext

Bestand: `context/EventContext.tsx`

Beheert:

- eventlijst uit `constants/events.ts`
- custom events die in de app worden aangemaakt
- update en delete van events
- lookup via `getEventById`

Opslagkey:

```text
eventcapture.events
```

Seed data:

- meerdere Brusselse nightlife-events
- Unsplash hero-afbeeldingen
- hostnamen, tags, prijzen, locaties en attendee counts

### FilterContext

Bestand: `context/FilterContext.tsx`

Beheert:

- search query
- genre/vibe filters
- datumfilter: all, today, tomorrow, this week
- sortering: popular, soonest, lowest price
- locatie
- prijsrange
- favoriete preset

Presets:

- Reset all
- Tonight
- Popular
- Cheapest
- Open air

Opslagkey:

```text
eventcapture.filters
```

### PostContext

Bestand: `context/PostContext.tsx`

Beheert:

- social posts
- likes op posts
- comments op posts
- posts toevoegen na capture review
- crown teller
- post verwijderen via admin

Belangrijk gedrag:

- `DEFAULT_CROWNS` staat op 5 voor de demo.
- Een post met `isBeerFinished: true` verhoogt de crown teller.
- Bij een nieuw crown level wordt een toast getoond.

Opslagkey:

```text
eventcapture.post-state
```

### SocialContext

Bestand: `context/SocialContext.tsx`

Beheert eventgebonden social state:

- event likes
- event saves
- event comments
- plannerstatus: going, maybe, skip of leeg
- plannernotities
- activiteit/notificaties

Opslagkey:

```text
eventcapture.social
```

### LanguageContext

Bestand: `context/LanguageContext.tsx`

Beheert:

- taalkeuze: `EN`, `NL`, `FR`
- vertaalfunctie `t(key)`
- opslag van taalkeuze

Opslagkey:

```text
eventcapture.language
```

Opmerking: de grootste UI-copy staat in `constants/translations.ts`, maar sommige schermen hebben nog hard-coded Engelse tekst. Dat geldt vooral voor delen van onboarding, auth, admin edit en security flows.

## Design system

De centrale themalaag staat in `constants/theme.ts`.

Belangrijke tokens:

- `Colors`: light/dark palet, cards, borders, tint, accent, danger en success.
- `Spacing`: vaste spacing schaal.
- `Radius`: radius schaal voor cards, pills en ronde buttons.
- `Shadows`: soft, card en floating schaduwstijlen.
- `Typography`: herbruikbare tekststijlen.
- `Layout`: screen padding, bottom padding en tabbar spacing.
- `TabThemes`: aparte accentkleuren per tab.

Herbruikbare UI-componenten:

- `AppButton`: primaire, secundaire, danger en ghost buttons met press-animatie.
- `IconActionButton`: ronde icon-only actieknop.
- `SurfaceCard`: standaard kaartcontainer met varianten `default`, `feature`, `subtle` en `inset`.
- `ScreenHeader`: consistente header met eyebrow, title, subtitle, back button, leading en right action.
- `StatChip`: kleine metriekchip met optioneel icoon.
- `AppImage`: wrapper rond `expo-image` met loading state, fade-in en fallback.
- `EmptyState`: herbruikbare lege toestand.
- `FeedbackBanner`: inline feedback voor succes, error of info.
- `Toast`: globale toast via `ToastProvider`.
- `CrownProgressBar`: geanimeerde voortgangsbalk voor rewards.
- `LogoMark`: gebruikt de splash asset als merkmarkering.

## Belangrijkste gebruikersflows

### 1. Login en profiel

De gebruiker komt via splash of onboarding bij login. Login is lokaal en controleert tegen demo/admin credentials of tegen het lokaal aangemaakte profiel. Na succesvolle login wordt de gebruiker naar `/(tabs)` gestuurd.

Een nieuwe gebruiker kan via `/profile/create` een profiel maken met:

- avatar
- username
- e-mail
- wachtwoord
- naam
- stad
- bio

Alles wordt lokaal opgeslagen.

### 2. Events ontdekken

De homefeed en explore-tab gebruiken `EventContext` en `FilterContext`.

Gebruikers kunnen:

- zoeken op artiest, plaats, host, tags of sfeer
- filters toepassen
- presets kiezen
- events openen
- events liken of bewaren
- eventdetails bekijken
- comments openen
- tickets CTA zien

### 3. My Night planner

De planner gebruikt `SocialContext`.

Gebruikers kunnen events markeren als:

- Going
- Maybe
- Skip

Ook kunnen ze notities bewaren per event. Een event dat wordt gesaved of een plannerstatus krijgt, verschijnt in `/event/my`.

### 4. Capture en crowns

De camera-flow gebruikt `expo-camera` en `services/beerDetection.ts`.

Flow:

1. Gebruiker geeft cameratoegang.
2. Gebruiker neemt een foto.
3. De capture wordt doorgegeven aan de analyseservice in de frontend.
4. Het resultaat wordt genormaliseerd naar `BeerAnalysisResult`.
5. Als er detecties zijn, gaat de app naar `/camera/review-success`.
6. Zonder detecties gaat de app naar `/camera/review-fail`.
7. De gebruiker kiest een event waaraan de capture gekoppeld wordt.
8. De app maakt een post aan.
9. Bij een succesvolle/eligible capture wordt `isBeerFinished` true en krijgt de gebruiker een crown.

Belangrijke beperking: `isCrownWorthy` is momenteel `detections.length > 0`. De app kijkt dus niet apart naar `is_drinking`; elke detectie maakt de capture crown-worthy.

### 5. Social feed

De social feed toont seed posts en nieuwe capture posts. Gebruikers kunnen:

- posts liken
- comments openen
- comments toevoegen
- crown badge zien op posts met `isBeerFinished`

### 6. Rewards

Rewards gebruiken `constants/crowns.ts`.

Instellingen:

- `CROWN_TARGET = 9`
- 5 levels: Starter, Riser, Regular, Headliner, Legend
- 9 milestones en 9 reward perks

De profielpagina toont de actieve perk. De achievements pagina toont de volledige crown journey, reward vault, progress en recente wins.

### 7. Admin

Admin-toegang is demo-only. Inloggen met `admin` / `admin` toont in het menu een admin dashboard.

Admin kan:

- users bekijken
- niet-admin users lokaal bannen uit de tijdelijke userlijst
- posts verwijderen
- events verwijderen
- events aanmaken
- events bewerken

Belangrijke beperking: de userlijst in `app/admin.tsx` is een lokale vaste lijst. Ze is niet gekoppeld aan echte accounts of een server.

## Browserdemo

De map `frontend/` bevat een aparte lichte frontenddemo:

- `frontend/index.html`
- `frontend/style.css`
- `frontend/app.js`

### Demofunctionaliteit

De webdemo bevat:

- camera starten en stoppen
- upload van een losse afbeelding
- confidence threshold slider
- frame rate selector
- connectiestatus
- FPS weergave
- realtime bounding boxes op canvas
- debug overlay voor faces, mouth zones en drinks
- detection list
- drinking alert
- detection log met de laatste 50 entries
- supported drinks legenda

### Frontendgedrag

`frontend/app.js` beheert de volledige browserinteractie:

- camera permissies aanvragen
- frames capteren
- UI updaten bij nieuwe detecties
- bounding boxes en debug overlays tekenen op `overlayCanvas`
- uploadresultaten tonen in de result view
- detection logs en statusweergave bijhouden

## Demo- en prototypekeuzes

Deze onderdelen zijn bewust gemaakt voor demonstratie of testdoeleinden:

- Lokale login in plaats van echte auth.
- Demo-account en admin-account met hard-coded credentials.
- Seed events in `constants/events.ts`.
- Seed posts in `constants/posts.ts`.
- Seed social state en notificaties in `SocialContext`.
- Lokale CRUD via AsyncStorage in plaats van serverdata.
- Contactformulier dat enkel lokaal succes/error toont.
- Terms akkoord wordt alleen in de huidige sessie onthouden.
- Delete account is een demo-actie en doet vooral sign-out.
- Admin user management is een lokale mocklijst.
- Rewards starten met 5 crowns zodat de reward UI meteen gevuld is.
- Browserdemo is bedoeld als test- en demo-interface, niet als productie-UI.

## Capture service

Mobiele service:

```text
services/beerDetection.ts
```

Belangrijke punten:

- verwerkt het resultaat van de capture-analyse in een vast frontendformaat
- normaliseert onbekende of onvolledige data naar veilige frontendtypes
- levert `detections` en een `annotatedImage` terug aan de UI

Responsemodel in de frontend:

```ts
interface DrinkDetection {
  label: string;
  drink_type: string;
  confidence: number;
  bbox: number[];
  is_drinking: boolean;
}

interface BeerAnalysisResult {
  isCrownWorthy: boolean;
  detections: DrinkDetection[];
  annotatedImage?: string;
}
```

## Internationalisatie

De app ondersteunt `EN`, `NL` en `FR` via `constants/translations.ts`. De taal kan in Settings gewijzigd worden. De keuze wordt bewaard in AsyncStorage.

Aandachtspunten voor verdere afwerking:

- Niet alle schermen gebruiken al `t(key)`.
- Sommige toasts en foutmeldingen staan nog rechtstreeks in het Engels.
- `NL` is bruikbaar als Nederlandstalige/Vlaamse UI-laag, maar copy kan nog verder Vlaams verfijnd worden.

## Testchecklist voor demo

Gebruik deze checklist voor een frontenddemo:

1. Start Expo en open de app.
2. Login met `demo@eventcapture.app` / `eventcapture123`.
3. Controleer homefeed, filters en eventdetail.
4. Like en save een event.
5. Zet een event op Going of Maybe en controleer `/event/my`.
6. Voeg een eventcomment toe.
7. Open social feed, like een post en voeg een postcomment toe.
8. Open achievements en profiel om crown progress te controleren.
9. Test de camera-flow en controleer de review-doorstroom.
10. Post een succesvolle capture en controleer social feed, crowns en notificaties.
11. Login met `admin` / `admin`.
12. Controleer admin events, posts en users.
13. Test de browserdemo met webcam en upload.
14. Run `npm run lint`.

## Bekende beperkingen

- Er is geen geautomatiseerde frontend test suite in de repository.
- Data kan verdwijnen of resetten wanneer AsyncStorage wordt leeggemaakt.
- De admin userlijst is niet gekoppeld aan `UserContext`.
- Sommige datumfilters vertrouwen op `new Date(event.fullDate)`, terwijl de seed strings tekstuele datums bevatten. Dit kan per runtime verschillen.
- Sommige schermen bevatten nog hard-coded Engelse copy.
- Web en native kunnen visueel licht verschillen door React Native Web en platformgedrag.

## Aanbevolen vervolgstappen

Voor een productieklare frontend zijn dit de belangrijkste verbeterpunten:

- Frontendvalidatie en flow-afhandeling rond capture verder verfijnen.
- Alle hard-coded copy migreren naar `constants/translations.ts`.
- Formvalidatie en foutmeldingen centraliseren.
- E2E tests toevoegen voor login, event discovery, capture review en admin.
- Unit tests toevoegen voor contexts, filters en `beerDetection`.
- Accessibility pass uitvoeren op icon buttons, contrast en screen reader labels.
- Offline- en foutstates in de UI verder uitbreiden.
