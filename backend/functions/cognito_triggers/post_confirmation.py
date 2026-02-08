"""Post Confirmation trigger: create user entity in DynamoDB after email verification."""

import os
import logging
from datetime import datetime, timezone

import boto3

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

USERS_TABLE = os.environ.get("USERS_TABLE", "")


def lambda_handler(event, context):
    """Write user record to DynamoDB on confirmed sign-up (not forgot-password)."""
    trigger_source = event.get("triggerSource", "")
    logger.info("Post confirmation trigger: %s", trigger_source)

    # Only act on sign-up confirmation, not forgot-password confirmation
    if trigger_source != "PostConfirmation_ConfirmSignUp":
        logger.info("Skipping non-signup trigger: %s", trigger_source)
        return event

    attrs = event["request"]["userAttributes"]
    user_id = attrs["sub"]
    email = attrs.get("email", "")
    name = attrs.get("name", "")
    now = datetime.now(timezone.utc).isoformat()

    table = boto3.resource("dynamodb").Table(USERS_TABLE)

    # Idempotent: use condition to avoid overwriting an existing user
    try:
        table.put_item(
            Item={
                "userId": user_id,
                "email": email,
                "name": name,
                "createdAt": now,
                "updatedAt": now,
            },
            ConditionExpression="attribute_not_exists(userId)",
        )
        logger.info("Created user entity for %s", user_id)
    except table.meta.client.exceptions.ConditionalCheckFailedException:
        logger.info("User %s already exists — skipping", user_id)

    return event
