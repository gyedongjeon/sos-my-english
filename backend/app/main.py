"""FastAPI entry point."""

from contextlib import asynccontextmanager
from dataclasses import asdict

from fastapi import FastAPI, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .conversation import Message, TutorReply, tutor_reply
from .db import get_connection, init_db
from .llm import LLMError
from .models import router as models_router
from .paths import FRONTEND_DIST
from .settings import router as settings_router
from .speech import synthesize
from .transcribe import transcribe


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="sos-my-english", lifespan=lifespan)
app.include_router(models_router)
app.include_router(settings_router)


class Topic(BaseModel):
    id: int
    title: str
    situation: str
    # The tutor's first line, which starts the conversation.
    opener: str


class ReplyRequest(BaseModel):
    topic_id: int
    # The conversation so far, oldest first, ending with what the learner just said.
    messages: list[Message] = Field(min_length=1)


class TranscriptResponse(BaseModel):
    text: str
    clarity: int | None
    unclear_words: list[str]
    words_per_minute: int | None


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


@app.get("/api/health")
def health() -> dict[str, str]:
    """Lets the desktop shell know the server is ready."""
    return {"status": "ok"}


@app.get("/api/topics", response_model=list[Topic])
def list_topics() -> list[Topic]:
    with get_connection() as conn:
        rows = conn.execute("SELECT id, title, situation, opener FROM topics ORDER BY id").fetchall()
    return [Topic(**dict(row)) for row in rows]


@app.post("/api/reply", response_model=TutorReply)
def reply(body: ReplyRequest) -> TutorReply:
    """The tutor's next line in a conversation, with a correction for the learner's last message."""
    if body.messages[-1].role != "learner":
        raise HTTPException(status_code=422, detail="The last message must be the learner's.")
    with get_connection() as conn:
        topic = conn.execute("SELECT situation FROM topics WHERE id = ?", (body.topic_id,)).fetchone()
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    try:
        return tutor_reply(topic["situation"], body.messages)
    except LLMError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


@app.post("/api/transcribe", response_model=TranscriptResponse)
def transcribe_speech(file: UploadFile) -> TranscriptResponse:
    try:
        result = transcribe(file.file)
    except Exception as e:
        # Undecodable upload or a failed model download/load; report it to the UI.
        raise HTTPException(status_code=502, detail=f"Transcription failed: {e}") from e
    return TranscriptResponse(**asdict(result))


@app.post("/api/speech")
def speech(body: SpeechRequest) -> Response:
    try:
        audio = synthesize(body.text)
    except Exception as e:
        # Model still downloading, failed to load, or synthesis failed; the UI falls back to the browser voice.
        raise HTTPException(status_code=502, detail=f"Speech synthesis failed: {e}") from e
    return Response(content=audio, media_type="audio/wav")


@app.get("/{path:path}", include_in_schema=False)
def frontend(path: str) -> FileResponse:
    """Serve the built frontend, so the whole app runs from this one server."""
    index = FRONTEND_DIST / "index.html"
    if path.startswith("api/") or not index.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    file = (FRONTEND_DIST / path).resolve()
    if file.is_file() and file.is_relative_to(FRONTEND_DIST.resolve()):
        return FileResponse(file)
    # Any other path is a client-side route; the Vue router takes it from here.
    return FileResponse(index)
