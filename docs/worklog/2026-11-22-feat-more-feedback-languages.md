---
title: "feat: add six more feedback languages"
date: 2026-11-22
branch: feat/more-feedback-languages
request-source: chat session, 2026-11-22
---

## Request

Add Turkish, Italian, Thai, Polish, Ukrainian, and Bengali to the languages corrections are
explained in.

## Changes

- `frontend/src/stores/settings.ts`: the six languages added to `LANGUAGES` with their own
  names and browser codes: Italian (`Italiano`, `it`), Polish (`Polski`, `pl`), Ukrainian
  (`Українська`, `uk`), Turkish (`Türkçe`, `tr`), Thai (`ไทย`, `th`), Bengali (`বাংলা`, `bn`).
  European languages are placed next to the others, Thai after Vietnamese and Bengali after
  Hindi. They appear in the Settings menu, and a first launch in a browser set to one of them
  starts from it.
- Nothing else needed changing: the backend takes the language as free text and passes it to
  the model, as for Russian (#28).
- Test cases for the six browser languages were added first and seen to fail (`expected
  'English' to be 'Turkish'`, and so on) before the list was changed.

## Verification

- `cd frontend && npm test`: 115 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 47 passed.
- `cd backend && uv run pytest`: 212 passed, 10 live tests deselected.
- With the key in `backend/.env`, ran a temporary live test in each of the six languages: every
  correction was explained in the chosen language (checked by its script or letters) and the
  better sentence stayed in English. The temporary test was deleted and is not committed.
- Not verified: the Settings menu in the running app, and a release; installed apps get the
  languages with the next version.
