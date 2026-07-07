from __future__ import annotations

from dataclasses import dataclass

from app.services.chart.constants import SIGNS
from app.services.chart.ephemeris import EphemerisEngine


@dataclass(frozen=True)
class HouseData:
    house: int
    sign: str
    start_degree: float
    end_degree: float


class HouseService:
    """Whole-sign house system used in Vedic astrology."""

    def __init__(self, engine: EphemerisEngine | None = None) -> None:
        self._engine = engine

    @property
    def engine(self) -> EphemerisEngine:
        if self._engine is None:
            from app.services.chart.ephemeris import get_ephemeris_engine

            self._engine = get_ephemeris_engine()
        return self._engine

    def calculate(self, ascendant_longitude: float) -> list[HouseData]:
        asc_sign_index = self.engine.sign_index(ascendant_longitude)
        houses: list[HouseData] = []

        for house_number in range(1, 13):
            sign_index = (asc_sign_index + house_number - 1) % 12
            houses.append(
                HouseData(
                    house=house_number,
                    sign=SIGNS[sign_index],
                    start_degree=0.0,
                    end_degree=30.0,
                )
            )

        return houses

    @staticmethod
    def get_planet_house(planet_longitude: float, ascendant_longitude: float) -> int:
        planet_sign = int(planet_longitude // 30)
        asc_sign = int(ascendant_longitude // 30)
        return ((planet_sign - asc_sign) % 12) + 1
