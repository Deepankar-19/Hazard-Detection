"""
Hotspot prediction model using RandomForestRegressor.

Input features (per grid cell):
  - historical_hazard_density
  - rainfall
  - traffic_intensity
  - road_age
  - nearby_construction

Output:
  - risk_score  (probability of hazard within 30 days, 0–1)

The model is trained on synthetic/simulated data for demonstration.
In production, replace with real data from municipal datasets.
"""

from __future__ import annotations

import pickle
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestRegressor

MODEL_PATH = Path(__file__).parent / "hotspot_rf_model.pkl"

FEATURE_NAMES = [
    "historical_hazard_density",
    "rainfall",
    "traffic_intensity",
    "road_age",
    "nearby_construction",
]

_model: RandomForestRegressor | None = None


# ── Training (simulated) ──

def _generate_training_data(n: int = 2000, seed: int = 42):
    """Generate synthetic training data for demo purposes."""
    rng = np.random.RandomState(seed)

    X = np.column_stack([
        rng.uniform(0, 50, n),    # historical_hazard_density
        rng.uniform(0, 500, n),   # rainfall (mm)
        rng.uniform(0, 1, n),     # traffic_intensity (0–1)
        rng.uniform(0, 50, n),    # road_age (years)
        rng.uniform(0, 1, n),     # nearby_construction (0–1)
    ])

    # Synthetic target: higher density, more rain, older road → higher risk
    y = (
        0.3 * (X[:, 0] / 50)
        + 0.25 * (X[:, 1] / 500)
        + 0.15 * X[:, 2]
        + 0.2 * (X[:, 3] / 50)
        + 0.1 * X[:, 4]
        + rng.normal(0, 0.05, n)
    )
    y = np.clip(y, 0, 1)
    return X, y


def train_model() -> RandomForestRegressor:
    """Train on simulated data and persist to disk."""
    X, y = _generate_training_data()
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X, y)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    return model


# ── Inference ──

def load_model() -> RandomForestRegressor:
    """Load persisted model, training a new one if needed."""
    global _model
    if _model is not None:
        return _model
    if MODEL_PATH.exists():
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
    else:
        _model = train_model()
    return _model


def predict_risk(features: dict[str, float]) -> float:
    """
    Predict risk score for a location.

    Parameters
    ----------
    features : dict mapping feature name → value
        Keys must include all FEATURE_NAMES.

    Returns
    -------
    float : risk_score in [0, 1]
    """
    model = load_model()
    x = np.array([[features.get(f, 0.0) for f in FEATURE_NAMES]])
    score = float(model.predict(x)[0])
    return max(0.0, min(1.0, score))
