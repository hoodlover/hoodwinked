# Hoodwinked — Roadmap

Summary
-------
This document captures the planned game modes and the intended extension points in the codebase so future contributors can pick up work quickly.

Planned modes
-------------
- Trivia — question/answer rounds, timed buzz-in mechanics, score per correct answer.
- Picture Reveal — progressively reveal an image; points awarded for early correct guesses.
- Wheel-of-Fortune — spinning wheel mechanic, letter-guessing, and puzzle solving.
- Family Feud — survey-style head-to-head answers with ranked points.

Design notes
------------
- The app currently exposes a `mode` field on the game `state` that drives per-mode behavior in the UI (`app/hoodwinked.tsx`).
- Game rules and authoritative state transitions live in the reducer in `lib/engine.ts`. That same reducer is mirrored on the server in `party/hoodwinked.ts` so PartyKit enforces authoritative logic.
- The codebase uses a discriminated `Action` union (TypeScript) for updates — extend that union with new mode-specific actions rather than ad-hoc stringly-typed messages.

Integration checklist (how to add a new mode)
-------------------------------------------
1. Add mode-specific shape to `State` and any new action variants in the `Action` union in `lib/engine.ts`.
2. Implement the reducer logic for the new actions and transitions, keeping server parity in `party/hoodwinked.ts`.
3. Add prompt/data sources for the mode (new JSON or in-code arrays), and adapt any persistence if needed.
4. Hook up UI in `app/hoodwinked.tsx` with board/phone render branches analogous to `classic` and `quiplash`.
5. Prototype locally with `/?local=1` (LocalParlor) to iterate with fake phones before deploying multiplayer.
6. Add tests or manual smoke scripts (use `scripts/smoke-multiplayer.mjs` as reference) and test end-to-end on a staging deployment.

Notes
-----
- Keep state transitions deterministic and testable — the shared reducer approach makes it easy to run the same logic server-side and client-side.
- Favor explicit actions for mode lifecycle events (START_ROUND, FORCE_REVEAL, SCORE_RESOLVE, etc.).
