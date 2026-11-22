---
title: "fix: ask again for sentences left without a translation"
date: 2026-11-22
branch: fix/translation-gaps
request-source: chat session, 2026-11-22
---

## Request

On a video's page with "Translation" on, the sentences in the middle of a video had no
translation, while the first and the last ones did.

## Changes

- **Cause**: a video is translated 40 sentences a request, four requests at a time. In the
  installed app's data, the video had 90 sentences and positions 39 to 79 had no translation:
  the whole second request (40 to 79) had failed, and the model had left out the last sentence
  of the first. A failed request was only reported when nothing at all was translated, and a
  sentence left out was only asked for again the next time the video's translation was asked
  for, so the gap was shown without a word.
- **Fix** (`translations.translate`): the sentences still without a translation after the first
  round (from a failed request or left out by the model) are asked for once more right away
  (`ROUNDS = 2`). The reply gains `missing`, the number of sentences still without one.
- **Frontend**: the video's page shows "N sentences could not be translated." with "Try again",
  which asks for those only (the others are kept by the backend). Asking again for the same
  video keeps the translations already shown while it waits, instead of clearing them.
- Alternatives considered: smaller requests (more requests, and a failed one still leaves a
  gap), and more rounds (one more round covers a passing failure; the button covers the rest).

## Verification

- `cd backend && uv run pytest`: 247 passed (3 new in `tests/test_video_translations.py`, seen
  failing first; the reply-shape test gained `missing`), 12 live tests deselected.
- `cd frontend && npm test`: 124 passed (1 new in `src/stores/videos.test.ts`, seen failing
  first); `npm run build` succeeded.
- On a copy of the installed app's database (deleted afterwards), asking this branch's backend
  for the video's translation with the real model returned all 90 sentences, `missing: 0`.
- Not verified: the warning on the page, which shows only when sentences stay untranslated.
