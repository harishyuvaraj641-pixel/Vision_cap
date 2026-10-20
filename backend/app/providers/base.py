"""
VISIONCAP — AI Provider Abstraction
"""

from abc import ABC, abstractmethod
from typing import Optional


class BaseAIProvider(ABC):
    """Abstract base class for AI vision providers."""

    @abstractmethod
    async def analyze_image(self, image_base64: str, question: str,
                            conversation_history: list[dict] = None,
                            language: Optional[str] = "en") -> str:
        """Analyze an image and answer a question."""
        pass

    @abstractmethod
    async def chat(self, message: str, conversation_history: list[dict] = None) -> str:
        """Chat without image context."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the AI provider is available."""
        pass

    @abstractmethod
    def get_info(self) -> dict:
        """Return provider info."""
        pass
