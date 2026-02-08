"""User identity extraction from Cognito JWT claims (API Gateway authorizer)."""

import os
import logging

logger = logging.getLogger()

DEV_USER = {
    "user_id": "dev-user-001",
    "email": "developer@cgiar.org",
}


def get_user_identity(event):
    """Extract user identity from API Gateway Cognito authorizer claims.

    In dev/test environments, falls back to a hardcoded dev user when no
    authorizer claims are present (e.g. local invocation, tests).
    In staging/prod, missing claims raise an error.
    """
    claims = (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("claims")
    )

    if claims:
        return {
            "user_id": claims["sub"],
            "email": claims.get("email", ""),
        }

    env = os.environ.get("ENVIRONMENT", "dev")
    if env in ("dev", "test"):
        logger.warning("No authorizer claims — using dev user fallback")
        return DEV_USER

    raise RuntimeError("Missing authorizer claims — authentication required")
