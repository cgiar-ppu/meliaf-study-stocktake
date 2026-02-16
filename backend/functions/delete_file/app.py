"""Delete a file from S3 for a submission."""

import os
import logging
from urllib.parse import unquote

import boto3
from botocore.config import Config

from shared.response import success, error, not_found, server_error
from shared.identity import get_user_identity
from shared.db import get_latest_active_version

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

AWS_REGION = os.environ.get("AWS_REGION", "eu-central-1")

s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    config=Config(
        signature_version="s3v4",
        s3={"addressing_style": "virtual"},
    ),
)

FILES_BUCKET = os.environ["FILES_BUCKET"]


def lambda_handler(event, context):
    try:
        get_user_identity(event)  # auth check

        submission_id = event.get("pathParameters", {}).get("id")
        encoded_filename = event.get("pathParameters", {}).get("filename")
        if not submission_id or not encoded_filename:
            return error("Missing submission ID or filename", 400)

        filename = unquote(encoded_filename)

        # Look up submission to get createdAt for S3 prefix
        submission = get_latest_active_version(submission_id)
        if not submission:
            return not_found("Submission not found")

        created_at = str(submission.get("createdAt", ""))[:10]  # YYYY-MM-DD
        prefix = f"{created_at}_{submission_id}/files/"

        # Find the matching file key (we need to match by display name)
        response = s3_client.list_objects_v2(
            Bucket=FILES_BUCKET,
            Prefix=prefix,
        )

        target_key = None
        for obj in response.get("Contents", []):
            key = obj["Key"]
            name_part = key[len(prefix):]
            if "_" in name_part:
                display_name = name_part.split("_", 1)[1]
            else:
                display_name = name_part

            if display_name == filename:
                target_key = key
                break

        if not target_key:
            return not_found(f"File not found: {filename}")

        s3_client.delete_object(Bucket=FILES_BUCKET, Key=target_key)

        return success({"message": f"File deleted: {filename}"})

    except Exception as e:
        logger.exception("Error deleting file")
        return server_error(str(e))
