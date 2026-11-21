"""Sentence patterns, practised by saying in English a sentence shown in the learner's language."""

from dataclasses import asdict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from .corrections import _words
from .db import get_connection
from .llm import LLMError, complete, parse_json_reply
from .pattern_list import LEVELS, PATTERNS, Pattern
from .settings import feedback_language

router = APIRouter(prefix="/api")

# How many sentences one round of a pattern has.
ROUND = 5
BY_ID = {pattern.id: pattern for pattern in PATTERNS}

__all__ = ["LEVELS", "PATTERNS", "router"]


class PatternStatus(BaseModel):
    """A pattern and how the learner has done on it."""

    id: str
    level: str
    pattern: str
    use: str
    example: str
    # Finished rounds, and the score of the last one.
    sessions: int = 0
    last_correct: int | None = None
    last_total: int | None = None
    practiced_at: str | None = None


class Exercise(BaseModel):
    prompt: str = Field(min_length=1, description="The sentence to say, in the learner's language.")
    answer: str = Field(min_length=1, description="The sentence in English, using the pattern.")


class Exercises(BaseModel):
    note: str = Field(description="When the pattern is used, in the learner's language.")
    items: list[Exercise] = Field(min_length=1)


class Attempt(BaseModel):
    prompt: str = Field(min_length=1)
    answer: str = Field(min_length=1)
    said: str = Field(min_length=1, description="What the learner said, as transcribed.")


class Verdict(BaseModel):
    correct: bool
    improved: str = Field(min_length=1, description="The sentence as it should be said, in English.")
    explanation: str | None = Field(default=None, description="What to change and why; null when correct.")


class Result(BaseModel):
    correct: int = Field(ge=0)
    total: int = Field(ge=1, le=50)

    @model_validator(mode="after")
    def not_more_than_all(self) -> "Result":
        if self.correct > self.total:
            raise ValueError("More correct sentences than sentences.")
        return self


EXERCISES_PROMPT = """\
You are an English teacher preparing a speaking drill for a non-native speaker whose own
language is {language}. The drill practises one sentence pattern:

Pattern: {pattern}
Used for: {use}
Example: {example}
CEFR level: {level}

Write {count} different sentences that each need this pattern. The learner sees a sentence in
{language} and says it in English.
- Everyday things a person might really say, each about a different situation and with a
  different subject or verb. Do not reuse the example.
- Keep the vocabulary and the rest of the grammar at CEFR level {level} or below, so that the
  pattern is the only hard part.
- "answer" is the sentence in natural English, using the pattern. It is one sentence, short
  enough to say in one breath.
- "prompt" is the same sentence in natural {language}, as a native speaker would say it, not a
  word-for-word translation. {cue}
- "note" says in one or two sentences of {language} when this pattern is used.

Reply with a single JSON object matching this schema, and nothing else:
{schema}"""

# With English as the learner's language there is nothing to translate from.
SAME_LANGUAGE_CUE = (
    'Because that language is English, write "prompt" as a short instruction that describes what '
    'to say without using the pattern\'s own words, such as "Say that you regret not leaving earlier."'
)

CHECK_PROMPT = """\
You are an English teacher checking one sentence of a speaking drill. The learner, whose own
language is {language}, practises this sentence pattern:

Pattern: {pattern}
Used for: {use}
CEFR level: {level}

You get the sentence the learner was shown, a model answer, and what the learner said. The
learner spoke; you see a speech-recognition transcript, so ignore punctuation, capitalization,
and spelling, and do not count an obvious recognition error (a word that makes no sense where
a similar-sounding word would) as a mistake.

correct: true when what the learner said means what the shown sentence means, uses the
pattern, and has no mistake in grammar or word choice that a fluent speaker would notice. It
does not have to match the model answer: other words and a different order are fine.
improved: the sentence as it should be said, in English. Stay as close to the learner's own
words as a correct sentence allows; when it was correct, repeat what the learner said.
explanation: when it was not correct, one or two sentences in {language} on what to change
and why, talking about what to say, not how to write it. When it was correct, null.

Reply with a single JSON object matching this schema, and nothing else:
{schema}"""


def _pattern(pattern_id: str) -> Pattern:
    if pattern_id not in BY_ID:
        raise HTTPException(status_code=404, detail="Pattern not found")
    return BY_ID[pattern_id]


def _status(pattern: Pattern, progress: dict | None) -> PatternStatus:
    return PatternStatus(**asdict(pattern), **(progress or {}))


@router.get("/patterns", response_model=list[PatternStatus])
def list_patterns() -> list[PatternStatus]:
    """Every pattern, level by level, with the learner's progress on it."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT pattern_id, sessions, last_correct, last_total, practiced_at FROM pattern_progress"
        ).fetchall()
    progress = {row["pattern_id"]: {key: row[key] for key in row.keys() if key != "pattern_id"} for row in rows}
    return [_status(pattern, progress.get(pattern.id)) for pattern in PATTERNS]


@router.post("/patterns/{pattern_id}/exercises", response_model=Exercises)
def write_exercises(pattern_id: str) -> Exercises:
    """New sentences to say for one round of a pattern. They are not stored."""
    pattern = _pattern(pattern_id)
    language = feedback_language()
    system = EXERCISES_PROMPT.format(
        **asdict(pattern),
        language=language,
        count=ROUND,
        cue=SAME_LANGUAGE_CUE if language.strip().lower() == "english" else "",
        schema=Exercises.model_json_schema(),
    )
    try:
        reply = complete(system, f"Write the {ROUND} sentences.", max_tokens=4000, response_format={"type": "json_object"})
        written = parse_json_reply(reply, Exercises)
    except LLMError as e:
        raise HTTPException(status_code=502, detail=f"Could not write the sentences: {e}") from e
    written.items = written.items[:ROUND]
    return written


@router.post("/patterns/{pattern_id}/check", response_model=Verdict)
def check(pattern_id: str, body: Attempt) -> Verdict:
    """Judge what the learner said for one sentence of a round."""
    pattern = _pattern(pattern_id)
    if _words(body.said) == _words(body.answer):
        # The model answer itself, as heard: nothing to judge.
        return Verdict(correct=True, improved=body.answer)
    system = CHECK_PROMPT.format(**asdict(pattern), language=feedback_language(), schema=Verdict.model_json_schema())
    user = f"Shown to the learner: {body.prompt}\nModel answer: {body.answer}\nThe learner said: {body.said}"
    try:
        reply = complete(
            system, user, max_tokens=2000, response_format={"type": "json_object"}, reasoning_effort="low"
        )
        verdict = parse_json_reply(reply, Verdict)
    except LLMError as e:
        raise HTTPException(status_code=502, detail=f"Could not check the sentence: {e}") from e
    if verdict.correct:
        verdict.explanation = None
    return verdict


@router.post("/patterns/{pattern_id}/results", response_model=PatternStatus)
def save_result(pattern_id: str, body: Result) -> PatternStatus:
    """Record a finished round: how many of its sentences were right at the first try."""
    pattern = _pattern(pattern_id)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO pattern_progress (pattern_id, sessions, last_correct, last_total, practiced_at)
            VALUES (?, 1, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            ON CONFLICT (pattern_id) DO UPDATE SET
                sessions = sessions + 1, last_correct = excluded.last_correct,
                last_total = excluded.last_total, practiced_at = excluded.practiced_at
            """,
            (pattern_id, body.correct, body.total),
        )
        row = conn.execute(
            "SELECT sessions, last_correct, last_total, practiced_at FROM pattern_progress WHERE pattern_id = ?",
            (pattern_id,),
        ).fetchone()
    return _status(pattern, dict(row))
