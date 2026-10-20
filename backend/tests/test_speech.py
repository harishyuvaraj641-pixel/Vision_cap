"""
VISIONCAP — Speech Service & Tamil Transcriber Tests
"""

from app.services.speech_service import speech_service
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_tamil_unicode_detection():
    query = "என் முன்னால் என்ன இருக்கிறது?"
    result = speech_service.detect_language_and_intent(query)
    assert result["is_tamil"] is True
    assert result["language"] == "ta"
    assert result["detected_language"] == "ta"


def test_tanglish_detection_and_intent():
    query = "munnadi enna irukku"
    result = speech_service.detect_language_and_intent(query)
    assert result["is_tamil"] is True
    assert result["language"] == "ta"
    assert "Tanglish" in result["intent_summary"] or "meaning" in result["intent_summary"]


def test_english_detection():
    query = "What is on the desk in front of me?"
    result = speech_service.detect_language_and_intent(query)
    assert result["is_tamil"] is False
    assert result["language"] == "en"


def test_detect_language_api_endpoint():
    res = client.post("/api/voice/detect-language", json={"text": "valadhu pakkam enna irukku"})
    assert res.status_code == 200
    data = res.json()
    assert data["is_tamil"] is True
    assert data["language"] == "ta"

    res_en = client.post("/api/voice/detect-language", json={"text": "Can you see any door?"})
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert data_en["is_tamil"] is False
    assert data_en["language"] == "en"
