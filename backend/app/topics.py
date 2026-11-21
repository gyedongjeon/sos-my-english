"""Conversation topics: the situations the tutor plays out."""

from fastapi import APIRouter
from pydantic import BaseModel

from .db import get_connection

router = APIRouter(prefix="/api")


class Topic(BaseModel):
    id: int
    title: str
    situation: str
    # The tutor's first line, which starts the conversation.
    opener: str


@router.get("/topics", response_model=list[Topic])
def list_topics() -> list[Topic]:
    with get_connection() as conn:
        rows = conn.execute("SELECT id, title, situation, opener FROM topics ORDER BY id").fetchall()
    return [Topic(**dict(row)) for row in rows]
