"""
Severity scoring based on bounding-box area ratio.

Mapping:
  area_ratio < 0.10   → LOW
  0.10 – 0.25         → MEDIUM
  > 0.25              → HIGH
"""


def compute_severity(area_ratio: float) -> str:
    """Convert a detection area ratio to a severity label."""
    if area_ratio < 0.10:
        return "LOW"
    elif area_ratio <= 0.25:
        return "MEDIUM"
    else:
        return "HIGH"
