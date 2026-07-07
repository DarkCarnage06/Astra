from __future__ import annotations

from datetime import UTC, datetime

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.core.exceptions import (
    ChartCalculationError,
    InvalidBirthDataError,
    InvalidCoordinatesError,
    InvalidTimezoneError,
)
from app.models.chart import ChartRequest, ChartResponse
from app.utils.flatlib_adapter import validate_birth_moment
from app.services.chart.ascendant_service import AscendantService
from app.services.chart.ayanamsa_service import AyanamsaService
from app.services.chart.dasha_service import DashaService
from app.services.chart.ephemeris import get_ephemeris_engine
from app.services.chart.formatter import ChartFormatter
from app.services.chart.house_service import HouseService
from app.services.chart.nakshatra_service import NakshatraService
from app.services.chart.planet_service import PlanetService


class ChartGenerator:
    """Orchestrates all chart calculation services."""

    def __init__(
        self,
        ayanamsa_service: AyanamsaService | None = None,
        ascendant_service: AscendantService | None = None,
        house_service: HouseService | None = None,
        planet_service: PlanetService | None = None,
        nakshatra_service: NakshatraService | None = None,
        dasha_service: DashaService | None = None,
        formatter: ChartFormatter | None = None,
    ) -> None:
        self.ayanamsa_service = ayanamsa_service or AyanamsaService()
        self.ascendant_service = ascendant_service or AscendantService()
        self.house_service = house_service or HouseService()
        self.planet_service = planet_service or PlanetService()
        self.nakshatra_service = nakshatra_service or NakshatraService()
        self.dasha_service = dasha_service or DashaService()
        self.formatter = formatter or ChartFormatter()
        self._engine = None

    @property
    def engine(self):
        if self._engine is None:
            self._engine = get_ephemeris_engine()
        return self._engine

    def generate(self, request: ChartRequest) -> ChartResponse:
        birth_datetime, julian_day = self._resolve_datetime(request)
        ascendant = self.ascendant_service.calculate(
            julian_day,
            request.latitude,
            request.longitude,
        )
        planets = self.planet_service.calculate(julian_day, ascendant.longitude)
        houses = self.house_service.calculate(ascendant.longitude)
        moon = next(planet for planet in planets if planet.name == "Moon")
        sun = next(planet for planet in planets if planet.name == "Sun")
        nakshatra = self.nakshatra_service.calculate(moon.longitude)
        dasha = self.dasha_service.calculate(moon.longitude, birth_datetime)
        ayanamsa_value = self.ayanamsa_service.get_value(julian_day)

        return self.formatter.format(
            ascendant=ascendant,
            ayanamsa_name=self.ayanamsa_service.get_name(),
            ayanamsa_value=ayanamsa_value,
            planets=planets,
            houses=houses,
            nakshatra=nakshatra,
            moon_sign=moon.sign,
            sun_sign=sun.sign,
            dasha=dasha,
        )

    def _resolve_datetime(self, request: ChartRequest) -> tuple[datetime, float]:
        try:
            ZoneInfo(request.timezone)
        except ZoneInfoNotFoundError as exc:
            raise InvalidTimezoneError(f"Unknown timezone: {request.timezone}") from exc

        if not (-90 <= request.latitude <= 90):
            raise InvalidCoordinatesError("Latitude must be between -90 and 90.")
        if not (-180 <= request.longitude <= 180):
            raise InvalidCoordinatesError("Longitude must be between -180 and 180.")

        try:
            hour, minute = map(int, request.time.split(":"))
            year, month, day = map(int, request.date.split("-"))
            local_dt = datetime(year, month, day, hour, minute, tzinfo=ZoneInfo(request.timezone))
            validate_birth_moment(request.date, request.time, request.timezone)
        except ValueError as exc:
            raise InvalidBirthDataError("Invalid birth date or time format.") from exc

        utc_dt = local_dt.astimezone(UTC)
        hour_decimal = utc_dt.hour + (utc_dt.minute / 60.0) + (utc_dt.second / 3600.0)

        try:
            julian_day = self.engine.get_julian_day(utc_dt.year, utc_dt.month, utc_dt.day, hour_decimal)
        except ChartCalculationError:
            raise
        except Exception as exc:
            raise ChartCalculationError("Failed to compute Julian day.") from exc

        return local_dt, julian_day
