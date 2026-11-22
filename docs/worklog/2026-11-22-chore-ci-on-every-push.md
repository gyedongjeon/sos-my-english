---
title: "ci: run the checks on every push to a pull request"
date: 2026-11-22
branch: chore/ci-on-every-push
request-source: repo-maintenance, 2026-11-22
---

## Request

CI ran only when a pull request into `main` was opened, so fixes pushed to the pull request afterwards went untested. Make it run on later pushes too.

## Changes

- `.github/workflows/ci.yml`: added `synchronize` to the `pull_request` types, so every push to an open pull request runs the checks again. The existing `concurrency` group (`cancel-in-progress: true`) cancels a run still in progress when a newer push arrives, so quick successive pushes do not pile up runs. Updated the header comment.
- `AGENTS.md`, `README.md`: updated the description of when CI runs. `README.ko.md` does not mention CI, so it is unchanged.

## Verification

- Reviewed the diff of `ci.yml`; the trigger is `types: [opened, reopened, synchronize]`, and `workflow_dispatch` / `workflow_call` are unchanged.
- The change takes effect on this pull request itself: a push after it is opened should start a new run.
