from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from app.services.chart.constants import (
    DASHA_ORDER,
    DASHA_YEARS,
    NAKSHATRA_LORDS,
    NAKSHATRA_SPAN,
    TOTAL_DASHA_YEARS,
)
from app.services.chart.ephemeris import EphemerisEngine


@dataclass(frozen=True)
class DashaPeriod:
    lord: str
    start: datetime
    end: datetime


@dataclass(frozen=True)
class DashaData:
    mahadasha: str
    antardasha: str
    remaining_years: float
    start_date: datetime
    end_date: datetime


class DashaService:
    def calculate(
        self,
        moon_longitude: float,
        birth_datetime: datetime,
        reference_datetime: datetime | None = None,
    ) -> DashaData:
        reference = reference_datetime or datetime.now(UTC)
        birth_lord, balance_years = self._birth_dasha_balance(moon_longitude)
        timeline = self._build_mahadasha_timeline(birth_datetime, birth_lord, balance_years)

        current_maha = self._find_active_period(timeline, reference)
        antar_timeline = self._build_antardasha_timeline(current_maha)
        current_antar = self._find_active_period(antar_timeline, reference)

        remaining = (current_maha.end - reference).total_seconds() / (365.25 * 24 * 3600)

        return DashaData(
            mahadasha=current_maha.lord,
            antardasha=current_antar.lord,
            remaining_years=round(max(remaining, 0.0), 2),
            start_date=current_maha.start,
            end_date=current_maha.end,
        )

    def _birth_dasha_balance(self, moon_longitude: float) -> tuple[str, float]:
        normalized = EphemerisEngine.normalize_longitude(moon_longitude)
        nakshatra_index = min(int(normalized / NAKSHATRA_SPAN), 26)
        position_in_nakshatra = normalized - (nakshatra_index * NAKSHATRA_SPAN)
        portion_completed = position_in_nakshatra / NAKSHATRA_SPAN
        birth_lord = NAKSHATRA_LORDS[nakshatra_index]
        balance_years = DASHA_YEARS[birth_lord] * (1 - portion_completed)
        return birth_lord, balance_years

    def _build_mahadasha_timeline(
        self,
        birth_datetime: datetime,
        birth_lord: str,
        balance_years: float,
    ) -> list[DashaPeriod]:
        timeline: list[DashaPeriod] = []
        cursor = birth_datetime
        lord_index = DASHA_ORDER.index(birth_lord)

        for offset in range(len(DASHA_ORDER) * 4):
            lord = DASHA_ORDER[(lord_index + offset) % len(DASHA_ORDER)]
            years = balance_years if offset == 0 else DASHA_YEARS[lord]
            end = cursor + timedelta(days=years * 365.25)
            timeline.append(DashaPeriod(lord=lord, start=cursor, end=end))
            cursor = end

        return timeline

    def _build_antardasha_timeline(self, mahadasha: DashaPeriod) -> list[DashaPeriod]:
        timeline: list[DashaPeriod] = []
        cursor = mahadasha.start
        start_index = DASHA_ORDER.index(mahadasha.lord)
        maha_years = (mahadasha.end - mahadasha.start).total_seconds() / (365.25 * 24 * 3600)

        for offset in range(len(DASHA_ORDER)):
            lord = DASHA_ORDER[(start_index + offset) % len(DASHA_ORDER)]
            antar_years = maha_years * (DASHA_YEARS[lord] / TOTAL_DASHA_YEARS)
            end = cursor + timedelta(days=antar_years * 365.25)
            timeline.append(DashaPeriod(lord=lord, start=cursor, end=end))
            cursor = end

        return timeline

    @staticmethod
    def _find_active_period(timeline: list[DashaPeriod], reference: datetime) -> DashaPeriod:
        for period in timeline:
            if period.start <= reference < period.end:
                return period
        return timeline[-1]
