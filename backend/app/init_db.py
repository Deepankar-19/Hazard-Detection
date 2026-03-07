"""
Database initialisation script — creates all tables.
Run with: python -m app.init_db
"""

import asyncio

from app.database import engine, Base
from app.models import *  # noqa: F401, F403  — registers all models


async def init() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅  All tables created.")


if __name__ == "__main__":
    asyncio.run(init())
