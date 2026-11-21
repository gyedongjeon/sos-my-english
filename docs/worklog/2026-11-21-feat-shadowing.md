---
title: "feat: shadow video sentences and search saved subtitles"
date: 2026-11-21
branch: feat/shadowing
request-source: chat session, 2026-11-21
---

## Request

The second of three steps for studying with videos, as agreed in the chat session: shadowing
(saying a sentence after hearing it, checked by comparing words, without a model) and a
search across the subtitles of all saved videos, to see how an expression is used elsewhere.

## Changes

- **`POST /api/video-lines/{id}/attempts {text}`** compares what was said with the sentence
  word by word and returns the share of words heard (0-100) and the sentence's words, each
  marked heard or not. A word said once counts once; marks that are not words ("--") do not
  count. The sentence keeps how often it was shadowed and its best score (two new columns on
  `video_lines`; a sentence now also has an `id` in the API).
- **Numbers**: the word comparison now treats "three" and "3" alike (0 to 20 and the tens),
  because speech recognition wrote "3" for a spoken "three" in the check below. This also
  applies where the same comparison is used: practising corrections, and the shortcut for a
  model answer said as it is in pattern practice.
- **`GET /api/video-lines?q=…`** returns the sentences of all saved videos that contain a
  word or phrase (capitals ignored, at most 50, newest video first).
- **Video page**: "Say it after" stops the video (its sound would be recorded too), records,
  and shows the score with the missed words marked and what was heard. A sentence's best
  score is shown in the list. While the video plays on by itself, the sentence being said
  becomes the chosen one, so pausing leaves the learner on it.
- **Videos page**: a search box; a result opens its video with that sentence chosen
  (`/videos/{id}?line={position}`).
- Not included: searching by word forms ("tell" does not find "told"), and judging
  pronunciation beyond which words were recognized.

## Verification

- `cd backend && uv run pytest`: 177 passed, 8 live tests deselected.
- `cd frontend && npm test`: 85 passed; `npm run build` succeeded.
- In a hidden, muted Electron window, on the data folder of the previous step (so the two
  columns were added to an existing database): searched "three stories", got two sentences,
  and the first opened its video with that sentence marked. A sentence spoken by the system
  voice with its last words left out scored 55% with those words marked; spoken in full it
  scored 100%, and the list then showed "100%" on it.
- Not verified: "Say it after" and "Stop" with the microphone (the recordings came from
  files), and the number fix against a real recording (covered by a test).
