"""
VISIONCAP — Core Logging Setup
Structured logging with colored output.
"""

import logging
import sys
from typing import Optional


class VisionCapFormatter(logging.Formatter):
    """Custom formatter with module-level tags."""

    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
    }
    RESET = '\033[0m'

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        tag = getattr(record, 'tag', record.name.upper())
        timestamp = self.formatTime(record, '%H:%M:%S')
        message = record.getMessage()
        return f"{color}[{timestamp}] [{tag}] {record.levelname}: {message}{self.RESET}"


def setup_logging(debug: bool = False) -> None:
    """Configure application logging."""
    level = logging.DEBUG if debug else logging.INFO

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(VisionCapFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers.clear()
    root_logger.addHandler(handler)

    # Suppress noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def get_logger(name: str, tag: Optional[str] = None) -> logging.Logger:
    """Get a tagged logger instance."""
    logger = logging.getLogger(name)
    if tag:
        old_factory = logging.getLogRecordFactory()

        def factory(*args, **kwargs):
            record = old_factory(*args, **kwargs)
            if record.name == name:
                record.tag = tag
            return record

        logging.setLogRecordFactory(factory)
    return logger
