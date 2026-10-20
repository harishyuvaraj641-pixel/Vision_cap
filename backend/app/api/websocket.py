from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.event_service import event_service
from app.core.state import app_state
import json

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await event_service.connect(websocket)
    try:
        # Send initial status
        await websocket.send_text(json.dumps({
            "type": "status",
            "data": app_state.get_system_status()
        }))
        
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        await event_service.disconnect(websocket)
