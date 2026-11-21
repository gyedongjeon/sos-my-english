"""Conversation topics: the situations the tutor plays out, built in or added by the learner."""

import sqlite3
from typing import Annotated

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field, StringConstraints

from .db import get_connection
from .llm import LLMError, complete, parse_json_reply

router = APIRouter(prefix="/api")

Typed = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class Topic(BaseModel):
    id: int
    title: str
    situation: str
    # The tutor's first line, which starts the conversation.
    opener: str
    # Added by the learner, so it can be removed; the built-in topics cannot.
    custom: bool


class NewTopic(BaseModel):
    title: Annotated[Typed, StringConstraints(max_length=80)]
    # Who the tutor is and what the talk is about, in any language.
    situation: Annotated[Typed, StringConstraints(max_length=600)]
    # Left empty, the opening line is written by the model.
    opener: Annotated[str, StringConstraints(strip_whitespace=True, max_length=400)] | None = None


class Opener(BaseModel):
    opener: str = Field(min_length=1, description="The partner's first line, in English.")


OPENER_PROMPT = """\
You are a friendly English conversation partner helping a non-native speaker practice
speaking. The learner wants to practise a spoken conversation they described themselves,
possibly in another language than English.

Write the line you open that conversation with, in the role the situation gives you: one or
two short sentences in natural, everyday English that are easy to follow by ear and end by
giving the learner something to answer. Plain text only, with no formatting, because it is
read aloud as-is.

Reply with a single JSON object matching this schema, and nothing else:
{schema}"""


def _write_opener(title: str, situation: str) -> str:
    reply = complete(
        OPENER_PROMPT.format(schema=Opener.model_json_schema()),
        f"Topic: {title}\nSituation: {situation}",
        max_tokens=2000,
        response_format={"type": "json_object"},
        reasoning_effort="low",
    )
    return parse_json_reply(reply, Opener).opener.strip()


@router.get("/topics", response_model=list[Topic])
def list_topics() -> list[Topic]:
    with get_connection() as conn:
        rows = conn.execute("SELECT id, title, situation, opener, custom FROM topics ORDER BY id").fetchall()
    return [Topic(**dict(row)) for row in rows]


@router.post("/topics", response_model=Topic, status_code=201)
def add_topic(body: NewTopic) -> Topic:
    """Add a topic of the learner's own."""
    taken = HTTPException(status_code=409, detail="There is already a topic with this title.")
    with get_connection() as conn:
        # Checked before the model is asked, so a title that is taken costs no request.
        if conn.execute("SELECT 1 FROM topics WHERE title = ?", (body.title,)).fetchone():
            raise taken
    try:
        opener = body.opener or _write_opener(body.title, body.situation)
    except LLMError as e:
        raise HTTPException(status_code=502, detail=f"Could not write the opening line: {e}") from e
    try:
        with get_connection() as conn:
            created = conn.execute(
                "INSERT INTO topics (title, situation, opener, custom) VALUES (?, ?, ?, 1)",
                (body.title, body.situation, opener),
            )
    except sqlite3.IntegrityError as e:
        raise taken from e
    return Topic(id=created.lastrowid, title=body.title, situation=body.situation, opener=opener, custom=True)


@router.delete("/topics/{topic_id}", status_code=204)
def delete_topic(topic_id: int) -> Response:
    """Remove a topic the learner added. Conversations held on it stay in the history."""
    with get_connection() as conn:
        found = conn.execute("SELECT custom FROM topics WHERE id = ?", (topic_id,)).fetchone()
        if found is None:
            raise HTTPException(status_code=404, detail="Topic not found")
        if not found["custom"]:
            raise HTTPException(status_code=403, detail="A built-in topic cannot be removed.")
        conn.execute("DELETE FROM topics WHERE id = ?", (topic_id,))
    return Response(status_code=204)
