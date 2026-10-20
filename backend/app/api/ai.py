from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.vision_service import vision_service
from app.services.ai_service import ai_service
from app.models.ai import VisionRequest, VisionResponse

router = APIRouter(prefix="/api", tags=["AI"])


class AIConfigRequest(BaseModel):
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None


class AITestRequest(BaseModel):
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None


@router.post("/vision/ask", response_model=VisionResponse)
@router.post("/ai/ask", response_model=VisionResponse)
async def ask_vision(request: VisionRequest):
    try:
        response = await vision_service.ask(
            question=request.question,
            camera_id=request.camera_id,
            image_base64=request.image_base64,
            language=request.language
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI Service Error: {str(e)}")


@router.get("/ai/status")
async def get_ai_status():
    health = await ai_service.health_check()
    info = ai_service.get_info()
    return {"status": "ok" if health else "error", "health": health, "info": info}


@router.get("/ai/config")
async def get_ai_config():
    """Retrieve current AI provider configuration and masked key status."""
    return ai_service.get_info()


@router.post("/ai/config")
async def set_ai_config(config: AIConfigRequest):
    """Update and persist AI credentials."""
    try:
        result = await ai_service.update_config(
            api_key=config.api_key.strip() if config.api_key is not None else None,
            base_url=config.base_url.strip() if config.base_url is not None else None,
            model=config.model.strip() if config.model is not None else None,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update AI config: {str(e)}")


@router.post("/ai/test")
async def test_ai_credentials(request: AITestRequest):
    """Test API connection with provided credentials without saving."""
    try:
        result = await ai_service.test_credentials(
            api_key=request.api_key.strip() if request.api_key is not None else None,
            base_url=request.base_url.strip() if request.base_url is not None else None,
            model=request.model.strip() if request.model is not None else None,
        )
        return result
    except Exception as e:
        return {"valid": False, "message": f"Connection test failed: {str(e)}"}
