import json
import uuid
import logging
from datetime import datetime, timezone

from shared.response import created, error, server_error
from shared.identity import get_user_identity
from shared.validator import validate_submission, ValidationError
from shared.db import put_submission

logger = logging.getLogger()


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return error("Invalid JSON in request body")

    try:
        validate_submission(body)
    except ValidationError as e:
        return error("Validation failed", 400, e.errors)

    user = get_user_identity(event)
    now = datetime.now(timezone.utc).isoformat()
    submission_id = str(uuid.uuid4())

    item = {
        **body,
        "submissionId": submission_id,
        "version": 1,
        "status": "active",
        "userId": user["user_id"],
        "modifiedBy": user["user_id"],
        "createdAt": now,
        "updatedAt": now,
    }

    try:
        put_submission(item)
    except Exception:
        logger.exception("DynamoDB put failed")
        return server_error("Failed to save submission")

    return created({
        "submissionId": submission_id,
        "version": 1,
        "message": "Submission created successfully",
    })
