# AGENTS.md

## Cursor Cloud specific instructions

`promising` is a single Next.js 15 (App Router) + TypeScript app using Prisma with an embedded SQLite database. There is no separate backend, container, or DB server. Standard commands live in `package.json` and `README.md`; only the non-obvious cloud caveats are captured here.

### First-run setup after `npm install`
`.env` and the SQLite DB (`prisma/dev.db`) are gitignored, so they do NOT persist across fresh VMs and are NOT created by the update script. Before running the app or tests, a fresh agent must:

```bash
cp .env.example .env        # SQLite + a dev AUTH_SECRET; works out of the box
npx prisma migrate dev      # creates & migrates prisma/dev.db
npm run db:seed             # seeds 27 stocks + demo account
```

`npm run db:reset` recreates and re-seeds the DB from scratch.

### Running / testing
- Dev server: `npm run dev` (Next.js + Turbopack) on http://localhost:3000.
- Lint: `npm run lint` (eslint). No automated test suite exists in this repo.
- Demo login: `demo@promising.app` / `demo1234`.

### Non-obvious gotchas
- Server-side auth (page server components, server actions) reads the session via `auth()`; client buttons ("Watch", "Add to Portfolio" in `src/components/stock/action-buttons.tsx`) rely on `useSession()` from `next-auth/react`. `useSession` hydrates asynchronously from `/api/auth/session` after page load. If you click those buttons before the client session hydrates, the component treats you as logged out and redirects to `/login`. When testing these actions, wait a moment / reload the detail page after login before clicking.
- Live market data (Yahoo Finance via `yahoo-finance2`, and optional Polygon.io) requires outbound internet. Screener/dashboard/detail pages render fine from seeded DB data without it, so most testing does not need network access. `POLYGON_API_KEY` and `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are optional; email/password auth and international data work without them.
