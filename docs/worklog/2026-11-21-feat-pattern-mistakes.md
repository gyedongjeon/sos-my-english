---
title: "feat: keep wrong pattern sentences as corrections"
date: 2026-11-21
branch: feat/pattern-mistakes
request-source: chat session, 2026-11-21
---

## Request

A sentence got wrong in pattern practice was recorded nowhere, neither in History nor on the
Corrections page. It should be kept, so that it can be practised again.

## Changes

- **Pattern mistakes are kept**: when the check of a pattern sentence comes back as not
  correct, the sentence asked for, what was said, the better sentence, and the explanation
  are saved (new table `pattern_mistakes`). There is one entry for each sentence asked for: a
  new wrong try at it replaces the earlier one and resets its practice count. A sentence
  judged right, and an answer that was shown without a try, are not kept.
- **They are listed with the corrections**, not in History: History holds whole
  conversations to read again, while the Corrections page is where a single sentence can be
  heard and said until it comes out right. `GET /api/corrections` now returns both kinds,
  newest first, each with either `conversation_id` or `pattern_id` and, for a mistake, the
  sentence asked for (`prompt`).
- **Ids changed**: a correction's `id` is now a string, "m<number>" for one made in a
  conversation and "p<number>" for a pattern mistake, so that the two kinds can share the
  list and the attempts endpoint.
- **`DELETE /api/corrections/{id}`** takes an entry off the list. A pattern mistake is
  deleted; a correction from a conversation is only hidden from the list (new column
  `dismissed`) and stays in its conversation.
- A correction made in a conversation now records when it was made (`corrected_at`), to
  order it among the mistakes; older ones fall back to the start of their conversation.
- **Pages**: the Corrections page shows the sentence asked for, links to the pattern or the
  conversation, and has a two-press "Remove". The pattern round says under a wrong sentence
  that it was kept in Corrections.
- This branch was started on top of `feat/own-patterns`, which was still open at the time.

## Verification

- `cd backend && uv run pytest`: 194 passed, 9 live tests deselected.
- `cd frontend && npm test`: 93 passed; `npm run build` succeeded.
- With a real model, on a database made by the previous branch (so the new table and
  columns were added to existing data): two wrong sentences, one for a built-in pattern and
  one for an own pattern, were judged wrong and then listed by `/api/corrections`. In a
  hidden Electron window the Corrections page showed both with their sentence, explanation,
  and pattern; "Remove" and "Remove for good" left one.
- Not verified: "Say it" on a pattern mistake with the microphone, and the note under a
  wrong sentence in the round page (the wrong sentences were sent to the API directly).
