from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.logging import log_request
from app.models.chart import ChartRequest, ChartResponse, ErrorResponse
from app.services.chart.chart_generator import ChartGenerator
from app.services.chart.constants import DASHA_ORDER, DASHA_YEARS, TOTAL_DASHA_YEARS
from app.services.chart.dasha_service import DashaService
from app.services.chart.ephemeris import get_ephemeris_engine
from app.services.chart_service import ChartService

router = APIRouter(prefix="/api", tags=["chart"])


def get_chart_service() -> ChartService:
    return ChartService()


def get_chart_generator() -> ChartGenerator:
    return ChartGenerator()


# ---------------------------------------------------------------------------
# POST /api/chart — existing endpoint
# ---------------------------------------------------------------------------
@router.post(
    "/chart",
    response_model=ChartResponse,
    summary="Generate a Vedic birth chart",
    responses={
        400: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
def create_chart(
    payload: ChartRequest,
    chart_service: ChartService = Depends(get_chart_service),
) -> ChartResponse:
    return chart_service.generate_chart(payload)


# ---------------------------------------------------------------------------
# GET /api/transits — current planetary transits
# ---------------------------------------------------------------------------
class TransitPlanet(BaseModel):
    name: str
    sign: str
    degree: float
    longitude: float
    retrograde: bool
    house_from_moon: int | None = None


class TransitsResponse(BaseModel):
    planets: list[TransitPlanet]
    generatedAt: str
    note: str


@router.get(
    "/transits",
    response_model=TransitsResponse,
    summary="Current planetary transits",
    description="Returns the current sidereal planetary positions using Swiss Ephemeris.",
)
def get_transits() -> TransitsResponse:
    from app.services.chart.planet_service import PlanetService
    from app.services.chart.ascendant_service import AscendantService
    from app.services.chart.ayanamsa_service import AyanamsaService

    try:
        engine = get_ephemeris_engine()
        now = datetime.now(UTC)
        hour_decimal = now.hour + now.minute / 60.0 + now.second / 3600.0
        jd = engine.get_julian_day(now.year, now.month, now.day, hour_decimal)

        # Use Aries (0°) as reference ascendant for transit chart
        planet_svc = PlanetService()
        ayanamsa_svc = AyanamsaService()
        ayanamsa_val = ayanamsa_svc.get_value(jd)

        raw_planets = planet_svc.calculate(jd, 0.0)

        transit_planets = [
            TransitPlanet(
                name=p.name,
                sign=p.sign,
                degree=round(p.degree, 4),
                longitude=round(p.longitude, 4),
                retrograde=p.retrograde,
            )
            for p in raw_planets
        ]

        return TransitsResponse(
            planets=transit_planets,
            generatedAt=now.isoformat(),
            note="Sidereal positions using Lahiri ayanamsa. Houses are relative to natal chart.",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transit calculation failed: {exc}") from exc


# ---------------------------------------------------------------------------
# POST /api/compatibility — dual-chart compatibility
# ---------------------------------------------------------------------------
class CompatibilityRequest(BaseModel):
    chart1: ChartRequest
    chart2: ChartRequest


class CompatibilityScore(BaseModel):
    category: str
    score: int
    description: str


class CompatibilityResponse(BaseModel):
    scores: list[CompatibilityScore]
    overall: int
    chart1Summary: dict[str, Any]
    chart2Summary: dict[str, Any]
    generatedAt: str


ELEMENT_MAP: dict[str, str] = {
    "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
    "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
    "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
    "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water",
}

COMPATIBLE_PAIRS = {
    ("Fire", "Air"), ("Air", "Fire"),
    ("Earth", "Water"), ("Water", "Earth"),
}

CHALLENGING_PAIRS = {
    ("Fire", "Water"), ("Water", "Fire"),
    ("Earth", "Air"), ("Air", "Earth"),
}


def element_score(sign1: str, sign2: str) -> int:
    e1, e2 = ELEMENT_MAP.get(sign1, ""), ELEMENT_MAP.get(sign2, "")
    if e1 == e2:
        return 90
    if (e1, e2) in COMPATIBLE_PAIRS:
        return 80
    if (e1, e2) in CHALLENGING_PAIRS:
        return 52
    return 65


@router.post(
    "/compatibility",
    response_model=CompatibilityResponse,
    summary="Calculate compatibility between two birth charts",
)
def calculate_compatibility(
    payload: CompatibilityRequest,
    generator: ChartGenerator = Depends(get_chart_generator),
) -> CompatibilityResponse:
    try:
        resp1 = generator.generate(payload.chart1)
        resp2 = generator.generate(payload.chart2)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    moon1 = next((p for p in resp1.planets if p.name == "Moon"), None)
    moon2 = next((p for p in resp2.planets if p.name == "Moon"), None)
    mercury1 = next((p for p in resp1.planets if p.name == "Mercury"), None)
    mercury2 = next((p for p in resp2.planets if p.name == "Mercury"), None)
    venus1 = next((p for p in resp1.planets if p.name == "Venus"), None)
    venus2 = next((p for p in resp2.planets if p.name == "Venus"), None)
    jupiter1 = next((p for p in resp1.planets if p.name == "Jupiter"), None)
    jupiter2 = next((p for p in resp2.planets if p.name == "Jupiter"), None)

    comm_score = element_score(mercury1.sign if mercury1 else resp1.sunSign, mercury2.sign if mercury2 else resp2.sunSign)
    emo_score = element_score(moon1.sign if moon1 else resp1.moonSign, moon2.sign if moon2 else resp2.moonSign)
    marriage_score = element_score(resp1.ascendant.sign, resp2.ascendant.sign)
    career_score = element_score(resp1.sunSign, resp2.sunSign)
    friend_score = element_score(jupiter1.sign if jupiter1 else resp1.sunSign, jupiter2.sign if jupiter2 else resp2.sunSign)
    venus_score = element_score(venus1.sign if venus1 else resp1.sunSign, venus2.sign if venus2 else resp2.sunSign)

    overall = int((comm_score + emo_score + marriage_score + career_score + friend_score + venus_score) / 6)

    scores = [
        CompatibilityScore(category="Communication", score=comm_score, description=f"Mercury in {mercury1.sign if mercury1 else '—'} meets Mercury in {mercury2.sign if mercury2 else '—'}."),
        CompatibilityScore(category="Emotional Bond", score=emo_score, description=f"Moon in {moon1.sign if moon1 else '—'} and Moon in {moon2.sign if moon2 else '—'} shape emotional resonance."),
        CompatibilityScore(category="Marriage Potential", score=marriage_score, description=f"Ascendant {resp1.ascendant.sign} and Ascendant {resp2.ascendant.sign} determine approach to shared life."),
        CompatibilityScore(category="Career Synergy", score=career_score, description=f"Sun in {resp1.sunSign} and Sun in {resp2.sunSign} reflect professional drive alignment."),
        CompatibilityScore(category="Friendship", score=friend_score, description=f"Jupiter in {jupiter1.sign if jupiter1 else '—'} and Jupiter in {jupiter2.sign if jupiter2 else '—'} shape wisdom sharing."),
        CompatibilityScore(category="Love & Harmony", score=venus_score, description=f"Venus in {venus1.sign if venus1 else '—'} and Venus in {venus2.sign if venus2 else '—'} reveal romantic compatibility."),
    ]

    chart1_summary = {
        "sunSign": resp1.sunSign, "moonSign": resp1.moonSign,
        "ascendant": resp1.ascendant.sign,
        "mahadasha": resp1.dasha.mahadasha,
    }
    chart2_summary = {
        "sunSign": resp2.sunSign, "moonSign": resp2.moonSign,
        "ascendant": resp2.ascendant.sign,
        "mahadasha": resp2.dasha.mahadasha,
    }

    return CompatibilityResponse(
        scores=scores,
        overall=overall,
        chart1Summary=chart1_summary,
        chart2Summary=chart2_summary,
        generatedAt=datetime.now(UTC).isoformat(),
    )


# ---------------------------------------------------------------------------
# GET /api/dasha — full dasha timeline
# ---------------------------------------------------------------------------
class DashaPeriodOut(BaseModel):
    lord: str
    startDate: str
    endDate: str
    durationYears: float
    isCurrent: bool
    antardashas: list[dict[str, Any]] | None = None


class DashaTimelineResponse(BaseModel):
    periods: list[DashaPeriodOut]
    currentMahadasha: str
    currentAntardasha: str
    remainingYears: float
    generatedAt: str


@router.post(
    "/dasha",
    response_model=DashaTimelineResponse,
    summary="Full Vimshottari Dasha timeline",
)
def get_dasha_timeline(
    payload: ChartRequest,
    generator: ChartGenerator = Depends(get_chart_generator),
) -> DashaTimelineResponse:
    try:
        chart = generator.generate(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    now = datetime.now(UTC)
    current_maha = chart.dasha.mahadasha
    maha_start = datetime.fromisoformat(chart.dasha.startDate.replace("Z", "+00:00")) if "T" in chart.dasha.startDate else datetime.strptime(chart.dasha.startDate, "%Y-%m-%d").replace(tzinfo=UTC)
    maha_end = datetime.fromisoformat(chart.dasha.endDate.replace("Z", "+00:00")) if "T" in chart.dasha.endDate else datetime.strptime(chart.dasha.endDate, "%Y-%m-%d").replace(tzinfo=UTC)

    # Build full timeline (past 2 + current + future 3)
    maha_idx = DASHA_ORDER.index(current_maha)
    periods = []

    for offset in range(-2, 6):
        idx = (maha_idx + offset) % len(DASHA_ORDER)
        lord = DASHA_ORDER[idx]
        duration = DASHA_YEARS[lord]

        if offset == 0:
            start = maha_start
            end = maha_end
        elif offset < 0:
            start = maha_start
            for o in range(offset, 0):
                prev_lord = DASHA_ORDER[(maha_idx + o - 1) % len(DASHA_ORDER)]
                start -= timedelta(days=DASHA_YEARS[prev_lord] * 365.25)
            end = start + timedelta(days=duration * 365.25)
            start = end - timedelta(days=duration * 365.25)
        else:
            start = maha_end
            for o in range(1, offset):
                prev_lord = DASHA_ORDER[(maha_idx + o) % len(DASHA_ORDER)]
                start += timedelta(days=DASHA_YEARS[prev_lord] * 365.25)
            end = start + timedelta(days=duration * 365.25)

        # Build antardashas for current period
        antardashas = None
        if offset == 0:
            antar_cursor = maha_start
            antar_list = []
            for a_offset in range(len(DASHA_ORDER)):
                a_lord = DASHA_ORDER[(maha_idx + a_offset) % len(DASHA_ORDER)]
                a_years = duration * (DASHA_YEARS[a_lord] / TOTAL_DASHA_YEARS)
                a_end = antar_cursor + timedelta(days=a_years * 365.25)
                antar_list.append({
                    "lord": a_lord,
                    "startDate": antar_cursor.strftime("%Y-%m-%d"),
                    "endDate": a_end.strftime("%Y-%m-%d"),
                    "isCurrent": antar_cursor <= now < a_end,
                })
                antar_cursor = a_end
            antardashas = antar_list

        periods.append(DashaPeriodOut(
            lord=lord,
            startDate=start.strftime("%Y-%m-%d"),
            endDate=end.strftime("%Y-%m-%d"),
            durationYears=round(duration, 2),
            isCurrent=offset == 0,
            antardashas=antardashas,
        ))

    return DashaTimelineResponse(
        periods=periods,
        currentMahadasha=chart.dasha.mahadasha,
        currentAntardasha=chart.dasha.antardasha,
        remainingYears=chart.dasha.remainingYears,
        generatedAt=now.isoformat(),
    )


# ---------------------------------------------------------------------------
# POST /api/cosmic-brief — raw data for cosmic brief calculations
# ---------------------------------------------------------------------------
class CosmicBriefResponse(BaseModel):
    currentMahadasha: str
    currentAntardasha: str
    remainingYears: float
    natalMoonSign: str
    natalSunSign: str
    natalAscendantSign: str
    transitPositions: list[TransitPlanet]
    generatedAt: str


@router.post(
    "/cosmic-brief",
    response_model=CosmicBriefResponse,
    summary="Cosmic brief calculation parameters",
)
def calculate_cosmic_brief(
    payload: ChartRequest,
    generator: ChartGenerator = Depends(get_chart_generator),
) -> CosmicBriefResponse:
    from app.services.chart.planet_service import PlanetService
    from app.services.chart.ayanamsa_service import AyanamsaService

    try:
        # Natal chart
        natal = generator.generate(payload)

        # Transits
        engine = get_ephemeris_engine()
        now = datetime.now(UTC)
        hour_decimal = now.hour + now.minute / 60.0 + now.second / 3600.0
        jd = engine.get_julian_day(now.year, now.month, now.day, hour_decimal)

        planet_svc = PlanetService()
        raw_transits = planet_svc.calculate(jd, 0.0)

        transit_planets = [
            TransitPlanet(
                name=p.name,
                sign=p.sign,
                degree=round(p.degree, 4),
                longitude=round(p.longitude, 4),
                retrograde=p.retrograde,
            )
            for p in raw_transits
        ]

        return CosmicBriefResponse(
            currentMahadasha=natal.dasha.mahadasha,
            currentAntardasha=natal.dasha.antardasha,
            remainingYears=natal.dasha.remainingYears,
            natalMoonSign=natal.moonSign,
            natalSunSign=natal.sunSign,
            natalAscendantSign=natal.ascendant.sign,
            transitPositions=transit_planets,
            generatedAt=now.isoformat(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Cosmic brief calculation failed: {exc}") from exc

