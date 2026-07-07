from datetime import UTC, datetime

from app.services.chart.dasha_service import DashaService


def test_dasha_period_for_reference_date() -> None:
    birth = datetime(1990, 1, 15, 14, 30, tzinfo=UTC)
    reference = datetime(2024, 1, 1, tzinfo=UTC)
    dasha = DashaService().calculate(moon_longitude=230.0, birth_datetime=birth, reference_datetime=reference)

    assert dasha.mahadasha
    assert dasha.antardasha
    assert dasha.remaining_years >= 0
    assert dasha.start_date <= reference < dasha.end_date
