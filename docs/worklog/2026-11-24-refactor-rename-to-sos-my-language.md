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

- **Rename** (`refactor:`): the product name, npm and Python package names, the bundle id
  (`local.sos-my-language`), the environment variables (`SOS_MY_ENGLISH_*` →
  `SOS_MY_LANGUAGE_*`), the update check's repository, window titles, CI scripts, and both
  READMEs. What the app teaches is unchanged; the descriptions still say English until a second
  language is added.
- **Keep the learner's data** (`feat:`): the system names an app's folder after the app, so the
  renamed app would start empty. On its first launch it moves `data/` from
  `SOS My English/` into its own folder when it has none yet (`desktop/src/legacy.ts`). Only
  `data/` is moved: the rest (`venv/`, `python/`, caches) holds absolute paths and is rebuilt.
  A failed move is logged and the app starts without the old data, which stays in place.
- **Updates from the old app**: the old app checks that a downloaded update has its own bundle
  id, so it refuses the renamed app and offers the download page. That is the safe outcome; the
  READMEs say to install the renamed app once by hand.
- Not done here: renaming the repository on GitHub (after this is merged), and the language
  packs and German, which come in later PRs. The German app's data is not imported.

## Verification

- `cd backend && uv run pytest`: 247 passed.
- `cd frontend && npm test`: 124 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 51 passed, including the new `tests/legacy.test.ts` (move when
  only the old data exists; not when the renamed app has data; nothing to move without the
  old app); `npx tsc --noEmit` passed.
- `grep` finds no `sos-my-english`, `SOS_MY_ENGLISH`, or `SOS My English` left outside the
  worklogs, apart from the old name in `legacy.ts` and the READMEs' note about it.
