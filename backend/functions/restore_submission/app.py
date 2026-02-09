import logging
from datetime import datetime, timezone

from shared.response import success, not_found, server_error
from shared.identity import get_user_identity
from shared.db import get_latest_archived_version, put_submission, mark_superseded

logger = logging.getLogger()


def lambda_handler(event, context):
    submission_id = event["pathParameters"]["id"]

    current = get_latest_archived_version(submission_id)
    if not current:
        return not_found(f"No archived submission found with id {submission_id}")

    user = get_user_identity(event)
    now = datetime.now(timezone.utc).isoformat()
    new_version = int(current["version"]) + 1

    restored_item = {
        **current,
        "version": new_version,
        "status": "active",
        "modifiedBy": user["user_id"],
        "createdAt": now,
        "updatedAt": now,
    }

    try:
        mark_superseded(submission_id, int(current["version"]))
        put_submission(restored_item)
    except Exception:
        logger.exception("DynamoDB operation failed")
        return server_error("Failed to restore submission")

    return success({
        "submissionId": submission_id,
        "version": new_version,
        "message": "Submission restored successfully",
    })
