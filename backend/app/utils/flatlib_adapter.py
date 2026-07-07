from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from app.core.ephemeris_status import is_flatlib_available
from app.core.exceptions import InvalidBirthDataError


def validate_birth_moment(date: str, time: str, timezone_name: str) -> None:
    """Cross-validate birth moment parsing using Flatlib when available."""
    if not is_flatlib_available():
        return

    from flatlib.datetime import Datetime

    local_dt = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M").replace(
        tzinfo=ZoneInfo(timezone_name)
    )
    offset = local_dt.utcoffset()
    if offset is None:
        raise InvalidBirthDataError("Unable to resolve timezone offset.")

    total_minutes = int(offset.total_seconds() // 60)
    sign = "+" if total_minutes >= 0 else "-"
    total_minutes = abs(total_minutes)
    hours, minutes = divmod(total_minutes, 60)
    offset_label = f"{sign}{hours:02d}:{minutes:02d}"
    flat_date = date.replace("-", "/")

    try:
        Datetime(flat_date, time, offset_label)
    except Exception as exc:
        raise InvalidBirthDataError("Invalid birth date or time for ephemeris parsing.") from exc
