---
title: "refactor: rename the app to SOS My Language"
date: 2026-11-24
branch: refactor/rename-to-sos-my-language
request-source: chat session, 2026-11-24
---

## Request

Each language got an app of its own (sos-my-english, then sos-my-german as a fork), and every
new language makes the forks harder to keep in step. Turn this app into one that teaches
several languages. The first step is the new name, `sos-my-language`, so the later work is
done under it. The repository keeps its history: it is renamed on GitHub rather than started
over.

## Changes

- Renamed the product name, npm and Python package names, the bundle id
  (`local.sos-my-language`), the environment variables (`SOS_MY_ENGLISH_*` →
  `SOS_MY_LANGUAGE_*`), the update check's repository, window titles, CI scripts, and both
  READMEs. What the app teaches is unchanged; the descriptions still say English until a second
  language is added.
- No migration from the old app. The app has only a couple of users, so keeping code that
  moves the old app's data folder was not worth it: the renamed app is installed as a new app
  and starts with a new folder. The old app cannot update itself into the renamed one (it
  checks that an update has its own bundle id, so it refuses it and offers the download page).
- Not done here: renaming the repository on GitHub (after this is merged), and the language
  packs and German, which come in later PRs.

## Verification

- `cd backend && uv run pytest`: 247 passed.
- `cd frontend && npm test`: 124 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 48 passed; `npx tsc --noEmit` passed.
- `grep` finds no `sos-my-english`, `SOS_MY_ENGLISH`, or `SOS My English` left outside the
  worklogs.
