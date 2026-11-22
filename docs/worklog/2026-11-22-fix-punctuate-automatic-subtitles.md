---
title: "fix: cut automatic subtitles without punctuation into sentences"
date: 2026-11-22
branch: fix/punctuate-automatic-subtitles
request-source: chat session, 2026-11-22
---

## Request

A video with automatic subtitles was listed line by line as YouTube shows them ("Richard Feynman
was a leading theoretical physicist who received a" / "Nobel Prize for his work in quantum
electrodynamics"). Group automatic subtitles into sentences too, as SOS My German now does.

## Changes

- **Cause**: some of YouTube's automatic English subtitles have no punctuation. With too few
  sentence ends (fewer than one in 40 words), the app keeps such subtitles line by line.
- **Fix**, ported from SOS My German's `fix/punctuate-automatic-subtitles`: when a video is added
  and its subtitles have too few sentence ends, `videos.punctuate` has the model add punctuation
  and capitals, up to 300 words a request and four requests at a time, each part ending with a
  subtitle line. Each line keeps its own number of words, so every word keeps its time, and the
  sentences are then cut as for punctuated subtitles.
- **Only the marks are taken from the model.** The reply is lined up with the words
  (`difflib.SequenceMatcher`); each word keeps its own spelling and takes the capital and the
  marks after it from the model's version, since the model tends to correct recognition errors
  however it is told not to. A reply in which fewer than nine in ten of the words are found is
  not used, and that part stays line by line. With no model, or when every part fails, the video
  is saved line by line as before.
- The German-only quotation marks („ ‚ « ») were left out of the marks stripped around a word;
  the prompt says "English".
- Subtitles with punctuation are not sent, and nothing changes for them. Videos saved before keep
  their lines; deleting and adding one again cuts it into sentences.
- **Privacy**: all the subtitles of a video without punctuation are sent to the LLM provider when
  it is added; the README says so. Its line "Subtitles stay on this computer and are not sent
  anywhere" was already untrue with the translation and now names both cases.

## Verification

- `cd backend && uv run pytest`: 237 passed (7 new, in `tests/test_punctuation.py`, first run
  failing: 4 failed, 3 passed), 11 live tests deselected.
- New live test, `uv run --env-file .env pytest -m live -k automatic_subtitles`: passed; four
  unpunctuated lines with a recognition error ("there lectures") came back cut at sentence ends,
  with every word as it was.
- Not verified: a real YouTube video in the running app.
