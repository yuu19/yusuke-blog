# Better Auth OAuth Provider lab

This workspace accompanies the self-contained Book “OAuth 2.1のしくみと実装 — Better Auth OAuth Providerをソースから読み解く”. It separates the authorization server, public client, protected resource, and later BFF so that cookies and bearer tokens never share an owner accidentally.

## Browser-visible origins

| Role | Origin | Notes |
| --- | --- | --- |
| Authorization Server | `http://localhost:4100` | Vite is the public development entry; Hono is internal on `127.0.0.1:4110` |
| Public React Client | `http://127.0.0.1:4200` | Tokens stay in memory; transaction data stays in `sessionStorage` |
| Notes Resource API | `http://127.0.0.3:4300` | Accepts bearer or DPoP requests |
| Next.js + Hono BFF | `http://[::1]:4400` | Added in Part 5; tokens stay in the BFF database |

Ports are not cookie boundaries. `localhost`, IPv4 loopback, and IPv6 loopback are used deliberately as distinct cookie hosts, while the API has no browser cookie ownership. Better Auth cross-subdomain cookies remain disabled. Because Better Auth permits local HTTP redirects only with native application metadata, the two local redirecting clients use `application_type: native`; the Part 6 HTTPS production registrations use `web`.

## Start

```bash
pnpm install
pnpm run setup
pnpm run lab:dev
```

`pnpm run setup` writes generated values only to `.local/.env` and never overwrites an existing file. The explicit `run` avoids pnpm's unrelated built-in `setup` command. `pnpm run lab:dev` starts PostgreSQL, applies committed migrations, seeds the user and OAuth clients through Better Auth APIs, then starts the three core applications.

Part 5 adds the BFF as a separate process:

```bash
pnpm --filter @oauth-lab/bff-app dev
```

Run the Device Flow CLI and machine indexer separately:

```bash
pnpm device
pnpm indexer
```

`pnpm db:down` keeps the database volume. `pnpm db:reset` deletes it and is intentionally separate.

## Verify

```bash
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm -r --if-present build
```

The Playwright suite covers OIDC + JWT after Authorization Code + PKCE, a wrong PKCE verifier and code replay, refresh-token rotation and reuse, and a DPoP-bound BFF session. It accepts both the first-time consent screen and Better Auth's reuse of an existing matching consent.

## Evidence boundary

- `upstream-sources.json` pins the exact Better Auth source inputs.
- `SPEC_MATRIX.md` separates RFC requirements, the OAuth 2.1 draft, plugin behavior, and lab observations.
- The local Inspector records only kind, length, prefix, and SHA-256 fingerprint. It is absent unless `OAUTH_LAB_MODE=true` and the request is loopback.
- No deployment, Git tag, commit, or push is performed by these scripts.
