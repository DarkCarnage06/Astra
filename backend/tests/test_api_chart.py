import pytest
from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "online"
    assert body["service"] == "ASTRA Backend"
    assert "ephemerisReady" in body


def test_chart_endpoint_validation_error(client: TestClient) -> None:
    response = client.post(
        "/api/chart",
        json={
            "date": "1990-02-30",
            "time": "14:30",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "timezone": "Asia/Kolkata",
        },
    )
    assert response.status_code == 422
    assert response.json()["error"] == "validation_error"


def test_chart_endpoint_invalid_timezone(client: TestClient) -> None:
    response = client.post(
        "/api/chart",
        json={
            "date": "1990-01-15",
            "time": "14:30",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "timezone": "Not/A_Real_Zone",
        },
    )
    assert response.status_code == 422


def test_chart_endpoint_success(client: TestClient, sample_payload: dict) -> None:
    pytest.importorskip("swisseph")

    response = client.post("/api/chart", json=sample_payload)
    assert response.status_code == 200
    body = response.json()
    assert body["ayanamsa"] == "Lahiri"
    assert len(body["planets"]) == 9
    assert len(body["houses"]) == 12
    assert "nakshatra" in body
    assert "dasha" in body


def test_chart_endpoint_without_ephemeris(client: TestClient, sample_payload: dict) -> None:
    from app.core.ephemeris_status import is_swisseph_available

    if is_swisseph_available():
        pytest.skip("Ephemeris is installed on this machine.")

    response = client.post("/api/chart", json=sample_payload)
    assert response.status_code == 500
    body = response.json()
    assert body["error"] == "chart_calculation_error"
    assert "pyswisseph" in body["message"].lower()
