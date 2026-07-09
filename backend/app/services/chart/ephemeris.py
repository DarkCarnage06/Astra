from __future__ import annotations

from functools import lru_cache
from typing import Any

from app.core.ephemeris_status import require_swisseph
from app.services.chart.constants import SIGNS


def _get_swe() -> Any:
    require_swisseph()
    import swisseph as swe

    return swe


class EphemerisEngine:
    """Cached Swiss Ephemeris initialization for sidereal Vedic calculations."""

    def __init__(self) -> None:
        swe = _get_swe()
        swe.set_ephe_path()
        swe.set_sid_mode(swe.SIDM_LAHIRI)

    @staticmethod
    def normalize_longitude(longitude: float) -> float:
        return longitude % 360.0

    @staticmethod
    def sign_index(longitude: float) -> int:
        return int(EphemerisEngine.normalize_longitude(longitude) // 30)

    @staticmethod
    def sign_name(longitude: float) -> str:
        return SIGNS[EphemerisEngine.sign_index(longitude)]

    @staticmethod
    def degree_in_sign(longitude: float) -> float:
        return round(EphemerisEngine.normalize_longitude(longitude) % 30, 4)

    def get_julian_day(self, year: int, month: int, day: int, hour_decimal: float) -> float:
        swe = _get_swe()
        return float(swe.julday(year, month, day, hour_decimal))

    def get_ayanamsa(self, julian_day: float) -> float:
        swe = _get_swe()
        return round(swe.get_ayanamsa(julian_day), 6)

    def get_ascendant_longitude(self, julian_day: float, latitude: float, longitude: float) -> float:
        swe = _get_swe()
        _, ascmc = swe.houses(julian_day, latitude, longitude, b"W")
        tropical_asc = ascmc[0]
        ayanamsa = self.get_ayanamsa(julian_day)
        return self.normalize_longitude(tropical_asc - ayanamsa)

    def get_planet_longitude(self, julian_day: float, planet_id: int) -> tuple[float, float, bool]:
        swe = _get_swe()
        flags = swe.FLG_SWIEPH | swe.FLG_SPEED | swe.FLG_SIDEREAL
        result, _ = swe.calc_ut(julian_day, planet_id, flags)
        longitude = self.normalize_longitude(result[0])
        speed = round(result[3], 6)
        retrograde = speed < 0
        return longitude, speed, retrograde

    def get_rahu_longitude(self, julian_day: float) -> tuple[float, float, bool]:
        swe = _get_swe()
        return self.get_planet_longitude(julian_day, swe.MEAN_NODE)

    def get_ketu_longitude(self, rahu_longitude: float) -> float:
        return self.normalize_longitude(rahu_longitude + 180.0)


@lru_cache(maxsize=1)
def get_ephemeris_engine() -> EphemerisEngine:
    return EphemerisEngine()
