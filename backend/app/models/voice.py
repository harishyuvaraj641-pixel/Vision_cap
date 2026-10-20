"""
VISIONCAP — Voice Models
"""

from pydantic import BaseModel
from typing import Optional
from enum import Enum


class VoiceState(str, Enum):
    IDLE = "idle"
    LISTENING = "listening"
    RECORDING = "recording"
    TRANSCRIBING = "transcribing"
    ERROR = "error"


class TranscriptionResult(BaseModel):
    """Speech-to-text result."""
    text: str
    language: Optional[str] = "en"
    confidence: Optional[float] = None
    duration_ms: Optional[int] = None


class VoiceCommand(BaseModel):
    """Voice control command."""
    action: str  # "start", "stop"


class WakeWordConfig(BaseModel):
    """Wake word configuration."""
    enabled: bool = True
    phrase: str = "Hey VISIONCAP"
    sensitivity: float = 0.5
