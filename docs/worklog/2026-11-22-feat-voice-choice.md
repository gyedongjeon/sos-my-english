---
title: "feat: choose the partner's voice under Settings"
date: 2026-11-22
branch: feat/voice-choice
request-source: chat session, 2026-11-22
---

## Request

Let the learner choose the partner's text-to-speech voice, following the voice choice recently
added to the sibling app SOS My German.

## Changes

- **Voices**: Kokoro's most natural English voices (the higher-graded ones in Kokoro's voice
  list), American and British, female and male: Heart (the default, as before), Bella, Nicole,
  Sarah, Michael, Fenrir, Puck, Emma, Isabella, George, and Fable. Each was rendered with the
  real model before it was taken in. Left out: the lower-graded English voices and the voices
  of other languages that share the model.
- **Unlike SOS My German**: Kokoro keeps every voice in the one `voices-v1.0.bin` already
  downloaded, so choosing a voice downloads nothing; the voice list has no size or download
  state, and the download code is unchanged.
- **Accent**: a British voice (prefix `b`) is now spoken with `lang="en-gb"`, the others with
  `en-us` as before, so British voices also get British pronunciation.
- **Backend**: `speech.VOICES` lists them. `GET /api/voices` returns each with which one is
  chosen; `PUT /api/voice` keeps the choice in the `settings` table (422 for an unlisted voice).
  The voice in use is the choice, else `TTS_VOICE`, else `af_heart`. The clip cache was already
  keyed by voice.
- **Frontend**: a "Partner's voice" card on the Settings page with the voices and "Hear it" to
  play a sample line.
- **Docs**: the README describes the choice; the Korean README adds it to the first setup;
  `.env.example` notes that the Settings choice comes before `TTS_VOICE`.

## Verification

- `cd backend && uv run pytest`: 221 passed (6 new in `tests/test_voice_choice.py`).
- `cd frontend && npm test`: 118 passed (3 new store tests); `npm run build` succeeded.
- All 11 voices rendered a sample line with the real Kokoro model, with the expected accent.
- Against a backend on a temporary data folder with the real model: `GET /api/voices` listed
  the voices with Heart chosen, `PUT /api/voice` with `bm_george` chose it, an unknown voice
  returned 422, and `/api/speech` returned WAV audio.
- Not verified: the Settings card in a browser, and listening to the voices in the app.
