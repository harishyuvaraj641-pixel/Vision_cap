"""
VISIONCAP — Custom Exceptions
"""


class VisionCapError(Exception):
    """Base exception for VISIONCAP."""
    pass


class CameraError(VisionCapError):
    """Camera-related errors."""
    pass


class CameraConnectionError(CameraError):
    """Failed to connect to camera."""
    pass


class CameraFrameError(CameraError):
    """Failed to capture or decode frame."""
    pass


class AIError(VisionCapError):
    """AI service errors."""
    pass


class AIProviderError(AIError):
    """AI provider configuration or communication error."""
    pass


class AIResponseError(AIError):
    """Invalid or failed AI response."""
    pass


class SpeechError(VisionCapError):
    """Speech recognition errors."""
    pass


class TTSError(VisionCapError):
    """Text-to-speech errors."""
    pass


class WebSocketError(VisionCapError):
    """WebSocket communication errors."""
    pass
