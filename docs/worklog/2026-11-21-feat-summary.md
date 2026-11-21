---
title: "feat: summarize a conversation when it is wrapped up"
date: 2026-11-21
branch: feat/summary
request-source: chat session, 2026-11-21
---

## Request

The second of four features agreed on in the chat session, to be added one at a time: when a
conversation ends, show the learner a summary of how it went. It follows the conversation
history, which it builds on.

## Changes

- **`POST /api/conversations/{id}/review`** writes a review of a saved conversation and saves
  it with the conversation (a new `review` column holding JSON; `GET /api/conversations/{id}`
  returns it, `null` until then). One model call gets the whole conversation, with each
  correction under the line it was made on, and returns a two- or three-sentence summary, up
  to three strengths, up to three things to work on next, and up to three expressions that
  would have fit the conversation. Everything but the expressions is written in the feedback
  language. Longer lists are cut to three instead of being rejected. `409` when nothing was
  said yet, `502` when the model cannot answer; nothing is saved then.
- **Saying more drops the review**, in the backend and in the page, because it no longer
  covers the conversation; it can be asked for again.
- **A database made before this change** gains the column when the app starts
  (`ALTER TABLE ... ADD COLUMN`).
- **Practice page**: a "Wrap up" button appears once something was said and answered. The
  summary is shown under the conversation, and the learner can keep talking afterwards.
- **Saved conversation page**: shows the summary above the transcript, or a "Summarize this
  conversation" button when the conversation was never wrapped up.
- **The summary card** (`ReviewCard.vue`) also shows numbers counted in the page from the
  lines themselves (`tally` in `history.ts`): turns, corrections, and the average clarity and
  pace. They need no model, so they are not stored.
- Named "review" in the code because `ConversationSummary` already means an entry of the
  history list; the pages call it a summary.
- A fourth live test checks that a review comes back in the chosen language with English
  expressions. After one real review praised a corrected sentence as if the learner had said
  it, the prompt was told to quote only the learner's own words.
- Not included: showing in the History list which conversations have a summary, and anything
  across conversations (progress over time).

## Verification

- `cd backend && uv run pytest`: 84 passed, 4 live tests deselected.
  `uv run --env-file .env pytest -m live`: 4 passed.
- `cd frontend && npm test`: 37 passed; `npm run build` (type check and build) succeeded.
- Started the backend on an empty temporary data folder with the built frontend and held a
  three-turn conversation with a real model through the API. In a hidden Electron window:
  pressed "Wrap up" on the practice page (with the store filled from that conversation) and
  looked at the summary card; opened the saved conversation and saw the same summary; added a
  line, saw the summary gone and the "Summarize this conversation" button, pressed it, and
  looked at the new summary. Both were in Korean with English expressions.
- Not verified: wrapping up after turns spoken into the microphone in the desktop app; the
  error message when a review fails, in the page (covered by store and API tests only); the
  wording of a review after the last prompt change beyond the live test passing.
