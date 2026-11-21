---
title: "chore: release v0.2.0"
date: 2026-11-21
branch: chore/release-v0.2.0
request-source: chat session, 2026-11-21
---

## Request

Release what was added since v0.1.1: the four features agreed on in the chat session and the
change to how the installed app's Python is pinned.

## Changes

- The version is raised from `0.1.1` to `0.2.0` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a MINOR
  release, because the commits since v0.1.1 include `feat`:
    - Conversations are saved as they happen and shown in History.
    - A conversation can be wrapped up with a summary of how it went.
    - Corrections are collected on their own page and practised by saying them again.
    - The learner can add topics of their own.
    - The installed app's Python comes from `backend/.python-version` (3.14) instead of a
      launch argument (3.12), so the first start after updating downloads Python once more.
- Saved data from v0.1.1 (settings only; it saved no conversations) is kept: the new tables
  and columns are added when the app starts.
- The two README screenshots were retaken, with made-up sample lines, so they show the
  navigation bar with Corrections and History and the "Wrap up" button.
- This is the first release an installed app can update itself to (v0.1.0 did not start), so
  the in-app update is used for real for the first time.

## Verification

- `.github/scripts/check-version.sh v0.2.0`: all packages are at 0.2.0.
- `cd backend && uv run pytest`: 104 passed, 5 live tests deselected.
- `cd frontend && npm test`: 50 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 31 passed; `npx tsc --noEmit` succeeded.
- The screenshots were looked at after being taken from a hidden window on an empty temporary
  data folder.
- Not verified: the installed app of this version, which is built by the release workflow
  after the tag is pushed, and the update from an installed v0.1.1 to it.
