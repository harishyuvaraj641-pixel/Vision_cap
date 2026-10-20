import logging
import threading
import asyncio
import re
import os
from typing import Optional, Dict, Any
from ..config import get_settings

logger = logging.getLogger(__name__)

try:
    import sounddevice
    import numpy as np
    import scipy.io.wavfile
    HAS_SOUNDDEVICE = True
except ImportError:
    HAS_SOUNDDEVICE = False

try:
    from faster_whisper import WhisperModel
    HAS_WHISPER = True
except ImportError:
    HAS_WHISPER = False

# Regex for Tamil Unicode characters
TAMIL_UNICODE_REGEX = re.compile(r'[\u0B80-\u0BFF]')

# Tanglish vocabulary and phrases for colloquial Tamil speech recognition
TANGLISH_KEYWORDS = {
    # Question markers
    "enna", "edhu", "ethu", "ithu", "idhu", "enga", "enge", "epdi", "eppadi", "yaar", "yaaradhu",
    "yen", "yaen", "ethana", "evvalavu", "evalo",
    # Spatial & orientation (critical for vision aid)
    "munnadi", "munnal", "pinnadi", "pinnal", "valadhu", "idathu", "valadhu pakkam", "idathu pakkam",
    "kitta", "arugil", "thooram", "tholaivil", "mela", "keezha", "adiyil", "naduvula", "ulle", "veliye",
    # Perceptual & action
    "irukku", "irukka", "paaru", "kaattu", "solunga", "sollinga", "pesunga", "theriyudha", "theriyala",
    "puriyudha", "purila", "theriyum", "kannula", "kannadi", "pathu",
    # Objects & navigation
    "kadavu", "door", "table", "mesa", "chair", "naarkali", "padikattu", "steps", "thanni", "saapadu",
    "aalu", "manidhan", "porul", "vazhi", "vali", "road", "suvar", "light", "thadangal", "aabathu",
    "ezhuthu", "vannam", "color", "velicham", "iruttu",
    # Social / confirmations
    "vanakkam", "nandri", "sari", "illa", "aama"
}

TANGLISH_TRANSLATIONS = {
    "munnadi enna irukku": "என் முன்னால் என்ன இருக்கிறது? (What is in front of me?)",
    "enna irukku": "இங்கே என்ன இருக்கிறது? (What is here?)",
    "enga irukku": "எங்கே இருக்கிறது? (Where is it?)",
    "yaaradhu": "யார் அங்கே இருக்கிறார்கள்? (Who is there?)",
    "valadhu pakkam": "வலது பக்கத்தில் (On the right side)",
    "idathu pakkam": "இடது பக்கத்தில் (On the left side)",
    "kitta": "அருகில் (Near)",
    "thooram": "தொலைவில் (Far)",
    "padikattu irukka": "படிக்கட்டுகள் உள்ளதா? (Are there stairs / steps?)",
    "vazhi irukka": "வழி உள்ளதா? (Is the path clear?)",
    "enna theriyudhu": "என்ன தெரிகிறது? (What is visible?)",
    "thadangal irukka": "ஏதாவது தடங்கல் உள்ளதா? (Are there any obstacles?)",
    "edhavadhu thadangal irukka": "ஏதாவது தடங்கல் உள்ளதா? (Are there any obstacles?)",
    "ezhuthu irukka": "எழுத்துக்கள் உள்ளதா? (Is there any text?)",
    "padithu kaattu": "படித்துக் காட்டுங்கள் (Read it aloud)",
    "vanna enna": "என்ன நிறம்? (What color is it?)",
    "color enna": "என்ன நிறம்? (What color is it?)",
    "velicham irukka": "வெளிச்சம் உள்ளதா? (Is there light?)",
    "kadavu enga": "கதவு எங்கே இருக்கிறது? (Where is the door?)"
}


