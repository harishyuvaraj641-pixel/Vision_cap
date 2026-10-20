import logging
from datetime import datetime
from ..config import get_settings

logger = logging.getLogger(__name__)

class ConversationService:
    def __init__(self):
        self.settings = get_settings()
        self.messages = []
        self.max_history = getattr(self.settings, "max_conversation_history", 50)
        
    def add_message(self, role: str, text: str, frame_id: str = None, camera_id: str = None):
        msg = {
            "role": role,
            "text": text,
            "timestamp": datetime.utcnow().isoformat(),
            "frame_id": frame_id,
            "camera_id": camera_id
        }
        self.messages.append(msg)
        if len(self.messages) > self.max_history:
            self.messages = self.messages[-self.max_history:]
            
    def get_history(self) -> list[dict]:
        return self.messages
        
    def get_context_messages(self) -> list[dict]:
        return [{"role": m["role"], "text": m["text"]} for m in self.messages]
        
    def clear(self):
        self.messages = []

    def clear_history(self):
        self.clear()

conversation_service = ConversationService()
