---
title: "feat: add built-in topics in categories"
date: 2026-11-21
branch: feat/topic-categories
request-source: chat session, 2026-11-21
---

## Request

Have more built-in topics, grouped by category (working life, school, the market, and so on).
The set was agreed on in the chat session: nine categories and about forty topics.

## Changes

- **40 built-in topics in 9 categories** (was 6 topics): Everyday, Work, School, Shopping,
  Food, Travel, Services, Home, and Opinions. Each situation and opening line was written by
  hand, not generated. The topics under Opinions have no role to play: the learner describes
  or argues something at more length, which the role-plays do not practise. Job interviews
  were left out, because the sibling app covers them.
- **`category`** on a topic (a new column; `null` for the learner's own). `GET /api/topics`
  lists the built-in topics category by category, then the learner's own.
- **A database of an earlier version** gains the new topics and the categories when the app
  starts. The first six topics keep their ids, saved conversations and own topics are
  untouched, and an own topic that happens to have the title of a new built-in one stays the
  learner's.
- **Seeding no longer uses up ids**: only the missing topics are inserted. Before, every start
  of the app ran an ignored insert for each built-in topic, and each of those advanced the id
  counter.
- **Home page**: a row of category buttons; one category is shown at a time, starting with
  the first. The learner's own topics are under "Yours", which appears once there is one and
  opens after a topic is added. The choice is kept while the app is open.
- The README screenshot of the home page was retaken.
- Not included: choosing a category for an own topic, searching topics, and translating the
  topic titles.

## Verification

- `cd backend && uv run pytest`: 111 passed, 5 live tests deselected. New tests cover that
  every built-in topic is complete and in a known category, that every category has at least
  four, the listing order, the upgrade of an older database, and the ids.
- `cd frontend && npm test`: 54 passed; `npm run build` (type check and build) succeeded.
- Ran the startup step twice on a copy of a database made by v0.2.0 code: 6 topics became 40,
  none without a category, and topics 1 to 6 kept their titles.
- In a hidden Electron window on an empty temporary data folder: looked at the home page with
  its nine categories, opened Opinions, added an own topic (the "Yours" category appeared and
  opened), and deleted it (the page went back to the first category).
- Not verified: a conversation on each of the 34 new topics with a real model; they use the
  same prompt as the existing ones, and only their texts are new.
