---
title: "feat: translate a video's sentences into the learner's language"
date: 2026-11-22
branch: feat/video-translation
request-source: chat session, 2026-11-22
---

## Request

Add the subtitle translation of the sibling app SOS My German: on a video's page, the learner
can turn a translation of the sentences into their own language on and off.

## Changes

- Ported from SOS My German with German replaced by English; the design is the same.
- **Backend**: `POST /api/videos/{id}/translations` returns every sentence of a saved video in
  the feedback language, by line id. Sentences without a kept translation are sent to the model
  in parts of 40, four parts at a time, with the video's title, and each part's translations are
  saved as it comes back (new table `line_translations`, one row per sentence and language,
  deleted with the video). A sentence the model leaves out is asked for the next time; ids that
  were not asked for are ignored. A failure is reported (502) only when nothing could be
  translated; otherwise what was translated is returned. With English as the feedback language
  the request is refused (422).
- **Frontend**: a "Translation" toggle next to "Show the text". Turned on, it asks for the
  translation of the open video (and of each video opened while it is on) and shows each
  sentence's translation under it, in smaller grey text, also while the English text is hidden.
  The toggle is kept while the app is open. Loading and failure (with "Try again") are shown
  under the controls.
- **Difference from SOS My German**: English is this app's default feedback language, so
  without a language chosen the toggle shows the 422 message; the backend tests that expect a
  translation choose Korean first.
- **Privacy**: turning the translation on sends all of a video's subtitles to the LLM provider;
  the README says so next to what else is sent.
- **Docs**: the README and the Korean README describe the toggle.

## Verification

- `cd backend && uv run pytest`: 230 passed (9 new, in `tests/test_video_translations.py`),
  11 live tests deselected.
- New live test, `uv run --env-file .env pytest -m live -k translated` (Gemini): passed; three
  English sentences came back in Korean, in order.
- `cd frontend && npm test`: 121 passed (3 new store tests); `npm run build` succeeded.
- With the real model and a temporary data folder, a 151-sentence YouTube video was translated
  into Korean in 7.4 s; asking again answered at once (0.004 s) from the kept translations.
- In the running app, the toggle on a saved video's page showed each sentence's Korean
  translation under it; checked by hand.
