---
title: "chore: release v0.6.1"
date: 2026-11-22
branch: chore/release-v0.6.1
request-source: chat session, 2026-11-22
---

## Request

Release the faster startup made since v0.6.0, so the installed app gets it.

## Changes

- The version is raised from `0.6.0` to `0.6.1` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a PATCH
  release, because the commits since v0.6.0 are `perf` and `docs`:
    - The packaged app keeps compiled Python in `<userData>/pycache`, and LiteLLM is loaded
      after the server is up with the price list it ships with. The server answered after about
      6 s before and 0.6 s after, measured with an installed app's packages (#32).
- No package and no saved data change. The first launch of this version compiles the packages
  once, so it is not yet as fast as later ones.

## Verification

- `.github/scripts/check-version.sh v0.6.1`: all packages are at 0.6.1.
- `cd backend && uv run pytest`: 215 passed, 10 live tests deselected.
- `cd frontend && npm test`: 115 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 48 passed; `npx tsc --noEmit` succeeded.
- Not verified: the installed apps of this version, which are built by the release workflow
  after the tag is pushed, the update from an installed v0.6.0 to it, and how fast it starts
  on macOS and Windows.
