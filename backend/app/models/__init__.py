"""
Models barrel export — import all models so SQLAlchemy metadata registers them.
"""

from app.models.user import User  # noqa: F401
from app.models.hazard import Hazard, HazardStatus  # noqa: F401
from app.models.hazard_confirmation import HazardConfirmation  # noqa: F401
from app.models.hazard_prediction import HazardPrediction  # noqa: F401
from app.models.municipal_repair import MunicipalRepair  # noqa: F401
