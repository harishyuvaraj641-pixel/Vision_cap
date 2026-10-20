"""
VISIONCAP — OpenAI-Compatible Vision Provider
Supports OpenAI, OpenRouter, NVIDIA, and other compatible APIs.
"""

import logging
from typing import Optional
import httpx

from .base import BaseAIProvider
from ..config import get_settings
from ..core.exceptions import AIProviderError, AIResponseError

logger = logging.getLogger("visioncap.ai.openai")

VISIONCAP_SYSTEM_PROMPT = """You are VISIONCAP, a real-time conversational vision assistant acting like a helpful companion walking beside a visually impaired person (similar to Gemini Live).
Speak naturally, warmly, and directly as a human friend.
Analyze the camera scene and answer the user's question in 1 to 2 concise spoken sentences.
Prioritize obstacles, people, and objects immediately in front of them with clear directions (left, right, straight ahead, close by).
Never use markdown formatting, bullet points, asterisks, or robotic intros like "In this image".
Deliver pure, immediate, spoken dialogue ready to be heard aloud."""

VISIONCAP_TAMIL_SYSTEM_PROMPT = """நீங்கள் விஷன்கேப் (VISIONCAP), பார்வை குறைபாடுள்ள ஒரு நண்பருக்கு வழிகாட்டும் நேரடி மனித உதவியாளர் (Gemini Live போன்றது).
இயற்கையான, கனிவான பேச்சுத் தமிழில் (spoken Tamil) 1 அல்லது 2 சுருக்கமான வரிகளில் மட்டும் நேரடியாக பதிலளிக்கவும்.
பயனரின் முன்னால் உள்ள தடங்கல்கள், பொருட்கள், மனிதர்கள் மற்றும் திசைகளை (நேரே, வலதுபுறம், இடதுபுறம், அருகில்) தெளிவாகவும் உடனடியாகவும் விவரிக்கவும்.
புல்லட் பாயிண்டுகள், ஸ்டார்கள் (*), அல்லது ரோபோ போன்ற அறிமுகங்கள் எதையும் பயன்படுத்த வேண்டாம்.
நேரடியாக கேட்கக்கூடிய எளிய, தெளிவான பேச்சுத் தமிழில் உரையாடவும்."""


class OpenAICompatibleProvider(BaseAIProvider):
    """OpenAI-compatible vision API provider."""

    def __init__(self):
        settings = get_settings()
        self.base_url = settings.ai_base_url.rstrip('/')
        self.api_key = settings.ai_api_key
        self.model = settings.ai_model

        if not self.api_key:
            logger.warning("[AI] No API key configured")

    async def analyze_image(self, image_base64: str, question: str,
                            conversation_history: list[dict] = None,
                            language: Optional[str] = "en") -> str:
        """Send image + question to vision model."""
        if not self.api_key:
            raise AIProviderError("AI API key not configured. Set AI_API_KEY in .env")

        # Automatic Tamil language and intent detection
        is_tamil = (language or "").lower().startswith("ta")
        effective_question = question

        try:
            from app.services.speech_service import speech_service
            detection = speech_service.detect_language_and_intent(question)
            if detection.get("is_tamil"):
                is_tamil = True
                intent_sum = detection.get("intent_summary")
                if intent_sum and intent_sum != "General vision query":
                    effective_question = f"{question}\n[User Context: {intent_sum}. Formulate visual explanation in clear spoken Tamil.]"
        except Exception:
            pass

        sys_prompt = VISIONCAP_TAMIL_SYSTEM_PROMPT if is_tamil else VISIONCAP_SYSTEM_PROMPT
        messages = [{"role": "system", "content": sys_prompt}]

        # Add conversation history for context
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages
                messages.append({
                    "role": msg["role"],
                    "content": msg["text"],
                })

        # Add current question with image
        messages.append({
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}",
                        "detail": "auto",
                    },
                },
                {"type": "text", "text": effective_question},
            ],
        })

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "max_tokens": 500,
                        "temperature": 0.7,
                    },
                )

                if response.status_code != 200:
                    error_text = response.text[:200]
                    raise AIResponseError(f"AI API error ({response.status_code}): {error_text}")

                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    raise AIResponseError("No response from AI model")

                return choices[0]["message"]["content"].strip()

        except httpx.TimeoutException:
            raise AIProviderError("AI request timed out. The vision model may be overloaded.")
        except httpx.ConnectError:
            raise AIProviderError("Cannot connect to AI provider. Check AI_BASE_URL in .env")
        except (AIProviderError, AIResponseError):
            raise
        except Exception as e:
            raise AIProviderError(f"AI request failed: {str(e)}")

    async def chat(self, message: str, conversation_history: list[dict] = None) -> str:
        """Chat without image."""
        if not self.api_key:
            raise AIProviderError("AI API key not configured")

        messages = [{"role": "system", "content": VISIONCAP_SYSTEM_PROMPT}]

        if conversation_history:
            for msg in conversation_history[-10:]:
                messages.append({"role": msg["role"], "content": msg["text"]})

        messages.append({"role": "user", "content": message})

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "max_tokens": 300,
                        "temperature": 0.7,
                    },
                )

                if response.status_code != 200:
                    raise AIResponseError(f"AI API error ({response.status_code})")

                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    raise AIResponseError("No response from AI model")

                return choices[0]["message"]["content"].strip()

        except (AIProviderError, AIResponseError):
            raise
        except Exception as e:
            raise AIProviderError(f"Chat request failed: {str(e)}")

    async def health_check(self) -> bool:
        """Check if provider is reachable."""
        if not self.api_key:
            return False
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                return response.status_code == 200
        except Exception:
            return False

    def update_config(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None):
        """Update provider configuration at runtime."""
        if api_key is not None:
            self.api_key = api_key
        if base_url is not None:
            self.base_url = base_url.rstrip('/')
        if model is not None:
            self.model = model
        logger.info(f"[AI] Provider configuration updated: base_url={self.base_url}, model={self.model}, key_set={bool(self.api_key)}")

    async def test_credentials(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None) -> tuple[bool, str]:
        """Test API connection with given or current credentials."""
        key = api_key if api_key is not None else self.api_key
        url = (base_url or self.base_url).rstrip('/')
        if not key:
            return False, "API key cannot be empty"
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.get(
                    f"{url}/models",
                    headers={"Authorization": f"Bearer {key}"},
                )
                if res.status_code == 200:
                    return True, "API connection verified successfully"
                elif res.status_code == 401:
                    return False, "Invalid API key (401 Unauthorized)"
                elif res.status_code == 403:
                    return False, "Access forbidden (403 Forbidden)"
                else:
                    return False, f"Provider returned status {res.status_code}: {res.text[:120]}"
        except httpx.ConnectError:
            return False, f"Cannot connect to {url}. Check URL or your internet connection."
        except httpx.TimeoutException:
            return False, f"Connection to {url} timed out after 12s."
        except Exception as e:
            return False, f"API test error: {str(e)}"

    def get_info(self) -> dict:
        return {
            "provider": "openai_compatible",
            "base_url": self.base_url,
            "model": self.model,
            "configured": bool(self.api_key),
        }
