"""
Mock routes — replaces all DB-dependent endpoints with hardcoded data.

This allows the entire RoadGuard app to run locally without
PostgreSQL, Redis, or MinIO (Docker).
"""

import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, File, Form, Query, UploadFile, HTTPException

from app.schemas.hazard import HazardOut, HazardPrediction, HazardHotspot
from app.schemas.hazard import ConfirmRepairResponse
from app.schemas.dashboard import DashboardSummary, WardPerformance, LeaderboardEntry
from app.services.hazard_service import predict_hazard_info
from app.utils.validators import validate_image, validate_gps

router = APIRouter()

# ═══════════════════════════════════════════
# IN-MEMORY STORE — citizen reports sync to admin queue
# ═══════════════════════════════════════════
CITIZEN_REPORTS: list[dict] = []

# ═══════════════════════════════════════════
# MOCK DATA
# ═══════════════════════════════════════════

_NOW = datetime.now(timezone.utc)

MOCK_HAZARDS: list[dict] = [
    # ── Potholes (around Chennai) ──
    {"id": "a1b2c3d4-0001-4000-8000-000000000001", "hazard_type": "pothole", "severity_score": "HIGH",
     "repair_cost_estimate": 12000.0, "status": "reported", "latitude": 13.0827, "longitude": 80.2707,
     "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400", "road_type": "city road", "ward": "Ward 1"},
    {"id": "a1b2c3d4-0002-4000-8000-000000000002", "hazard_type": "pothole", "severity_score": "MEDIUM",
     "repair_cost_estimate": 6000.0, "status": "under_review", "latitude": 13.0600, "longitude": 80.2500,
     "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400", "road_type": "city road", "ward": "Ward 2"},
    {"id": "a1b2c3d4-0003-4000-8000-000000000003", "hazard_type": "pothole", "severity_score": "LOW",
     "repair_cost_estimate": 3000.0, "status": "verified", "latitude": 13.0900, "longitude": 80.2300,
     "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400", "road_type": "local road", "ward": "Ward 1"},
    {"id": "a1b2c3d4-0004-4000-8000-000000000004", "hazard_type": "pothole", "severity_score": "HIGH",
     "repair_cost_estimate": 12000.0, "status": "reported", "latitude": 13.0500, "longitude": 80.2100,
     "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400", "road_type": "highway", "ward": "Ward 3"},

    # ── Waterlogging ──
    {"id": "a1b2c3d4-0005-4000-8000-000000000005", "hazard_type": "waterlogging", "severity_score": "HIGH",
     "repair_cost_estimate": 15000.0, "status": "reported", "latitude": 13.0700, "longitude": 80.2400,
     "image_url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400", "road_type": "city road", "ward": "Ward 2"},
    {"id": "a1b2c3d4-0006-4000-8000-000000000006", "hazard_type": "waterlogging", "severity_score": "MEDIUM",
     "repair_cost_estimate": 6000.0, "status": "under_review", "latitude": 13.0450, "longitude": 80.2650,
     "image_url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400", "road_type": "local road", "ward": "Ward 4"},

    # ── Broken Road Edge ──
    {"id": "a1b2c3d4-0007-4000-8000-000000000007", "hazard_type": "broken_road_edge", "severity_score": "MEDIUM",
     "repair_cost_estimate": 8000.0, "status": "reported", "latitude": 13.0950, "longitude": 80.2550,
     "image_url": "https://images.unsplash.com/photo-1584463699037-7550ec0e7e2e?w=400", "road_type": "highway", "ward": "Ward 5"},
    {"id": "a1b2c3d4-0008-4000-8000-000000000008", "hazard_type": "broken_road_edge", "severity_score": "LOW",
     "repair_cost_estimate": 3000.0, "status": "verified", "latitude": 13.0350, "longitude": 80.2800,
     "image_url": "https://images.unsplash.com/photo-1584463699037-7550ec0e7e2e?w=400", "road_type": "city road", "ward": "Ward 1"},
    {"id": "a1b2c3d4-0009-4000-8000-000000000009", "hazard_type": "broken_road_edge", "severity_score": "HIGH",
     "repair_cost_estimate": 12000.0, "status": "reported", "latitude": 13.0550, "longitude": 80.2900,
     "image_url": "https://images.unsplash.com/photo-1584463699037-7550ec0e7e2e?w=400", "road_type": "city road", "ward": "Ward 3"},

    # ── Missing Manhole Cover ──
    {"id": "a1b2c3d4-0010-4000-8000-000000000010", "hazard_type": "missing_manhole_cover", "severity_score": "HIGH",
     "repair_cost_estimate": 18000.0, "status": "reported", "latitude": 13.0780, "longitude": 80.2200,
     "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400", "road_type": "city road", "ward": "Ward 4"},
    {"id": "a1b2c3d4-0011-4000-8000-000000000011", "hazard_type": "missing_manhole_cover", "severity_score": "MEDIUM",
     "repair_cost_estimate": 9000.0, "status": "under_review", "latitude": 13.0650, "longitude": 80.2350,
     "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400", "road_type": "local road", "ward": "Ward 2"},

    # ── Extra scattered markers ──
    {"id": "a1b2c3d4-0012-4000-8000-000000000012", "hazard_type": "pothole", "severity_score": "MEDIUM",
     "repair_cost_estimate": 6000.0, "status": "resolved_unverified", "latitude": 13.1000, "longitude": 80.2600,
     "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400", "road_type": "city road", "ward": "Ward 5"},
    {"id": "a1b2c3d4-0013-4000-8000-000000000013", "hazard_type": "waterlogging", "severity_score": "LOW",
     "repair_cost_estimate": 2000.0, "status": "verified", "latitude": 13.0400, "longitude": 80.2450,
     "image_url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400", "road_type": "local road", "ward": "Ward 3"},
    {"id": "a1b2c3d4-0014-4000-8000-000000000014", "hazard_type": "pothole", "severity_score": "HIGH",
     "repair_cost_estimate": 12000.0, "status": "reported", "latitude": 13.0850, "longitude": 80.2150,
     "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400", "road_type": "highway", "ward": "Ward 1"},
    {"id": "a1b2c3d4-0015-4000-8000-000000000015", "hazard_type": "broken_road_edge", "severity_score": "MEDIUM",
     "repair_cost_estimate": 6000.0, "status": "under_review", "latitude": 13.0750, "longitude": 80.2950,
     "image_url": "https://images.unsplash.com/photo-1584463699037-7550ec0e7e2e?w=400", "road_type": "city road", "ward": "Ward 5"},
]

