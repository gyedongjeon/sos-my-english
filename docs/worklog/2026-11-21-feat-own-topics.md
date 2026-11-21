---
title: "feat: let the learner add topics of their own"
date: 2026-11-21
branch: feat/own-topics
request-source: chat session, 2026-11-21
---

## Request

The last of four features agreed on in the chat session, added one at a time: besides the six
built-in topics, let the learner make topics for the situations they need.

## Changes

- **`POST /api/topics`** adds a topic from a title, a situation, and optionally the partner's
  opening line. The situation may be written in any language. When the opening line is left
  empty, one model call writes it in English from the title and the situation; if that fails
  (`502`) nothing is added. With an opening line given, no model is needed. A title that
  already exists is refused (`409`) before the model is asked.
- **`DELETE /api/topics/{id}`** removes an own topic; a built-in one is refused (`403`).
  Conversations held on it stay in History, because a conversation already keeps a copy of its
  topic's title and situation.
- **`custom`** on a topic tells the two kinds apart (a new column; a database made earlier
  gains it at startup, with the existing topics as built-in).
- **Home page**: own topics are marked "Yours" and have a two-press delete, like History.
  "+ Add your own topic" opens a form under the list. The list moved into a Pinia store
  (`stores/topics.ts`) with tests.
- Tidying first: the topics endpoint moved out of `main.py` into `app/topics.py`
  (`refactor:` commit).
- A fifth live test adds a topic described in Korean and checks that the written opening line
  is short, plain English.
- Not included: editing a topic (delete it and add it again), and reordering.
- The README screenshots were not retaken; they still show the navigation bar without
  Corrections and History, and no "Add your own topic" button.

## Verification

- `cd backend && uv run pytest`: 104 passed, 5 live tests deselected.
  `uv run --env-file .env pytest -m live`: 5 passed.
- `cd frontend && npm test`: 50 passed; `npm run build` (type check and build) succeeded.
- Started the backend on an empty temporary data folder with a real model and, in a hidden
  Electron window, used the home page: filled in the form with a situation in Korean and no
  opening line, and the topic appeared marked "Yours" with an English opening line; adding
  the same title again showed "There is already a topic with this title."; held one turn on
  the topic through the API; deleted the topic with both presses, after which six topics were
  left and the conversation still opened in History.
- Not verified: speaking on an own topic in the desktop app.
