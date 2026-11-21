---
title: "fix: explain corrections in the chosen language"
date: 2026-11-21
branch: fix/explanation-language
request-source: CI run on a pull request, 2026-11-21
---

## Request

The live LLM tests ran against a real model for the first time once the repository secret was
added, and one failed: with Korean chosen as the feedback language, a correction was explained
in English.

## Changes

- **Cause**: the language was named once, in the last line of the instructions, after a prompt
  that is otherwise all about an English conversation. `gemini-3.1-flash-lite` followed it only
  some of the time.
- **Fix**: the prompt now names the language where the correction is described ("explain why
  in one or two sentences of Korean") and says why at the end: the learner reads the
  explanation in that language even though the conversation is in English, and English
  examples may be quoted inside it.
- No code besides the prompt changed.

## Verification

- Before the change, the live test
  `test_a_mistake_is_corrected_and_explained_in_the_chosen_language` failed in 1 of 3 local
  runs with `gemini/gemini-3.1-flash-lite`, the same way as in CI. After it, the test passed
  12 times out of 12, and the whole live suite (3 tests) passed 3 times out of 3.
- `cd backend && uv run pytest`: 65 passed, 3 live tests deselected.
- Not verified: other models. A model can still ignore the instruction now and then; the live
  test would show it.
