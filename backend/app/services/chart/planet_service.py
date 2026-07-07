from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.services.chart.constants import PLANET_NAMES
from app.services.chart.ephemeris import EphemerisEngine, get_ephemeris_engine
from app.services.chart.house_service import HouseService


def _get_swe() -> Any:
    import swisseph as swe

    return swe


@dataclass(frozen=True)
class PlanetData:
    name: str
    sign: str
    degree: float
    longitude: float
    house: int
    retrograde: bool
    speed: float


class PlanetService:
    def __init__(
        self,
        engine: EphemerisEngine | None = None,
        house_service: HouseService | None = None,
    ) -> None:
        self._engine = engine
        self._house_service = house_service

    @property
    def engine(self) -> EphemerisEngine:
        if self._engine is None:
            self._engine = get_ephemeris_engine()
        return self._engine

    @property
    def house_service(self) -> HouseService:
        if self._house_service is None:
            self._house_service = HouseService(self.engine)
        return self._house_service

    def calculate(self, julian_day: float, ascendant_longitude: float) -> list[PlanetData]:
        swe = _get_swe()
        planet_ids = {
            "Sun": swe.SUN,
            "Moon": swe.MOON,
            "Mercury": swe.MERCURY,
            "Venus": swe.VENUS,
            "Mars": swe.MARS,
            "Jupiter": swe.JUPITER,
            "Saturn": swe.SATURN,
        }
        planets: list[PlanetData] = []

        for planet_name in PLANET_NAMES:
            if planet_name == "Rahu":
                longitude, speed, retrograde = self.engine.get_rahu_longitude(julian_day)
            elif planet_name == "Ketu":
                rahu_longitude, speed, retrograde = self.engine.get_rahu_longitude(julian_day)
                longitude = self.engine.get_ketu_longitude(rahu_longitude)
                speed = -abs(speed)
            else:
                planet_id = planet_ids[planet_name]
                longitude, speed, retrograde = self.engine.get_planet_longitude(julian_day, planet_id)

            planets.append(
                PlanetData(
                    name=planet_name,
                    sign=self.engine.sign_name(longitude),
                    degree=self.engine.degree_in_sign(longitude),
                    longitude=round(longitude, 4),
                    house=self.house_service.get_planet_house(longitude, ascendant_longitude),
                    retrograde=retrograde,
                    speed=speed,
                )
            )

        return planets
