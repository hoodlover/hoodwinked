# Hoodwinked — Architecture

Overview
--------
This document explains where the code lives, the stack, URL modes, and the environment/deploy story so the next time you (or another contributor) return, the design is clear.

Repository layout (key files)
----------------------------
- `app/hoodwinked.tsx` — single big client UI component that orchestrates board and phone views.
- `lib/engine.ts` — authoritative reducer and game logic used by both client and server.
- `party/hoodwinked.ts` — PartyKit server room logic that mirrors the reducer to enforce authoritative state.
- `partykit.json` — PartyKit entrypoint configuration (`main` points to `party/hoodwinked.ts`).
- `scripts/smoke-multiplayer.mjs` — example script used to exercise multiplayer flows.

Tech stack
----------
- Framework: Next.js (App Router)
- Real-time transport: PartyKit (room/party model)
- Hosting: Vercel for the Next.js app; PartyKit can be self-hosted or run via PartyKit tooling.
- Language: TypeScript + React

URL modes
---------
- Host / landing: `/` — shows landing and lets host create a room.
- Local prototype: `/?local=1` — single-page prototype with in-memory reducer and fake phones.
- Multiplayer: `/?room=CODE&role=host` (host view on TV), players join with `?room=CODE&role=play` on their phones.

Environment variables
---------------------
- `NEXT_PUBLIC_PARTYKIT_HOST` — the PartyKit host (e.g., `localhost:1999` for local dev or an external host). The client uses this to connect to the PartyKit server.

Deployment notes
----------------
- The frontend is deployed to Vercel. The app will be available at `*.vercel.app` after deployment.
- For multiplayer on a real domain, deploy the PartyKit server (or use a hosted PartyKit instance) and set `NEXT_PUBLIC_PARTYKIT_HOST` to the public host in Vercel's environment settings.
- To deploy PartyKit rooms using the PartyKit CLI:

```bash
npx partykit deploy
```

- After deployment, verify the frontend can reach the PartyKit host and test a room end-to-end.

Local development
-----------------
- Use the `/?local=1` mode to iterate quickly without a PartyKit server.
- To test multiplayer locally, run a PartyKit server (see PartyKit docs) and set `NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999` during development.
- Use `scripts/smoke-multiplayer.mjs` to exercise multiplayer flows programmatically.

Other notes
-----------
- Keep the reducer in `lib/engine.ts` the single source of truth for game rules so client and server behavior remains identical.
- Document any new env vars or PartyKit configuration in this file when adding new services.
