"""SQLite access and seed data."""

import sqlite3

from .paths import DATA_DIR

DB_PATH = DATA_DIR / "app.db"

# Conversation topics: (title, the situation the tutor plays out, the tutor's opening line).
SEED_TOPICS = [
    (
        "Small talk",
        "A relaxed chat between two acquaintances about everyday life.",
        "Hi! It's good to see you. How has your week been so far?",
    ),
    (
        "Introducing yourself",
        "Two people meet for the first time at a social event and get to know each other.",
        "Hi, I don't think we've met. I'm Alex. What's your name, and what do you do?",
    ),
    (
        "At a café",
        "The tutor is a barista taking the learner's order at a café.",
        "Good morning! Welcome in. What can I get started for you today?",
    ),
    (
        "Travel plans",
        "Two friends talk about a trip the learner is planning or has taken.",
        "I heard you've been thinking about a trip. Where would you like to go?",
    ),
    (
        "Weekend and hobbies",
        "A friendly chat about what the learner does in their free time.",
        "So, what do you usually like to do on the weekend?",
    ),
    (
        "A meeting at work",
        "The tutor is a colleague catching up with the learner on a project before a meeting.",
        "Thanks for joining. Before we start, could you tell me what you've been working on this week?",
    ),
]


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _add_column(conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    """Add a column to a table made by an earlier version of the app, unless it is there."""
    if column not in [found["name"] for found in conn.execute(f"PRAGMA table_info({table})")]:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS topics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL UNIQUE,
                situation TEXT NOT NULL,
                opener TEXT NOT NULL
            )
            """
        )
        conn.executemany(
            "INSERT OR IGNORE INTO topics (title, situation, opener) VALUES (?, ?, ?)",
            SEED_TOPICS,
        )
        conn.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        # A conversation keeps its topic's title and situation, so it stays readable (and the
        # tutor can still reply in it) after the topic is changed or removed.
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
                title TEXT NOT NULL,
                situation TEXT NOT NULL,
                started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                review TEXT
            )
            """
        )
        # `review` (JSON, written when a conversation is wrapped up) was added after the first
        # conversations were saved.
        _add_column(conn, "conversations", "review", "TEXT")
        # One line of a conversation, in the order they were said. The delivery columns and the
        # correction columns are filled for the learner's lines only.
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                role TEXT NOT NULL CHECK (role IN ('tutor', 'learner')),
                text TEXT NOT NULL,
                clarity INTEGER,
                unclear_words TEXT,
                words_per_minute INTEGER,
                correction_original TEXT,
                correction_improved TEXT,
                correction_explanation TEXT
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS messages_by_conversation ON messages (conversation_id, id)")
