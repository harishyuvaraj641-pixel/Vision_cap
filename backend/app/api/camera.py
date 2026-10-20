import io
import asyncio
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from app.services.camera_service import camera_service
from app.models.camera import CameraConfig, CameraInfo

router = APIRouter(prefix="/api/camera", tags=["Camera"])

@router.get("/status", response_model=list[CameraInfo])
async def get_cameras():
    return camera_service.get_cameras()

@router.get("/{camera_id}/status", response_model=CameraInfo)
async def get_camera_status(camera_id: str):
    camera = camera_service.get_camera(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera

@router.get("/frame")
async def get_latest_frame():
    frame = camera_service.get_frame_jpeg()
    if not frame:
        raise HTTPException(status_code=503, detail="No frame available")
    return StreamingResponse(io.BytesIO(frame), media_type="image/jpeg")

@router.get("/frame/{camera_id}")
async def get_camera_frame(camera_id: str):
    frame = camera_service.get_frame_jpeg(camera_id)
    if not frame:
        raise HTTPException(status_code=503, detail="No frame available")
    return StreamingResponse(io.BytesIO(frame), media_type="image/jpeg")

async def generate_mjpeg_stream(camera_id: str = None):
    boundary = "frame"
    while True:
        frame = camera_service.get_frame_jpeg(camera_id)
        if frame:
            yield (b"--" + boundary.encode() + b"\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
        else:
            await asyncio.sleep(0.05)
        await asyncio.sleep(1/30) # Limit frame rate approx 30fps

@router.get("/stream")
async def stream_primary_camera():
    return StreamingResponse(
        generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/stream/{camera_id}")
async def stream_camera(camera_id: str):
    return StreamingResponse(
        generate_mjpeg_stream(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.post("/add", response_model=CameraInfo)
async def add_camera(config: CameraConfig):
    return await camera_service.add_camera(config)

@router.delete("/{camera_id}")
async def remove_camera(camera_id: str):
    if await camera_service.remove_camera(camera_id):
        return {"status": "removed"}
    raise HTTPException(status_code=404, detail="Camera not found")

@router.put("/{camera_id}/primary")
async def set_primary_camera(camera_id: str):
    if camera_service.set_primary(camera_id):
        return {"status": "primary set"}
    raise HTTPException(status_code=404, detail="Camera not found")
