import logging
from datetime import datetime, timezone

from shared.response import success, not_found, server_error
from shared.identity import get_user_identity
from shared.db import get_latest_active_version, put_submission, mark_superseded

logger = logging.getLogger()


def lambda_handler(event, context):
    submission_id = event["pathParameters"]["id"]

    current = get_latest_active_version(submission_id)
    if not current:
        return not_found(f"No active submission found with id {submission_id}")

    user = get_user_identity(event)
    now = datetime.now(timezone.utc).isoformat()
    new_version = int(current["version"]) + 1

    archived_item = {
        **current,
        "version": new_version,
        "status": "archived",
        "modifiedBy": user["user_id"],
        "createdAt": now,
        "updatedAt": now,
    }

    try:
        mark_superseded(submission_id, int(current["version"]))
        put_submission(archived_item)
    except Exception:
        logger.exception("DynamoDB operation failed")
        return server_error("Failed to archive submission")

    return success({
        "submissionId": submission_id,
        "version": new_version,
        "message": "Submission archived successfully",
    })
