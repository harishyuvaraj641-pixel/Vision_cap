import logging
import asyncio
import tempfile
import os
import subprocess
from ..config import get_settings
from ..core.state import app_state

logger = logging.getLogger(__name__)

try:
    import edge_tts
    HAS_EDGE_TTS = True
except ImportError:
    HAS_EDGE_TTS = False

class TTSService:
    def __init__(self):
        self.settings = get_settings()
        self.is_speaking = False
        self.voice = getattr(self.settings, "tts_voice", "en-US-AriaNeural")
        self.current_process = None

    async def speak(self, text: str, language: str = "en"):
        if not HAS_EDGE_TTS:
            logger.error("edge-tts is not installed")
            return
            
        self.is_speaking = True
        # Broadcast tts_started event via app_state
        await app_state.broadcast({"event": "tts_started", "text": text})
        
        temp_file = None
        try:
            is_tamil = (language or "").lower().startswith("ta") or any("\u0b80" <= c <= "\u0bff" for c in text)
            tts_voice = "ta-IN-ValluvarNeural" if is_tamil else self.voice
            communicate = edge_tts.Communicate(text, tts_voice)
            
            # Create a named temp file
            fd, temp_path = tempfile.mkstemp(suffix=".mp3")
            os.close(fd)
            temp_file = temp_path
            
            await communicate.save(temp_file)
            
            # Play using system default player
            if os.name == 'nt':
                # Windows
                self.current_process = subprocess.Popen(['start', '', '/WAIT', temp_file], shell=True)
                # Using an asyncio sleep loop to wait since start is shell and /WAIT works differently
                # A better approach on windows for async is to use a direct player, but fallback to wait for process
                await asyncio.get_event_loop().run_in_executor(None, self.current_process.wait)
            else:
                # Unix-like (mac/linux fallback)
                player = 'afplay' if os.uname().sysname == 'Darwin' else 'mpg123'
                self.current_process = await asyncio.create_subprocess_exec(player, temp_file)
                await self.current_process.communicate()
                
        except Exception as e:
            logger.error(f"Error in TTS speak: {e}")
        finally:
            self.is_speaking = False
            self.current_process = None
            await app_state.broadcast({"event": "tts_finished"})
            
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except Exception as e:
                    logger.error(f"Failed to cleanup TTS file {temp_file}: {e}")

    async def stop(self):
        if self.current_process:
            try:
                if os.name == 'nt':
                    subprocess.call(['taskkill', '/F', '/T', '/PID', str(self.current_process.pid)])
                else:
                    self.current_process.terminate()
            except Exception as e:
                logger.error(f"Error stopping TTS playback: {e}")
        self.is_speaking = False

    def is_available(self) -> bool:
        return HAS_EDGE_TTS

tts_service = TTSService()
