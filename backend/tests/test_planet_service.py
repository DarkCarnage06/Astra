import pytest

pytest.importorskip("swisseph")

import swisseph as swe

from app.services.chart.ascendant_service import AscendantService
from app.services.chart.planet_service import PlanetService


def test_planet_service_returns_nine_planets() -> None:
    julian_day = swe.julday(1990, 1, 15, 9.0)
    ascendant = AscendantService().calculate(julian_day, 28.6139, 77.2090)
    planets = PlanetService().calculate(julian_day, ascendant.longitude)

    names = {planet.name for planet in planets}
    assert names == {"Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"}
    assert all(0 <= planet.degree < 30 for planet in planets)
    assert all(1 <= planet.house <= 12 for planet in planets)


def test_ascendant_within_sign_bounds() -> None:
    julian_day = swe.julday(1990, 1, 15, 9.0)
    ascendant = AscendantService().calculate(julian_day, 28.6139, 77.2090)

    assert ascendant.sign
    assert 0 <= ascendant.degree < 30
    assert 0 <= ascendant.longitude < 360
