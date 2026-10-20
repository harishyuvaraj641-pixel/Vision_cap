"""
VISIONCAP — AI Models
"""

from pydantic import BaseModel
from typing import Optional, Union


class VisionRequest(BaseModel):
    """Request for visual analysis."""
    question: str
    camera_id: Optional[str] = None
    image_base64: Optional[str] = None
    language: Optional[str] = "en"


class VisionResponse(BaseModel):
    """Response from visual analysis."""
    success: bool
    question: str
    answer: str
    frame_id: Optional[Union[int, str]] = None
    camera_id: Optional[str] = None
    frame_timestamp: Optional[str] = None
    latency_ms: Optional[int] = None
    is_demo: bool = False


class AIStatus(BaseModel):
    """AI service status."""
    available: bool
    provider: str
    model: str
    error: Optional[str] = None


class ConversationMessage(BaseModel):
    """A single conversation message."""
    role: str  # "user" or "assistant"
    text: str
    timestamp: Optional[str] = None
    frame_id: Optional[Union[int, str]] = None
    camera_id: Optional[str] = None


class ConversationHistory(BaseModel):
    """Conversation history response."""
    messages: list[ConversationMessage]
    max_history: int