class SpeechService:
    def __init__(self):
        self.settings = get_settings()
        self.model = None
        self.is_recording = False
        self.sample_rate = 16000
        self._record_thread = None
        self._audio_buffer = []
        self._http_client = None

    async def _get_http_client(self):
        import httpx
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(timeout=15.0)
        return self._http_client

    def _load_model(self):
        if not HAS_WHISPER:
            logger.error("faster-whisper is not installed")
            return
        if self.model is None:
            model_size = getattr(self.settings, "whisper_model", "tiny")
            logger.info(f"Loading faster-whisper model: {model_size}")
            self.model = WhisperModel(model_size, device="cpu", compute_type="int8")

    def detect_language_and_intent(self, text: str) -> Dict[str, Any]:
        """
        Analyze text to detect if the user spoke Tamil (Tamil Unicode or Tanglish) or English.
        Normalizes Tanglish queries to assist the Vision AI in effortlessly understanding intent.
        """
        if not text:
            return {
                "language": "en",
                "is_tamil": False,
                "detected_language": "en",
                "normalized_query": "",
                "intent_summary": "Empty query"
            }

        # 1. Direct Tamil Unicode check
        has_tamil_unicode = bool(TAMIL_UNICODE_REGEX.search(text))
        
        # 2. Tanglish keyword matching
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        tanglish_matches = [w for w in words if w in TANGLISH_KEYWORDS]
        is_tanglish = len(tanglish_matches) >= 2 or (len(tanglish_matches) >= 1 and len(words) <= 3)

        is_tamil = has_tamil_unicode or is_tanglish
        detected_lang = "ta" if is_tamil else "en"

        # 3. Intent enrichment for Vision AI
        cleaned_text = text.strip()
        normalized_query = cleaned_text
        intent_summary = "General vision query"

        if is_tamil:
            if has_tamil_unicode:
                intent_summary = "Tamil visual assistance query for visually impaired user"
                normalized_query = cleaned_text
            else:
                # Tanglish query normalization
                matched_phrases = []
                lower_text = cleaned_text.lower()
                for phrase, trans in TANGLISH_TRANSLATIONS.items():
                    if phrase in lower_text:
                        matched_phrases.append(trans)
                
                if matched_phrases:
                    intent_summary = f"Tanglish spoken query meaning: {'; '.join(matched_phrases)}"
                else:
                    intent_summary = f"Spoken Tanglish with keywords ({', '.join(tanglish_matches)})"

        return {
            "language": detected_lang,
            "is_tamil": is_tamil,
            "detected_language": detected_lang,
            "normalized_query": normalized_query,
            "intent_summary": intent_summary
        }

    async def transcribe_with_deepgram(self, file_bytes: bytes, filename: str = "audio.webm",
                                       language_hint: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Transcribe audio using Deepgram Nova-3 API with specialized Tamil support.
        """
        api_key = getattr(self.settings, "deepgram_api_key", "")
        if not api_key:
            return None

        try:
            import httpx
            # Default to Tamil unless explicitly set to English
            is_english = bool(language_hint and language_hint.lower().startswith("en"))
            is_tamil = not is_english

            # Deepgram Nova-3 endpoint query parameters
            if is_tamil:
                query_params = "model=nova-3&language=ta&smart_format=true&punctuate=true"
            else:
                query_params = "model=nova-3&language=en&smart_format=true&punctuate=true"

            url = f"https://api.deepgram.com/v1/listen?{query_params}"

            # Determine content type based on extension
            content_type = "audio/webm"
            lower_fn = filename.lower()
            if lower_fn.endswith(".wav"):
                content_type = "audio/wav"
            elif lower_fn.endswith(".mp4") or lower_fn.endswith(".m4a"):
                content_type = "audio/mp4"
            elif lower_fn.endswith(".ogg") or lower_fn.endswith(".opus"):
                content_type = "audio/ogg"

            headers = {
                "Authorization": f"Token {api_key}",
                "Content-Type": content_type
            }

            client = await self._get_http_client()
            response = await client.post(url, headers=headers, content=file_bytes)

            if response.status_code != 200:
                logger.warning(f"[Deepgram] API returned error status {response.status_code}: {response.text}")
                return None

            data = response.json()
            channels = data.get("results", {}).get("channels", [])
            if not channels:
                return None

            alternatives = channels[0].get("alternatives", [])
            if not alternatives:
                return None

            primary_alt = alternatives[0]
            transcript = primary_alt.get("transcript", "").strip()
            if not transcript:
                logger.info("[Deepgram] Received empty transcript, trying fallback transcriber")
                return None

            detected_lang = primary_alt.get("detected_language") or channels[0].get("detected_language") or ("ta" if is_tamil else "en")

            logger.info(f"[Transcriber] Deepgram Nova-3 transcribed: '{transcript}' (lang={detected_lang})")

            return {
                "text": transcript,
                "language": "ta" if detected_lang in ["ta", "tamil"] or is_tamil else detected_lang,
                "provider": "deepgram"
            }
        except Exception as e:
            logger.warning(f"[Transcriber] Deepgram transcription failed, falling back: {e}")
            return None

    async def transcribe_audio(self, file_bytes: bytes, filename: str = "audio.webm",
                               language_hint: Optional[str] = None) -> Dict[str, Any]:
        """
        Transcribe uploaded audio with automatic Tamil / English language detection.
        Uses Deepgram Nova-3 API with fallback to Groq's whisper-large-v3-turbo,
        followed by local faster-whisper or speech buffer.
        """
        raw_text = ""
        whisper_lang = "en"

        # Strategy 1: Deepgram Nova-3 API (Primary Tamil & Multilingual Transcriber)
        deepgram_key = getattr(self.settings, "deepgram_api_key", "")
        if deepgram_key:
            deepgram_result = await self.transcribe_with_deepgram(file_bytes, filename, language_hint)
            if deepgram_result and deepgram_result.get("text"):
                raw_text = deepgram_result["text"]
                whisper_lang = deepgram_result.get("language", "ta" if (language_hint and language_hint.startswith("ta")) else "en")

        # Strategy 2: Groq Whisper API (Fallback if Deepgram not configured or empty)
        if not raw_text:
            api_key = getattr(self.settings, "ai_api_key", "")
            if api_key:
                try:
                    from groq import AsyncGroq
                    client = AsyncGroq(api_key=api_key)
                    
                    # If language_hint is 'ta', force Tamil; otherwise auto-detect
                    lang_param = "ta" if language_hint and language_hint.startswith("ta") else None

                    # Whisper prompt to guide accurate Tamil vocabulary & phonetic alignment
                    whisper_prompt = (
                        "தமிழ் பேச்சு, Tanglish மற்றும் பார்வை உதவி வழிகாட்டுதல்: "
                        "என் முன்னால் என்ன இருக்கிறது, வழி உள்ளதா, படிக்கட்டுகள் உள்ளதா, "
                        "யார் அங்கே இருக்கிறார்கள், என்ன நிறம், என்ன தெரிகிறது."
                    ) if (language_hint and language_hint.startswith("ta")) else "Tamil, Tanglish and English visual assistant navigation queries."

                    transcription = await client.audio.transcriptions.create(
                        model="whisper-large-v3-turbo",
                        file=(filename, file_bytes),
                        response_format="verbose_json",
                        language=lang_param,
                        prompt=whisper_prompt,
                        temperature=0.0
                    )

                    raw_text = getattr(transcription, "text", "") or ""
                    raw_text = raw_text.strip()
                    detected_raw = getattr(transcription, "language", "") or ""
                    
                    if detected_raw.lower() in ["ta", "tamil"]:
                        whisper_lang = "ta"
                    else:
                        whisper_lang = detected_raw.lower() if detected_raw else "en"

                    logger.info(f"[Transcriber] Groq Whisper transcribed: '{raw_text}' (lang={whisper_lang})")
                except Exception as e:
                    logger.warning(f"[Transcriber] Groq Whisper failed, falling back: {e}")

        # Strategy 2: Local faster-whisper fallback
        if not raw_text and HAS_WHISPER:
            try:
                self._load_model()
                if self.model:
                    import tempfile
                    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
                        tmp.write(file_bytes)
                        tmp_path = tmp.name
                    
                    try:
                        segments, info = self.model.transcribe(tmp_path, beam_size=5)
                        raw_text = " ".join([segment.text for segment in segments]).strip()
                        whisper_lang = getattr(info, "language", "en")
                    finally:
                        try:
                            os.remove(tmp_path)
                        except Exception:
                            pass
            except Exception as e:
                logger.error(f"[Transcriber] Local faster-whisper error: {e}")

        # If transcription failed to produce text
        if not raw_text:
            return {
                "text": "",
                "language": language_hint or "en",
                "detected_language": language_hint or "en",
                "is_tamil": bool(language_hint and language_hint.startswith("ta")),
                "normalized_query": "",
                "intent_summary": "No speech detected"
            }

        # Analyze detected language & intent
        analysis = self.detect_language_and_intent(raw_text)
        
        # If Whisper itself detected Tamil, prioritize Tamil
        if whisper_lang in ["ta", "tamil"]:
            analysis["language"] = "ta"
            analysis["is_tamil"] = True
            analysis["detected_language"] = "ta"

        return {
            "text": raw_text,
            "language": analysis["language"],
            "detected_language": analysis["detected_language"],
            "is_tamil": analysis["is_tamil"],
            "normalized_query": analysis["normalized_query"],
            "intent_summary": analysis["intent_summary"]
        }

    async def start_recording(self):
        self.is_recording = True
        self._audio_buffer = []
        if HAS_SOUNDDEVICE:
            self._record_thread = threading.Thread(target=self._record_audio)
            self._record_thread.start()
        else:
            logger.error("sounddevice is not installed, cannot record audio.")

    def _record_audio(self):
        if not HAS_SOUNDDEVICE:
            return
        try:
            with sounddevice.InputStream(samplerate=self.sample_rate, channels=1, dtype='int16') as stream:
                while self.is_recording:
                    data, overflowed = stream.read(self.sample_rate // 10)  # 100ms chunks
                    self._audio_buffer.append(data)
        except Exception as e:
            logger.error(f"Error recording audio: {e}")

    async def stop_recording(self) -> str:
        self.is_recording = False
        if self._record_thread:
            self._record_thread.join()
            self._record_thread = None
            
        if not self._audio_buffer:
            return ""
            
        if HAS_SOUNDDEVICE:
            audio_data = np.concatenate(self._audio_buffer, axis=0)
            return await self.transcribe(audio_data)
        return ""

    async def transcribe(self, audio_data) -> str:
        if not HAS_WHISPER:
            return "Error: faster-whisper is not installed"
        
        self._load_model()
        if not self.model:
            return "Error: Model could not be loaded"
            
        try:
            # Need audio data as float32 in [-1, 1]
            audio_float32 = audio_data.astype(np.float32) / 32768.0
            audio_float32 = audio_float32.flatten()
            
            segments, info = self.model.transcribe(audio_float32, beam_size=5)
            text = " ".join([segment.text for segment in segments])
            return text.strip()
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return f"Error transcribing: {str(e)}"

    def is_available(self) -> bool:
        if not HAS_SOUNDDEVICE:
            return False
        try:
            devices = sounddevice.query_devices()
            return len(devices) > 0
        except Exception:
            return False


speech_service = SpeechService()
