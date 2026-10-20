"""
VISIONCAP — Global Application State Machine
Centralized state with WebSocket event broadcasting.
"""

import asyncio
import logging
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Optional

logger = logging.getLogger("visioncap.state")


class SystemState(str, Enum):
    BOOTING = "booting"
    CAMERA_CONNECTING = "camera_connecting"
    CAMERA_CONNECTED = "camera_connected"
    IDLE = "idle"
    WAKE_DETECTED = "wake_detected"
    LISTENING = "listening"
    TRANSCRIBING = "transcribing"
    FRAME_CAPTURED = "frame_captured"
    ANALYZING = "analyzing"
    THINKING = "thinking"
    RESPONSE_READY = "response_ready"
    SPEAKING = "speaking"
    CAMERA_DISCONNECTED = "camera_disconnected"
    MICROPHONE_DISCONNECTED = "microphone_disconnected"
    AI_OFFLINE = "ai_offline"
    ERROR = "error"


class AppState:
    """Centralized application state with event broadcasting."""

    def __init__(self):
        self.system_state: SystemState = SystemState.BOOTING
        self.previous_state: Optional[SystemState] = None
        self._listeners: list[Callable] = []
        self._state_history: list[dict] = []
        self.max_history = 50

        # Subsystem states
        self.camera_connected: bool = False
        self.camera_count: int = 0
        self.microphone_available: bool = False
        self.ai_available: bool = False
        self.tts_available: bool = False
        self.websocket_connected: bool = False
        self.voice_state: str = "idle"

        # Current operation
        self.current_frame_id: Optional[int] = None
        self.current_transcription: Optional[str] = None
        self.current_response: Optional[str] = None

    @property
    def camera_available(self) -> bool:
        return self.camera_connected

    @camera_available.setter
    def camera_available(self, val: bool):
        self.camera_connected = val

    async def broadcast(self, event: dict):
        """Send raw event dict or formatted event."""
        if "type" not in event and "event" in event:
            event["type"] = event.pop("event")
        if "timestamp" not in event:
            event["timestamp"] = datetime.now(timezone.utc).isoformat()
        if "data" not in event:
            data = {k: v for k, v in event.items() if k not in ("type", "timestamp")}
            event = {"type": event["type"], "timestamp": event["timestamp"], "data": data}
        await self._broadcast(event)

    async def set_state(self, new_state: SystemState, data: Optional[dict] = None):
        """Transition to a new state and broadcast the change."""
        self.previous_state = self.system_state
        self.system_state = new_state

        event = {
            "type": "system_state",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "state": new_state.value,
                "previous_state": self.previous_state.value if self.previous_state else None,
                **(data or {}),
            },
        }

        self._state_history.append(event)
        if len(self._state_history) > self.max_history:
            self._state_history = self._state_history[-self.max_history:]

        logger.info(f"State: {self.previous_state.value if self.previous_state else '?'} → {new_state.value}")

        await self._broadcast(event)

    async def broadcast_event(self, event_type: str, data: dict):
        """Broadcast a custom event to all listeners."""
        event = {
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": data,
        }
        await self._broadcast(event)

    def add_listener(self, callback: Callable):
        """Register a WebSocket event listener."""
        self._listeners.append(callback)

    def remove_listener(self, callback: Callable):
        """Unregister a listener."""
        if callback in self._listeners:
            self._listeners.remove(callback)

    async def _broadcast(self, event: dict):
        """Send event to all registered listeners."""
        dead_listeners = []
        for listener in self._listeners:
            try:
                await listener(event)
            except Exception as e:
                logger.warning(f"Listener error: {e}")
                dead_listeners.append(listener)

        for dead in dead_listeners:
            self._listeners.remove(dead)

    def get_system_status(self) -> dict:
        """Return current system status summary."""
        return {
            "state": self.system_state.value,
            "camera": self.camera_connected,
            "camera_count": self.camera_count,
            "microphone": self.microphone_available,
            "ai": self.ai_available,
            "tts": self.tts_available,
            "websocket": self.websocket_connected,
        }

    def get_state_history(self) -> list[dict]:
        """Return recent state history."""
        return list(self._state_history)


# Global singleton
app_state = AppState()
