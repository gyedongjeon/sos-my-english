---
title: "chore: release v0.4.0"
date: 2026-11-21
branch: chore/release-v0.4.0
request-source: chat session, 2026-11-21
---

## Request

Release what was added since v0.3.0.

## Changes

- The version is raised from `0.3.0` to `0.4.0` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a MINOR
  release, because the commits since v0.3.0 include `feat`:
    - Sentence-pattern practice: 100 patterns by CEFR level (A1 to C2); a sentence is shown
      in the learner's language and said in English, five sentences a round.
    - The menu entry "Practice" is now "Conversation", next to the new "Patterns".
- Saved data from v0.3.0 is kept; one table for pattern progress is added when the app starts.
- No dependency changed, so the first start after updating downloads nothing new.

## Verification

- `.github/scripts/check-version.sh v0.4.0`: all packages are at 0.4.0.
- `cd backend && uv run pytest`: 138 passed, 8 live tests deselected.
- `cd frontend && npm test`: 67 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 31 passed; `npx tsc --noEmit` succeeded.
- Not verified: the installed app of this version, which is built by the release workflow
  after the tag is pushed, and the update from an installed v0.3.0 to it.
