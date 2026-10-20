"""
VISIONCAP Backend Tests — Groq Provider & Qwen Model
Tests GroqProvider instantiation, parameter defaults, streaming accumulation, and AIService dynamic routing.
"""

import asyncio
from unittest.mock import AsyncMock, MagicMock
from app.providers.groq_provider import GroqProvider
from app.services.ai_service import AIService
from app.core.exceptions import AIProviderError


def test_groq_provider_initialization():
    """Verify GroqProvider initializes with exact requested parameters and defaults."""
    provider = GroqProvider(api_key="gsk_test123", model="qwen/qwen3.8-27b")
    assert provider.model == "qwen/qwen3.8-27b"
    assert provider.temperature == 0.6
    assert provider.max_completion_tokens == 2048
    assert provider.top_p == 0.95
    assert provider.reasoning_effort == "default"
    assert provider.api_key == "gsk_test123"
    info = provider.get_info()
    assert info["provider"] == "groq"
    assert info["model"] == "qwen/qwen3.8-27b"
    assert info["configured"] is True


async def test_groq_provider_missing_key():
    """Verify clean error when key is missing."""
    provider = GroqProvider(api_key="", model="qwen/qwen3.8-27b")
    raised = False
    try:
        await provider.analyze_image("base64", "What is this?")
    except AIProviderError as e:
        raised = True
        assert "not configured" in str(e).lower()
    assert raised, "Expected AIProviderError for missing Groq key"


async def test_groq_provider_streaming_accumulation():
    """Verify that chunks streamed from Groq are concatenated accurately."""
    provider = GroqProvider(api_key="gsk_mock", model="qwen/qwen3.8-27b")

    # Create mock streaming chunks
    class MockDelta:
        def __init__(self, content):
            self.content = content

    class MockChoice:
        def __init__(self, content):
            self.delta = MockDelta(content)

    class MockChunk:
        def __init__(self, content):
            self.choices = [MockChoice(content)]

    async def mock_stream_generator():
        for piece in ["The ", "path ", "ahead ", "is ", "clear."]:
            yield MockChunk(piece)

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_stream_generator())

    result = await provider._execute_chat_completion(mock_client, [{"role": "user", "content": "What is ahead?"}])
    assert result == "The path ahead is clear."


def test_ai_service_routes_to_groq():
    """Verify that AIService dynamically selects GroqProvider for qwen or groq URLs."""
    service = AIService()
    assert service._is_groq(model="qwen/qwen3.8-27b") is True
    assert service._is_groq(base_url="https://api.groq.com/openai/v1") is True
    assert service._is_groq(provider_type="groq") is True
    assert service._is_groq(base_url="https://api.openai.com/v1", model="gpt-4o") is False
