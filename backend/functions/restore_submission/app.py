import logging

from shared.response import success, not_found, server_error
from shared.db import get_latest_archived_version, update_submission_status

logger = logging.getLogger()


def lambda_handler(event, context):
    submission_id = event["pathParameters"]["id"]

    current = get_latest_archived_version(submission_id)
    if not current:
        return not_found(f"No archived submission found with id {submission_id}")

    version = int(current["version"])

    try:
        update_submission_status(submission_id, version, "active")
    except Exception:
        logger.exception("DynamoDB operation failed")
        return server_error("Failed to restore submission")

    return success({
        "submissionId": submission_id,
        "version": version,
        "message": "Submission restored successfully",
    })
