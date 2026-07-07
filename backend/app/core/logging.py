from __future__ import annotations

import sys
import time
from pathlib import Path

from loguru import logger

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

logger.remove()
logger.add(
    sys.stdout,
    level="INFO",
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | {message}",
)
logger.add(
    LOG_DIR / "astra-backend.log",
    rotation="10 MB",
    retention="14 days",
    level="DEBUG",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
)


def log_request(path: str, payload: dict) -> None:
    logger.info("Incoming request path={path} payload={payload}", path=path, payload=payload)


def log_calculation_time(duration_ms: float) -> None:
    logger.info("Chart calculation completed in {duration_ms:.2f}ms", duration_ms=duration_ms)


def log_error(message: str, error: Exception | None = None) -> None:
    if error:
        logger.exception("{message}: {error}", message=message, error=error)
    else:
        logger.error(message)


class Timer:
    def __enter__(self) -> "Timer":
        self.start = time.perf_counter()
        return self

    def __exit__(self, *_args: object) -> None:
        self.elapsed_ms = (time.perf_counter() - self.start) * 1000
