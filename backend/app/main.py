import json
import os
import re
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    AstraBackendError,
    ChartCalculationError,
    InvalidBirthDataError,
    InvalidCoordinatesError,
    InvalidTimezoneError,
)
from app.core.logging import log_error
from app.models.chart import ErrorResponse

# Dynamic CORS origins configuration
cors_origins_raw = os.getenv("CORS_ORIGINS", "")
allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "https://astra.app"]

if cors_origins_raw:
    try:
        parsed = json.loads(cors_origins_raw)
        if isinstance(parsed, list):
            allowed_origins.extend(parsed)
    except Exception:
        allowed_origins.extend([o.strip() for o in cors_origins_raw.split(",") if o.strip()])

# Build regex pattern supporting localhost, 127.0.0.1, Vercel subdomains (*.vercel.app), and defined origins
regex_patterns = [
    r"https?://localhost:3000",
    r"https?://127.0.0.1:3000",
    r"https://.*\.vercel\.app",
]
for origin in allowed_origins:
    escaped = re.escape(origin).replace(r"\*", r".*")
    regex_patterns.append(f"^{escaped}$")

cors_origin_regex = "^(" + "|".join(regex_patterns) + ")$"

app = FastAPI(
    title=settings.app_name,
    version="0.2.0",
    description=(
        "ASTRA astrology calculation engine. Computes sidereal birth charts locally using "
        "Swiss Ephemeris and exposes structured JSON for the Next.js frontend and future AI "
        "explanation layers. The LLM never calculates astrology; this service does."
    ),
)

# 1. Log incoming origin header
@app.middleware("http")
async def log_origin_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    if origin:
        logger.info(f"Incoming request from Origin: {origin}")
    response = await call_next(request)
    return response

# 2. Add CORSMiddleware with credentials, methods, headers, and dynamic regex support
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _error_response(status_code: int, error: str, message: str, detail: str | None = None) -> JSONResponse:
    payload = ErrorResponse(error=error, message=message, detail=detail)
    return JSONResponse(status_code=status_code, content=payload.model_dump())


@app.exception_handler(InvalidBirthDataError)
async def invalid_birth_data_handler(_: Request, exc: InvalidBirthDataError) -> JSONResponse:
    log_error("Invalid birth data", exc)
    return _error_response(400, "invalid_birth_data", str(exc))


@app.exception_handler(InvalidCoordinatesError)
async def invalid_coordinates_handler(_: Request, exc: InvalidCoordinatesError) -> JSONResponse:
    log_error("Invalid coordinates", exc)
    return _error_response(400, "invalid_coordinates", str(exc))


@app.exception_handler(InvalidTimezoneError)
async def invalid_timezone_handler(_: Request, exc: InvalidTimezoneError) -> JSONResponse:
    log_error("Invalid timezone", exc)
    return _error_response(400, "invalid_timezone", str(exc))


@app.exception_handler(ChartCalculationError)
async def chart_calculation_handler(_: Request, exc: ChartCalculationError) -> JSONResponse:
    log_error("Chart calculation error", exc)
    return _error_response(500, "chart_calculation_error", str(exc))


@app.exception_handler(AstraBackendError)
async def astra_backend_handler(_: Request, exc: AstraBackendError) -> JSONResponse:
    log_error("Application error", exc)
    return _error_response(500, "application_error", str(exc))


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    log_error("Request validation failed", exc)
    first_error = exc.errors()[0]
    message = first_error.get("msg", "Request validation failed.")
    return _error_response(422, "validation_error", message, detail=str(exc.errors()))


app.include_router(api_router)
