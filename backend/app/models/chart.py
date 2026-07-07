from __future__ import annotations

from datetime import datetime
from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, Field, field_validator


class ChartRequest(BaseModel):
    date: Annotated[
        str,
        Field(
            description="Birth date in YYYY-MM-DD format.",
            examples=["1990-01-15"],
            pattern=r"^\d{4}-\d{2}-\d{2}$",
        ),
    ]
    time: Annotated[
        str,
        Field(
            description="Birth time in 24-hour HH:mm format.",
            examples=["14:30"],
            pattern=r"^\d{2}:\d{2}$",
        ),
    ]
    latitude: Annotated[
        float,
        Field(
            description="Birth latitude in decimal degrees.",
            ge=-90,
            le=90,
            examples=[28.6139],
        ),
    ]
    longitude: Annotated[
        float,
        Field(
            description="Birth longitude in decimal degrees.",
            ge=-180,
            le=180,
            examples=[77.2090],
        ),
    ]
    timezone: Annotated[
        str,
        Field(
            description="IANA timezone identifier for the birth location.",
            examples=["Asia/Kolkata"],
            min_length=1,
        ),
    ]

    @field_validator("date")
    @classmethod
    def validate_date(cls, value: str) -> str:
        try:
            datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError as exc:
            raise ValueError("Invalid date. Use a real calendar date in YYYY-MM-DD format.") from exc
        return value

    @field_validator("time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        try:
            parsed = datetime.strptime(value, "%H:%M")
        except ValueError as exc:
            raise ValueError("Invalid time. Use HH:mm in 24-hour format.") from exc

        if parsed.minute < 0 or parsed.hour > 23:
            raise ValueError("Invalid time. Hours must be 00-23 and minutes 00-59.")
        return value

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError(f"Unknown timezone: {value}") from exc
        return value


class AscendantInfo(BaseModel):
    sign: str = Field(description="Sidereal ascendant sign (Lagna).")
    degree: float = Field(description="Degree of ascendant within its sign (0-30).")
    longitude: float = Field(description="Full sidereal ascendant longitude (0-360).")


class PlanetInfo(BaseModel):
    name: str = Field(description="Planet name.")
    sign: str = Field(description="Sidereal zodiac sign.")
    degree: float = Field(description="Degree within sign (0-30).")
    longitude: float = Field(description="Sidereal ecliptic longitude (0-360).")
    house: int = Field(description="Whole-sign house placement (1-12).", ge=1, le=12)
    retrograde: bool = Field(description="Whether the planet is retrograde.")
    speed: float = Field(description="Daily motion in degrees.")


class HouseInfo(BaseModel):
    house: int = Field(description="House number (1-12).", ge=1, le=12)
    sign: str = Field(description="Sign occupying the house in whole-sign system.")
    startDegree: float = Field(description="Starting degree of the house sign boundary.")
    endDegree: float = Field(description="Ending degree of the house sign boundary.")


class NakshatraInfo(BaseModel):
    name: str = Field(description="Moon nakshatra name.")
    pada: int = Field(description="Nakshatra quarter (1-4).", ge=1, le=4)
    lord: str = Field(description="Nakshatra ruling planet.")


class DashaInfo(BaseModel):
    mahadasha: str = Field(description="Current Vimshottari mahadasha lord.")
    antardasha: str = Field(description="Current Vimshottari antardasha lord.")
    remainingYears: float = Field(description="Remaining years in current mahadasha.")
    startDate: str = Field(description="Mahadasha start date (ISO).")
    endDate: str = Field(description="Mahadasha end date (ISO).")


class MetadataInfo(BaseModel):
    ephemeris: str = Field(description="Ephemeris engine used.")
    ayanamsa: str = Field(description="Ayanamsa system applied.")
    generatedAt: str = Field(description="UTC timestamp when chart was generated.")
    calculationTimeMs: float | None = Field(
        default=None,
        description="Server-side chart calculation duration in milliseconds.",
    )


class ChartResponse(BaseModel):
    ascendant: AscendantInfo
    ayanamsa: str = Field(description="Ayanamsa system name.")
    ayanamsaValue: float = Field(description="Computed ayanamsa value in degrees.")
    planets: list[PlanetInfo]
    houses: list[HouseInfo]
    nakshatra: NakshatraInfo
    moonSign: str = Field(description="Sidereal Moon sign (Rashi).")
    sunSign: str = Field(description="Sidereal Sun sign (Rashi).")
    dasha: DashaInfo
    metadata: MetadataInfo


class ErrorResponse(BaseModel):
    error: str = Field(description="Error category.")
    message: str = Field(description="Human-readable error message.")
    detail: str | None = Field(default=None, description="Optional technical detail.")
