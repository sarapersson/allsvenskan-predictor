# Allsvenskan Predictor - TODO

## Critical (Do Now)

- [x] Rotate API key in AWS SSM (current key is exposed in Postman collection)
- [x] Remove API key from `postman/Allsvenskan-Predictor.postman_collection.json`
- [x] Add `.env` to root `.gitignore`
- [x] Restrict CORS origins in `serverless.yml` (currently `*`)

## High Priority

- [x] Add duplicate prediction prevention in `createPrediction.ts` (conditional write)
- [x] Add retry logic with exponential backoff in `fetchMatches.ts`
- [x] Handle unprocessed batch items in `fetchMatches.ts`
- [x] Guard against `NaN` from `parseInt` in `fetchMatches.ts`
- [x] Add request timeout (AbortController) in `frontend/services/api.ts`
- [x] Fix IAM ARNs to use `${aws:accountId}` instead of wildcard

## Medium Priority

- [x] Add GSI on `PredictionsTable` for `matchId` (avoid scan in calculateScores)
- [ ] Add GSI on `MatchesTable` for date/round (avoid scan in getMatches)
- [x] Enable Point-in-Time Recovery on DynamoDB tables
- [x] Add DLQ for `logPrediction` Lambda
- [x] Increase `fetchMatches` timeout to 90s
- [x] Refactor `frontend/app/(tabs)/index.tsx` into smaller components
- [x] Replace O(n²) prediction lookup with a Map/useMemo
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
