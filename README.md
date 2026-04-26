# EventCapture - Frontend Documentatie

## 1. Projectoverzicht

**EventCapture** is een mobiele sociale applicatie, gebouwd met Expo en React Native, gericht op het nachtleven en evenementen. Gebruikers kunnen evenementen ontdekken, plannen maken ("My Night"), foto's maken van hun drankjes ("Captures") om beloningen ("Kronen") te verdienen, en communiceren met de community (liken, reageren). De applicatie bevat ook een beheerderspaneel (Admin Dashboard) voor contentbeheer.

## 2. Technologiestack

De applicatie maakt gebruik van een moderne React Native stack:
- **Framework:** [Expo](https://expo.dev/) (v54)
- **Core Library:** [React Native](https://reactnative.dev/) (v0.81.5) & React (v19)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (Bestandsgebaseerde routing)
- **Statusbeheer (State Management):** React Context API (aangepaste hooks)
- **Lokale Opslag:** `@react-native-async-storage/async-storage`
- **Typing:** TypeScript

## 3. Projectstructuur

De mappenstructuur volgt de standaard Expo Router conventies, met een scheiding tussen pagina's, componenten en logica:

```text
EventCapture/
├── app/               # Expo Router pagina's en layouts (Routing)
│   ├── (tabs)/        # Hoofdnavigatie (Onderaan het scherm)
│   ├── admin/         # Beheerderspagina's
│   ├── auth/          # Authenticatieschermen (Login, Wachtwoord reset)
│   ├── camera/        # Camera en foto-review schermen
│   ├── event/         # Evenement details en creatie
│   └── profile/       # Profiel aanmaken en bewerken
├── components/        # Herbruikbare React componenten
│   └── ui/            # Basis UI elementen (knoppen, kaarten, input velden)
├── constants/         # Vaste waarden, thema's en vertalingen (translations.ts)
├── context/           # React Context providers (Statusbeheer)
└── hooks/             # Aangepaste React hooks (bijv. useColorScheme)
```

## 4. Navigatie en Routing

De navigatie wordt volledig beheerd door **Expo Router**. 
- **Root Layout (`app/_layout.tsx`):** Bevat alle context providers en de `AuthNavigatorGuard` die controleert of een gebruiker is ingelogd voordat ze toegang krijgen tot de hoofdapplicatie.
- **Tab Navigatie (`app/(tabs)/_layout.tsx`):** Beheert de onderste navigatiebalk met de belangrijkste secties:
  - `index.tsx` (Feed / Ontdekken)
  - `socialfeed.tsx` (Community / Posts)
  - `camera.tsx` (Vastleggen)
  - `achievements.tsx` (Kroonkluis / Beloningen)
  - `profile.tsx` (Gebruikersprofiel)

## 5. Statusbeheer (Context API)

De applicatie vermijdt complexe externe bibliotheken zoals Redux en gebruikt in plaats daarvan meerdere modulaire **React Contexts**:

- **`UserContext`**: Beheert de huidige gebruiker, authenticatiestatus en profielinformatie.
- **`EventContext`**: Beheert de lijst met evenementen, opgeslagen evenementen en de "My Night" (Mijn Nacht) planner.
- **`PostContext`**: Beheert de berichten van gebruikers, inclusief de foto's ("Captures") die ze maken.
- **`SocialContext`**: Beheert sociale interacties zoals vind-ik-leuks (likes) en reacties (comments) op posts en evenementen.
- **`FilterContext`**: Beheert de actieve zoekfilters en categorieën voor het ontdekken van evenementen.
- **`LanguageContext`**: Beheert de geselecteerde taal en levert de vertaalfunctionaliteit (`t()` functie).
- **`ToastContext`**: Zorgt voor het tonen van tijdelijke meldingen (toasts) in de applicatie.

## 6. Belangrijkste Functionaliteiten

### 6.1. Ontdekken & Filters (Feed)
Gebruikers kunnen door evenementen bladeren, filteren op datum, prijs, of sfeer (bijv. "Live muziek", "Open air"). Deze functionaliteit maakt gebruik van de `FilterContext` om resultaten in real-time bij te werken.

### 6.2. Camera & Beloningen (Kronen)
De kern van de app-ervaring. Gebruikers maken foto's (`expo-camera`) van hun drankjes tijdens evenementen.
- Na het maken van een foto volgt een review-scherm (`camera/review-success` of `review-fail`).
- Geldige foto's leveren "Kronen" op, die worden bijgehouden in de `achievements.tsx` (Kroonkluis). Gebruikers kunnen in niveau stijgen (levelen) op basis van hun reeks (streak).

### 6.3. Social Feed & Interactie
Een feed in Instagram-stijl waar gebruikers elkaars vastgelegde momenten kunnen zien.
- Functionaliteiten omvatten het liken van posts en het achterlaten van reacties.
- Dit wordt aangedreven door de `SocialContext` en `PostContext`.

### 6.4. Planner ("My Night")
Gebruikers kunnen evenementen opslaan of markeren als "Gaan" (Going) of "Misschien" (Maybe). Deze worden verzameld in de planner, waar gebruikers ook persoonlijke notities kunnen toevoegen voor de avond.

### 6.5. Admin Dashboard
Een verborgen/afgeschermde sectie (`app/admin.tsx`) voor beheerders om de applicatie te modereren.
- Beheerders kunnen gebruikers bekijken (en mogelijk verbannen), posts verwijderen, en evenementen beheren.

## 7. Internationalisatie (i18n)

De applicatie is volledig meertalig en ondersteunt momenteel Engels (EN), Nederlands/Vlaams (NL), en Frans (FR).
- **Architectuur:** Geregeld via `LanguageContext`. De geselecteerde taal wordt opgeslagen in de lokale opslag (`AsyncStorage`).
- **Vertalingen:** Alle hardcoded teksten zijn ondergebracht in `constants/translations.ts`.
- **Gebruik:** Componenten importeren de `useLanguage` hook en gebruiken de `t('sleutel')` functie om teksten reactief weer te geven. Wanneer de taal in de instellingen wordt gewijzigd, past de hele UI zich direct aan.

## 8. Stijlen & Thema's

- **Thema:** De applicatie ondersteunt zowel lichte als donkere modi via de `useColorScheme` hook (gekoppeld aan de systeeminstellingen van het apparaat).
- **Kleurenpalet:** Vaste kleuren en stijlen zijn gedefinieerd in `constants/theme.ts`.
- **Componenten:** De app maakt gebruik van herbruikbare "Themed" componenten (zoals `ThemedText` en `ThemedView`) in de `components/` map, die automatisch reageren op thema-wijzigingen en zorgen voor een consistente, premium uitstraling (bijv. blur-effecten, vloeiende overgangen).

> [!TIP]
> **Aandachtspunt voor verdere ontwikkeling:** Omdat de app sterk afhankelijk is van Context API's, is het belangrijk om bij het toevoegen van nieuwe complexe logica te letten op onnodige "re-renders" om de prestaties soepel te houden.
