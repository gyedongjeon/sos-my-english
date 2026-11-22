---
title: "chore: release v0.5.2"
date: 2026-11-22
branch: chore/release-v0.5.2
request-source: chat session, 2026-11-22
---

## Request

Release the fix made since v0.5.1, so the installed app gets it.

## Changes

- The version is raised from `0.5.1` to `0.5.2` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a PATCH
  release, because the only commit since v0.5.1 is a `fix`:
    - **Practise it** after making a pattern from a video opens the pattern. Before, the page
      kept showing the loading signal when the patterns page had not been visited first (#26).
- No package and no saved data change.

## Verification

- `.github/scripts/check-version.sh v0.5.2`: all packages are at 0.5.2.
- `cd backend && uv run pytest`: 203 passed, 9 live tests deselected.
- `cd frontend && npm test`: 104 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 47 passed; `npx tsc --noEmit` succeeded.
- Not verified: the installed apps of this version, which are built by the release workflow
  after the tag is pushed, and the update from an installed v0.5.1 to it.
