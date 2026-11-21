---
title: "feat: save conversations and show them in History"
date: 2026-11-21
branch: feat/history
request-source: chat session, 2026-11-21
---

## Request

Conversations were kept only in the page and were lost when the app was closed. Save them, and
let the learner look at past conversations again. It is the first of four requested features;
the others (a summary at the end, reviewing corrections, the learner's own topics) follow in
their own branches.

## Changes

- **Storage**: two tables, `conversations` and `messages`. A conversation keeps a copy of its
  topic's title and situation, so it stays readable after a topic is changed or removed (which
  the coming "own topics" feature allows). A learner's line keeps its correction and how it was
  spoken (clarity, unclear words, pace). Existing databases get the tables on the next start;
  nothing is migrated, because nothing was stored before.
- **API**: `POST /api/conversations` starts one on a topic, `POST .../{id}/messages` saves what
  the learner said, and `POST .../{id}/reply` returns the tutor's line with a correction and
  saves both. `GET /api/conversations` lists the conversations in which something was said,
  newest first, and `GET` / `DELETE .../{id}` read and remove one.
  `POST /api/reply`, which took the whole conversation from the page, is removed: the tutor
  now reads the saved lines. Saving the line and asking for the reply are separate requests so
  that a failed reply does not lose the line; it can be asked for again.
- **Practice page**: the conversation is started with the first thing said, not when a topic is
  opened, so opening a topic or pressing "Start over" leaves nothing behind. If saving a line
  fails, "Ask for the reply again" saves it first.
- **History pages**: a list with the date, the number of turns, and the number of corrections,
  and a page for one conversation with its corrections, "Hear it" for every line, and a link to
  practise the topic again. Deleting takes a second press ("Delete for good").
- The correction card and the line about how something was spoken became components, shared by
  the practice page and the saved conversation (the first in its own `refactor` commit).
- Left out: continuing a saved conversation, and searching or filtering the list.

## Verification

- `cd backend && uv run pytest`: 75 passed, 3 live tests deselected. The live tests, which now
  go through the new API, passed: 3 of 3.
- `cd frontend && npm test`: 30 passed; `npm run build` succeeded.
- Ran the backend on a temporary copy of the data with a real model: held two conversations
  through the API (one with two turns, a correction on the first), then looked at the History
  list, the "Delete for good" step, and the saved conversation in the built frontend. They
  showed the lines, the correction with its Korean explanation, and the pace and clarity as
  saved.
- Not verified: a spoken turn in the desktop app writing to History (the turns above were sent
  as text), and pressing "Delete for good" in the page (its API call is covered by a test).
  The desktop tests were not run; no desktop file changed.
