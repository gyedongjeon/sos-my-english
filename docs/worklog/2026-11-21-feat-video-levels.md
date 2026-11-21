---
title: "feat: tag videos with a level and list them by level"
date: 2026-11-21
branch: feat/video-levels
request-source: chat session, 2026-11-21
---

## Request

Give videos a tag for their level and let the learner pick videos by that tag. The request
also said to merge this pull request once the work is done, without waiting for a review.

## Changes

- **A level for each video** (`level` on `videos`, A1 to C2 or empty; a new column). When a
  video is added, one model call estimates the level a learner needs to follow it. The model
  reads about 2,400 characters of sentences from the start, the middle, and the end of the
  subtitles, and the pace in words a minute, counted from the first word to the last with the
  pauses. If no model is configured, the call fails, or the answer is not a level, the video
  is saved without one.
- **`PUT /api/videos/{id}/level {level}`** sets or clears the level by hand;
  **`POST /api/videos/{id}/level`** estimates it again and reports a failure (`502`),
  keeping the level it had.
- **Videos page**: a tag with the level on each video, and tabs "All", one for each level
  that has videos (easiest first), and "No level". The choice is kept while the app is open
  and falls back to "All" when its last video goes.
- **Video page**: a "Level" select and "Estimate it".
- Considered and rejected: free-form tags. The request was for levels, and the same six as
  for the patterns keep the two pages consistent.
- No live test was added for the estimate: it would assert which level a text gets, which
  is wording, not shape.

## Verification

- `cd backend && uv run pytest`: 201 passed, 9 live tests deselected.
- `cd frontend && npm test`: 97 passed; `npm run build` succeeded.
- With a real model, on a database made by the earlier branches: a talk added through the
  API came back as B2; a saved video without a level was under "No level"; "Estimate it" on
  its page set B2; choosing B1 in the select saved B1; the list then had the tabs All, B1,
  and B2 and the B1 tab listed that video alone (read from the page, not from a screenshot).
- Not verified: the estimate for easy videos (both samples were talks for adults), and the
  message when an estimate fails, in the page.
