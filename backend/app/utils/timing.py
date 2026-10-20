import time
import logging
from functools import wraps

logger = logging.getLogger(__name__)

class Timer:
    def __init__(self, name="Timer"):
        self.name = name
        self.start_time = None
        self.end_time = None
        
    def __enter__(self):
        self.start_time = time.time()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.time()
        self.elapsed_ms = int((self.end_time - self.start_time) * 1000)
        logger.debug(f"[{self.name}] Elapsed time: {self.elapsed_ms}ms")

def async_timed():
    def wrapper(func):
        @wraps(func)
        async def wrapped(*args, **kwargs):
            start = time.time()
            try:
                return await func(*args, **kwargs)
            finally:
                end = time.time()
                elapsed_ms = int((end - start) * 1000)
                logger.debug(f"[{func.__name__}] Executed in {elapsed_ms}ms")
        return wrapped
    return wrapper