MOCK_LEADERBOARD = [
    {"username": "RoadWarrior99", "points": 2450, "city": "Chennai"},
    {"username": "PotholeHunter", "points": 2180, "city": "Chennai"},
    {"username": "CitizenFixer", "points": 1920, "city": "Chennai"},
    {"username": "SafeStreetsArun", "points": 1750, "city": "Chennai"},
    {"username": "UrbanGuardPriya", "points": 1580, "city": "Chennai"},
    {"username": "RoadRanger_TN", "points": 1340, "city": "Chennai"},
    {"username": "InfraWatchdog", "points": 1120, "city": "Chennai"},
    {"username": "StreetSentinel", "points": 980, "city": "Chennai"},
    {"username": "MumbaiRoadPro", "points": 870, "city": "Mumbai"},
    {"username": "FixItChennai", "points": 740, "city": "Chennai"},
]

MOCK_WARDS = [
    {"ward": "Ward 1", "total_hazards": 14, "resolved_hazards": 8, "average_resolution_time_days": 3.2},
    {"ward": "Ward 2", "total_hazards": 11, "resolved_hazards": 5, "average_resolution_time_days": 5.1},
    {"ward": "Ward 3", "total_hazards": 9, "resolved_hazards": 6, "average_resolution_time_days": 2.8},
    {"ward": "Ward 4", "total_hazards": 7, "resolved_hazards": 3, "average_resolution_time_days": 6.5},
    {"ward": "Ward 5", "total_hazards": 6, "resolved_hazards": 4, "average_resolution_time_days": 4.0},
]

