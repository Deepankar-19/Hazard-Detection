"""
Severity scoring based on bounding-box area ratio.

Mapping:
  area_ratio < 0.10   → LOW
  0.10 – 0.25         → MEDIUM
  > 0.25              → HIGH
"""


from typing import Any

def compute_severity(area_ratio: float) -> dict[str, Any]:
    """Convert a detection area ratio to a severity score and level."""
    if area_ratio < 0.10:
        level = "Low"
    elif area_ratio <= 0.25:
        level = "Medium"
    else:
        level = "High"
        
    return {
        "severity_score": round(area_ratio, 4),
        "severity_level": level
    }
