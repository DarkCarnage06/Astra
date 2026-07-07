# ASTRA Backend

Independent FastAPI backend for ASTRA astrology calculations and future AI features.

The backend is the **source of truth** for all astrology data. The LLM never calculates charts — it only explains structured JSON produced here.

## Stack

- Python 3.12
- FastAPI
- Pydantic
- Uvicorn
- Swiss Ephemeris (`pyswisseph`)
- Flatlib
- TimezoneFinder
- Geopy
- Loguru

## Project Structure

```text
backend/
  app/
    main.py
    api/
      router.py
      routes/
        health.py
        chart.py
    services/
      chart_service.py
      chart/
        chart_generator.py
        planet_service.py
        house_service.py
        ascendant_service.py
        nakshatra_service.py
        dasha_service.py
        ayanamsa_service.py
        formatter.py
        ephemeris.py
        constants.py
    models/
      chart.py
    core/
      config.py
      exceptions.py
      logging.py
    utils/
  tests/
  requirements.txt
  .env.example
```

## Setup

### Quick setup (Windows)

```powershell
cd backend
.\scripts\setup.ps1
```

### Manual setup

1. Create and activate a virtual environment:

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements-core.txt
pip install -r requirements-ephemeris.txt
```

Or install everything at once:

```bash
pip install -r requirements.txt
```

3. Create your environment file:

```bash
cp .env.example .env
```

## Run

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

### Docker (recommended on Windows without C++ Build Tools)

```bash
docker compose up --build
```

The API will be available at `http://127.0.0.1:8000`.

Interactive docs: `http://127.0.0.1:8000/docs`

## Test

```bash
pytest
```

Ephemeris-dependent tests are skipped automatically if `pyswisseph` is not installed.

## API

### Health Check

`GET /`

```json
{
  "status": "online",
  "service": "ASTRA Backend"
}
```

### Birth Chart

`POST /api/chart`

Request:

```json
{
  "date": "1990-01-15",
  "time": "14:30",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "timezone": "Asia/Kolkata"
}
```

Response (abbreviated):

```json
{
  "ascendant": { "sign": "Capricorn", "degree": 24.18, "longitude": 294.18 },
  "ayanamsa": "Lahiri",
  "ayanamsaValue": 23.85,
  "planets": [
    {
      "name": "Sun",
      "sign": "Capricorn",
      "degree": 1.42,
      "longitude": 271.42,
      "house": 1,
      "retrograde": false,
      "speed": 1.01
    }
  ],
  "houses": [
    { "house": 1, "sign": "Capricorn", "startDegree": 0, "endDegree": 30 }
  ],
  "nakshatra": { "name": "Jyeshtha", "pada": 3, "lord": "Mercury" },
  "moonSign": "Scorpio",
  "sunSign": "Capricorn",
  "dasha": {
    "mahadasha": "Saturn",
    "antardasha": "Moon",
    "remainingYears": 7.2,
    "startDate": "2020-03-15",
    "endDate": "2039-03-15"
  },
  "metadata": {
    "ephemeris": "Swiss Ephemeris",
    "ayanamsa": "Lahiri",
    "generatedAt": "2026-07-07T12:00:00+00:00",
    "calculationTimeMs": 12.5
  }
}
```

## Architecture

- **Routers** handle HTTP only.
- **Services** contain business logic.
- **Chart engine** uses Lahiri ayanamsa, whole-sign houses, and Vimshottari dasha.
- **Ephemeris** is initialized once and cached.
- **Loguru** logs requests, calculation time, and errors.

## Notes

- CORS is enabled for `http://localhost:3000`.
- `GET /` reports `ephemerisReady` so you can verify Swiss Ephemeris before calling `/api/chart`.
- On Windows, `pyswisseph` requires [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) unless you use Docker.
- `flatlib` is included for birth-moment validation and future chart extensions.
