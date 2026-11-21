---
title: "feat: practise corrections by saying them again"
date: 2026-11-21
branch: feat/practice-corrections
request-source: chat session, 2026-11-21
---

## Request

The third of four features agreed on in the chat session, added one at a time: let the learner
go back over the corrections they were given and say the corrected sentences again. It builds
on the saved conversations.

## Changes

- **`GET /api/corrections`** lists every correction in the saved conversations, newest first,
  with the conversation it came from and how often it was said right since.
- **`POST /api/corrections/{id}/attempts`** takes what the learner said (already transcribed)
  and compares its words with the better sentence. Punctuation and capitals are ignored,
  short forms are spelled out ("I'm" = "I am", "don't" = "do not"), and the sentence may be
  part of something longer, since a correction is often only a phrase. A match adds one to
  the line's `practiced` count and sets `practiced_at`; otherwise the missing words are
  returned. No model is called. The two new columns are on `messages`, where the correction
  already is, so deleting a conversation removes its corrections; a database made earlier
  gains them at startup.
- **Corrections page** (new, in the navigation): each correction with "Hear it" and "Say it".
  A try is recorded, transcribed by the existing `/api/transcribe`, and checked; the page then
  shows "That's it!", or what was heard and the missing words. Corrections said right at
  least once are hidden behind a switch, except those said right during this visit.
- **"I said it right — count it"**: speech recognition mishears words too (in the check below
  it heard "mini" for "many"), so the learner can count a try by hand. It sends the better
  sentence itself as the try, which needs no second endpoint.
- Tidying first: the "add a column to an older database" step became one helper
  (`refactor:` commit).
- Not included: spaced repetition or reminders (the count and date are stored, which is what
  such a schedule would need), and removing a single correction from the list.
- This branch was started on top of `feat/summary`, which was still open at the time.

## Verification

- `cd backend && uv run pytest`: 92 passed, 4 live tests deselected.
- `cd frontend && npm test`: 44 passed; `npm run build` (type check and build) succeeded.
- Started the backend on a temporary data folder (reusing the downloaded Whisper model) and
  held a conversation with a real model, which gave three corrections. Spoke three tries with
  the system voice into `/api/transcribe` and sent the transcripts to the check: "I'm very
  excited." matched "I am very excited."; a full sentence matched; and the uncorrected
  sentence did not match, with "a, lot, of" reported missing.
- In a hidden Electron window looked at the Corrections page: the list, a missed try, the
  try counted by hand, and the switch that shows practised corrections.
- Not verified: recording with the microphone on the page ("Say it" and "Stop" themselves;
  the audio in the check came from files), and the page in the desktop app.
