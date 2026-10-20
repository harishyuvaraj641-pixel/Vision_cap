import logging
import os
from typing import Optional
from ..config import get_settings
from ..core.state import app_state
from ..providers.openai_compatible import OpenAICompatibleProvider
from ..providers.groq_provider import GroqProvider

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.settings = get_settings()
        self._init_provider(
            provider_type=getattr(self.settings, "ai_provider", "openai_compatible"),
            base_url=getattr(self.settings, "ai_base_url", "https://api.openai.com/v1"),
            model=getattr(self.settings, "ai_model", "gpt-4o"),
            api_key=getattr(self.settings, "ai_api_key", "")
        )

    def _is_groq(self, provider_type: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None) -> bool:
        pt = (provider_type or "").lower()
        url = (base_url or getattr(self.settings, "ai_base_url", "")).lower()
        mdl = (model or getattr(self.settings, "ai_model", "")).lower()
        return pt == "groq" or "groq.com" in url or "qwen" in mdl

    def _init_provider(self, provider_type: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None, api_key: Optional[str] = None):
        key = api_key if api_key is not None else getattr(self.settings, "ai_api_key", "")
        mdl = model or getattr(self.settings, "ai_model", "gpt-4o")
        url = base_url or getattr(self.settings, "ai_base_url", "https://api.openai.com/v1")

        if self._is_groq(provider_type, url, mdl):
            self.provider = GroqProvider(api_key=key, model=mdl)
            logger.info(f"[AI] Initialized native Groq provider for model: {mdl}")
        else:
            self.provider = OpenAICompatibleProvider()
            if hasattr(self.provider, "update_config"):
                self.provider.update_config(api_key=key, base_url=url, model=mdl)
            
    async def analyze_image(self, image_base64: str, question: str, conversation_history: list = None, language: Optional[str] = "en") -> str:
        logger.info(f"Analyzing image for question: {question} (language: {language})")
        import inspect
        sig = inspect.signature(self.provider.analyze_image)
        if "language" in sig.parameters or any(p.kind == inspect.Parameter.VAR_KEYWORD for p in sig.parameters.values()):
            return await self.provider.analyze_image(image_base64, question, conversation_history, language=language)
        return await self.provider.analyze_image(image_base64, question, conversation_history)

    async def chat(self, message: str, conversation_history: list = None) -> str:
        logger.info(f"Chatting with message: {message}")
        return await self.provider.chat(message, conversation_history)
        
    async def health_check(self) -> bool:
        logger.info("Performing AI service health check")
        if hasattr(self.provider, "health_check"):
            return await self.provider.health_check()
        return True

    def get_info(self) -> dict:
        info = self.provider.get_info() if hasattr(self.provider, "get_info") else {}
        key = getattr(self.provider, "api_key", "")
        masked_key = f"{key[:7]}...{key[-4:]}" if key and len(key) > 12 else ("****" if key else "")
        provider_name = "groq" if isinstance(self.provider, GroqProvider) else getattr(self.settings, "ai_provider", "openai_compatible")
        return {
            "provider": provider_name,
            "base_url": getattr(self.provider, "base_url", "https://api.openai.com/v1"),
            "model": getattr(self.provider, "model", "gpt-4o"),
            "has_key": bool(key),
            "masked_key": masked_key,
            "configured": bool(key)
        }

    async def update_config(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None) -> dict:
        """Update live AI credentials and persist to .env."""
        current_key = api_key if api_key is not None else getattr(self.provider, "api_key", "")
        current_url = base_url if base_url is not None else getattr(self.provider, "base_url", "")
        current_model = model if model is not None else getattr(self.provider, "model", "")

        should_be_groq = self._is_groq(base_url=current_url, model=current_model)
        is_currently_groq = isinstance(self.provider, GroqProvider)

        if should_be_groq and not is_currently_groq:
            self.provider = GroqProvider(api_key=current_key, model=current_model)
            logger.info(f"[AI] Switched to native Groq provider with model: {current_model}")
        elif not should_be_groq and is_currently_groq:
            self.provider = OpenAICompatibleProvider()
            self.provider.update_config(api_key=current_key, base_url=current_url, model=current_model)
            logger.info(f"[AI] Switched to OpenAI-compatible provider with model: {current_model}")
        else:
            if hasattr(self.provider, "update_config"):
                self.provider.update_config(api_key=api_key, base_url=base_url, model=model)

        # Check health with updated credentials
        is_healthy = await self.health_check()
        app_state.ai_available = is_healthy

        # Persist to .env file if key or url changed
        try:
            env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend", ".env")
            if not os.path.exists(env_path):
                env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
            
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                
                updated_lines = []
                for line in lines:
                    if api_key is not None and line.startswith("AI_API_KEY="):
                        updated_lines.append(f"AI_API_KEY={api_key}\n")
                    elif base_url is not None and line.startswith("AI_BASE_URL="):
                        updated_lines.append(f"AI_BASE_URL={base_url}\n")
                    elif model is not None and line.startswith("AI_MODEL="):
                        updated_lines.append(f"AI_MODEL={model}\n")
                    else:
                        updated_lines.append(line)
                
                with open(env_path, "w", encoding="utf-8") as f:
                    f.writelines(updated_lines)
                logger.info("[AI] Successfully persisted AI credentials to .env")
        except Exception as e:
            logger.warning(f"[AI] Could not persist to .env: {e}")

        return {
            "success": True,
            "health": is_healthy,
            "info": self.get_info()
        }

    async def test_credentials(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None) -> dict:
        target_url = base_url or getattr(self.provider, "base_url", "")
        target_model = model or getattr(self.provider, "model", "")
        target_key = api_key if api_key is not None else getattr(self.provider, "api_key", "")

        if self._is_groq(base_url=target_url, model=target_model):
            test_provider = GroqProvider(api_key=target_key, model=target_model)
            ok, msg = await test_provider.test_credentials(api_key=target_key, base_url=target_url, model=target_model)
            return {"valid": ok, "message": msg}

        if hasattr(self.provider, "test_credentials"):
            ok, msg = await self.provider.test_credentials(api_key=api_key, base_url=base_url, model=model)
            return {"valid": ok, "message": msg}
        return {"valid": True, "message": "Provider does not support validation probing"}

ai_service = AIService()
