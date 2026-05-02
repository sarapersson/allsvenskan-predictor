# ⚽ Allsvenskan Tipsspel

En serverless-applikation för att tippa resultat i Allsvenskan. Byggd med AWS Lambda, API Gateway, DynamoDB och EventBridge.

## 🏗 Arkitektur

```
FRONTEND (React Native / Expo)
        |
        v
API GATEWAY (Säkrad med API-key)
|-- GET /matches ----------> getMatches (Lambda) ------> DynamoDB (MatchesTable)
|-- GET /predictions ------> getPredictions (Lambda) --> DynamoDB (PredictionsTable)
|-- POST /predictions -----> createPrediction (Lambda) > DynamoDB (PredictionsTable)

SCHEDULED (EventBridge Schedule)
|-- fetchMatches (Lambda) -----> Hämtar data från API --> DynamoDB (MatchesTable)

EVENT-DRIVEN (EventBridge Bus)
|-- calculateScores (Lambda) --> Triggad av MatchesUpdated --> Uppdaterar PredictionsTable
|-- logPrediction (Lambda) ----> Loggar varje nytt tips (triggad av PredictionCreated-event)
```

## 🛠 Tech Stack

- **Backend:** Node.js, TypeScript, Serverless Framework
- **Moln:** AWS Lambda, API Gateway, DynamoDB, EventBridge
- **Frontend:** React Native med Expo
- **Data:** TheSportsDB (gratis API)

## 🔌 API Endpoints

| Metod | Endpoint | Beskrivning | Auth |
|-------|----------|-------------|------|
| GET | /matches | Hämta alla matcher | API-key |
| GET | /predictions | Hämta användarens tips | API-key |
| POST | /predictions | Skicka in ett tips | API-key |

## ⚡ Event-driven funktioner

| Funktion | Trigger | Beskrivning |
|----------|---------|-------------|
| fetchMatches | EventBridge (var 2:a timme + dagligen) | Hämtar matchdata från TheSportsDB, smart fetch av omgångar som behöver uppdateras |
| calculateScores | EventBridge (MatchesUpdated-event) | Beräknar poäng för alla tips baserat på faktiska resultat |
| logPrediction | EventBridge (PredictionCreated-event) | Loggar varje tips som skapas |

## 🏆 Poängsystem

- **3p** -- Exakt rätt resultat
- **1p** -- Rätt utgång (1/X/2)
- **0p** -- Fel

## 🚀 Deploy

```bash
npm install
npx serverless deploy
```

### Efter deploy

1. **Skapa API-nyckel i SSM** (första gången):
   ```bash
   aws ssm put-parameter \
     --name "/allsvenskan-predictor/dev/api-key" \
     --value "$(openssl rand -hex 16)" \
     --type SecureString \
     --region eu-north-1
   ```

2. **Prenumerera på larm** (e-post vid fel):
   ```bash
   aws sns subscribe \
     --topic-arn arn:aws:sns:eu-north-1:<ACCOUNT_ID>:allsvenskan-predictor-alarms-dev \
     --protocol email \
     --notification-endpoint din@email.com \
     --region eu-north-1
   ```

3. **Seed matchdata** (hämtar alla 30 omgångar för Allsvenskan 2026 från TheSportsDB till DynamoDB):
   ```bash
   npx serverless invoke -f fetchMatches
   ```
   Detta körs sedan automatiskt var 2:a timme (resultat) och dagligen (datumändringar) via EventBridge.

## 💻 Frontend

```bash
cd frontend
cp .env.example .env   # Fyll i API-URL och nyckel
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
├── shared/
│   └── types/
│       └── index.ts          # Delade typer (Match, Prediction)
├── tests/
│   ├── calculateScores.test.ts
│   └── fetchMatches.test.ts
├── frontend/
│   ├── app/
│   │   └── (tabs)/
│   │       └── index.tsx
│   ├── components/
│   │   ├── match-card.tsx
│   │   └── score-summary.tsx
│   ├── constants/
│   │   └── theme.ts
│   ├── services/
│   │   └── api.ts
│   └── package.json
├── serverless.yml
├── vitest.config.ts
├── package.json
└── README.md
```
