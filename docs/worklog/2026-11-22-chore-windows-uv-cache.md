---
title: "ci: cache uv's downloads in the Windows job again"
date: 2026-11-22
branch: chore/windows-uv-cache
request-source: repo-maintenance, 2026-11-22
---

## Request

The Windows CI job takes much longer than the others, and it is the only job without the uv cache. Find out why the cache was left out, and turn it back on if it is safe.

## Changes

- `.github/workflows/ci.yml`: the Windows job's `setup-uv` step has `enable-cache: true` with `cache-dependency-glob: backend/uv.lock` again, like the Linux backend jobs.
- Why it was off: the cache was removed in `bbae93a` (2026-11-21), together with the fix that makes `.github/scripts/start-server-check.sh` stop the server it starts. Before that fix the server was still running when the job ended; setup-uv's post step (`uv cache prune`) could not remove files the server held open on Windows, hung for five minutes, and failed the job (run 44943164559). The server is stopped now, so the cache should no longer be in the way. A comment in the workflow records the dependency.

## Verification

- First run on this pull request: the job, including the "Post Run astral-sh/setup-uv" step, must pass and save the cache.
- Second run (started by hand): the cache must be restored, and "Run the backend tests" compared with the recent runs without the cache (48–78 s).
