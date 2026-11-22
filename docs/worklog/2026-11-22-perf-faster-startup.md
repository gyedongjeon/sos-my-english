---
title: "perf: start the app in about a second instead of six"
date: 2026-11-22
branch: perf/faster-startup
request-source: chat session, 2026-11-22
---

## Request

On both macOS and Windows, opening the app again after quitting it takes a long time. Make it
start faster.

## Changes

Measured on an installed v0.6.0 (macOS), the server took about 6 seconds to answer. `uv run`
itself took 0.04 seconds; the time went to Python loading the backend:

- **No compiled files were kept** (about 3.5 s). The desktop app set `PYTHONDONTWRITEBYTECODE`
  to keep compiled files out of the app bundle, which also kept them out of the package folder
  in the user's profile: the installed `venv` had 9,031 `.py` files and no `.pyc`, so every
  launch compiled all of them again. `desktop/src/backend.ts` now sets `PYTHONPYCACHEPREFIX` to
  `<userData>/pycache` for the packaged app instead, so compiled files are kept there and the
  bundle stays unchanged. A checkout keeps `PYTHONDONTWRITEBYTECODE` as before.
- **LiteLLM downloaded its model price list on every start** (0.5 to 0.9 s here, longer on a
  slow network). `app/llm.py` sets `LITELLM_LOCAL_MODEL_COST_MAP=True`, so the list LiteLLM
  ships with is used; prices are not used by this app.
- **LiteLLM took about 2 s to load** and was loaded with the server, though it is needed only
  to call the model. `app/llm.py` now loads it on first use (`load()`), and the server starts a
  background thread to load it once it is up, so it is usually ready before the first request
  that needs it; a request that comes sooner waits for the import. No other module imports
  LiteLLM.

## Verification

- New tests, each seen to fail first: `desktop/tests/backend.test.ts` (compiled files go to
  `<userData>/pycache` and are no longer switched off for the packaged app);
  `backend/tests/test_startup.py` (in a fresh interpreter: the server loads without LiteLLM,
  LiteLLM is loaded in the background after startup, and the shipped price list is used).
- `cd backend && uv run pytest`: 215 passed. `uv run --env-file .env pytest -m live`: 10 passed,
  so real model calls still work with LiteLLM loaded later.
- `cd desktop && npm test`: 48 passed; `npx tsc --noEmit` succeeded.
- Time until `/api/health` answers, using the installed app's package folder: v0.6.0 as
  installed 6.7 s and 5.6 s; with this change 2.4 s on the first launch (nothing compiled yet)
  and 0.66 s and 0.61 s on later launches.
- Not verified: the packaged app on macOS and Windows; installed apps get this with the next
  release. On Windows the start may have other slow parts (antivirus scanning) not measured here.
