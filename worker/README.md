# Medical Chat Worker (Cloudflare)

This worker proxies frontend chat requests to OpenAI Responses API so keys stay server-side.

## Endpoint

- `POST /chat`

## Environment

Set secrets/vars before deploy:

- Secret: `OPENAI_API_KEY`
- Var: `OPENAI_MODEL` (optional, defaults to `gpt-5.4-mini`)

## Local commands

```bash
cd worker
npm run dev
npm run deploy
```

## Frontend wiring

Set the route page endpoint in:

- `/Users/idanschechter/Projects/idansch.github.io/shelter.html` on `#shelter-app[data-api-endpoint]`

Example:

```html
<main id="shelter-app" data-api-endpoint="https://your-worker-subdomain.workers.dev/chat">
```
