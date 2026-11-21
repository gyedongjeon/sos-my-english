---
title: "fix: run the installed app on Python 3.12"
date: 2026-11-21
branch: fix/packaged-python
request-source: chat session, 2026-11-21
---

## Request

The app installed from the v0.1.0 release did not start. It reported "The app server stopped"
with uv's error that `onnxruntime==1.32.0` has no build for CPython 3.15.

## Changes

- **Cause**: the packaged app keeps uv's Python in its own folder
  (`UV_PYTHON_INSTALL_DIR`), which starts empty, so uv installs a Python for the project. With
  only `requires-python = ">=3.12"` to go by, it picks the newest one, 3.15, and the locked
  `onnxruntime` has builds only up to 3.14. Running from a checkout was not affected, because
  uv uses the Python already on the machine there.
- **Fix**: the packaged app starts the backend with `uv run --python 3.12`
  (`desktop/src/backend.ts`), the version the project is developed and tested on. A checkout
  keeps choosing its own Python.
- A folder left by the failed start needs no cleaning up: uv replaces a virtual environment made
  with another Python.
- `sos-my-interview` starts its backend the same way and is expected to fail the same way on a
  fresh install; that is left to its own repository.

## Verification

- Reproduced with the uv bundled in the app (0.13.9), an empty Python folder and an empty
  virtual environment: `uv run --project backend --frozen --no-dev` failed with the reported
  error. With `--python 3.12` added, it installed CPython 3.12.16 and the 84 packages, and
  `onnxruntime`, `faster_whisper`, `kokoro_onnx`, and `litellm` were imported.
- `cd desktop && npm test`: 30 passed (the new test failed before the fix);
  `npx tsc --noEmit` succeeded.
- Not verified: the installed app itself, which needs a new release to be built from this fix.
