import pytest

swisseph = pytest.importorskip("swisseph")

from app.models.chart import ChartRequest
from app.services.chart.chart_generator import ChartGenerator


def test_chart_generator_returns_complete_chart(sample_payload: dict) -> None:
    request = ChartRequest(**sample_payload)
    chart = ChartGenerator().generate(request)

    assert chart.ayanamsa == "Lahiri"
    assert chart.ascendant.sign
    assert 0 <= chart.ascendant.degree < 30
    assert len(chart.planets) == 9
    assert len(chart.houses) == 12
    assert chart.nakshatra.name
    assert 1 <= chart.nakshatra.pada <= 4
    assert chart.dasha.mahadasha
    assert chart.dasha.antardasha
    assert chart.metadata.ephemeris == "Swiss Ephemeris"


def test_chart_generator_performance(sample_payload: dict) -> None:
    request = ChartRequest(**sample_payload)
    chart = ChartGenerator().generate(request)

    assert chart.metadata.calculationTimeMs is None
    assert chart.sunSign
    assert chart.moonSign
