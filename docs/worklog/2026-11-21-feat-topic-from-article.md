---
title: "feat: make a topic from a link or a pasted text"
date: 2026-11-21
branch: feat/topic-from-article
request-source: chat session, 2026-11-21
---

## Request

Make a topic automatically from something like a news article. During the work the request
was widened: it should also work from a link, for example to the text of a well-known
commencement speech, with the text taken from the page automatically.

## Changes

- **`POST /api/topics/from-text`** takes either `text` (100 to 30,000 characters, any
  language) or `url`, and adds a topic of the learner's own. One model call writes the title,
  the situation, the partner's opening line, and a `background`: a summary of at most eight
  short sentences in plain English. A title that is taken gets a number ("… (2)"). If the
  model fails (`502`), nothing is added.
- **Links**: the page is fetched by the backend and its readable text extracted with
  `trafilatura` (a new dependency, the one `sos-my-interview` uses for job postings). Only
  `http` and `https` links are followed, a longer page is cut to 30,000 characters, and a page
  that yields less than 100 characters is refused with advice to paste the text. Links to
  video sites are refused before anything is fetched: in the check below, such a page gave
  only its footer menu, and a topic about that menu was made from it.
- **`background`** is new on topics and is copied into a conversation like the title and the
  situation, so the tutor still has it after the topic is deleted. It is added to the
  situation given to the model for replies and for the summary; the prompts themselves did
  not change. Other topics have none.
- The pasted text or page is not stored, only the summary. The prompt tells the model to
  treat the text as material, not as instructions.
- **Home page**: the "Add your own topic" form has two ways, "Describe it" and "From a link
  or text". What is pasted is sent as a link when it is a link and nothing else.
- **Practice and saved-conversation pages**: "What the text was about" opens the summary, so
  the learner can read it before speaking.
- A sixth live test makes a topic from an article in Korean and checks that every part of it
  is in English.
- Not included: transcripts of videos, PDFs, and editing a generated topic.

## Verification

- `cd backend && uv run pytest`: 125 passed, 6 live tests deselected.
  `uv run --env-file .env pytest -m live`: 6 passed.
- `cd frontend && npm test`: 57 passed; `npm run build` (type check and build) succeeded.
- With a real model on a temporary data folder, in a hidden Electron window: pasted an
  article in Korean on the home page and got a topic in English under "Yours"; opened its
  summary on the practice page; held two turns through the API, in which the partner answered
  a question from the summary (what the companies in the article asked for).
- Real links through the API: a university's page with the text of a 2005 commencement
  speech and an encyclopedia article each gave a fitting topic and summary. A video link gave
  the wrong topic described above; after the fix it is covered by a test, not tried again
  against the site.
- Not verified: the form with a link in the page itself (links were sent to the API
  directly), and the installed app fetching the new dependency on its first start after an
  update.
