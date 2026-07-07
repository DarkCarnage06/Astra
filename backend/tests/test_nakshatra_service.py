from app.services.chart.nakshatra_service import NakshatraService


def test_nakshatra_from_moon_longitude() -> None:
    nakshatra = NakshatraService().calculate(230.0)

    assert nakshatra.name == "Jyeshtha"
    assert 1 <= nakshatra.pada <= 4
    assert nakshatra.lord == "Mercury"
