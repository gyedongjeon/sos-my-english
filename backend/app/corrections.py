"""Corrections from saved conversations, practised by saying the better sentence aloud."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .conversation import _spoken
from .db import get_connection

router = APIRouter(prefix="/api")

# Short forms that are spelled differently from their words, and the ones that follow no rule.
IRREGULAR = {"won't": "will not", "can't": "can not", "cannot": "can not", "shan't": "shall not", "let's": "let us"}
ENDINGS = {"n't": " not", "'m": " am", "'re": " are", "'ve": " have", "'ll": " will"}
# After these words "'s" is "is" and "'d" is "would" far more often than anything else; after any
# other word "'s" is left alone, because it usually marks an owner ("my friend's car").
PRONOUNS = {"i", "you", "he", "she", "it", "we", "they", "that", "there", "here", "what", "who", "where", "how"}


class SavedCorrection(BaseModel):
    """A correction made in a saved conversation, and how often it was practised since."""

    # The id of the learner's line it was made on.
    id: int
    conversation_id: int
    title: str
    original: str
    improved: str
    explanation: str
    # How many times the better sentence was said correctly, and when it last was.
    practiced: int
    practiced_at: str | None


class AttemptRequest(BaseModel):
    text: str = Field(min_length=1, description="What the learner said, as transcribed.")


class Attempt(BaseModel):
    matched: bool
    # Words of the better sentence that were not heard, in its order.
    missing: list[str]
    practiced: int


def _words(text: str) -> list[str]:
    """The words of a sentence as heard, with short forms spelled out so "I'm" equals "I am"."""
    words: list[str] = []
    for word in _spoken(text):
        stem, apostrophe, ending = word.rpartition("'")
        if word in IRREGULAR:
            word = IRREGULAR[word]
        elif apostrophe and stem in PRONOUNS and ending in ("s", "d"):
            word = f"{stem} {'is' if ending == 's' else 'would'}"
        else:
            for short, full in ENDINGS.items():
                if word.endswith(short) and len(word) > len(short):
                    word = word.removesuffix(short) + full
                    break
        words.extend(word.split())
    return words


def _contains(said: list[str], wanted: list[str]) -> bool:
    """Whether the wanted words were said one after another, in order."""
    return any(said[i : i + len(wanted)] == wanted for i in range(len(said) - len(wanted) + 1))


def _missing(said: list[str], wanted: list[str]) -> list[str]:
    left = list(said)
    missing = []
    for word in wanted:
        if word in left:
            left.remove(word)
        else:
            missing.append(word)
    return missing


@router.get("/corrections", response_model=list[SavedCorrection])
def list_corrections() -> list[SavedCorrection]:
    """Every correction in the saved conversations, newest first."""
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT m.id, m.conversation_id, c.title, m.correction_original AS original,
                   m.correction_improved AS improved, m.correction_explanation AS explanation,
                   m.practiced, m.practiced_at
            FROM messages m JOIN conversations c ON c.id = m.conversation_id
            WHERE m.correction_improved IS NOT NULL
            ORDER BY m.id DESC
            """
        ).fetchall()
    return [SavedCorrection(**dict(row)) for row in rows]


@router.post("/corrections/{correction_id}/attempts", response_model=Attempt)
def attempt(correction_id: int, body: AttemptRequest) -> Attempt:
    """Check what the learner said against the better sentence; a match is counted as practice."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT correction_improved AS improved, practiced FROM messages"
            " WHERE id = ? AND correction_improved IS NOT NULL",
            (correction_id,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Correction not found")
        said, wanted = _words(body.text), _words(row["improved"])
        matched = _contains(said, wanted)
        if matched:
            conn.execute(
                "UPDATE messages SET practiced = practiced + 1,"
                " practiced_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?",
                (correction_id,),
            )
    return Attempt(
        matched=matched,
        missing=[] if matched else _missing(said, wanted),
        practiced=row["practiced"] + matched,
    )
