"""List files for a submission and return presigned GET URLs."""

import os
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

DOWNLOAD_URL_EXPIRY = 3600  # 1 hour


def lambda_handler(event, context):
    try:
        get_user_identity(event)  # auth check

        submission_id = event.get("pathParameters", {}).get("id")
        if not submission_id:
            return error("Missing submission ID", 400)

        # Look up submission to get createdAt for S3 prefix
        submission = get_latest_active_version(submission_id)
        if not submission:
            return not_found("Submission not found")

        created_at = str(submission.get("createdAt", ""))[:10]  # YYYY-MM-DD
        prefix = f"{created_at}_{submission_id}/files/"

        response = s3_client.list_objects_v2(
            Bucket=FILES_BUCKET,
            Prefix=prefix,
        )

        files = []
        for obj in response.get("Contents", []):
            key = obj["Key"]
            # Extract filename: strip prefix and the short UUID prefix (8 chars + underscore)
            name_part = key[len(prefix):]
            # The format is {shortUuid}_{originalFilename}
            if "_" in name_part:
                display_name = name_part.split("_", 1)[1]
            else:
                display_name = name_part

            download_url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": FILES_BUCKET, "Key": key},
                ExpiresIn=DOWNLOAD_URL_EXPIRY,
            )

            files.append({
                "key": key,
                "filename": display_name,
                "size": obj["Size"],
                "downloadUrl": download_url,
            })

        return success({"files": files})

    except Exception as e:
        logger.exception("Error listing files")
        return server_error(str(e))
