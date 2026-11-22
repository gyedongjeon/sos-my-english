---
title: "feat: suggest videos like a saved one at a similar level"
date: 2026-11-22
branch: feat/similar-videos
request-source: chat session, 2026-11-22
---

## Request

Starting from a video the learner added, use the LLM to recommend other YouTube videos at a
similar English level. Search YouTube with yt-dlp rather than the official YouTube Data API,
which would make each user create their own API key.

## Changes

- New endpoint `POST /api/videos/{video}/suggestions` (`backend/app/similar_videos.py`):
    1. The LLM gets the video's title, channel, and the same subtitle sample used for its level,
       and replies with two or three YouTube searches.
    2. Each search is run with yt-dlp (`ytsearch8:`, flat, so videos are not opened one by one).
       Saved videos, duplicates, Shorts (under a minute), and videos over an hour are left out.
    3. The first six left are checked in parallel: their English subtitles are read and their
       level estimated with the existing `_transcript` / `sentences` / `_estimate`. Videos
       without subtitles or without a level are dropped.
    4. Videos at most one level apart from the saved video's are returned, nearest level first
       (all levels when the saved video has none).
- The LLM is not asked for video IDs directly: it makes up IDs and does not know whether a
  video still exists, has English subtitles, or what its level is. It only writes the searches;
  everything suggested comes from a real search and is checked.
- Suggestions are not stored. Nothing is saved until the learner adds one, so only links are
  handled until then and subtitles are fetched by the learner's own app, as when adding a video.
- `yt-dlp` is added as a backend dependency; it is imported only when searching.
- Video page: a "Find similar videos" button lists the suggestions with channel, length, level,
  and whether the subtitles are automatic; "Add" saves one and opens it. The videos store keeps
  the suggestions for the video they were asked for and ignores a reply for an earlier one.
- README: the feature, what is sent to the LLM, and that the YouTube search is unofficial too.
  README.ko.md: the feature in the Videos step.

## Verification

- `cd backend && uv run pytest`: 212 passed. New tests in `tests/test_similar_videos.py`
  cover the order by level, leaving out saved/duplicate/short/long videos, the check limit,
  a video without a level, no model, and a failed search. The conftest blocks `_search`.
- `uv run --env-file .env pytest -m live -k searches`: the model's searches are one to three
  short phrases.
- `cd frontend && npm test`: 109 passed; `npm run build` succeeded.
- `cd desktop && npm test`: 47 passed; `npx tsc --noEmit` succeeded.
- By hand against a temporary data folder, with real YouTube and the configured model: for a
  saved commencement speech (B2), six other commencement speeches were suggested (five B2, one
  C1) in about 12 seconds.
- Not verified: the new section on the video page in a browser, and the search in the packaged
  desktop app.
