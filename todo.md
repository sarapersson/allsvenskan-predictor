# Allsvenskan Predictor - TODO

## Round 2 (completed)

### Security

- [x] Limit API_KEY env var to only the authorizer Lambda
- [x] Fix hardcoded CORS `*` in handler responses
- [x] Validate `matchId` as string with max length in createPrediction
- [x] Use `crypto.timingSafeEqual` in authorizer

### Bugs

- [x] Fix createPrediction response shape mismatch in frontend

### Config

- [x] Add `.build/` to `.gitignore`
- [x] Expand CloudWatch alarms to cover all critical Lambdas
- [x] Create `.env.example` files (already existed, skipped)

### Nice-to-haves

- [x] Update README
- [x] Remove empty `postman/` directory
- [x] Add pull-to-refresh on match list

---

## Round 1 (completed)

### Critical (Do Now)

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
- [x] Add GSI on `MatchesTable` for date/round (avoid scan in getMatches)
- [x] Enable Point-in-Time Recovery on DynamoDB tables
- [x] Add DLQ for `logPrediction` Lambda
- [x] Increase `fetchMatches` timeout to 90s
- [x] Refactor `frontend/app/(tabs)/index.tsx` into smaller components
- [x] Replace O(n²) prediction lookup with a Map/useMemo
- [x] Use theme constants instead of hardcoded colors in frontend

## Low Priority

- [x] Remove unused boilerplate (`explore.tsx`, `modal.tsx`)
- [x] Add `build` script to root `package.json`
- [x] Add shared types package (avoid type drift between frontend/backend)
- [x] Add CloudWatch alarms for Lambda errors
- [x] Make `calculateScores` event-driven instead of hourly schedule
- [x] Add basic test framework and unit tests
- [x] Add `.env.example` files for developer onboarding
- [x] Add Lambda concurrency limits
