"""
Object storage service — uploads hazard images to S3 / MinIO.
"""

import uuid
from io import BytesIO

import boto3
from botocore.config import Config as BotoConfig

from app.config import get_settings

settings = get_settings()

_s3_client = None


def _get_s3():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
            config=BotoConfig(signature_version="s3v4"),
        )
        # Ensure bucket exists
        try:
            _s3_client.head_bucket(Bucket=settings.S3_BUCKET_NAME)
        except Exception:
            _s3_client.create_bucket(Bucket=settings.S3_BUCKET_NAME)
    return _s3_client


def upload_image(file_bytes: bytes, content_type: str) -> str:
    """
    Upload image bytes to S3/MinIO and return the public URL.
    """
    s3 = _get_s3()
    key = f"hazards/{uuid.uuid4().hex}.{'png' if 'png' in content_type else 'jpg'}"

    s3.upload_fileobj(
        BytesIO(file_bytes),
        settings.S3_BUCKET_NAME,
        key,
        ExtraArgs={"ContentType": content_type},
    )

    url = f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET_NAME}/{key}"
    return url
