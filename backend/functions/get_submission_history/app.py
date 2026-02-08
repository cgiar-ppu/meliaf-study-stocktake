import logging

from shared.response import success, not_found, server_error
from shared.db import get_version_history

logger = logging.getLogger()


def lambda_handler(event, context):
    submission_id = event["pathParameters"]["id"]

    try:
        items = get_version_history(submission_id)
    except Exception:
        logger.exception("DynamoDB query failed")
        return server_error("Failed to get submission history")

    if not items:
        return not_found(f"No submission found with id {submission_id}")

    return success({
        "submissionId": submission_id,
        "versions": items,
        "count": len(items),
    })
