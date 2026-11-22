---
title: "chore: release v0.7.1"
date: 2026-11-22
branch: chore/release-v0.7.1
request-source: chat session, 2026-11-22
---

## Request

Release the fix that cuts automatic subtitles without punctuation into sentences, so the
installed app gets it.

## Changes

- The version is raised from `0.7.0` to `0.7.1` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a PATCH
  release, because the only code commit since v0.7.0 is a `fix`:
    - Automatic subtitles without punctuation are punctuated by the LLM when a video is added
      and cut into sentences; every word keeps its spelling and time (#39).
- No package or data changes. Videos saved before keep their lines until added again.

## Verification

- `.github/scripts/check-version.sh v0.7.1`: all packages are at 0.7.1.
- `cd backend && uv run pytest`: 237 passed, 12 live tests deselected.
- `cd frontend && npm test`: 121 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 48 passed; `npx tsc --noEmit` succeeded.
- Not verified: the installed apps of this version, which are built by the release workflow
  after the tag is pushed, and the update from an installed v0.7.0 to it.
