"""ConfirmSignup Lambda: confirms a Cognito user and redirects to the sign-in page.

Invoked via Lambda Function URL (no API Gateway) to avoid circular dependency.
Receives ?code=...&email=... query params from the confirmation email link.
"""

import os
import logging
import urllib.parse

import boto3

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:8080")
USER_POOL_CLIENT_ID = os.environ.get("USER_POOL_CLIENT_ID", "")

cognito = boto3.client("cognito-idp")


def _redirect(path: str, params: dict | None = None) -> dict:
    """Return a 302 redirect response for Lambda Function URL."""
    url = f"{FRONTEND_URL.rstrip('/')}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    return {
        "statusCode": 302,
        "headers": {"Location": url},
        "body": "",
    }


def lambda_handler(event, context):
    """Confirm sign-up and redirect to the app."""
    # Lambda Function URL puts query params in event differently than API Gateway
    query = event.get("queryStringParameters") or {}
    code = query.get("code", "")
    email = query.get("email", "")

    if not code or not email:
        logger.warning("Missing code or email in query params")
        return _redirect("/signin", {"error": "confirmation_failed"})

    logger.info("Confirming sign-up for %s", email)

    try:
        cognito.confirm_sign_up(
            ClientId=USER_POOL_CLIENT_ID,
            Username=email,
            ConfirmationCode=code,
        )
        logger.info("Successfully confirmed %s", email)
        return _redirect("/signin", {"confirmed": "true"})

    except cognito.exceptions.ExpiredCodeException:
        logger.warning("Expired confirmation code for %s", email)
        return _redirect("/signin", {"error": "code_expired"})

    except cognito.exceptions.NotAuthorizedException:
        # User already confirmed — treat as success (idempotent)
        logger.info("User %s already confirmed", email)
        return _redirect("/signin", {"confirmed": "true"})

    except cognito.exceptions.CodeMismatchException:
        logger.warning("Invalid confirmation code for %s", email)
        return _redirect("/signin", {"error": "confirmation_failed"})

    except Exception:
        logger.exception("Unexpected error confirming %s", email)
        return _redirect("/signin", {"error": "confirmation_failed"})
