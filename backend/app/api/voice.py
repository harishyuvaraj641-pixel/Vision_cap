from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.services.speech_service import speech_service
from app.services.tts_service import tts_service
from app.services.event_service import event_service
from app.core.state import app_state

router = APIRouter(tags=["Voice"])


class DetectLanguageRequest(BaseModel):
    text: str


@router.post("/api/voice/start")
async def start_recording():
    try:
        await speech_service.start_recording()
        app_state.voice_state = "listening"
        return {"status": "listening"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/voice/stop")
async def stop_recording():
    try:
        app_state.voice_state = "transcribing"
        text = await speech_service.stop_recording()
        
        await event_service.broadcast({
            "type": "transcription",
            "data": {"text": text}
        })
        
        app_state.voice_state = "idle"
        return {"text": text}
    except Exception as e:
        app_state.voice_state = "idle"
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/voice/transcribe")
async def transcribe_audio_file(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None)
):
    """
    Transcribe uploaded audio with automatic Tamil / English language detection.
    Powered by Groq Whisper with fallback to local speech engine.
    """
    try:
        app_state.voice_state = "transcribing"
        file_bytes = await file.read()
        filename = file.filename or "audio.webm"
        
        result = await speech_service.transcribe_audio(
            file_bytes=file_bytes,
            filename=filename,
            language_hint=language
        )

        await event_service.broadcast({
            "type": "transcription",
            "data": result
        })
        
        app_state.voice_state = "idle"
        return result
    except Exception as e:
        app_state.voice_state = "idle"
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")


@router.post("/api/voice/detect-language")
async def detect_text_language(request: DetectLanguageRequest):
    """
    Classify input text/query as Tamil, Tanglish, or English and extract intent.
    """
    try:
        result = speech_service.detect_language_and_intent(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Language detection error: {str(e)}")


@router.get("/api/voice/status")
async def get_status():
    return {
        "available": speech_service.is_available(),
        "state": app_state.voice_state
    }


@router.post("/api/tts/stop")
async def stop_tts():
    try:
        await tts_service.stop()
        return {"status": "stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
