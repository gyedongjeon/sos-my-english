"""A few requests to a real LLM, to catch what mocks cannot: a prompt the model no longer
follows, a changed provider API, a retired model name.

Left out of a normal run. With a key in `.env`:

    uv run --env-file .env pytest -m live

Replies differ every time, so these tests check the shape of a reply, never its wording.
"""

import re

import pytest

pytestmark = pytest.mark.live

def reply_to(client, said: str) -> dict:
    conversation = client.post("/api/conversations", json={"topic_id": 1}).json()
    client.post(f"/api/conversations/{conversation['id']}/messages", json={"text": said})
    response = client.post(f"/api/conversations/{conversation['id']}/reply")
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


def test_a_review_is_written_in_the_chosen_language_with_english_phrases(client):
    client.put("/api/settings", json={"feedback_language": "Korean"})
    conversation = client.post("/api/conversations", json={"topic_id": 1}).json()
    for said in ("it was busy but good I had many meeting", "yesterday I go to the beach with my friend"):
        client.post(f"/api/conversations/{conversation['id']}/messages", json={"text": said})
        assert client.post(f"/api/conversations/{conversation['id']}/reply").status_code == 200
    response = client.post(f"/api/conversations/{conversation['id']}/review")
    assert response.status_code == 200, response.text
    review = response.json()
    assert re.search("[가-힣]", review["summary"])
    # Both lines have a mistake, so there is something to work on.
    assert review["focus"] and all(re.search("[가-힣]", item) for item in review["focus"])
    assert all(phrase["english"].strip() and not re.search("[가-힣]", phrase["english"]) for phrase in review["phrases"])


def test_the_opening_line_of_an_own_topic_is_short_plain_english(client):
    # The learner may describe the situation in their own language.
    topic = {"title": "병원 예약", "situation": "병원 접수처에 전화해서 진료 예약을 잡는 상황. 상대는 접수 직원."}
    response = client.post("/api/topics", json=topic)
    assert response.status_code == 201, response.text
    opener = response.json()["opener"]
    assert 2 <= len(opener) <= 400
    assert "\n" not in opener and "*" not in opener
    assert not re.search("[가-힣]", opener)


def test_a_topic_made_from_an_article_in_another_language_is_in_english(client):
    article = (
        "서울시는 다음 달부터 한강 공원에서 전동 킥보드 운행을 전면 금지한다고 밝혔다. "
        "최근 2년간 공원 내 킥보드 사고가 세 배로 늘어난 데 따른 조치다. "
        "시민단체는 보행자 안전을 위해 필요한 결정이라고 환영했지만, 공유 킥보드 업체들은 "
        "이용자 불편과 매출 감소를 우려하며 전용 도로를 만들어 달라고 요구했다. "
        "서울시는 6개월간 시범 운영한 뒤 계속할지 결정할 계획이다."
    )
    response = client.post("/api/topics/from-text", json={"text": article})
    assert response.status_code == 201, response.text
    topic = response.json()
    for field in ("title", "situation", "background", "opener"):
        assert topic[field].strip() and not re.search("[가-힣]", topic[field]), field
    assert len(topic["title"]) <= 80
    assert "\n" not in topic["opener"] and "*" not in topic["opener"]
    assert topic["opener"].rstrip().endswith("?")
