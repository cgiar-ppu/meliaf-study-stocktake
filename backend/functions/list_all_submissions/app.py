import logging

from shared.response import success, server_error
from shared.identity import get_user_identity
from shared.db import list_all_submissions

logger = logging.getLogger()


def lambda_handler(event, context):
    get_user_identity(event)  # require auth but don't filter by user
    params = event.get("queryStringParameters") or {}
    status_filter = params.get("status", "active")

    try:
        items = list_all_submissions(status_filter)
    except Exception:
        logger.exception("DynamoDB query failed")
        return server_error("Failed to list submissions")

    return success({
        "submissions": items,
        "count": len(items),
    })
