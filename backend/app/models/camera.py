"""
VISIONCAP — Camera Models
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class CameraType(str, Enum):
    ESP32CAM = "esp32cam"
    USB = "usb"
    LAPTOP = "laptop"
    NETWORK = "network"
    CUSTOM = "custom"


class CameraStatus(str, Enum):
    LIVE = "live"
    READY = "ready"
    CONNECTING = "connecting"
    DISCONNECTED = "disconnected"
    ERROR = "error"


class CameraConfig(BaseModel):
    """Camera configuration for adding/updating cameras."""
    id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=50)
    label: str = ""
    type: CameraType = CameraType.ESP32CAM
    url: str = ""
    stream_url: str = "/stream"
    capture_url: str = "/capture"
    is_primary: bool = False


class CameraInfo(BaseModel):
    """Camera status and metadata."""
    id: str
    name: str
    label: str
    type: CameraType
    url: str
    stream_url: str
    capture_url: str
    status: CameraStatus = CameraStatus.DISCONNECTED
    resolution: Optional[str] = None
    fps: Optional[float] = None
    frame_id: int = 0
    last_frame_timestamp: Optional[str] = None
    stream_mode: Optional[str] = None
    is_primary: bool = False
    error: Optional[str] = None


class FrameInfo(BaseModel):
    """Information about a captured frame."""
    frame_id: int
    camera_id: str
    timestamp: str
    width: int
    height: int
    size_bytes: int
    encoding: str = "jpeg"
