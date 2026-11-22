---
title: "feat: keep sentences not said right after a video with the corrections"
date: 2026-11-22
branch: feat/shadowing-mistakes
request-source: chat session, 2026-11-22
---

## Request

A sentence said after a video with "Say it after" that did not come through in full (for
example "gaps" heard as "guess") was not recorded anywhere: it did not appear on the Corrections
page. Keep such sentences with the corrections, and keep a record of the mistakes so that, once
enough have piled up, the sounds often got wrong can be analysed with the LLM.

## Changes

- **Corrections**: a sentence shadowed below 100% is kept in a new `shadowing_mistakes` table
  (one row per sentence; a new wrong try replaces what was said and resets its practice count,
  as pattern mistakes do). `GET /api/corrections` lists it with id `s<n>`, the video's title, what
  was heard as `original`, the sentence as `improved`, and an explanation naming the words not
  heard with what was heard in their place: `Not heard: “gaps” (heard “guess”).` It is practised
  and removed like any correction.
- **Deleting the video keeps it**, so mistakes keep piling up for the later analysis: the row
  holds the sentence and the video's title, and only its link to the sentence is dropped
  (`ON DELETE SET NULL`); the page then shows "From “<title>” (deleted)" without a link. A first
  version removed it with the video; it was changed during the same session at the requester's
  choice.
- **What was heard instead** comes from lining up the sentence's words with the transcription
  (`difflib.SequenceMatcher`); words missed side by side are named together, and a word left out
  is named alone.
- **Log for later analysis**: every try, right or not, is written to `shadowing_attempts` (the
  sentence, what was heard, the score, the time). It keeps the sentence itself and drops the
  link to it when the video is deleted, so the record outlives the video; the README says so.
  The analysis itself (a page and an LLM request) is left for later, when tries have piled up.
- **Frontend**: `SavedCorrection` gains `video` and `position`; a correction from a video links
  to its sentence (`/videos/<id>?line=<position>`). The link is chosen by `source()`, extracted
  first in a `refactor:` commit.
- **Alternatives considered**: keeping the recordings (more to store, and the text pairs are
  enough for now), and scoring pronunciation by phonemes with another model or a cloud service
  (heavier, or sends the voice off the computer).
- Not done: a sentence later shadowed at 100% is not counted as practice of its listed mistake;
  it is practised on the Corrections page.

## Verification

- `cd backend && uv run pytest`: 244 passed (7 new, in `tests/test_shadowing_mistakes.py`, each
  first seen failing), 12 live tests deselected.
- `cd frontend && npm test`: 123 passed (the new `source` tests failed first); `npm run build`
  succeeded.
- Desktop unchanged.
- In the desktop app run from this branch (`cd desktop && npm run dev`), a sentence shadowed
  below 100% appeared on the Corrections page, and its link opened the video at that sentence.
