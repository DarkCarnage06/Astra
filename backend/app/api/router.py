from fastapi import APIRouter

from app.api.routes.chart import router as chart_router
from app.api.routes.health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(chart_router)
