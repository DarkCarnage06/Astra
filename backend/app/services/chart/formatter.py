from __future__ import annotations

from datetime import UTC, datetime

from app.models.chart import (
    AscendantInfo,
    ChartResponse,
    DashaInfo,
    HouseInfo,
    MetadataInfo,
    NakshatraInfo,
    PlanetInfo,
)
from app.services.chart.ascendant_service import AscendantData
from app.services.chart.dasha_service import DashaData
from app.services.chart.house_service import HouseData
from app.services.chart.nakshatra_service import NakshatraData
from app.services.chart.planet_service import PlanetData


class ChartFormatter:
    """Maps internal calculation dataclasses to API response models."""

    def format(
        self,
        *,
        ascendant: AscendantData,
        ayanamsa_name: str,
        ayanamsa_value: float,
        planets: list[PlanetData],
        houses: list[HouseData],
        nakshatra: NakshatraData,
        moon_sign: str,
        sun_sign: str,
        dasha: DashaData,
        calculation_time_ms: float | None = None,
    ) -> ChartResponse:
        return ChartResponse(
            ascendant=AscendantInfo(
                sign=ascendant.sign,
                degree=ascendant.degree,
                longitude=ascendant.longitude,
            ),
            ayanamsa=ayanamsa_name,
            ayanamsaValue=ayanamsa_value,
            planets=[
                PlanetInfo(
                    name=planet.name,
                    sign=planet.sign,
                    degree=planet.degree,
                    longitude=planet.longitude,
                    house=planet.house,
                    retrograde=planet.retrograde,
                    speed=planet.speed,
                )
                for planet in planets
            ],
            houses=[
                HouseInfo(
                    house=house.house,
                    sign=house.sign,
                    startDegree=house.start_degree,
                    endDegree=house.end_degree,
                )
                for house in houses
            ],
            nakshatra=NakshatraInfo(
                name=nakshatra.name,
                pada=nakshatra.pada,
                lord=nakshatra.lord,
            ),
            moonSign=moon_sign,
            sunSign=sun_sign,
            dasha=DashaInfo(
                mahadasha=dasha.mahadasha,
                antardasha=dasha.antardasha,
                remainingYears=dasha.remaining_years,
                startDate=dasha.start_date.date().isoformat(),
                endDate=dasha.end_date.date().isoformat(),
            ),
            metadata=MetadataInfo(
                ephemeris="Swiss Ephemeris",
                ayanamsa=ayanamsa_name,
                generatedAt=datetime.now(UTC).isoformat(),
                calculationTimeMs=calculation_time_ms,
            ),
        )
