---
title: "chore: release v0.6.0"
date: 2026-11-22
branch: chore/release-v0.6.0
request-source: chat session, 2026-11-22
---

## Request

Release the features made since v0.5.2, so the installed app gets them.

## Changes

- The version is raised from `0.5.2` to `0.6.0` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a MINOR
  release, because the commits since v0.5.2 are `feat`s and none breaks anything:
    - Russian as a feedback language (#28).
    - "Find similar videos" on a video's page suggests YouTube videos like it at a similar
      level, found with yt-dlp searches the LLM writes (#29).
    - Turkish, Italian, Thai, Polish, Ukrainian, and Bengali as feedback languages (#30).
- One new backend package, `yt-dlp` (#29), which the installed app installs when it starts the
  new version. No saved data changes.

## Verification

- `.github/scripts/check-version.sh v0.6.0`: all packages are at 0.6.0.
- `cd backend && uv run pytest`: 212 passed, 10 live tests deselected.
- `cd frontend && npm test`: 115 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 47 passed; `npx tsc --noEmit` succeeded.
- Not verified: the installed apps of this version, which are built by the release workflow
  after the tag is pushed, the update from an installed v0.5.2 to it, and "Find similar
  videos" in the installed app.
