# ⚽ Allsvenskan Tipsspel

En serverless-applikation för att tippa resultat i Allsvenskan. Byggd med AWS Lambda, API Gateway, DynamoDB och EventBridge.

## 🏗 Arkitektur

```
FRONTEND (React Native / Expo)
        |
        v
API GATEWAY (Sakrad med API-key)
|-- GET /matches ----------> getMatches (Lambda) ------> DynamoDB (MatchesTable)
|-- GET /predictions ------> getPredictions (Lambda) --> DynamoDB (PredictionsTable)
|-- POST /predictions -----> createPrediction (Lambda) > DynamoDB (PredictionsTable)

EVENTBRIDGE
|-- fetchMatches (Lambda) -----> Hamtar data fran API --> DynamoDB (MatchesTable)
|-- calculateScores (Lambda) --> Laser bada tabeller ---> Uppdaterar PredictionsTable
|-- logPrediction (Lambda) ----> Loggar varje nytt tips (triggad av event)
```

## 🛠 Tech Stack

- **Backend:** Node.js, TypeScript, Serverless Framework
- **Moln:** AWS Lambda, API Gateway, DynamoDB, EventBridge
- **Frontend:** React Native med Expo
- **Data:** Allsvenskan API (api-football)

## 🔌 API Endpoints

| Metod | Endpoint | Beskrivning | Auth |
|-------|----------|-------------|------|
| GET | /matches | Hamta alla matcher | API-key |
| GET | /predictions | Hamta anvandarens tips | API-key |
| POST | /predictions | Skicka in ett tips | API-key |

## ⚡ Event-driven funktioner

| Funktion | Trigger | Beskrivning |
|----------|---------|-------------|
| fetchMatches | EventBridge (schema) | Hamtar matchdata fran extern API och sparar i DynamoDB |
| calculateScores | EventBridge (schema) | Beraknar poang for alla tips baserat pa faktiska resultat |
| logPrediction | EventBridge (event) | Loggar varje tips som skapas |

## 🏆 Poangsystem

- **3p** -- Exakt ratt resultat
- **1p** -- Ratt utgang (1/X/2)
- **0p** -- Fel

## 🚀 Deploy

```bash
npm install
npx serverless deploy
```

## 💻 Frontend

```bash
cd frontend
npm install
npx expo start
```

## 📁 Projektstruktur

```
allsvenskan-predictor/
├── src/
│   ├── handlers/
│   │   ├── authorizer.ts
│   │   ├── calculateScores.ts
│   │   ├── createPrediction.ts
│   │   ├── fetchMatches.ts
│   │   ├── getMatches.ts
│   │   ├── getPredictions.ts
│   │   └── logPrediction.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── dynamodb.ts
├── frontend/
│   ├── app/
│   │   └── (tabs)/
│   │       └── index.tsx
│   ├── services/
│   │   └── api.ts
│   └── package.json
├── serverless.yml
├── package.json
└── README.md
```
