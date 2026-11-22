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
- The waiting screen now shows a progress bar and the step in words ("Downloading Python…", "Downloading packages… 120 of 310 MB", "Installing packages…", "Starting…"). The bar follows the size of the downloads uv names, so it is an estimate; later launches only say "Starting…". A first version showed uv's last line as it was, which was replaced after feedback the same day that package names mean little to a user.
- The packaged app keeps the backend's output in `backend.log` in its data folder.
- Checked on macOS with a stand-in for uv: the bar and the words followed its lines.
- In the Windows trial the Python download was retried four times from inside the app and never finished, while the same uv run from a command prompt fetched it in 18 seconds; after that the app went on to the packages. Whether the app or the connection was at fault is not known yet.

### Follow-up: the microphone error says what went wrong
- In the same trial the installed app opened, and "Start speaking" answered "The microphone is not available" without a reason.
- The message now depends on the failure: no microphone found, access turned off in the system's privacy settings, the microphone held by another app, or the failure's name for anything else. All four screens that record use it.
- The cause on the trial machine is not known yet; the new message is what will tell.
- When the system itself refuses the microphone, the app now shows a dialog that offers to open the microphone page of the system settings (Windows never asks for a desktop app; macOS asks once). Not seen running yet: it needs a machine where access is turned off.

### Follow-up: the Windows installer ships Python
- The trial was repeated with an empty data folder and failed the same way: inside the app, uv's download of Python stopped at about 3 MB and timed out, four attempts in a row, on three launches. The same uv fetched the same file from a command prompt in 18 seconds, and the packages (from another host) came down inside the app without trouble. Why it stalls there is not known.
- The Windows installer now holds the pinned Python (`resources/python`, fetched at build time by `scripts/fetch-python.mjs`), and the app tells uv to use it and to download none. The macOS app is unchanged and still fetches its Python.
- Checked on macOS that uv builds the environment on a Python moved to another folder and named by `UV_PYTHON`. The Windows CI job now starts the server on the shipped Python and checks that the unpacked installer holds it.
