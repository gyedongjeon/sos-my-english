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