MOCK_HOTSPOTS = [
    {"id": "b1c2d3e4-0001-4000-8000-000000000001", "latitude": 13.0800, "longitude": 80.2700, "risk_score": 0.92, "predicted_date": "2026-03-15"},
    {"id": "b1c2d3e4-0002-4000-8000-000000000002", "latitude": 13.0600, "longitude": 80.2500, "risk_score": 0.85, "predicted_date": "2026-03-18"},
    {"id": "b1c2d3e4-0003-4000-8000-000000000003", "latitude": 13.0450, "longitude": 80.2650, "risk_score": 0.78, "predicted_date": "2026-03-20"},
    {"id": "b1c2d3e4-0004-4000-8000-000000000004", "latitude": 13.0950, "longitude": 80.2550, "risk_score": 0.71, "predicted_date": "2026-03-22"},
    {"id": "b1c2d3e4-0005-4000-8000-000000000005", "latitude": 13.0350, "longitude": 80.2800, "risk_score": 0.65, "predicted_date": "2026-03-25"},
]


# ═══════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════

# ── POST /predict-hazard (REAL ML — no DB needed) ──
@router.post("/predict-hazard", response_model=list[HazardPrediction], status_code=200, tags=["Hazards"])
async def predict_hazard(
    image: UploadFile = File(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
):
    """Upload image and get AI prediction (real YOLO model)."""
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="Image file is missing")

    validate_image(image)
    validate_gps(latitude, longitude)

    try:
        image_bytes = await image.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read image file")

    try:
        predictions = await predict_hazard_info(
            image_bytes=image_bytes,
            content_type=image.content_type or "image/jpeg",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")

    if len(predictions) == 1 and predictions[0]["hazard_type"] == "unknown":
        return [
            HazardPrediction(
                hazard_type="none", confidence=0.0, severity_score=0.0,
                severity_level="None", estimated_repair_cost=0.0,
                message="No hazard detected"
            )
        ]

    return [
        HazardPrediction(
            hazard_type=p["hazard_type"], confidence=p["confidence"],
            severity_score=p["severity_score"], severity_level=p["severity_level"],
            estimated_repair_cost=p["estimated_repair_cost"]
        )
        for p in predictions
    ]


# ── POST /report-hazard (mock — no DB) ──
@router.post("/report-hazard", status_code=201, tags=["Hazards"])
async def report_hazard_mock(payload: dict = None):
    """Save citizen report to in-memory store so admin can see it in real-time."""
    new_id = str(uuid.uuid4())
    data = payload or {}
    report = {
        "id": new_id,
        "image_url": data.get("image_url", "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400"),
        "hazard_type": data.get("hazard_type", "pothole"),
        "severity_score": data.get("severity_score", "MEDIUM"),
        "repair_cost_estimate": data.get("repair_cost_estimate", 6000.0),
        "status": "reported",
        "latitude": data.get("latitude", 13.0827),
        "longitude": data.get("longitude", 80.2707),
        "road_type": data.get("road_type", "city road"),
        "ward": data.get("ward", "Ward 1"),
        "reported_by": data.get("reporter_username", "citizen_john"),
        "ai_confidence": data.get("confidence", 0.85),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "resolved_at": None,
    }
    # Push to in-memory store → immediately visible to admin
    CITIZEN_REPORTS.insert(0, report)
    return report


# ── GET /hazards (mock map data) ──
@router.get("/hazards", tags=["Hazards"])
async def get_hazards(
    latitude: float = Query(default=13.0827),
    longitude: float = Query(default=80.2707),
    radius: float = Query(default=5000),
    severity: str | None = Query(default=None),
    status: str | None = Query(default=None),
):
    """Return mock hazard markers for the map, placed around the requested coordinates."""
    import random
    rng = random.Random(int(latitude * 100) + int(longitude * 100)) # Stable randomness
    
    # Generate 15 dynamic markers around the user's location
    dynamic_hazards = []
    base_classes = ["pothole", "waterlogging", "broken_road_edge", "missing_manhole_cover"]
    base_severities = ["LOW", "MEDIUM", "HIGH"]
    base_statuses = ["reported", "under_review", "verified", "resolved_unverified"]
    
    # Add a Municipality Center
    dynamic_hazards.append({
        "id": "municipality-center",
        "hazard_type": "municipality_center",
        "severity_score": "DEFAULT",
        "repair_cost_estimate": 0,
        "status": "verified",
        "latitude": latitude + 0.01,
        "longitude": longitude - 0.005,
        "image_url": "https://images.unsplash.com/photo-1577983054593-9c8b056127da?w=400",
        "road_type": "hq",
        "ward": "HQ",
        "created_at": _NOW.isoformat(),
        "resolved_at": None,
    })
    
    for i in range(15):
        # random offset: bias westward to avoid ocean in coastal cities like Chennai
        lat_offset = rng.uniform(-0.04, 0.04)
        lng_offset = rng.uniform(-0.08, 0.005)
        
        hazard_type = rng.choice(base_classes)
        severity_score = rng.choice(base_severities)
        
        dynamic_hazards.append({
            "id": f"mock-{i}",
            "hazard_type": hazard_type,
            "severity_score": severity_score,
            "repair_cost_estimate": rng.randint(2000, 15000),
            "status": rng.choice(base_statuses),
            "latitude": latitude + lat_offset,
            "longitude": longitude + lng_offset,
            "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400" if hazard_type == "pothole" else "https://images.unsplash.com/photo-1584463699037-7550ec0e7e2e?w=400",
            "road_type": rng.choice(["city road", "local road", "highway"]),
            "ward": f"Ward {rng.randint(1, 15)}",
            "created_at": (_NOW - timedelta(days=i)).isoformat(),
            "resolved_at": (_NOW - timedelta(days=1)).isoformat() if severity_score == "LOW" else None,
        })

    results = dynamic_hazards
    if severity:
        results = [h for h in results if h["severity_score"] == severity.upper()]
    if status:
        results = [h for h in results if h["status"] == status]

    return results


# ── GET /leaderboard (mock) ──
@router.get("/leaderboard", response_model=list[LeaderboardEntry], tags=["Leaderboard"])
async def get_leaderboard(
    city: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
):
    """Return mock leaderboard data."""
    data = MOCK_LEADERBOARD
    if city:
        data = [u for u in data if u.get("city", "").lower() == city.lower()]
    return [LeaderboardEntry(**u) for u in data[:limit]]


# ── GET /dashboard/summary (mock) ──
@router.get("/dashboard/summary", response_model=DashboardSummary, tags=["Dashboard"])
async def dashboard_summary():
    """Mock platform-wide statistics."""
    return DashboardSummary(
        total_hazards=47,
        severe_hazards=12,
        average_repair_time_days=4.3,
        unresolved_hazards=18,
        verified_hazards=22,
    )


# ── GET /dashboard/ward-performance (mock) ──
@router.get("/dashboard/ward-performance", response_model=list[WardPerformance], tags=["Dashboard"])
async def ward_performance():
    """Mock per-ward breakdown."""
    return [WardPerformance(**w) for w in MOCK_WARDS]


# ── GET /hazard-hotspots (mock) ──
@router.get("/hazard-hotspots", response_model=list[HazardHotspot], tags=["Hotspots"])
async def get_hotspots(
    latitude: float = Query(default=13.0827),
    longitude: float = Query(default=80.2707),
):
    """Return mock hotspot predictions around the requested location."""
    import random
    rng = random.Random(int(latitude * 10) + int(longitude * 10))
    hotspots = []
    for i in range(5):
        lat_offset = rng.uniform(-0.05, 0.05)
        lng_offset = rng.uniform(-0.05, 0.05)
        hotspots.append(HazardHotspot(
            id=str(uuid.uuid4()),
            latitude=latitude + lat_offset,
            longitude=longitude + lng_offset,
            risk_score=round(rng.uniform(0.6, 0.95), 2),
            predicted_date=(_NOW + timedelta(days=i*2)).isoformat()
        ))
    return hotspots


# ── POST /confirm-repair (mock) ──
@router.post("/confirm-repair", response_model=ConfirmRepairResponse, tags=["Confirmations"])
async def confirm_repair_mock(payload: dict = None):
    """Mock repair confirmation."""
    return ConfirmRepairResponse(
        message="Confirmation recorded",
        total_confirmations=3,
        status="verified",
    )


# ── Auth stubs ──
@router.post("/auth/register", tags=["Authentication"])
async def register_mock(payload: dict = None):
    """Mock registration."""
    return {
        "id": str(uuid.uuid4()),
        "username": "DemoUser",
        "email": "demo@roadguard.com",
        "points": 0,
        "city": "Chennai",
        "created_at": _NOW.isoformat(),
    }


@router.post("/auth/login", tags=["Authentication"])
async def login_mock(payload: dict = None):
    """Mock login — returns a dummy token."""
    return {
        "access_token": "mock-jwt-token-for-local-dev",
        "token_type": "bearer",
    }


# ═══════════════════════════════════════════
# NEW ENDPOINTS — User Dashboard Features
# ═══════════════════════════════════════════

# ── GET /my-reports (user's own submitted reports) ──
@router.get("/my-reports", tags=["User Dashboard"])
async def get_my_reports():
    """Return mock list of the current user's submitted hazard reports with status tracking."""
    return [
        {
            "id": "my-001", "hazard_type": "pothole", "severity_score": "HIGH",
            "status": "verified", "latitude": 13.0820, "longitude": 80.2700,
            "repair_cost_estimate": 12000, "ward": "Ward 1",
            "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400",
            "created_at": (_NOW - timedelta(days=3)).isoformat(),
            "points_earned": 25, "admin_notes": "Repair crew dispatched. Expected fix: 2 days."
        },
        {
            "id": "my-002", "hazard_type": "waterlogging", "severity_score": "MEDIUM",
            "status": "under_review", "latitude": 13.0750, "longitude": 80.2650,
            "repair_cost_estimate": 6000, "ward": "Ward 2",
            "image_url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400",
            "created_at": (_NOW - timedelta(days=1)).isoformat(),
            "points_earned": 10, "admin_notes": None
        },
        {
            "id": "my-003", "hazard_type": "broken_road_edge", "severity_score": "LOW",
            "status": "reported", "latitude": 13.0900, "longitude": 80.2300,
            "repair_cost_estimate": 3000, "ward": "Ward 3",
            "image_url": "https://images.unsplash.com/photo-1584463699037-7550ec0e7e2e?w=400",
            "created_at": (_NOW - timedelta(hours=6)).isoformat(),
            "points_earned": 10, "admin_notes": None
        },
        {
            "id": "my-004", "hazard_type": "missing_manhole_cover", "severity_score": "HIGH",
            "status": "resolved_unverified", "latitude": 13.0650, "longitude": 80.2350,
            "repair_cost_estimate": 18000, "ward": "Ward 4",
            "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400",
            "created_at": (_NOW - timedelta(days=7)).isoformat(),
            "points_earned": 25, "admin_notes": "Manhole covered. Awaiting citizen verification."
        },
    ]


# ── GET /user/notifications (status updates on user's reports) ──
@router.get("/user/notifications", tags=["User Dashboard"])
async def get_user_notifications():
    """Return mock notifications about the user's report updates."""
    return [
        {
            "id": "notif-001", "type": "status_change",
            "title": "Your pothole report was VERIFIED!",
            "body": "Ward 1 crew confirmed the pothole on Anna Salai. Repair scheduled.",
            "hazard_id": "my-001", "read": False,
            "created_at": (_NOW - timedelta(hours=2)).isoformat()
        },
        {
            "id": "notif-002", "type": "points_earned",
            "title": "+25 Guard Points earned!",
            "body": "Thanks for reporting the pothole. You earned 25 points.",
            "hazard_id": "my-001", "read": False,
            "created_at": (_NOW - timedelta(hours=3)).isoformat()
        },
        {
            "id": "notif-003", "type": "repair_complete",
            "title": "Repair marked complete — verify it!",
            "body": "The missing manhole cover in Ward 4 was reportedly fixed. Can you verify?",
            "hazard_id": "my-004", "read": True,
            "created_at": (_NOW - timedelta(days=1)).isoformat()
        },
        {
            "id": "notif-004", "type": "status_change",
            "title": "Your waterlogging report is under review",
            "body": "A municipal officer is reviewing your report for Ward 2.",
            "hazard_id": "my-002", "read": True,
            "created_at": (_NOW - timedelta(days=1, hours=5)).isoformat()
        },
    ]


# ═══════════════════════════════════════════
# NEW ENDPOINTS — Admin Dashboard Features
# ═══════════════════════════════════════════

# ── GET /admin/verification-queue (reports pending admin approval) ──
@router.get("/admin/verification-queue", tags=["Admin Dashboard"])
async def admin_verification_queue():
    """Return citizen-submitted reports + seed data for admin verification."""
    seed_data = [
        {
            "id": "q-001", "hazard_type": "pothole", "severity_score": "HIGH",
            "status": "reported", "reported_by": "citizen_john", "ward": "Ward 1",
            "latitude": 13.0827, "longitude": 80.2707,
            "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400",
            "repair_cost_estimate": 12000, "ai_confidence": 0.91,
            "created_at": (_NOW - timedelta(hours=2)).isoformat(),
        },
        {
            "id": "q-002", "hazard_type": "waterlogging", "severity_score": "HIGH",
            "status": "reported", "reported_by": "PotholeHunter", "ward": "Ward 2",
            "latitude": 13.0700, "longitude": 80.2400,
            "image_url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400",
            "repair_cost_estimate": 15000, "ai_confidence": 0.87,
            "created_at": (_NOW - timedelta(hours=5)).isoformat(),
        },
        {
            "id": "q-003", "hazard_type": "missing_manhole_cover", "severity_score": "HIGH",
            "status": "reported", "reported_by": "SafeStreetsArun", "ward": "Ward 4",
            "latitude": 13.0780, "longitude": 80.2200,
            "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400",
            "repair_cost_estimate": 18000, "ai_confidence": 0.94,
            "created_at": (_NOW - timedelta(hours=8)).isoformat(),
        },
    ]
    # Citizen-submitted reports appear at the top of the queue
    return CITIZEN_REPORTS + seed_data


# ── POST /admin/verify-hazard (approve or reject a report) ──
@router.post("/admin/verify-hazard", tags=["Admin Dashboard"])
async def admin_verify_hazard(payload: dict = None):
    """Mock: admin approves or rejects a hazard report."""
    action = (payload or {}).get("action", "approve")
    return {
        "message": f"Hazard {action}d successfully",
        "new_status": "verified" if action == "approve" else "rejected",
        "hazard_id": (payload or {}).get("hazard_id", "unknown"),
    }


# ── GET /admin/repair-costs (budget overview by hazard type) ──
@router.get("/admin/repair-costs", tags=["Admin Dashboard"])
async def admin_repair_costs():
    """Return mock repair cost breakdown for admin budget planning."""
    return {
        "total_estimated_cost": 285000,
        "total_spent": 142000,
        "remaining_budget": 500000,
        "by_type": [
            {"hazard_type": "pothole", "count": 18, "total_cost": 96000, "avg_cost": 5333},
            {"hazard_type": "waterlogging", "count": 8, "total_cost": 72000, "avg_cost": 9000},
            {"hazard_type": "broken_road_edge", "count": 11, "total_cost": 55000, "avg_cost": 5000},
            {"hazard_type": "missing_manhole_cover", "count": 6, "total_cost": 62000, "avg_cost": 10333},
        ],
        "by_ward": [
            {"ward": "Ward 1", "total_cost": 78000, "resolved_cost": 45000},
            {"ward": "Ward 2", "total_cost": 62000, "resolved_cost": 30000},
            {"ward": "Ward 3", "total_cost": 48000, "resolved_cost": 28000},
            {"ward": "Ward 4", "total_cost": 55000, "resolved_cost": 22000},
            {"ward": "Ward 5", "total_cost": 42000, "resolved_cost": 17000},
        ]
    }


# ── POST /admin/assign-repair (schedule a repair) ──
@router.post("/admin/assign-repair", tags=["Admin Dashboard"])
async def admin_assign_repair(payload: dict = None):
    """Mock: admin assigns/schedules a repair for a verified hazard."""
    return {
        "message": "Repair scheduled successfully",
        "hazard_id": (payload or {}).get("hazard_id", "unknown"),
        "assigned_contractor": "Metro Roads Pvt Ltd",
        "estimated_completion": (_NOW + timedelta(days=3)).isoformat(),
        "priority": (payload or {}).get("priority", "normal"),
    }

