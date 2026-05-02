# Allsvenskan Predictor - Frontend 📱

React Native-app byggd med Expo för att tippa Allsvenskan-matcher.

## Tech Stack

- Framework: React Native med Expo
- Routing: Expo Router (file-based)
- Language: TypeScript
- Backend: AWS Lambda + API Gateway + DynamoDB

## Kom igång

### 1. Installera dependencies

```bash
cd frontend
npm install
```

### 2. Konfigurera miljövariabler

Skapa en .env-fil i frontend/-mappen:

```bash
EXPO_PUBLIC_API_URL=https://din-api-gateway-url.amazonaws.com
EXPO_PUBLIC_API_KEY=din-api-nyckel
```

### 3. Starta appen

```bash
npx expo start
```

Tangenter:
- a = Android emulator
- i = iOS simulator
- w = Webbläsare
Eller scanna QR-koden med Expo Go på din telefon.

## Projektstruktur

```
frontend/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      Layout för tabs
│   │   ├── index.tsx        Hemskärm - matcher
│   │   └── explore.tsx      Utforska
│   ├── _layout.tsx          Root layout med navigation
│   └── modal.tsx            Modal-vy
├── assets/images/           Bilder och ikoner
├── components/              Återanvändbara UI-komponenter
├── constants/               Färger, config, etc.
├── hooks/                   Custom React hooks
├── scripts/                 Hjälpskript
├── services/
│   └── api.ts              API-anrop mot backend
├── .env                     Miljövariabler (INTE i git)
├── app.json                 Expo-konfiguration
├── tsconfig.json            TypeScript-konfiguration
└── package.json             Dependencies och scripts
```

## Scripts

```bash
npx expo start            # Starta dev-server
npx expo start --clear    # Starta med rensad cache
npm run lint              # Kör ESLint
```

## API-integration
All kommunikation med backend sker via services/api.ts:
`GET /matches` - Hämta alla matcher
`GET /predictions` - Hämta alla tips
`POST /predictions` - Skapa nytt tips
Alla requests kräver headern x-api-key.

## Köra på fysisk enhet

1. Installera Expo Go på din telefon
2. Se till att telefon och dator är på samma WiFi-nätverk
3. Scanna QR-koden som visas i terminalen

## Bygga för produktion
```bash
npm install -g eas-cli
eas login
eas build --platform android
eas build --platform ios
```

## Felsökning

- "Network request failed" - Kolla att EXPO_PUBLIC_API_URL är korrekt i .env
- "Unauthorized" - Kolla att EXPO_PUBLIC_API_KEY matchar backend
- Metro bundler hänger - Kör npx expo start --clear
- Expo Go hittar inte servern - Se till att telefon/dator är på samma WiFi
- TypeScript-fel efter ändring - Starta om TS server i VS Code (Cmd+Shift+P)

