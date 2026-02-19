import json
import logging
import os

import boto3

from shared.identity import get_user_identity
from shared.response import error, server_error, success

logger = logging.getLogger()

MAX_USER_IDS = 25


def lambda_handler(event, context):
    # Enforce authentication
    try:
        get_user_identity(event)
    except Exception:
        return error("Authentication required", 401)

    # Parse body
    try:
        body = json.loads(event.get("body") or "{}")
    except (json.JSONDecodeError, TypeError):
        return error("Invalid JSON body")

    user_ids = body.get("userIds")
    if not isinstance(user_ids, list) or len(user_ids) == 0:
        return error("userIds must be a non-empty list")

    if len(user_ids) > MAX_USER_IDS:
        return error(f"Maximum {MAX_USER_IDS} user IDs per request")

    # Deduplicate
    unique_ids = list(set(user_ids))

    table_name = os.environ["USERS_TABLE"]

    try:
        dynamodb = boto3.resource("dynamodb")
        response = dynamodb.batch_get_item(
            RequestItems={
                table_name: {
                    "Keys": [{"userId": uid} for uid in unique_ids],
                    "ProjectionExpression": "userId, email, #n",
                    "ExpressionAttributeNames": {"#n": "name"},
                }
            }
        )
    except Exception:
        logger.exception("DynamoDB batch_get_item failed")
        return server_error("Failed to look up users")

    items = response.get("Responses", {}).get(table_name, [])
    users = {item["userId"]: item for item in items}

    return success({"users": users})
