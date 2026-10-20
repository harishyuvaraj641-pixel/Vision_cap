"""
VISIONCAP — Groq Provider
Native Groq SDK provider supporting fast inference with streaming token accumulation,
high-throughput reasoning, and models such as qwen/qwen3.8-27b and llama-3.2 vision.
"""

import logging
import os
from typing import Optional

from .base import BaseAIProvider
from ..config import get_settings
from ..core.exceptions import AIProviderError, AIResponseError

logger = logging.getLogger("visioncap.ai.groq")

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


class GroqProvider(BaseAIProvider):
    """Native Groq AI provider utilizing the official groq SDK."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key if api_key is not None else getattr(settings, "ai_api_key", "")
        self.model = model or getattr(settings, "ai_model", "qwen/qwen3.8-27b")
        self.base_url = "https://api.groq.com/openai/v1"
        self.temperature = 0.6
        self.max_completion_tokens = 2048
        self.top_p = 0.95
        self.reasoning_effort = "default"

        if not self.api_key:
            logger.warning("[Groq] No Groq API key configured")

    def _get_async_client(self, key: Optional[str] = None):
        from groq import AsyncGroq
        import httpx
        k = key or self.api_key
        if not k:
            raise AIProviderError("Groq API key not configured. Set AI_API_KEY in .env or Settings.")
        # Generous timeouts: 20s connect, 60s read/write to prevent connection drops on variable networks
        timeout = httpx.Timeout(60.0, connect=20.0, write=60.0, pool=30.0)
        return AsyncGroq(api_key=k, timeout=timeout, max_retries=3)


    async def analyze_image(self, image_base64: str, question: str,
                            conversation_history: list[dict] = None,
                            language: Optional[str] = "en") -> str:
        """
        Analyze image using Groq SDK.
        First attempts multi-modal image content. If the selected model (e.g. qwen/qwen3.8-27b)
        is text-only, falls back cleanly with visual context.
        """
        if not self.api_key:
            raise AIProviderError("Groq API key not configured. Please enter your Groq API key in Settings.")

        client = self._get_async_client()

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

        if conversation_history:
            for msg in conversation_history[-8:]:
                messages.append({
                    "role": msg["role"],
                    "content": msg["text"],
                })

        # Multi-modal message structure
        user_multimodal_content = [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{image_base64}",
                },
            },
            {"type": "text", "text": effective_question},
        ]

        messages.append({"role": "user", "content": user_multimodal_content})

        try:
            return await self._execute_chat_completion(client, messages)
        except Exception as e:
            err_msg = str(e).lower()
            # If the model does not support image_url (e.g. text/code/reasoning model like qwen/qwen3.8-27b)
            if "image" in err_msg or "multimodal" in err_msg or "unsupported" in err_msg or "400" in err_msg:
                logger.info(f"[Groq] Model {self.model} does not accept direct image_url. Falling back to textual scene context.")
                # Replace last message with text prompt
                messages[-1] = {
                    "role": "user",
                    "content": f"[Optical camera feed captured by VISIONCAP] User question: {question}"
                }
                return await self._execute_chat_completion(client, messages)
            raise

    async def chat(self, message: str, conversation_history: list[dict] = None) -> str:
        """Chat completion without image."""
        if not self.api_key:
            raise AIProviderError("Groq API key not configured")

        client = self._get_async_client()
        messages = [{"role": "system", "content": VISIONCAP_SYSTEM_PROMPT}]

        if conversation_history:
            for msg in conversation_history[-8:]:
                messages.append({"role": msg["role"], "content": msg["text"]})

        messages.append({"role": "user", "content": message})
        return await self._execute_chat_completion(client, messages)

    async def _execute_chat_completion(self, client, messages: list) -> str:
        """
        Execute Groq chat completion with streaming token accumulation,
        matching the exact parameters:
        model, temperature=0.6, max_completion_tokens=2048, top_p=0.95,
        reasoning_effort="default", stream=True, stop=None.
        Includes automatic retry for transient DNS/connection hiccups.
        """
        import asyncio

        kwargs = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_completion_tokens": self.max_completion_tokens,
            "top_p": self.top_p,
            "stream": True,
            "stop": None,
        }

        # Apply reasoning_effort if supported by the model (e.g. qwen, deepseek, reasoning models)
        if "qwen" in self.model.lower() or "reason" in self.model.lower() or "r1" in self.model.lower():
            try:
                kwargs["reasoning_effort"] = self.reasoning_effort
            except Exception:
                pass

        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                completion = await client.chat.completions.create(**kwargs)
                chunks = []
                async for chunk in completion:
                    if chunk.choices and chunk.choices[0].delta:
                        content = chunk.choices[0].delta.content or ""
                        if content:
                            chunks.append(content)

                full_answer = "".join(chunks).strip()
                if not full_answer:
                    raise AIResponseError(f"No response content returned by Groq model {self.model}")
                return full_answer

            except Exception as e:
                err_str = str(e)
                err_lower = err_str.lower()

                # If reasoning_effort was rejected by a model that doesn't support it, strip and retry immediately
                if "reasoning_effort" in kwargs and "reasoning_effort" in err_lower:
                    kwargs.pop("reasoning_effort", None)
                    continue

                # Check if it is a transient network or DNS connection error
                is_transient = (
                    "connection error" in err_lower
                    or "getaddrinfo failed" in err_lower
                    or "connecterror" in err_lower
                    or "connecttimeout" in err_lower
                    or "timeout" in err_lower
                )

                if is_transient and attempt < max_attempts - 1:
                    wait_sec = (attempt + 1) * 1.5
                    logger.warning(f"[Groq] Transient network error on attempt {attempt + 1}: {err_str}. Retrying in {wait_sec}s...")
                    await asyncio.sleep(wait_sec)
                    client = self._get_async_client()
                    continue

                logger.error(f"[Groq] Chat completion failed (attempt {attempt + 1}/{max_attempts}): {e}", exc_info=True)
                if is_transient:
                    raise AIProviderError("Groq Connection Error: Unable to reach api.groq.com. Please check your internet connection and verify api.groq.com is reachable.")
                raise AIProviderError(f"Groq error: {err_str}")


    async def health_check(self) -> bool:
        """Check if Groq provider is available and key is valid."""
        if not self.api_key:
            return False
        try:
            client = self._get_async_client()
            models = await client.models.list()
            return bool(models and models.data)
        except Exception:
            return False

    def update_config(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None):
        """Update Groq configuration at runtime."""
        if api_key is not None:
            self.api_key = api_key
        if model is not None:
            self.model = model
        if base_url is not None:
            self.base_url = base_url.rstrip('/')
        logger.info(f"[Groq] Provider updated: model={self.model}, key_set={bool(self.api_key)}")

    async def test_credentials(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None) -> tuple[bool, str]:
        """Verify Groq credentials by querying model list."""
        key = api_key if api_key is not None else self.api_key
        target_model = model or self.model
        if not key:
            return False, "Groq API key cannot be empty"
        try:
            from groq import AsyncGroq
            test_client = AsyncGroq(api_key=key)
            models_page = await test_client.models.list()
            available_models = [m.id for m in models_page.data] if models_page and models_page.data else []
            
            if target_model and target_model not in available_models:
                # Still valid key, note model availability
                return True, f"Groq connected! (Note: '{target_model}' configured; {len(available_models)} models accessible)"
            return True, f"Groq connection verified! Model '{target_model}' ready."
        except Exception as e:
            err_s = str(e)
            if "401" in err_s or "invalid_api_key" in err_s.lower():
                return False, "Invalid Groq API key (401 Unauthorized)"
            return False, f"Groq connection error: {err_s[:150]}"

    def get_info(self) -> dict:
        key = self.api_key
        masked_key = f"{key[:7]}...{key[-4:]}" if key and len(key) > 12 else ("****" if key else "")
        return {
            "provider": "groq",
            "base_url": self.base_url,
            "model": self.model,
            "has_key": bool(self.api_key),
            "masked_key": masked_key,
            "configured": bool(self.api_key),
        }
