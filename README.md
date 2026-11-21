# SOS My English

**English** | [한국어](README.ko.md)

[![CI](https://github.com/gyedongjeon/sos-my-english/actions/workflows/ci.yml/badge.svg)](https://github.com/gyedongjeon/sos-my-english/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Stuck for words? An app for practising **spoken English**, running on your own machine. Pick a
topic, talk it through out loud with an AI partner that answers by voice, and get your English
fixed as you go.

Part of the SOS series, next to [SOS My Interview](https://github.com/gyedongjeon/sos-my-interview).

## Features
- **Speaking first**: you answer by voice, not by typing; what you said is transcribed for you.
- **Listening first**: your partner's reply is read aloud, and its text stays hidden until you ask for it.
- **Corrections as you go**: after each thing you say, the most valuable fix is shown with the better sentence and why, and you can hear the better sentence.
- **How clearly you spoke**: each line shows a clarity score, the words that were hard to recognize, and your pace.
- **Explanations in your language**: corrections are explained in Korean, Japanese, Chinese, Spanish, and more; the conversation stays in English.
- **Private by default**: speech-to-text and your partner's voice run locally, and your data stays on your computer. Only the text of the conversation goes to the LLM provider you choose, with your own API key.

The app runs locally for a single user; there is no account, server, or deployment.

## First setup
The app opens on the Settings page the first time.

1. **Feedback language**: pick the language your corrections are explained in. It starts from
   your system language.
2. **AI model and API key**: choose a provider and model and paste that provider's API key. It is
   saved and checked with a test request.

Replies and corrections are written by an LLM through
[LiteLLM](https://docs.litellm.ai/docs/providers), so any supported provider works (Gemini,
Claude, OpenAI, OpenRouter, a local Ollama model, ...). Both settings can be changed any time
under Settings. The key is stored in the local database (`app.db`), is never shown again in the
UI, and is sent only to the chosen provider.

## How it works
### Conversation
Each topic sets a situation (small talk, ordering at a café, a meeting at work, ...) and an
opening line. After each thing you say, the LLM gets the conversation so far and returns your
partner's next line together with at most one correction of what you just said.

### Speech-to-text
What you say is transcribed locally with [Whisper](https://github.com/SYSTRAN/faster-whisper): no
API key is needed and the audio never leaves your machine. The `small.en` model (~480 MB) is
downloaded on the first transcription; set the `WHISPER_MODEL` environment variable to use
another one. The clarity score is Whisper's confidence in the words it heard, a proxy for how
clearly they were pronounced. Allow microphone access when asked.

### Text-to-speech
Your partner's lines are read aloud with a local
[Kokoro](https://github.com/thewh1teagle/kokoro-onnx) voice. Its model files (~350 MB) are
downloaded in the background on first use, and rendered clips are cached in
`backend/data/tts/cache/`. Set the `TTS_VOICE` environment variable to change the voice. While
the download is running, or if the backend cannot produce audio, the browser's built-in voice is
used instead.

## Run from source
You need [uv](https://docs.astral.sh/uv/) and Node.js. Run the backend and frontend in separate
terminals, then open http://localhost:5173.

```bash
# Backend (http://127.0.0.1:8000)
cd backend
uv run uvicorn app.main:app --reload

# Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

### Desktop app
The desktop app is an Electron window that starts and stops the backend for you.

```bash
cd desktop
npm install
npm run dev    # run from this checkout, using backend/data
npm run dist   # build desktop/release/SOS My English-<version>-arm64.dmg
```

`npm run dist` first downloads the uv release pinned in `desktop/scripts/fetch-uv.mjs` (checked
against its SHA-256) into `desktop/vendor/`, to bundle it into the app, so the built app needs
nothing else installed. Releases are built and published by GitHub Actions when a version tag is
pushed; see [docs/git-workflow/versioning.md](docs/git-workflow/versioning.md). The packaged app
keeps its data in `~/Library/Application Support/SOS My English/data/`.

## Tests
```bash
cd backend && uv run pytest     # API and logic, against a temporary data folder
cd frontend && npm test         # unit tests (Vitest)
cd desktop && npm test          # unit tests (Vitest)
```

The backend tests never call a real LLM, Whisper, or Kokoro, and never reach the network. Opening a pull
request into `main` runs all three suites, the frontend build, and the desktop type check
(`.github/workflows/ci.yml`).

## Structure
- `backend/` — FastAPI app. Everything it stores lives in `backend/data/` (git-ignored): the SQLite file `app.db` and the `tts/` voice model and cache.
- `frontend/` — Vue 3 app; `/api` requests are proxied to the backend by Vite. Once built (`npm run build`), the backend serves it too, so http://127.0.0.1:8000 alone runs the whole app.
- `desktop/` — Electron shell that starts the backend and shows the app in a window.

Built with FastAPI and SQLite (backend), Vue 3, TypeScript, Vite, Pinia, and Tailwind CSS + daisyUI
(frontend), and Electron (desktop).

## License
[MIT](LICENSE). Third-party work shipped in the built app — the libraries and the heading font, Bricolage
Grotesque (SIL Open Font License 1.1) — is credited in
[frontend/public/THIRD_PARTY_NOTICES.txt](frontend/public/THIRD_PARTY_NOTICES.txt), which is also served by the app at
`/THIRD_PARTY_NOTICES.txt`.
