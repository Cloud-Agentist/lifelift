# Cloud Agentist — Agent Guide

## What This Repo Is

Cloud Agentist is the **flagship consumer-facing UI shell** for the Cloud Agentist platform.
It is a Next.js 16 application that lets humans interact with their persistent AI actor,
review pending approvals, and see their activity and memory.

Cloud Agentist **does not contain platform logic**. It calls platform APIs only. All reasoning,
governance, memory, and capability execution live in `cloud-agentist-platform`.

## Architecture Role

```
Human (browser)
     ↕
Cloud Agentist (Next.js, port 3100)
     ↕  server-side only — never browser-to-platform
Cloud Agentist Platform services (ports 3000-3021)
```

## Key Rules

1. **No platform logic in Cloud Agentist** — No authority evaluation, no approval storage, no actor
   management beyond `ensureActor()`. Call the platform; don't re-implement it.

2. **Server-side calls only** — Internal platform URLs (`localhost:3002`, etc.) must never reach
   the browser. Use Server Components and Server Actions. Sensitive data stays server-side.

3. **Auth0 v4 pattern** — Use `auth0.getSession()` from `@/lib/auth0` in Server Components.
   Use `useUser()` from `@auth0/nextjs-auth0` in Client Components.

4. **`/auth/*` routes** — Handled automatically by the `proxy.ts` / `middleware.ts` interception.
   Do not add manual route handlers for login/logout/callback.

5. **Actor identity** — Every authenticated user maps to a platform actor via `ensureActor(sub, name)`
   in `src/lib/platform.ts`. The `actorId` is the platform-native identifier; Auth0 `sub` is the
   external link.

## Directory Layout

```
src/
  app/
    page.tsx               — Landing page (unauthenticated)
    layout.tsx             — Root layout with Auth0Provider
    (protected)/
      layout.tsx           — Nav + auth guard
      chat/                — Chat interface (ChatShell client component + server action)
      approvals/           — Pending approvals list (ApprovalList + server action)
      activity/            — Event feed + memory panel
    api/
      approvals/           — JSON API endpoint for client-side polling (optional)
  lib/
    auth0.ts               — Auth0Client singleton
    platform.ts            — Server-side platform API client
  middleware.ts            — Next.js 15 compat (delegates to proxy.ts logic)
  proxy.ts                 — Next.js 16 proxy (Auth0 middleware)
```

## Running Locally

```bash
npm install
cp .env.example .env    # fill in AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET
npm run dev             # port 3100
```

Platform services must be running for chat/approvals/activity to work. Start the platform
with `npm run dev:*` commands in `cloud-agentist-platform/`.

## Auth0 Setup

- Create a **Regular Web Application** (not SPA, not M2M) in the Auth0 dashboard
- Allowed Callback URL: `http://localhost:3100/auth/callback`
- Allowed Logout URL: `http://localhost:3100`
- Set `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` in `.env`

## Extending

- Add new pages under `src/app/(protected)/`
- New platform API calls go in `src/lib/platform.ts`
- Server Actions go in `actions.ts` co-located with the page/component

## TODO

- Real-time approval badge count (polling or server-sent events)
- Profile/preferences page (actor metadata + memory management)
- Notification center (signal-ingest events rendered proactively)
- Mobile-optimised layout
- Dark/light theme toggle
