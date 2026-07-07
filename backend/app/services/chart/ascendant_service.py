from __future__ import annotations

from dataclasses import dataclass

from app.services.chart.ephemeris import EphemerisEngine, get_ephemeris_engine


@dataclass(frozen=True)
class AscendantData:
    sign: str
    degree: float
    longitude: float


class AscendantService:
    def __init__(self, engine: EphemerisEngine | None = None) -> None:
        self._engine = engine

    @property
    def engine(self) -> EphemerisEngine:
        if self._engine is None:
            self._engine = get_ephemeris_engine()
        return self._engine

    def calculate(self, julian_day: float, latitude: float, longitude: float) -> AscendantData:
        asc_longitude = self.engine.get_ascendant_longitude(julian_day, latitude, longitude)
        return AscendantData(
            sign=self.engine.sign_name(asc_longitude),
            degree=self.engine.degree_in_sign(asc_longitude),
            longitude=round(asc_longitude, 4),
        )
