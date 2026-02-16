"""Generate a presigned S3 PUT URL for file uploads."""

import json
import os
import uuid
import logging

import boto3
from botocore.config import Config

from shared.response import success, error, not_found, server_error
from shared.identity import get_user_identity
from shared.db import get_latest_active_version

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

s3_client = boto3.client(
    "s3",
    region_name=os.environ.get("AWS_REGION", "eu-central-1"),
    config=Config(signature_version="s3v4"),
)

FILES_BUCKET = os.environ["FILES_BUCKET"]

ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/gif",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
PRESIGNED_URL_EXPIRY = 300  # 5 minutes


def lambda_handler(event, context):
    try:
        get_user_identity(event)  # auth check

        submission_id = event.get("pathParameters", {}).get("id")
        if not submission_id:
            return error("Missing submission ID", 400)

        body = json.loads(event.get("body") or "{}")
        filename = body.get("filename", "").strip()
        content_type = body.get("contentType", "").strip()

        if not filename:
            return error("filename is required", 400)
        if not content_type:
            return error("contentType is required", 400)
        if content_type not in ALLOWED_CONTENT_TYPES:
            return error(f"Content type not allowed: {content_type}. Allowed: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}", 400)

        # Look up submission to get createdAt for S3 prefix
        submission = get_latest_active_version(submission_id)
        if not submission:
            return not_found("Submission not found")

        created_at = str(submission.get("createdAt", ""))[:10]  # YYYY-MM-DD
        short_uuid = uuid.uuid4().hex[:8]
        safe_filename = filename.replace("/", "_").replace("\\", "_")
        s3_key = f"{created_at}_{submission_id}/files/{short_uuid}_{safe_filename}"

        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": FILES_BUCKET,
                "Key": s3_key,
                "ContentType": content_type,
            },
            ExpiresIn=PRESIGNED_URL_EXPIRY,
        )

        return success({
            "uploadUrl": presigned_url,
            "key": s3_key,
            "filename": safe_filename,
        })

    except Exception as e:
        logger.exception("Error generating upload URL")
        return server_error(str(e))
