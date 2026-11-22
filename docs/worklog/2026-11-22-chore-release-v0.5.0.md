---
title: "chore: release v0.5.0"
date: 2026-11-22
branch: chore/release-v0.5.0
request-source: chat session, 2026-11-22
---

## Request

Release what was added since v0.4.0.

## Changes

- The version is raised from `0.4.0` to `0.5.0` in `backend/pyproject.toml`,
  `frontend/package.json`, and `desktop/package.json`, with their lock files. It is a MINOR
  release, because the commits since v0.4.0 include `feat`:
    - Studying with YouTube videos: a pasted link is played in YouTube's own player, sentence
      by sentence, with repeat, a slower speed, and hidden text.
    - Shadowing ("Say it after") with a word-by-word score, and a search across the subtitles
      of all saved videos.
    - A pattern of the learner's own, made from a sentence of a video and practised under
      "Yours" in Patterns.
    - Sentences got wrong in pattern practice are kept in Corrections, where an entry can
      also be removed.
    - A CEFR level tag on each video, estimated when it is added, and a filter by level.
    - An installer for 64-bit Windows, which ships Python. This is the first release with one.
    - The first launch shows a progress bar, and a microphone that cannot be used is explained.
- Saved data from v0.4.0 is kept; the new tables and columns are added when the app starts.
- One package was added (`youtube-transcript-api`), so the first start after updating on
  macOS installs it and takes a little longer than usual.

## Verification

- `.github/scripts/check-version.sh v0.5.0`: all packages are at 0.5.0.
- `cd backend && uv run pytest`: 203 passed, 9 live tests deselected.
- `cd frontend && npm test`: 101 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 47 passed; `npx tsc --noEmit` succeeded.
- Not verified: the installed apps of this version, which are built by the release workflow
  after the tag is pushed; the update from an installed v0.4.0 to it on macOS; and the
  release workflow's Windows job, which runs for the first time with this tag.
