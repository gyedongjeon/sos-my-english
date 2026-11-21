---
title: "feat: make a pattern from a sentence of a video"
date: 2026-11-21
branch: feat/own-patterns
request-source: chat session, 2026-11-21
---

## Request

The last of three steps for studying with videos, as agreed in the chat session: when the
learner finds an expression worth practising in a sentence of a video, add it to the
patterns and practise it there, starting from that sentence.

## Changes

- **`POST /api/patterns {line, phrase}`** makes a pattern of the learner's own from the
  marked part of a saved video's sentence. One model call turns it into a formula and a note
  on its use; the sentence becomes its example. The phrase must be part of the sentence, and
  a formula that already exists returns the saved pattern. New table `own_patterns`.
- **Own patterns in the list**: `GET /api/patterns` returns them after the built-in ones,
  with the level "Yours", `custom: true`, and the video and sentence they came from. Their
  ids are "own-<number>". They are practised through the same endpoints as the built-in ones;
  in the prompts their level reads "the level of the example sentence", as they have no CEFR
  level. `DELETE /api/patterns/{id}` removes an own pattern with its progress; a built-in one
  is refused. Deleting the video keeps the pattern and its example and drops only the link.
- **Video page**: "Make a pattern" shows the chosen sentence word by word; the first click
  marks a word, the second stretches the mark to another. "Make the pattern" saves it and
  offers "Practise it".
- **Patterns page**: a "Yours" tab appears once there is an own pattern; each shows its
  example, "In the video", and a two-press delete.
- A ninth live test makes a pattern from a real sentence. It first asserted a word of the
  formula and failed in two of five runs, because which words stay and which become a slot
  differs between runs; it now checks the shape only.
- Not included: making a pattern from a correction or from typed text, and editing a formula.

## Verification

- `cd backend && uv run pytest`: 187 passed, 9 live tests deselected.
  `uv run --env-file .env pytest -m live`: 9 passed, three times in a row after the change
  to the test.
- `cd frontend && npm test`: 92 passed; `npm run build` succeeded.
- With a real model in a hidden Electron window, on a saved video: pressed "Make a pattern",
  marked "the closest I've ever gotten to" with two clicks, and got "the closest I've ever
  gotten to + noun/-ing"; "Practise it" opened the round, for which five Korean sentences
  with fitting English answers were written; the Patterns page listed it under "Yours" with
  its example.
- Not verified: speaking a round of an own pattern; "In the video" and deleting, in the page
  (covered by API and store tests).
