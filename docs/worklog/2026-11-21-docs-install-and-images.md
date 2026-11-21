---
title: "docs: add install steps and screenshots"
date: 2026-11-21
branch: docs/install-and-images
request-source: chat session, 2026-11-21
---

## Request

Update the README now that releases exist, and add images of the app.

## Changes

- **Install**: both READMEs said there was no installer, or did not mention installing. They
  now describe downloading the `.dmg` from the latest release, the `xattr -cr` step for the
  unsigned build, and what the first launch downloads, and say to use 0.1.1 or later because
  0.1.0 does not start. A release badge was added.
- **`README.md` order**: "Where files are kept, and uninstalling" and "Updates" moved under
  Install, where a user of the installed app looks for them; the desktop section for developers
  links there instead of repeating it.
- **Images**: `docs/images/practice.png` (a conversation with a correction) at the top of both
  READMEs, and `docs/images/home.png` (the list of topics) further down. They were captured from
  the built frontend in a hidden Electron window at 1280 x 860 (2x). The conversation in the
  picture is sample data put into the page, not a recorded session, so no personal data is
  shown.
- A comment in `frontend/src/types.ts` that had been separated from the type it describes was
  put back above it.

## Verification

- Looked at both images: the pages are complete, and nothing personal (no API key, no Settings
  page) is in them.
- Every relative link and image path in the two READMEs points at a file or heading that exists.
- `cd frontend && npm run build`: succeeded (for the comment move).
- Not verified: how the READMEs render on GitHub.
