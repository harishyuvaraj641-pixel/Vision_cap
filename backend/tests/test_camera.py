"""
VISIONCAP Backend Tests — Camera Service & Frame Buffer
Tests camera connection, frame retrieval, invalid responses, and reconnection logic.
"""

import asyncio
import numpy as np
import cv2
from app.models.camera import CameraConfig, CameraType, CameraStatus
from app.services.frame_buffer import FrameBuffer, MultiFrameBuffer
from app.services.camera_service import CameraService, CameraInstance


def test_frame_buffer_storage_and_retrieval():
    """Test storing and retrieving the newest frame in FrameBuffer."""
    buffer = FrameBuffer("test-cam")
    assert not buffer.has_frame
    assert buffer.get_latest() is None

    # Create dummy frame
    dummy_img = np.zeros((480, 640, 3), dtype=np.uint8)
    _, dummy_jpeg = cv2.imencode(".jpg", dummy_img)
    jpeg_bytes = dummy_jpeg.tobytes()

    # Update frame
    stored = buffer.update(dummy_img, jpeg_bytes)
    assert buffer.has_frame
    assert buffer.frame_count == 1
    assert stored.width == 640
    assert stored.height == 480
    assert stored.jpeg_data == jpeg_bytes

    # Second frame replaces the first
    buffer.update(dummy_img, jpeg_bytes)
    assert buffer.frame_count == 2
    assert buffer.get_latest_jpeg() == jpeg_bytes

    # Clear buffer
    buffer.clear()
    assert not buffer.has_frame
    assert buffer.get_latest() is None


def test_multi_frame_buffer():
    """Test managing multiple independent camera buffers."""
    mfb = MultiFrameBuffer()
    buf1 = mfb.get_buffer("cam-1")
    buf2 = mfb.get_buffer("cam-2")

    assert buf1 is not buf2

    dummy_img = np.zeros((240, 320, 3), dtype=np.uint8)
    _, dummy_jpeg = cv2.imencode(".jpg", dummy_img)
    buf1.update(dummy_img, dummy_jpeg.tobytes())

    assert mfb.get_latest("cam-1") is not None
    assert mfb.get_latest("cam-2") is None

    mfb.remove_buffer("cam-1")
    assert mfb.get_latest("cam-1") is None


async def test_camera_service_lifecycle():
    """Test adding, primary selection, and removing cameras."""
    svc = CameraService()

    config = CameraConfig(
        id="cam-test-1",
        name="CAM 01 Test",
        label="Test Unit",
        type=CameraType.CUSTOM,
        url="http://127.0.0.1:9999",
        is_primary=True,
    )

    info = await svc.add_camera(config)
    assert info.id == "cam-test-1"
    assert info.name == "CAM 01 Test"
    assert svc.get_primary_camera_id() == "cam-test-1"

    cameras = svc.get_cameras()
    assert len(cameras) == 1

    # Remove camera
    removed = await svc.remove_camera("cam-test-1")
    assert removed is True
    assert len(svc.get_cameras()) == 0


async def test_invalid_camera_response_handling():
    """Test camera instance behavior when target endpoint is unreachable."""
    config = CameraConfig(
        id="cam-invalid",
        name="CAM Invalid",
        type=CameraType.ESP32CAM,
        url="http://192.0.2.1:8888",  # Non-routable test IP
    )
    cam = CameraInstance(config)
    await cam.connect()

    # Should gracefully transition to DISCONNECTED with explanatory error, without crashing
    assert cam.status == CameraStatus.DISCONNECTED
    assert cam.error is not None
    assert "Cannot reach camera" in cam.error

    await cam.disconnect()
    assert cam.status == CameraStatus.DISCONNECTED
