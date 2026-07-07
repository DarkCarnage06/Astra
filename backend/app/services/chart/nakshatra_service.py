from __future__ import annotations

from dataclasses import dataclass

from app.services.chart.constants import (
    NAKSHATRA_LORDS,
    NAKSHATRA_NAMES,
    NAKSHATRA_SPAN,
    PADA_SPAN,
)
from app.services.chart.ephemeris import EphemerisEngine


@dataclass(frozen=True)
class NakshatraData:
    name: str
    pada: int
    lord: str
    index: int


class NakshatraService:
    def calculate(self, moon_longitude: float) -> NakshatraData:
        normalized = EphemerisEngine.normalize_longitude(moon_longitude)
        index = min(int(normalized / NAKSHATRA_SPAN), len(NAKSHATRA_NAMES) - 1)
        position_in_nakshatra = normalized - (index * NAKSHATRA_SPAN)
        pada = min(int(position_in_nakshatra / PADA_SPAN) + 1, 4)

        return NakshatraData(
            name=NAKSHATRA_NAMES[index],
            pada=pada,
            lord=NAKSHATRA_LORDS[index],
            index=index,
        )
