import logging
import asyncio
import json
from ..core.state import app_state

logger = logging.getLogger(__name__)

class EventService:
    def __init__(self):
        self.active_connections = set()
        # Register the broadcast method as a listener on app_state
        app_state.add_listener(self.broadcast)

    async def connect(self, websocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        # Assuming app_state has websocket_connected property or method
        if hasattr(app_state, "websocket_connected"):
            app_state.websocket_connected = True
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    async def disconnect(self, websocket):
        self.active_connections.discard(websocket)
        if len(self.active_connections) == 0:
            if hasattr(app_state, "websocket_connected"):
                app_state.websocket_connected = False
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, event: dict):
        if not self.active_connections:
            return
            
        dead_connections = set()
        for connection in self.active_connections:
            try:
                if isinstance(event, dict):
                    await connection.send_json(event)
                else:
                    await connection.send_text(json.dumps(event))
            except Exception as e:
                logger.warning(f"Failed to send to websocket: {e}")
                dead_connections.add(connection)
                
        for dead in dead_connections:
            await self.disconnect(dead)

    async def send_to(self, websocket, event: dict):
        try:
            if isinstance(event, dict):
                await websocket.send_json(event)
            else:
                await websocket.send_text(json.dumps(event))
        except Exception as e:
            logger.warning(f"Failed to send to specific websocket: {e}")
            await self.disconnect(websocket)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)

event_service = EventService()
