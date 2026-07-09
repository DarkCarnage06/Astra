from __future__ import annotations

from app.core.exceptions import ChartCalculationError
from app.core.logging import Timer, log_calculation_time, log_error
from app.models.chart import ChartRequest, ChartResponse
from app.services.chart.chart_generator import ChartGenerator


class ChartService:
    """Application service for birth chart generation."""

    def __init__(self, generator: ChartGenerator | None = None) -> None:
        self._generator = generator

    @property
    def generator(self) -> ChartGenerator:
        if self._generator is None:
            self._generator = ChartGenerator()
        return self._generator

    def generate_chart(self, request: ChartRequest) -> ChartResponse:
        try:
            with Timer() as timer:
                chart = self.generator.generate(request)

            log_calculation_time(timer.elapsed_ms)
            chart.metadata.calculationTimeMs = round(timer.elapsed_ms, 2)
            return chart
        except Exception as exc:
            import traceback
            tb = traceback.format_exc()
            log_error("Unexpected chart calculation failure", exc)
            raise ChartCalculationError(
                f"Chart calculation failed: {str(exc)} | Traceback: {tb}"
            ) from exc
