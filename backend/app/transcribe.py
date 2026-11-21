"""Local speech-to-text with Whisper (faster-whisper); no API key, audio stays on this machine."""

import os
import string
import threading
from dataclasses import dataclass, field
from typing import BinaryIO

from faster_whisper import WhisperModel

# English-only model, downloaded from Hugging Face on first use (~480 MB for small.en).
DEFAULT_MODEL = "small.en"
# Words Whisper recognized with less confidence than this are reported as unclear.
UNCLEAR_BELOW = 0.5
MAX_UNCLEAR_WORDS = 8

_model: WhisperModel | None = None
_lock = threading.Lock()


@dataclass
class Transcript:
    text: str
    # How confidently Whisper recognized the words, 0-100. This is a proxy for how clearly
    # they were pronounced, not a phonetic assessment. None when nothing was said.
    clarity: int | None = None
    unclear_words: list[str] = field(default_factory=list)
    words_per_minute: int | None = None


def _get_model() -> WhisperModel:
    global _model
    with _lock:
        if _model is None:
            name = os.environ.get("WHISPER_MODEL", "").strip() or DEFAULT_MODEL
            _model = WhisperModel(name, device="cpu", compute_type="int8")
        return _model


def transcribe(audio: BinaryIO) -> Transcript:
    """Transcribe an audio file and measure how clearly it was spoken."""
    model = _get_model()
    # The model is not safe for concurrent use; requests are rare, so run one at a time.
    with _lock:
        # vad_filter drops silence, which otherwise makes Whisper invent text.
        segments, _ = model.transcribe(
            audio, language="en", vad_filter=True, word_timestamps=True
        )
        segments = list(segments)

    text = " ".join(segment.text.strip() for segment in segments).strip()
    words = [word for segment in segments for word in (segment.words or [])]
    if not words:
        return Transcript(text=text)

    clarity = round(100 * sum(w.probability for w in words) / len(words))
    unclear: list[str] = []
    for w in words:
        cleaned = w.word.strip().strip(string.punctuation)
        if w.probability < UNCLEAR_BELOW and cleaned and cleaned.lower() not in map(str.lower, unclear):
            unclear.append(cleaned)

    speaking_seconds = words[-1].end - words[0].start
    wpm = round(len(words) / speaking_seconds * 60) if speaking_seconds >= 5 else None
    return Transcript(text, clarity, unclear[:MAX_UNCLEAR_WORDS], wpm)
