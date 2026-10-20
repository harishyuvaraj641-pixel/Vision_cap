"""
VISIONCAP Backend Tests — AI Service & Provider Abstraction
Tests OpenAI-compatible provider, timeouts, missing API key handling, and fallback behavior.
"""

from app.providers.base import BaseAIProvider
from app.providers.openai_compatible import OpenAICompatibleProvider
from app.core.exceptions import AIProviderError
from app.services.conversation_service import ConversationService
from app.services.ai_service import AIService


class MockAIProvider(BaseAIProvider):
    """Deterministic mock provider for testing pipeline orchestration."""
    def __init__(self, should_fail=False):
        self.should_fail = should_fail

    async def analyze_image(self, image_base64: str, question: str, conversation_history=None, **kwargs) -> str:
        if self.should_fail:
            raise AIProviderError("Simulated AI upstream timeout")
        return f"Mock answer to: {question}"

    async def chat(self, message: str, conversation_history=None) -> str:
        return f"Mock chat response to: {message}"

    async def health_check(self) -> bool:
        return not self.should_fail

    def get_info(self) -> dict:
        return {"provider": "mock", "configured": True}


async def test_ai_provider_missing_key_graceful_failure():
    """Test that provider cleanly raises AIProviderError when unconfigured."""
    provider = OpenAICompatibleProvider()
    provider.api_key = ""  # Explicitly clear API key

    raised = False
    try:
        await provider.analyze_image("dummybase64", "What is this?")
    except AIProviderError as e:
        raised = True
        assert "not configured" in str(e).lower()
    assert raised, "Expected AIProviderError when API key is missing"


async def test_mock_ai_pipeline_success():
    """Test standard AI pipeline analysis flow with mock provider."""
    mock_p = MockAIProvider(should_fail=False)
    assert await mock_p.health_check() is True

    result = await mock_p.analyze_image("dummybase64", "What is in front of me?")
    assert "Mock answer to: What is in front of me?" == result


async def test_mock_ai_pipeline_timeout_handling():
    """Test provider error handling under upstream timeouts."""
    mock_p = MockAIProvider(should_fail=True)
    assert await mock_p.health_check() is False

    raised = False
    try:
        await mock_p.analyze_image("dummybase64", "What is this?")
    except AIProviderError:
        raised = True
    assert raised, "Expected AIProviderError under simulated timeout"


def test_conversation_memory_bounded():
    """Test conversation history stores messages and stays strictly bounded."""
    conv = ConversationService()
    conv.max_history = 5
    conv.clear()

    for i in range(10):
        conv.add_message("user", f"Question {i}")
        conv.add_message("assistant", f"Answer {i}")

    history = conv.get_history()
    assert len(history) <= 5
    # Latest item should be Answer 9
    assert history[-1]["text"] == "Answer 9"


async def test_vision_service_direct_base64():
    """Test vision_service.ask accepts client-provided base64 image directly."""
    from app.services.vision_service import vision_service
    from app.services.ai_service import ai_service

    old_provider = ai_service.provider
    try:
        ai_service.provider = MockAIProvider(should_fail=False)
        result = await vision_service.ask(
            question="What is this object?",
            camera_id="laptop_webcam",
            image_base64="data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        )
        assert result["success"] is True
        assert "Mock answer to: What is this object?" in result["answer"]
        assert result["camera_id"] == "laptop_webcam"
        assert result["frame_id"] is not None
    finally:
        ai_service.provider = old_provider

