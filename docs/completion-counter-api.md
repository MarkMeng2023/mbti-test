# Completion Counter API

This static site needs a shared completion counter that works across GitHub Pages and Aliyun OSS without exposing database administrator credentials in frontend code.

## Recommended Approach

Use Cloudflare Workers with D1 or KV.

- It does not require a long-running server.
- It is low-cost for this traffic pattern.
- The frontend only calls a small HTTPS API.
- The Worker can keep private database or KV credentials server-side.
- It supports CORS allowlists for the production domains.
- The same API can be used by GitHub Pages and Aliyun OSS.
- The Worker can make `runId` idempotency checks before incrementing.

D1 is preferred if you want durable `runId` records and simple reporting queries. KV is enough for a basic counter, but idempotency and later analytics are easier to reason about with D1.

## Initial Count

Initial public count: `1019`.

Prefer storing the real completed-test count separately, then add the display baseline (`1019`) in the API response. This keeps current-period reports from accidentally treating the baseline as new completions.

## Read Total

```http
GET /completion-count
```

Response:

```json
{
  "count": 1019
}
```

## Increment On Completed Test

```http
POST /completion-count/increment
Content-Type: application/json
```

Request:

```json
{
  "runId": "unique-test-run-id",
  "mode": "quick"
}
```

Response when incremented:

```json
{
  "count": 1020,
  "incremented": true
}
```

Response when the same `runId` was already counted:

```json
{
  "count": 1020,
  "incremented": false
}
```

## Server Requirements

- Treat `runId` as idempotency key. Do not trust the frontend alone.
- Accept only `mode` values: `quick` and `pro`.
- Do not store names, emails, IP addresses, answer details, gender, age, zodiac, or blood type.
- Do not expose database administrator keys or write tokens to frontend code.
- Restrict CORS to production origins, for example:
  - `https://markmeng2023.github.io`
  - the Aliyun OSS production domain
- Rate-limit requests by origin and broad request pattern to reduce abuse.
- Return a safe count even when `incremented` is false.
- Validate JSON body size and reject malformed requests.
- Log only minimal operational metadata.

## Frontend Contract

The frontend calls only:

- `getCompletionCount()`
- `incrementCompletionCount(runId, mode)`

Both functions live in `js/core/completionCounter.js`. Business pages should not call third-party APIs directly.
