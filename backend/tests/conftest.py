"""
Shared test fixtures.

Uses httpx AsyncClient with an in-process TestClient.
DB operations use SQLite for isolation (GeoAlchemy2 features mocked).
"""

import asyncio
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.utils.security import create_access_token


@pytest.fixture(scope="session")
def event_loop():
    """Create a session-scoped event loop."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def auth_headers() -> dict[str, str]:
    """Return Authorization headers with a valid JWT for a fake user."""
    fake_user_id = uuid.uuid4()
    token = create_access_token(fake_user_id)
    return {"Authorization": f"Bearer {token}"}
