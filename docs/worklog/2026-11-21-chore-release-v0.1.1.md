---
title: "chore: release v0.1.1"
date: 2026-11-21
branch: chore/release-v0.1.1
request-source: chat session, 2026-11-21
---

## Request

Release the fixes made since v0.1.0, whose installed app did not start.

## Changes

- The version is raised from `0.1.0` to `0.1.1` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a PATCH
  release: the two changes since v0.1.0 are fixes.
    - The installed app runs on Python 3.12. In v0.1.0 it installed Python 3.15, which a
      package has no build for, and stopped with "The app server stopped".
    - Corrections are explained in the chosen feedback language more reliably.
- v0.1.0 cannot update itself to this version, because it does not start. It has to be replaced
  by hand with the `.dmg` of this release.

## Verification

- `.github/scripts/check-version.sh v0.1.1`: all packages are at 0.1.1.
- `cd backend && uv run pytest`: 65 passed, 3 live tests deselected.
- `cd frontend && npm test`: 26 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 30 passed; `npx tsc --noEmit` succeeded.
- Not verified: the installed app of this version; it is built by the release workflow after
  the tag is pushed.
