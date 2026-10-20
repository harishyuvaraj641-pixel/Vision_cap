import logging

logger = logging.getLogger(__name__)

class WakeWordService:
    def __init__(self):
        self.enabled = False
        self.phrase = 'Hey VISIONCAP'

    async def start(self):
        logger.info("Wake word detection is not yet implemented")

    async def stop(self):
        pass

    def is_available(self) -> bool:
        return False

wakeword_service = WakeWordService()
