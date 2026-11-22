---
title: "feat: build a Windows installer"
date: 2026-11-21
branch: feat/windows
request-source: chat session, 2026-11-21
---

## Request

Make a Windows version of the app as well.

## Changes

- **Installer for 64-bit Windows** (`electron-builder`, NSIS target): it installs for the
  current user without administrator rights and is named
  `SOS-My-English-Setup-<version>.exe`. The app ships `uv.exe` like the macOS app ships `uv`
  (`desktop/scripts/fetch-uv.mjs` now also has the pinned Windows build and its SHA-256).
- **Stopping the backend on Windows**: uv starts the Python server as a process of its own
  there, and ending uv left the server running. The whole process tree is now ended
  (`taskkill /T /F`); the decision is in `stopCommand` with tests. The console window of the
  backend is hidden.
- **Updates on Windows**: only the macOS app can replace itself. On Windows the app reports
  a new version and opens the download page; the check is under Help in a small menu, as
  there is no application menu.
- **Release workflow**: a Windows job builds the installer after the release exists and adds
  it to the release. The release notes have an install section for Windows.
- **CI**: a Windows job runs the backend's tests, starts the server the way the installed
  app does (`.github/scripts/start-server-check.sh`: the locked packages without the test
  tools, a data folder of its own) and waits for it to answer, and builds the installer.
- **Database connections are closed after use.** The first Windows run of the tests failed
  with one test's data showing up in the next: connections were never closed, only left to
  be collected, and an open one keeps the database file locked on Windows, so the tests'
  cleanup could not remove it. `get_connection()` now closes its connection when its block
  ends, saving or dropping the changes as before, and the tests' cleanup no longer ignores a
  folder it cannot remove.
- Found on the Windows runner as well: Git's `tar`, first on the path of a Git shell, takes
  "C:" for a remote host, so the uv archive is unpacked with Windows' own `tar.exe`.
- Not included: an installer for Intel Macs or Linux, signing the Windows installer, and the
  desktop unit tests on Windows (they compare paths written with forward slashes).

## Verification

- `cd backend && uv run pytest`: 203 passed, 9 live tests deselected.
  `cd desktop && npm test`: 36 passed; `npx tsc --noEmit` succeeded.
- On GitHub's Windows runner, started by hand on this branch: the backend's tests passed,
  the server installed its packages, started, and answered `/api/health`, `/api/topics`, and
  `/api/models`, and the installer was built (`SOS-My-English-Setup-0.4.0.exe`, 133 MB). The
  job's cleanup then failed because the check had left its server running; the check now
  stops it, which was tried on macOS only before this pull request's own run.
- **Not verified: the installed app on a Windows machine.** Nobody has opened it. Unchecked
  in particular: the installer itself, the window and its menu, the microphone, the voice,
  closing the app (that the server stops), the update notice, and uninstalling.

### Follow-up: installer kept as a CI artifact
- The Windows CI job now uploads the installer it builds (`windows-installer`, kept 7 days), so it can be tried on a real machine before a release.

### Follow-up: the first launch shows what it is doing
- Reported on 2026-11-22 from a first try of the installer in a Windows virtual machine: the waiting screen stayed up with no sign of whether the setup was slow or stuck.
- The waiting screen now shows the last line the backend wrote (for example the package being downloaded), and the packaged app keeps that output in `backend.log` in its data folder.
- Checked on macOS with a stand-in for uv that prints two lines: the screen showed the second one. The cause of the long wait in the virtual machine is not known yet.
