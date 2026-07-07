from __future__ import annotations

from app.services.chart.ephemeris import EphemerisEngine, get_ephemeris_engine


class AyanamsaService:
    AYANAMSA_NAME = "Lahiri"

    def __init__(self, engine: EphemerisEngine | None = None) -> None:
        self._engine = engine

    @property
    def engine(self) -> EphemerisEngine:
        if self._engine is None:
            self._engine = get_ephemeris_engine()
        return self._engine

    def get_name(self) -> str:
        return self.AYANAMSA_NAME

    def get_value(self, julian_day: float) -> float:
        return self.engine.get_ayanamsa(julian_day)
