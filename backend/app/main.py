import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    camera_router,
    voice_router,
    ai_router,
    system_router,
    websocket_router,
    conversation_router
)
from app.core.state import app_state, SystemState
from app.config import get_settings
from app.services.event_service import event_service
from app.services.ai_service import ai_service
from app.services.speech_service import speech_service
from app.services.camera_service import camera_service
from app.models.system import HealthCheck

logger = logging.getLogger(__name__)

def setup_logging(debug: bool):
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(level=level, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    setup_logging(settings.debug)
    logger.info("VISIONCAP Backend Starting...")
    
    app_state.add_listener(event_service.broadcast)
    
    # Check AI health
    ai_health = await ai_service.health_check()
    app_state.ai_available = ai_health
    
    # Check speech service
    app_state.microphone_available = speech_service.is_available()
    
    # TTS always available
    app_state.tts_available = True
    
    app_state.system_state = SystemState.IDLE
    logger.info("VISIONCAP Backend Ready")
    
    yield
    
    await camera_service.shutdown()
    logger.info("VISIONCAP Backend Stopped")

settings = get_settings()

app = FastAPI(
    title="VISIONCAP",
    description="Voice-first AI vision assistant",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(camera_router)
app.include_router(voice_router)
app.include_router(ai_router)
app.include_router(system_router)
app.include_router(websocket_router)
app.include_router(conversation_router)

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "VISIONCAP Backend API",
        "version": "1.0.0",
        "health": "/health",
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthCheck)
async def health():
    return HealthCheck(
        status="ok",
        camera=app_state.camera_connected,
        ai=app_state.ai_available,
        version="1.0.0"
    )
