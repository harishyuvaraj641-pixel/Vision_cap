from fastapi import APIRouter
from app.services.conversation_service import conversation_service

router = APIRouter(prefix="/api/conversation", tags=["Conversation"])

@router.get("/history")
async def get_history():
    return conversation_service.get_history()

@router.delete("/history")
async def clear_history():
    conversation_service.clear_history()
    return {"status": "cleared"}
