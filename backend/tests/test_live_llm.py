"""A few requests to a real LLM, to catch what mocks cannot: a prompt the model no longer
follows, a changed provider API, a retired model name.

Left out of a normal run. With a key in `.env`:

    uv run --env-file .env pytest -m live

Replies differ every time, so these tests check the shape of a reply, never its wording.
"""

import re

import pytest

pytestmark = pytest.mark.live

OPENER = {"role": "tutor", "text": "Hi! It's good to see you. How has your week been so far?"}


def reply_to(client, said: str) -> dict:
    messages = [OPENER, {"role": "learner", "text": said}]
    response = client.post("/api/reply", json={"topic_id": 1, "messages": messages})
    # A reply that does not match the schema is reported as 502 by the endpoint.
    assert response.status_code == 200, response.text
    return response.json()


def test_reply_is_short_and_plain_enough_to_read_aloud(client):
    reply = reply_to(client, "it was busy but good I had many meeting")["reply"]
    assert 2 <= len(reply) <= 400
    assert "\n" not in reply and "*" not in reply


def test_a_mistake_is_corrected_and_explained_in_the_chosen_language(client):
    client.put("/api/settings", json={"feedback_language": "Korean"})
    correction = reply_to(client, "yesterday I go to the beach with my friend and we swimmed")["correction"]
    assert correction is not None
    assert correction["improved"].strip() and correction["improved"] != correction["original"]
    # The explanation is written in the chosen language; the better sentence stays in English.
    assert re.search("[가-힣]", correction["explanation"])
    assert not re.search("[가-힣]", correction["improved"])


def test_missing_punctuation_is_not_corrected(client):
    # Correct when spoken; only the transcript lacks the comma and the question mark.
    assert reply_to(client, "I'm good and you")["correction"] is None
