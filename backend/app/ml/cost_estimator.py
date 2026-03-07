"""
Repair cost estimation.

Formula:  cost = base_cost × severity_multiplier × road_type_factor

Base cost:  ₹2 000

Severity multiplier:
  LOW    → 1
  MEDIUM → 2
  HIGH   → 4

Road-type factor:
  local road → 1.0
  city road  → 1.5
  highway    → 3.0
"""

BASE_COST_INR = 2000

SEVERITY_MULTIPLIER: dict[str, float] = {
    "LOW": 1.0,
    "MEDIUM": 2.0,
    "HIGH": 4.0,
}

ROAD_TYPE_FACTOR: dict[str, float] = {
    "local road": 1.0,
    "city road": 1.5,
    "highway": 3.0,
}


def estimate_cost(
    hazard_type: str,
    severity: str,
    road_type: str = "local road",
) -> float:
    """Return estimated repair cost in INR."""
    sev_mult = SEVERITY_MULTIPLIER.get(severity, 1.0)
    road_mult = ROAD_TYPE_FACTOR.get(road_type.lower().strip(), 1.0)
    return BASE_COST_INR * sev_mult * road_mult
