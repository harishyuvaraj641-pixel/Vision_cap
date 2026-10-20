from app.api.camera import router as camera_router
from app.api.voice import router as voice_router
from app.api.ai import router as ai_router
from app.api.system import router as system_router
from app.api.websocket import router as websocket_router
from app.api.conversation import router as conversation_router

__all__ = [
    "camera_router",
    "voice_router",
    "ai_router",
    "system_router",
    "websocket_router",
    "conversation_router"
]
