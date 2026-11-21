---
title: "chore: release v0.3.0"
date: 2026-11-21
branch: chore/release-v0.3.0
request-source: chat session, 2026-11-21
---

## Request

Release what was added since v0.2.0.

## Changes

- The version is raised from `0.2.0` to `0.3.0` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a MINOR
  release, because the commits since v0.2.0 include `feat`:
    - 40 built-in topics in 9 categories (was 6 topics), shown one category at a time.
    - A topic can be made from a link to an article or a speech, or from a pasted text, with
      a short summary the partner and the learner talk from.
- Saved data from v0.2.0 is kept: the new topics, categories, and columns are added when the
  app starts, and the first six topics keep their ids.
- The backend has a new dependency (`trafilatura`), so the first start after updating
  downloads a few packages once more.

## Verification

- `.github/scripts/check-version.sh v0.3.0`: all packages are at 0.3.0.
- `cd backend && uv run pytest`: 125 passed, 6 live tests deselected.
- `cd frontend && npm test`: 57 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 31 passed; `npx tsc --noEmit` succeeded.
- Not verified: the installed app of this version, which is built by the release workflow
  after the tag is pushed, and the update from an installed v0.2.0 to it, including the
  download of the new dependency.
