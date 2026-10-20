"""
VISIONCAP — Frame Buffer
Stores only the latest valid frame per camera.
Memory-efficient: no continuous video storage.
"""

import logging
import threading
from datetime import datetime, timezone
from typing import Optional
import numpy as np

logger = logging.getLogger("visioncap.frame_buffer")


class FrameData:
    """Container for a single camera frame."""

    __slots__ = ['frame', 'jpeg_data', 'frame_id', 'timestamp', 'width', 'height', 'camera_id']

    def __init__(self, frame: np.ndarray, jpeg_data: bytes, frame_id: int,
                 camera_id: str, width: int, height: int):
        self.frame = frame
        self.jpeg_data = jpeg_data
        self.frame_id = frame_id
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.camera_id = camera_id
        self.width = width
        self.height = height


class FrameBuffer:
    """Thread-safe latest-frame buffer for a single camera."""

    def __init__(self, camera_id: str):
        self.camera_id = camera_id
        self._frame: Optional[FrameData] = None
        self._lock = threading.Lock()
        self._frame_count = 0

    def update(self, frame: np.ndarray, jpeg_data: bytes) -> FrameData:
        """Store a new frame, replacing the previous one."""
        with self._lock:
            self._frame_count += 1
            h, w = frame.shape[:2]
            frame_data = FrameData(
                frame=frame,
                jpeg_data=jpeg_data,
                frame_id=self._frame_count,
                camera_id=self.camera_id,
                width=w,
                height=h,
            )
            self._frame = frame_data
            return frame_data

    def get_latest(self) -> Optional[FrameData]:
        """Get the latest frame."""
        with self._lock:
            return self._frame

    def get_latest_jpeg(self) -> Optional[bytes]:
        """Get the latest JPEG data."""
        with self._lock:
            return self._frame.jpeg_data if self._frame else None

    @property
    def frame_count(self) -> int:
        return self._frame_count

    @property
    def has_frame(self) -> bool:
        with self._lock:
            return self._frame is not None

    def clear(self):
        """Clear the buffer."""
        with self._lock:
            self._frame = None


class MultiFrameBuffer:
    """Manages frame buffers for multiple cameras."""

    def __init__(self):
        self._buffers: dict[str, FrameBuffer] = {}
        self._lock = threading.Lock()

    def get_buffer(self, camera_id: str) -> FrameBuffer:
        """Get or create a buffer for a camera."""
        with self._lock:
            if camera_id not in self._buffers:
                self._buffers[camera_id] = FrameBuffer(camera_id)
            return self._buffers[camera_id]

    def remove_buffer(self, camera_id: str):
        """Remove a camera buffer."""
        with self._lock:
            if camera_id in self._buffers:
                self._buffers[camera_id].clear()
                del self._buffers[camera_id]

    def get_latest(self, camera_id: str) -> Optional[FrameData]:
        """Get latest frame for a specific camera."""
        with self._lock:
            buf = self._buffers.get(camera_id)
            return buf.get_latest() if buf else None

    def clear_all(self):
        """Clear all buffers."""
        with self._lock:
            for buf in self._buffers.values():
                buf.clear()
            self._buffers.clear()


# Global singleton
frame_buffers = MultiFrameBuffer()
