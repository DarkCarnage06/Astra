class AstraBackendError(Exception):
    """Base application error."""


class ChartCalculationError(AstraBackendError):
    """Raised when ephemeris or chart calculation fails."""


class InvalidBirthDataError(AstraBackendError):
    """Raised when birth date or time is invalid."""


class InvalidCoordinatesError(AstraBackendError):
    """Raised when latitude or longitude is invalid."""


class InvalidTimezoneError(AstraBackendError):
    """Raised when timezone cannot be resolved."""
