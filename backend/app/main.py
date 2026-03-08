"""
RoadGuard — FastAPI application entry point.

Includes:
• CORS middleware
• Rate limiting (via SlowAPI)
• Mock router registration (no Docker/DB required)
• Lifespan events for model warm-up
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings

settings = get_settings()


# ── Rate Limiter ──
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


# ── Lifespan ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events."""
    # Warm-up: pre-load the hotspot ML model so first request isn't slow
    try:
        from app.ml.hotspot_model import load_model
        load_model()
    except Exception:
        pass  # Non-critical — model will train on first request
    yield  # App is running
    # Shutdown — nothing to clean up currently


# ── App ──
app = FastAPI(
    title="RoadGuard API",
    description=(
        "Citizen-powered road hazard reporting system with computer vision, "
        "geospatial analytics, predictive ML, and municipal dashboards."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow all origins in dev, restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Mock Router (no DB / Docker needed) ──
from app.routes.mock_routes import router as mock_router  # noqa: E402

app.include_router(mock_router)


# ── Health Check ──
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "service": "RoadGuard API"}


# ── Root ──
@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "Welcome to RoadGuard API",
        "docs": "/docs",
        "health": "/health",
    }
