---
title: "feat: practise sentence patterns by CEFR level"
date: 2026-11-21
branch: feat/pattern-practice
request-source: chat session, 2026-11-21
---

## Request

Add sentence-pattern practice: patterns grouped by CEFR level (A1 to C2); for a pattern, a
sentence in the learner's own language is shown and the learner says it in English. Agreed in
the chat session: five sentences a round, more patterns than the 54 first proposed, and a
menu change, since the app is meant to grow beyond conversation ("for now, patterns only").

## Changes

- **100 patterns** in `backend/app/pattern_list.py`: 20 each for A1 to B2, 12 for C1, 8 for
  C2, each with a formula, what it is used for, and an example. There is no official level
  for a pattern; each is placed where its grammar is usually taught. They live in the code,
  not the database, and are identified by a fixed id.
- **`POST /api/patterns/{id}/exercises`**: one model call writes five sentences that need
  the pattern, in the feedback language, each with a model answer in English, plus a note on
  when the pattern is used. With English as the feedback language a short instruction is
  written in place of a sentence to translate. Nothing is stored, so every round is new.
- **`POST /api/patterns/{id}/check`**: the model judges what was said by meaning, grammar,
  and use of the pattern, not by a match with the model answer, since a translation has many
  right answers. It returns the sentence as it should be said and, when wrong, a short
  explanation in the feedback language. The model answer said as it is needs no model call.
- **`POST /api/patterns/{id}/results`** records a finished round in a new table,
  `pattern_progress` (rounds, last score, date); `GET /api/patterns` lists the patterns with it.
- **Patterns page** (levels as tabs, the last score on each pattern) and a **round page**:
  the sentence, "Say it in English", the verdict with "Hear it", "Say it again", "Show the
  answer", and the score at the end. A sentence counts when it was right at the first try.
- **Menu**: "Practice" is now "Conversation", next to the new "Patterns". The README
  screenshots were retaken for it.
- After a real check answered a sentence with a different meaning by fixing only its grammar,
  the prompt was told to give the model answer and say that the meaning differs.
- Two more live tests: the sentences come in the chosen language with English answers, and a
  right sentence in other words than the model answer's is accepted.
- Not included: wrong sentences going to the Corrections page, a placement test, and spaced
  repetition.

## Verification

- `cd backend && uv run pytest`: 138 passed, 8 live tests deselected.
  `uv run --env-file .env pytest -m live`: 8 passed.
- `cd frontend && npm test`: 67 passed; `npm run build` (type check and build) succeeded.
- One whole round of "should have + past participle" with a real model in a hidden Electron
  window, with Korean as the feedback language: five Korean sentences with English answers
  were written; a model answer spoken by the system voice (through the page's own recording
  path, local transcription included) was accepted; a sentence with a wrong verb form was
  refused with a Korean explanation; "Show the answer" and the end of the round worked, and
  the pattern then showed "1/5" in the list.
- Not verified: recording with the microphone itself ("Say it in English" and "Stop"); the
  quality of the sentences for the other 99 patterns, and for C1 and C2 in particular; the
  prompt change for a different meaning beyond the live tests passing.
