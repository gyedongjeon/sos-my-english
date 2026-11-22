---
title: "chore: release v0.8.1"
date: 2026-11-22
branch: chore/release-v0.8.1
request-source: chat session, 2026-11-22
---

## Request

Release the fix for sentences left without a translation, so the installed app gets it.

## Changes

- The version is raised from `0.8.0` to `0.8.1` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a PATCH
  release, because the only code commit since v0.8.0 is a `fix`:
    - Sentences a translation request failed on, or that the model left out, are asked for once
      more right away; any still missing are counted on the video's page with "Try again" (#43).
- No package or data changes.

## Verification

- `.github/scripts/check-version.sh v0.8.1`: all packages are at 0.8.1.
- `cd backend && uv run pytest`: 247 passed, 12 live tests deselected.
- `cd frontend && npm test`: 124 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 48 passed; `npx tsc --noEmit` succeeded.
- Not verified: the installed apps of this version, which are built by the release workflow
  after the tag is pushed, and the update from an installed v0.8.0 to it.
