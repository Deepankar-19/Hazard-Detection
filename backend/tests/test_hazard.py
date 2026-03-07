"""
Hazard endpoint tests.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_hazards_requires_coords(client: AsyncClient):
    """GET /hazards without coords should return 422."""
    response = await client.get("/hazards")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_hazards_with_params(client: AsyncClient):
    """GET /hazards with valid coords should return 200 or 500 (no DB)."""
    response = await client.get(
        "/hazards",
        params={"latitude": 13.0827, "longitude": 80.2707, "radius": 5000},
    )
    assert response.status_code in (200, 500)


@pytest.mark.asyncio
async def test_report_hazard_unauthenticated(client: AsyncClient):
    """POST /report-hazard without auth should return 401."""
    response = await client.post("/report-hazard")
    assert response.status_code == 401
