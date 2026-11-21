---
title: "feat: listen to YouTube videos sentence by sentence"
date: 2026-11-21
branch: feat/videos
request-source: chat session, 2026-11-21
---

## Request

Study with YouTube videos: paste a link, have the video embedded, and listen to it one
sentence at a time, with repeated listening. This is the first of three steps agreed on in
the chat session; shadowing and searching the saved subtitles come next, then making a
pattern from a sentence. Also agreed: the video is played by YouTube's own player and never
downloaded, and the subtitles are stored locally.

## Changes

- **`POST /api/videos {url}`** saves a video from any usual form of YouTube link: its title
  and channel (from YouTube's public embedding information) and its English subtitles
  (`youtube-transcript-api`, a new dependency; subtitles written by a person are preferred to
  automatic ones). Adding a saved video again returns it. `GET /api/videos`,
  `GET /api/videos/{id}`, and `DELETE /api/videos/{id}` list, open, and remove; removing a
  video removes its subtitles. Two new tables, `videos` and `video_lines`.
- **Sentences**: subtitle lines break where they fit the screen, not where a sentence ends,
  so they are joined and cut again at sentence ends. A word's time is taken from how far into
  its line it stands. A silence of 1.5 seconds also ends a sentence, a very long one is cut
  at a comma, stage directions such as "[Music]" and "(Laughter)" are dropped, and subtitles
  without punctuation are kept line by line.
- **Videos page** (new menu entry): the link form and the saved videos. **Video page**:
  YouTube's embedded player, and under it the sentences. Clicking one plays just that part
  and stops; "Repeat" keeps it going; there are previous/next buttons and speeds of 0.5, 0.75,
  and 1. "Show the text" hides the sentences and the player's own subtitles for listening.
  While the video plays on by itself, the sentence being said is marked.
- The desktop window now also grants the full-screen permission, for the player's button.
- Considered and rejected: downloading the audio to transcribe it locally, which YouTube's
  terms forbid and which is what download tools have been taken down for.
- No live test was added: the subtitles are read the way YouTube's page reads them, and such
  requests are often refused from the addresses of hosted CI machines.

## Verification

- `cd backend && uv run pytest`: 165 passed, 8 live tests deselected.
- `cd frontend && npm test`: 78 passed; `npm run build` succeeded.
  `cd desktop && npm test`: 31 passed; `npx tsc --noEmit` succeeded.
- Real subtitles of two videos (a commencement address and a talk), read from this machine:
  244 and 315 lines became about 150 sentences each, 15 words on average, the longest 53.
- In a hidden, muted Electron window against the built app: added the first video through
  the form, which opened its page with the player; clicking a 3.4-second sentence played it
  and stopped by itself 5.4 seconds later (loading included); with "Repeat" on it was still
  playing after 12 seconds; "Pause" stopped it; "Next" moved on. With "Show the text" off,
  the sentences and the player's subtitles were gone in the screenshot.
- Not verified: the sound itself and how exactly a sentence's start and end fall on the
  speech (the window was muted); the speed setting; full screen in the desktop app; a video
  with unpunctuated automatic subtitles, and one that does not allow embedding.
