"""
VISIONCAP — Vision Pipeline Service
Orchestrates optical frame retrieval, visual AI processing, and conversation memory.
"""

import logging
import base64
import time
from datetime import datetime, timezone
from typing import Optional, Union

from .camera_service import camera_service
from .ai_service import ai_service
from .conversation_service import conversation_service
from ..core.state import app_state, SystemState
from .frame_buffer import FrameData

logger = logging.getLogger("visioncap.vision")


class VisionService:
    def __init__(self):
        pass

    async def ask(
        self,
        question: str,
        camera_id: Optional[str] = None,
        image_base64: Optional[str] = None,
        language: Optional[str] = "en"
    ) -> dict:
        start_time = time.time()
        try:
            # 1. State: FRAME_CAPTURED
            c_id = camera_id or ("webcam" if image_base64 else "primary")
            await app_state.set_state(SystemState.FRAME_CAPTURED, {"camera_id": c_id})
            await app_state.broadcast_event("frame_captured", {"camera_id": c_id})

            if image_base64:
                # Strip data URI prefix if present (e.g., data:image/jpeg;base64,...)
                if "," in image_base64:
                    image_base64 = image_base64.split(",", 1)[1]
                f_id = int(time.time() * 1000 % 1000000)
                f_timestamp = datetime.now(timezone.utc).isoformat()

                # Optimize image payload to prevent connection timeouts/drops
                try:
                    raw_bytes = base64.b64decode(image_base64)
                    if len(raw_bytes) > 200 * 1024:
                        import numpy as np
                        import cv2
                        from ..utils.image import resize_frame
                        np_arr = np.frombuffer(raw_bytes, np.uint8)
                        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                        if frame is not None:
                            frame = resize_frame(frame, 1280, 720)
                            _, compressed = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                            image_base64 = base64.b64encode(compressed).decode('utf-8')
                except Exception as comp_err:
                    logger.debug(f"Frame optimization skipped: {comp_err}")

            else:
                frame_data: Optional[FrameData] = camera_service.get_latest_frame(camera_id)

                if not frame_data or not frame_data.jpeg_data:
                    await app_state.set_state(SystemState.IDLE)
                    no_frame_msg = "கேமரா காட்சி கிடைக்கவில்லை. கேமரா இணைக்கப்பட்டுள்ளதா என சரிபார்க்கவும்." if (language or "").lower().startswith("ta") else "No camera frame is currently available. Check that your camera or webcam is connected and online."
                    return {
                        "success": False,
                        "question": question,
                        "answer": no_frame_msg,
                        "error": "No camera frame available",
                    }

                frame_jpeg = frame_data.jpeg_data
                f_id = frame_data.frame_id
                c_id = frame_data.camera_id
                f_timestamp = frame_data.timestamp
                image_base64 = base64.b64encode(frame_jpeg).decode("utf-8")

            # 4. State: ANALYZING
            await app_state.set_state(SystemState.ANALYZING, {"frame_id": f_id})
            await app_state.broadcast_event("analysis_started", {"frame_id": f_id})
            await app_state.broadcast_event("analysis_progress", {"stage": "preparing_image", "message": "Preparing image for analysis"})

            # 5. Conversation context
            history = conversation_service.get_context_messages()

            # 6. State: THINKING
            await app_state.set_state(SystemState.THINKING)
            await app_state.broadcast_event("analysis_progress", {"stage": "sending_to_ai", "message": "Transmitting to Vision AI"})

            # 7. AI Analysis
            answer = await ai_service.analyze_image(image_base64, question, history, language=language)

            await app_state.broadcast_event("analysis_progress", {"stage": "generating_response", "message": "Synthesizing response"})

            # 8. Record in conversation history
            conversation_service.add_message("user", question, f_id, c_id)
            conversation_service.add_message("assistant", answer, f_id, c_id)

            # 9. State: RESPONSE_READY
            await app_state.set_state(SystemState.RESPONSE_READY)
            await app_state.broadcast_event("ai_response", {
                "question": question,
                "answer": answer,
                "frame_id": f_id,
                "camera_id": c_id,
            })

            latency_ms = int((time.time() - start_time) * 1000)

            # Return to IDLE
            await app_state.set_state(SystemState.IDLE)

            return {
                "success": True,
                "question": question,
                "answer": answer,
                "frame_id": f_id,
                "camera_id": c_id,
                "frame_timestamp": f_timestamp,
                "latency_ms": latency_ms,
            }

        except Exception as e:
            logger.error(f"Error in vision ask pipeline: {str(e)}", exc_info=True)
            await app_state.set_state(SystemState.ERROR, {"error": str(e)})
            await app_state.broadcast_event("error", {"message": f"Vision analysis failed: {str(e)}"})

            err_str = str(e)
            if "not configured" in err_str.lower() or "401" in err_str or "unauthorized" in err_str.lower() or "api key" in err_str.lower():
                user_msg = (
                    "VISIONCAP received your query, but an active AI API key is not configured yet. "
                    "Please open Settings in the top bar and enter your OpenAI, OpenRouter, or Groq API key."
                )
            else:
                user_msg = f"VISIONCAP could not reach the vision AI: {err_str[:120]}"

            return {
                "success": False,
                "question": question,
                "answer": user_msg,
                "error": str(e),
            }


vision_service = VisionService()
