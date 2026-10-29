# Hidden Gem

Hidden Gem is a social map app where friends can see each other’s live presence, chat, and share meaningful places through public Gems and private Spots.

## Product summary

Hidden Gem is built for the core v1 promise:

"Users can sign up, add friends, share location, chat, and create public Gems and private Spots on a map."

## Why it matters

The app combines the trust of a social network with the excitement of map-based discovery. It is intimate enough for close friends, useful enough for everyday coordination, and visually engaging enough to feel like a memorable mobile product.

## Product pillars

- Social trust: friend requests, presence, private network
- Real-time location: share with friends or publicly
- Social discovery: map-based Gems and Spots
- Conversation: direct chat with read states and notifications
- Privacy: clear consent, minimal sharing by default, location controls

## Core MVP features

- Authentication: sign up, login, logout, reset password
- Profile: username, profile image, bio, privacy defaults
- Friends: requests, accept/decline, list, block, remove
- Presence: online/offline status and last active time
- Live location: friends-only/public/off modes
- Map: display map, markers for friends and content
- Public Gems: create, view, search, save, report
- Private Spots: create, share, hidden from public search
- Messaging: direct chat, read receipts, timestamps, notifications
- Offline: unsynced queueing for messages and content

## MVP launch outcome

The initial version should feel useful immediately: a user can sign up, add friends, share location, communicate in real time, and create geotagged places that matter.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Redis for realtime and presence
- PostGIS for nearby location data
- WebSockets for chat and live updates
- IndexedDB for offline queueing

## Included docs

- `docs/hidden-gem-prd.md`
- `docs/hidden-gem-brand.md`
- `docs/hidden-gem-sprint-backlog.md`
- `docs/technical-architecture.md`
- `docs/database-schema.md`
- `docs/sprint-plan.md`

## Project structure

```
hidden-gem/
├── backend/      API service (Next.js route handlers only) on port 4000
│   ├── app/api/      46+ REST and realtime (SSE) endpoints
│   ├── lib/          auth, Prisma client, OTP/email, rate limiting, realtime hub
│   └── prisma/       schema.prisma and migrations (add yours here)
├── frontend/     Web app (pages, components, styles) on port 3000
│   ├── app/          pages and layouts
│   ├── components/   UI, map, navigation
│   └── lib/          browser helpers, realtime client, server-side backend client
├── docs/         product, design and architecture notes
├── legacy/       archived single-file prototype
└── docker-compose.yml   local PostgreSQL
```

The browser only talks to the frontend. `frontend/next.config.js` proxies `/api/*` to the backend (`BACKEND_URL`), so session cookies, OAuth redirects and the realtime stream stay on one origin. In production, either keep that proxy or route `/api` to the backend at your reverse proxy (nginx, Caddy, a cloud load balancer); the browser code does not change.

## Quick start

```
docker compose up -d db                 # local PostgreSQL (optional)
cp backend/.env.example backend/.env    # DATABASE_URL, JWT_SECRET (32+ characters), Clerk, email keys
cp frontend/.env.example frontend/.env  # BACKEND_URL and Clerk keys (same Clerk app as the backend)
npm run setup                           # installs root, backend and frontend dependencies
npx prisma migrate deploy --schema backend/prisma/schema.prisma
npm run dev                             # backend on :4000, frontend on :3000
```

Run one side only with `npm run dev:backend` or `npm run dev:frontend`. `NEXT_PUBLIC_APP_URL` in the backend must be the frontend's public address because OAuth redirects are built from it.

## Production launch checklist

- Set `NEXT_PUBLIC_APP_URL` to the public HTTPS URL. Configure the same origin in Google OAuth's authorized redirect URI and in Clerk's production instance settings.
- Configure production-only `DATABASE_URL`, a unique `JWT_SECRET` (at least 32 characters), Resend credentials, and `EMAIL_FROM` in the hosting provider's secret manager. Do not use local `.env` files or placeholder credentials in production.
- Run `npx prisma migrate deploy` against the production database before serving traffic. This includes the persistent authentication rate-limit table.
- Ensure the hosting proxy overwrites `x-forwarded-for` or supplies a trusted `x-real-ip` header. Authentication rate limits use that address and are stored in PostgreSQL, so they work across app instances.
- Enable automated database backups and verify a restore before launch. Configure error/availability monitoring and alerts in the chosen hosting provider.
- Smoke-test signup and email delivery to an external inbox, OTP verification, password login, Google/Clerk sign-in if enabled, and logout.
- With two separate test accounts, verify that location sharing defaults off, only intended friends can see friend-only locations and private Spots, and blocking removes access. Test turning sharing off and logging out as well.
- Test the deployed map, chat, and Server-Sent Events connection on the chosen Node.js host; the realtime stream requires support for long-lived HTTP responses and a reachable PostgreSQL database.

Open http://localhost:3000

## Standalone live prototype

The original single-file prototype (`hidden-gem.html` / `hidden-gem.js`) is archived in `legacy/` and is no longer part of the build or lint. The main app's map (`/map`) supersedes it.

## Verification email preview

With the app running, open http://localhost:3000/email-preview.html to preview the branded verification email in a browser. It uses a sample code; the actual email uses a generated, expiring code and the same HTML template.

The interactive map uses OpenStreetMap street tiles or Esri World Imagery satellite tiles. The browser requests geolocation permission only when location-based features are used. Live sharing can be turned off from the map page; logging out also clears the user's stored coordinates. Map and chat updates are pushed over Server-Sent Events using PostgreSQL `LISTEN`/`NOTIFY`; run the app on a Node.js host that supports long-lived HTTP streams and keep the database reachable by the realtime listener.

## Realtime system

Everything live (friend locations, chat, friend requests, presence) travels over one Server-Sent Events stream per browser tab.

```
API route (message sent, location updated, request accepted)
  -> publishRealtime()            backend/lib/realtime.ts pg_notify on channel hidden_gem_updates
  -> LISTEN in the Node process   backend/lib/realtime.ts fans out to that user's open streams
  -> GET /api/realtime/stream SSE   , 25 s heartbeat, resync event on every (re)connect
  -> subscribeRealtime()          frontend/lib/realtime-client.ts one shared EventSource, backoff reconnect
  -> pages refetch what changed   map, friends, chat, nav badge
```

- **Publishing is explicit.** Mutating routes call `publishRealtime`/`publishLocationChange`; no database triggers are required. If you also keep triggers on the same channel, clients simply refetch twice.
- **Presence follows connections.** A user is online while at least one stream is open and goes offline 20 seconds after the last one closes. Counters are per server process; with several instances, pin presence to one or move the counters to a shared store.
- **Reconnects are automatic.** The header shows Live / Reconnecting / Offline. After any reconnect the server sends a full resync event, so missed updates are recovered.
- **Location publishes are throttled** to one per user every 3 seconds (turning sharing off always publishes immediately).
- The host must support long-lived HTTP responses and the database must allow a persistent `LISTEN` connection (use a direct connection, not a transaction-mode pooler such as PgBouncer).

## Operations

- `GET /api/health` returns database and realtime status (HTTP 503 when the database is unreachable); point uptime monitors and load balancers at it.
- `docker compose up -d db` starts a local PostgreSQL 16.
- `.github/workflows/ci.yml` runs lint, type-check and build for backend and frontend on every push and pull request.
- Security headers are set in `frontend/next.config.js` (nosniff, frame protection, referrer policy, geolocation limited to this origin).

