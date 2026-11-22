---
title: "fix: stay on the sentence after playing it"
date: 2026-11-22
branch: fix/sentence-stays-chosen
request-source: chat session, 2026-11-22
---

## Request

On the video page, **Play the sentence** sometimes moved the chosen sentence to the next one
when the sentence ended, and sometimes stayed on it. It should always stay on the sentence that
was played.

## Changes

- **Cause**: when a part ends, `useYouTubePlayer` clears the part and asks YouTube to pause, but
  `playing` stays `true` until YouTube reports the pause a moment later. In that window the video
  page treats the video as playing on by itself and makes the sentence at the current time the
  chosen one. The time is read every 100 ms, so it is already a little past the end of the
  sentence; when the next sentence starts at or before that time (sentences that follow each
  other without a gap), the next sentence was chosen. With a gap, the played sentence stayed
  chosen — which is why it happened only sometimes.
- **Fix**: `tick()` sets `playing` to `false` at the moment it stops at the end of a part, without
  waiting for YouTube's state change. The later state change sets the same value.
- Repeating and pausing by hand are unchanged. Pausing by hand has the same short window, but the
  time is then inside the sentence being said, so it picks the right one.

## Verification

- New `frontend/src/composables/useYouTubePlayer.test.ts` with a stand-in for YouTube's player:
  a part that ends counts as stopped before YouTube reports the pause. It failed before the fix
  (`playing` was still `true`) and passes after it.
- `cd frontend && npm test`: 13 files, 102 tests pass. `npm run build` (type check) passes.
- Ran from source (`uvicorn` + `npm run dev`) and played sentences that run straight into the
  next one in a TED talk: the played sentence stays chosen.
