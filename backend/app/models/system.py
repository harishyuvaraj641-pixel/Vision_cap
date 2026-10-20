"""
VISIONCAP — System Models
"""

from pydantic import BaseModel
from typing import Optional


class SystemStatus(BaseModel):
    """Overall system status."""
    state: str
    camera: bool
    camera_count: int
    microphone: bool
    ai: bool
    tts: bool
    websocket: bool


class HealthCheck(BaseModel):
    """Health check response."""
    status: str
    camera: bool
    ai: bool
    version: str = "1.0.0"
