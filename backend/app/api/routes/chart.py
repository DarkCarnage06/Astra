from fastapi import APIRouter, Depends, Request

from app.core.logging import log_request
from app.models.chart import ChartRequest, ChartResponse, ErrorResponse
from app.services.chart_service import ChartService

router = APIRouter(prefix="/api", tags=["chart"])


def get_chart_service() -> ChartService:
    return ChartService()


@router.post(
    "/chart",
    response_model=ChartResponse,
    summary="Generate a Vedic birth chart",
    description=(
        "Accepts birth details and returns a complete sidereal birth chart computed locally "
        "using Swiss Ephemeris with Lahiri ayanamsa. This endpoint is the source of truth for "
        "all astrology data consumed by the ASTRA frontend and AI layers."
    ),
    responses={
        400: {"model": ErrorResponse, "description": "Invalid birth data or coordinates."},
        422: {"model": ErrorResponse, "description": "Request validation failed."},
        500: {"model": ErrorResponse, "description": "Ephemeris or calculation failure."},
    },
)
def create_chart(
    payload: ChartRequest,
    request: Request,
    chart_service: ChartService = Depends(get_chart_service),
) -> ChartResponse:
    log_request(request.url.path, payload.model_dump())
    return chart_service.generate_chart(payload)
