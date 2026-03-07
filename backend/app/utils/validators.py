"""
Request validation utilities — file type, GPS coordinates, image size.
"""

from fastapi import HTTPException, UploadFile, status

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def validate_image(file: UploadFile) -> None:
    """Raise 400 if uploaded file is not a valid JPEG/PNG or exceeds size cap."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image type '{file.content_type}'. Allowed: JPEG, PNG.",
        )
    # Check size (if available in headers)
    if file.size and file.size > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image exceeds {MAX_IMAGE_SIZE_BYTES // (1024*1024)} MB limit.",
        )


def validate_gps(latitude: float, longitude: float) -> None:
    """Raise 400 if GPS coordinates are outside valid range."""
    if not (-90 <= latitude <= 90):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid latitude: {latitude}. Must be between -90 and 90.",
        )
    if not (-180 <= longitude <= 180):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid longitude: {longitude}. Must be between -180 and 180.",
        )
