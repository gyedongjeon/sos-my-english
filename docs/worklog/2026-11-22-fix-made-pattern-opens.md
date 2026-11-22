---
title: "fix: open a pattern made from a video"
date: 2026-11-22
branch: fix/made-pattern-opens
request-source: chat session, 2026-11-22
---

## Request

After making a pattern from a video sentence, **Practise it** opened a page that showed only the
loading signal and never the pattern. The pattern was saved, though: it was listed under
**Yours** on the patterns page.

## Changes

- Cause: the patterns store starts with `loading: true`. When a video is opened without visiting
  the patterns page first, the list is never loaded, and `make()` pushes the new pattern into the
  empty list. The drill page loaded the list only when it was empty, so with that one pattern it
  never loaded and `loading` stayed `true`.
- `stores/patterns.ts`: a `loaded` flag records that the whole list came from the backend, and
  `ensureLoaded()` loads it only when it has not been.
- `views/PatternDrillView.vue`: uses `ensureLoaded()` instead of checking for an empty list.
- Rejected: starting with `loading: false`. The patterns page would then briefly show an empty
  list before its first load, and the drill page would still skip loading the rest of the list.

## Verification

- New tests in `stores/drill.test.ts`: the full list loads when only a just-made pattern is known
  (failed before the fix), and a loaded list is not fetched again.
- `cd frontend && npm test`: 104 passed. `npm run build`: passed.
- Not yet checked in the running app.
