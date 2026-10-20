"""
VISIONCAP — Configuration System
Loads settings from .env file using pydantic-settings.
"""

import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """VISIONCAP application configuration."""

    # ─── ESP32-CAM ───
    esp32_cam_url: str = "http://192.168.1.100"
    esp32_stream_url: str = "http://192.168.1.100/stream"
    esp32_capture_url: str = "http://192.168.1.100/capture"

    # ─── AI Provider ───
    ai_provider: str = "openai_compatible"
    ai_base_url: str = "https://api.openai.com/v1"
    ai_api_key: str = ""
    ai_model: str = "gpt-4o"

    # ─── Speech Recognition ───
    whisper_model: str = "base"
    deepgram_api_key: str = ""

    # ─── TTS ───
    tts_provider: str = "edge"
    tts_voice: str = "en-US-GuyNeural"

    # ─── Camera Settings ───
    camera_timeout: int = 5
    camera_reconnect_interval: int = 3
    max_frame_width: int = 1280
    max_frame_height: int = 720

    # ─── Application ───
    debug: bool = False
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    max_conversation_history: int = 20

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Singleton
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        if os.path.exists(env_path):
            _settings = Settings(_env_file=env_path)
        else:
            _settings = Settings()
    return _settings
