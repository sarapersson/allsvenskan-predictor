# Allsvenskan Predictor - TODO

## Critical (Do Now)

- [x] Rotate API key in AWS SSM (current key is exposed in Postman collection)
- [x] Remove API key from `postman/Allsvenskan-Predictor.postman_collection.json`
- [x] Add `.env` to root `.gitignore`
- [x] Restrict CORS origins in `serverless.yml` (currently `*`)

## High Priority

- [x] Add duplicate prediction prevention in `createPrediction.ts` (conditional write)
- [ ] Add retry logic with exponential backoff in `fetchMatches.ts`
- [ ] Handle unprocessed batch items in `fetchMatches.ts`
- [ ] Guard against `NaN` from `parseInt` in `fetchMatches.ts`
- [ ] Add request timeout (AbortController) in `frontend/services/api.ts`
- [ ] Fix IAM ARNs to use `${aws:accountId}` instead of wildcard

## Medium Priority

- [ ] Add GSI on `PredictionsTable` for `matchId` (avoid scan in calculateScores)
- [ ] Add GSI on `MatchesTable` for date/round (avoid scan in getMatches)
- [ ] Enable Point-in-Time Recovery on DynamoDB tables
- [ ] Add DLQ for `logPrediction` Lambda
- [ ] Increase `fetchMatches` timeout to 90s
- [ ] Refactor `frontend/app/(tabs)/index.tsx` into smaller components
- [ ] Replace O(n²) prediction lookup with a Map/useMemo
- [ ] Use theme constants instead of hardcoded colors in frontend

## Low Priority

- [ ] Remove unused boilerplate (`explore.tsx`, `modal.tsx`)
- [ ] Add `build` script to root `package.json`
- [ ] Add shared types package (avoid type drift between frontend/backend)
- [ ] Add CloudWatch alarms for Lambda errors
- [ ] Make `calculateScores` event-driven instead of hourly schedule
- [ ] Add basic test framework and unit tests
- [ ] Add `.env.example` files for developer onboarding
- [ ] Add Lambda concurrency limits
