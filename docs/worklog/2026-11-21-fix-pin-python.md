---
title: "fix: pin the Python version in the project"
date: 2026-11-21
branch: fix/pin-python
request-source: chat session, 2026-11-21
---

## Request

`sos-my-interview` fixed the same failed first launch (uv installing Python 3.15, which
`onnxruntime` has no build for) by pinning the Python version in the project. Do it the same way
here, in place of the `--python 3.12` argument that v0.1.1 passes from the desktop launcher.

## Changes

- **Pin**: `backend/.python-version` says `3.14`, and the packaged app ships that file next to
  `pyproject.toml` and `uv.lock`. Running from a checkout, CI, and the packaged app now all use
  the same Python minor version; before, only the packaged app was pinned. The patch version is
  left open.
- **Upper bound**: `requires-python` is `>=3.12,<3.15`, and `uv.lock` was resolved again for
  that range. No package version changed; the lock only lost its Python 3.15 entries.
- **Launcher**: the `--python 3.12` argument and its constant were removed from
  `desktop/src/backend.ts`. The installed app therefore moves from Python 3.12 to 3.14 with the
  next release; uv replaces an environment whose Python does not match, so nothing has to be
  removed by hand, but the first launch after that update installs the packages again.
- **Tests**, taken from `sos-my-interview`: a backend test reads `uv.lock` and fails when a
  package without a source distribution has no wheel for a Python that `requires-python`
  allows; another checks that the pinned version is inside that range; a desktop test checks
  that the pin is among the files the packaged app ships.

## Verification

- The new tests failed before the change (two in the backend, two in the desktop suite) and
  pass after it.
- `cd backend && uv run pytest`: 67 passed, 3 live tests deselected, now on Python 3.14.5. The
  live tests (`pytest -m live`) passed: 3 of 3.
- `cd desktop && npm test`: 31 passed; `npx tsc --noEmit` succeeded.
- First launch simulated with the uv shipped in the app (0.13.9): only the files the app ships
  were copied to an empty folder, and uv was limited to the Pythons it installs itself. `uv run
  --frozen --no-dev` installed Python 3.14.10 and the 84 packages, and imported `onnxruntime`,
  `faster_whisper`, `kokoro_onnx`, `litellm`, and `app.main`.
- Not verified: a rebuilt installer, and an installed v0.1.1 updating to a version with this
  change. The frontend tests were not run; no frontend file changed.
