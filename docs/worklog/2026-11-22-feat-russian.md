---
title: "feat: add Russian as a feedback language"
date: 2026-11-22
branch: feat/russian
request-source: chat session, 2026-11-22
---

## Request

Offer Russian as a language corrections are explained in, so the series website
(`sos-my-app`, served at sosmy.app) can add a Russian page whose promise of "explanations in
your language" is true. The same change is made in `sos-my-interview`.

## Changes

- `frontend/src/stores/settings.ts`: Russian (`Русский`, browser code `ru`) added to
  `LANGUAGES`, after Portuguese. It appears in the Settings menu, and a first launch in a
  Russian-language browser starts from it.
- Nothing else needed changing: the backend takes the language as free text and passes it to
  the model (`feedback_language()`), and no data is kept per language.
- A test case for `ru-RU -> Russian` was added first and seen to fail (`expected 'English' to be
  'Russian'`) before the list was changed.

## Verification

- `cd frontend && npm test`: 105 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 47 passed.
- `cd backend && uv run pytest`: 203 passed, 9 live tests deselected.
- With the Gemini key in `backend/.env`, ran a temporary copy of
  `test_a_mistake_is_corrected_and_explained_in_the_chosen_language` with "Russian" and a
  Cyrillic check instead of Korean: passed, so a real reply explained the correction in Russian
  and kept the better sentence in English. The temporary test was deleted and is not committed.
- Not verified: the Settings menu in the running app, and a release; installed apps get Russian
  with the next version.
