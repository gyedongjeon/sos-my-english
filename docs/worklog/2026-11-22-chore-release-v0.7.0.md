---
title: "chore: release v0.7.0"
date: 2026-11-22
branch: chore/release-v0.7.0
request-source: chat session, 2026-11-22
---

## Request

Release the voice choice and the video translation made since v0.6.1, so the installed app gets
them.

## Changes

- The version is raised from `0.6.1` to `0.7.0` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a MINOR
  release, because the commits since v0.6.1 include `feat` and none is breaking:
    - The partner's voice can be chosen under Settings among eleven of Kokoro's English voices,
      American and British, female and male; nothing more is downloaded (#36).
    - A "Translation" toggle on a video's page shows each sentence in the feedback language,
      translated by the LLM the first time and kept afterwards (#37).
- No package changes. Saved data gains a `line_translations` table, created when the app
  starts; existing data is kept and read as before.

## Verification

- `.github/scripts/check-version.sh v0.7.0`: all packages are at 0.7.0.
- `cd backend && uv run pytest`: 230 passed, 11 live tests deselected.
- `cd frontend && npm test`: 121 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 48 passed; `npx tsc --noEmit` succeeded.
- Not verified: the installed apps of this version, which are built by the release workflow
  after the tag is pushed, and the update from an installed v0.6.1 to it.
