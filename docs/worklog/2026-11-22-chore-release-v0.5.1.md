---
title: "chore: release v0.5.1"
date: 2026-11-22
branch: chore/release-v0.5.1
request-source: chat session, 2026-11-22
---

## Request

Release the fix made since v0.5.0, so the installed app gets it.

## Changes

- The version is raised from `0.5.0` to `0.5.1` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a PATCH
  release, because the only commit since v0.5.0 is a `fix`:
    - After **Play the sentence**, the played sentence stays chosen. Before, it sometimes moved
      to the next sentence when that one started right after it (#24).
- No package and no saved data change.

## Verification

- `.github/scripts/check-version.sh v0.5.1`: all packages are at 0.5.1.
- `cd backend && uv run pytest`: 203 passed, 9 live tests deselected.
- `cd frontend && npm test`: 102 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 47 passed; `npx tsc --noEmit` succeeded.
- Not verified: the installed apps of this version, which are built by the release workflow
  after the tag is pushed, and the update from an installed v0.5.0 to it.
