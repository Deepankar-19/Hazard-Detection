"""
ML module unit tests — severity scoring and cost estimation.
"""

import pytest

from app.ml.severity import compute_severity
from app.ml.cost_estimator import estimate_cost, BASE_COST_INR


class TestSeverity:
    def test_low_severity(self):
        assert compute_severity(0.05) == "LOW"

    def test_medium_severity(self):
        assert compute_severity(0.15) == "MEDIUM"

    def test_high_severity(self):
        assert compute_severity(0.30) == "HIGH"

    def test_boundary_low_medium(self):
        assert compute_severity(0.10) == "MEDIUM"

    def test_boundary_medium_high(self):
        assert compute_severity(0.25) == "MEDIUM"

    def test_zero(self):
        assert compute_severity(0.0) == "LOW"


class TestCostEstimator:
    def test_low_local(self):
        cost = estimate_cost("pothole", "LOW", "local road")
        assert cost == BASE_COST_INR * 1 * 1  # 2000

    def test_medium_city(self):
        cost = estimate_cost("pothole", "MEDIUM", "city road")
        assert cost == BASE_COST_INR * 2 * 1.5  # 6000

    def test_high_highway(self):
        cost = estimate_cost("pothole", "HIGH", "highway")
        assert cost == BASE_COST_INR * 4 * 3  # 24000

    def test_unknown_defaults(self):
        cost = estimate_cost("unknown", "UNKNOWN_SEV", "unknown_road")
        # Falls back to multiplier 1.0 for both unknowns
        assert cost == BASE_COST_INR * 1.0 * 1.0
