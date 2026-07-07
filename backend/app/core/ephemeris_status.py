from __future__ import annotations

from app.core.exceptions import ChartCalculationError


def is_swisseph_available() -> bool:
    try:
        import swisseph  # noqa: F401

        return True
    except ModuleNotFoundError:
        return False


def is_flatlib_available() -> bool:
    try:
        import flatlib  # noqa: F401

        return True
    except ModuleNotFoundError:
        return False


def require_swisseph() -> None:
    if not is_swisseph_available():
        raise ChartCalculationError(
            "Swiss Ephemeris (pyswisseph) is not installed. "
            "Run `pip install -r requirements.txt` (Linux/macOS) or use `docker compose up` on Windows."
        )
