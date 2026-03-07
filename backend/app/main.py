"""
RoadGuard — FastAPI application entry point.

Includes:
• CORS middleware
• Rate limiting (via SlowAPI)
• Router registration for all endpoints
• Lifespan events for DB init and model warm-up
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    allow_origins=["*"] if settings.APP_ENV == "development" else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──
from app.routes.auth import router as auth_router            # noqa: E402
from app.routes.hazards import router as hazards_router      # noqa: E402
from app.routes.confirmations import router as confirm_router  # noqa: E402
from app.routes.hotspots import router as hotspot_router     # noqa: E402
from app.routes.leaderboard import router as lb_router       # noqa: E402
from app.routes.dashboard import router as dash_router       # noqa: E402

app.include_router(auth_router)
app.include_router(hazards_router)
app.include_router(confirm_router)
app.include_router(hotspot_router)
app.include_router(lb_router)
app.include_router(dash_router)


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
