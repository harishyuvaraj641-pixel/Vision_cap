"""
VISIONCAP — Camera Service
Handles ESP32-CAM connections, stream reading, and frame extraction.
Supports multiple cameras with automatic reconnection.
"""

import asyncio
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Optional
import cv2
import numpy as np
import httpx

from ..config import get_settings
from ..core.exceptions import CameraConnectionError, CameraFrameError
from ..core.state import app_state, SystemState
from ..models.camera import CameraConfig, CameraInfo, CameraStatus, CameraType
from .frame_buffer import frame_buffers, FrameData

logger = logging.getLogger("visioncap.camera")


class CameraInstance:
    """Manages a single camera connection."""

    def __init__(self, config: CameraConfig):
        self.id = config.id or f"cam-{uuid.uuid4().hex[:8]}"
        self.config = config
        self.status = CameraStatus.DISCONNECTED
        self.resolution: Optional[str] = None
        self.fps: float = 0.0
        self.stream_mode: Optional[str] = None
        self.error: Optional[str] = None
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._frame_times: list[float] = []
        self._fps_window = 30

    def to_info(self) -> CameraInfo:
        """Convert to API response model."""
        buf = frame_buffers.get_buffer(self.id)
        latest = buf.get_latest() if buf.has_frame else None
        return CameraInfo(
            id=self.id,
            name=self.config.name,
            label=self.config.label,
            type=self.config.type,
            url=self.config.url,
            stream_url=self.config.stream_url,
            capture_url=self.config.capture_url,
            status=self.status,
            resolution=self.resolution,
            fps=round(self.fps, 1) if self.fps > 0 else None,
            frame_id=buf.frame_count if buf else 0,
            last_frame_timestamp=latest.timestamp if latest else None,
            stream_mode=self.stream_mode,
            is_primary=self.config.is_primary,
            error=self.error,
        )

    def _update_fps(self):
        """Calculate FPS from recent frame timestamps."""
        now = time.monotonic()
        self._frame_times.append(now)
        self._frame_times = self._frame_times[-self._fps_window:]
        if len(self._frame_times) >= 2:
            elapsed = self._frame_times[-1] - self._frame_times[0]
            if elapsed > 0:
                self.fps = (len(self._frame_times) - 1) / elapsed

    async def connect(self):
        """Start camera connection."""
        self.status = CameraStatus.CONNECTING
        self._running = True

        if self.config.type == CameraType.ESP32CAM or self.config.type == CameraType.NETWORK:
            # Try stream mode first
            stream_url = f"{self.config.url}{self.config.stream_url}"
            try:
                async with httpx.AsyncClient(timeout=get_settings().camera_timeout) as client:
                    resp = await client.get(stream_url, timeout=get_settings().camera_timeout)
                    if resp.status_code == 200:
                        self.stream_mode = "mjpeg"
                        self.status = CameraStatus.LIVE
                        self.error = None
                        logger.info(f"[CAMERA] {self.config.name} connected via MJPEG stream")
                        self._task = asyncio.create_task(self._read_stream())
                        return
            except Exception:
                pass

            # Fallback to capture mode
            capture_url = f"{self.config.url}{self.config.capture_url}"
            try:
                async with httpx.AsyncClient(timeout=get_settings().camera_timeout) as client:
                    resp = await client.get(capture_url, timeout=get_settings().camera_timeout)
                    if resp.status_code == 200 and len(resp.content) > 0:
                        self.stream_mode = "capture"
                        self.status = CameraStatus.LIVE
                        self.error = None
                        logger.info(f"[CAMERA] {self.config.name} connected via capture endpoint")
                        self._task = asyncio.create_task(self._poll_capture())
                        return
            except Exception:
                pass

            self.status = CameraStatus.DISCONNECTED
            self.error = "Cannot reach camera. Check the URL and network connection."
            logger.warning(f"[CAMERA] {self.config.name} connection failed")

        elif self.config.type == CameraType.LAPTOP or self.config.type == CameraType.USB:
            # OpenCV local camera
            self._task = asyncio.create_task(self._read_local_camera())

        else:
            self.status = CameraStatus.READY
            self.error = None

    async def _read_stream(self):
        """Read MJPEG stream continuously."""
        stream_url = f"{self.config.url}{self.config.stream_url}"
        settings = get_settings()
        buffer = bytearray()

        while self._running:
            try:
                async with httpx.AsyncClient(timeout=None) as client:
                    async with client.stream("GET", stream_url) as resp:
                        self.status = CameraStatus.LIVE
                        async for chunk in resp.aiter_bytes(chunk_size=4096):
                            if not self._running:
                                break
                            buffer.extend(chunk)
                            # Find JPEG boundaries
                            while True:
                                start = buffer.find(b'\xff\xd8')
                                end = buffer.find(b'\xff\xd9', start + 2) if start >= 0 else -1
                                if start >= 0 and end >= 0:
                                    jpeg_data = bytes(buffer[start:end + 2])
                                    buffer = buffer[end + 2:]
                                    await self._process_jpeg(jpeg_data)
                                else:
                                    break
            except Exception as e:
                if self._running:
                    self.status = CameraStatus.DISCONNECTED
                    self.error = f"Stream connection lost"
                    logger.warning(f"[CAMERA] {self.config.name} stream error: {e}")
                    await asyncio.sleep(settings.camera_reconnect_interval)

    async def _poll_capture(self):
        """Poll capture endpoint periodically."""
        capture_url = f"{self.config.url}{self.config.capture_url}"
        settings = get_settings()

        while self._running:
            try:
                async with httpx.AsyncClient(timeout=settings.camera_timeout) as client:
                    resp = await client.get(capture_url)
                    if resp.status_code == 200 and len(resp.content) > 100:
                        self.status = CameraStatus.LIVE
                        self.error = None
                        await self._process_jpeg(resp.content)
                    else:
                        self.status = CameraStatus.ERROR
                        self.error = "Invalid frame data"
            except Exception as e:
                self.status = CameraStatus.DISCONNECTED
                self.error = "Cannot reach camera"
                logger.warning(f"[CAMERA] {self.config.name} capture error: {e}")
            await asyncio.sleep(0.1)  # ~10 FPS for polling mode

    async def _read_local_camera(self):
        """Read from local USB/laptop camera via OpenCV."""
        loop = asyncio.get_event_loop()

        def _open_camera():
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                return None
            return cap

        cap = await loop.run_in_executor(None, _open_camera)
        if cap is None:
            self.status = CameraStatus.ERROR
            self.error = "Cannot open local camera"
            logger.error(f"[CAMERA] {self.config.name} failed to open local camera")
            return

        self.status = CameraStatus.LIVE
        self.stream_mode = "local"
        self.error = None
        logger.info(f"[CAMERA] {self.config.name} local camera opened")

        try:
            while self._running:
                def _read():
                    return cap.read()
                ret, frame = await loop.run_in_executor(None, _read)
                if ret and frame is not None:
                    _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                    await self._process_frame(frame, jpeg.tobytes())
                else:
                    await asyncio.sleep(0.05)
        finally:
            cap.release()

    async def _process_jpeg(self, jpeg_data: bytes):
        """Decode JPEG bytes and store the frame."""
        try:
            np_arr = np.frombuffer(jpeg_data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if frame is not None:
                await self._process_frame(frame, jpeg_data)
        except Exception as e:
            logger.debug(f"Frame decode error: {e}")

    async def _process_frame(self, frame: np.ndarray, jpeg_data: bytes):
        """Store frame in buffer and update metadata."""
        settings = get_settings()
        h, w = frame.shape[:2]

        # Resize if needed
        if w > settings.max_frame_width or h > settings.max_frame_height:
            scale = min(settings.max_frame_width / w, settings.max_frame_height / h)
            new_w, new_h = int(w * scale), int(h * scale)
            frame = cv2.resize(frame, (new_w, new_h))
            _, jpeg_data_resized = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            jpeg_data = jpeg_data_resized.tobytes()
            h, w = new_h, new_w

        self.resolution = f"{w}x{h}"
        self._update_fps()

        buf = frame_buffers.get_buffer(self.id)
        buf.update(frame, jpeg_data)

    async def disconnect(self):
        """Stop camera connection."""
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self.status = CameraStatus.DISCONNECTED
        frame_buffers.remove_buffer(self.id)
        logger.info(f"[CAMERA] {self.config.name} disconnected")


class CameraService:
    """Manages all camera instances."""

    def __init__(self):
        self._cameras: dict[str, CameraInstance] = {}
        self._primary_id: Optional[str] = None

    async def add_camera(self, config: CameraConfig) -> CameraInfo:
        """Add and connect a new camera."""
        cam = CameraInstance(config)
        self._cameras[cam.id] = cam

        if config.is_primary or len(self._cameras) == 1:
            self._primary_id = cam.id
            cam.config.is_primary = True

        await cam.connect()

        # Update app state
        app_state.camera_count = len(self._cameras)
        live_cams = sum(1 for c in self._cameras.values() if c.status == CameraStatus.LIVE)
        app_state.camera_connected = live_cams > 0

        await app_state.broadcast_event("camera_added", {"camera": cam.to_info().model_dump()})
        return cam.to_info()

    async def remove_camera(self, camera_id: str) -> bool:
        """Remove a camera."""
        cam = self._cameras.get(camera_id)
        if not cam:
            return False

        await cam.disconnect()
        del self._cameras[camera_id]

        if self._primary_id == camera_id:
            self._primary_id = next(iter(self._cameras), None)
            if self._primary_id and self._primary_id in self._cameras:
                self._cameras[self._primary_id].config.is_primary = True

        app_state.camera_count = len(self._cameras)
        app_state.camera_connected = any(
            c.status == CameraStatus.LIVE for c in self._cameras.values()
        )

        await app_state.broadcast_event("camera_removed", {"camera_id": camera_id})
        return True

    def get_cameras(self) -> list[CameraInfo]:
        """Get all camera info."""
        return [cam.to_info() for cam in self._cameras.values()]

    def get_camera(self, camera_id: str) -> Optional[CameraInfo]:
        """Get specific camera info."""
        cam = self._cameras.get(camera_id)
        return cam.to_info() if cam else None

    def get_primary_camera_id(self) -> Optional[str]:
        """Get the primary camera ID."""
        return self._primary_id

    def set_primary(self, camera_id: str) -> bool:
        """Set a camera as primary."""
        if camera_id not in self._cameras:
            return False
        if self._primary_id and self._primary_id in self._cameras:
            self._cameras[self._primary_id].config.is_primary = False
        self._primary_id = camera_id
        self._cameras[camera_id].config.is_primary = True
        return True

    def get_latest_frame(self, camera_id: Optional[str] = None) -> Optional[FrameData]:
        """Get latest frame from specified or primary camera."""
        cid = camera_id or self._primary_id
        if not cid:
            return None
        return frame_buffers.get_latest(cid)

    def get_frame_jpeg(self, camera_id: Optional[str] = None) -> Optional[bytes]:
        """Get latest JPEG data."""
        cid = camera_id or self._primary_id
        if not cid:
            return None
        buf = frame_buffers.get_buffer(cid)
        return buf.get_latest_jpeg() if buf else None

    async def shutdown(self):
        """Disconnect all cameras."""
        for cam in list(self._cameras.values()):
            await cam.disconnect()
        self._cameras.clear()
        frame_buffers.clear_all()
        logger.info("[CAMERA] All cameras disconnected")


# Global singleton
camera_service = CameraService()
