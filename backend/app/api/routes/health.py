from fastapi import APIRouter

from app.core.ephemeris_status import is_flatlib_available, is_swisseph_available

router = APIRouter(tags=["health"])


@router.get(
    "/",
    summary="Service health check",
    description="Returns API status and ephemeris dependency availability.",
)
def health_check() -> dict[str, str | bool]:
    return {
        "status": "online",
        "service": "ASTRA Backend",
        "ephemerisReady": is_swisseph_available(),
        "flatlibReady": is_flatlib_available(),
    }


@router.get(
    "/health",
    summary="Simple service health check",
    description="Returns a simple JSON indicating that the application is healthy.",
)
def health_check_alt() -> dict[str, str]:
    return {"status": "healthy"}
