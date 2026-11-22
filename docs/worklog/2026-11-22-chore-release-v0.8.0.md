---
title: "chore: release v0.8.0"
date: 2026-11-22
branch: chore/release-v0.8.0
request-source: chat session, 2026-11-22
---

## Request

Release the shadowing mistakes made since v0.7.1, so the installed app gets them.

## Changes

- The version is raised from `0.7.1` to `0.8.0` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a MINOR
  release, because the commits since v0.7.1 include `feat` and none is breaking:
    - A sentence of a video not said in full with "Say it after" is listed on the Corrections
      page, with the words not heard and what was heard instead, links to its sentence, and stays
      without the link when the video is deleted; every try is logged for a later analysis (#41).
- No package changes. Saved data gains the `shadowing_mistakes` and `shadowing_attempts` tables,
  created when the app starts; existing data is kept and read as before.

## Verification

- `.github/scripts/check-version.sh v0.8.0`: all packages are at 0.8.0.
- `cd backend && uv run pytest`: 244 passed, 12 live tests deselected.
- `cd frontend && npm test`: 123 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 48 passed; `npx tsc --noEmit` succeeded.
- Not verified: the installed apps of this version, which are built by the release workflow
  after the tag is pushed, and the update from an installed v0.7.1 to it.
