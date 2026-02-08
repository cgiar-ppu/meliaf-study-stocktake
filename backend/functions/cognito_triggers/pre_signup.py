"""Pre Sign-Up trigger: validate email domain against allowed list."""

import os
import logging

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

ALLOWED_DOMAINS = [
    d.strip().lower()
    for d in os.environ.get("ALLOWED_EMAIL_DOMAINS", "").split(",")
    if d.strip()
]


def lambda_handler(event, context):
    """Reject sign-ups from disallowed email domains."""
    email = event["request"]["userAttributes"].get("email", "")
    domain = email.rsplit("@", 1)[-1].lower() if "@" in email else ""

    logger.info("Pre sign-up check for domain: %s", domain)

    if not ALLOWED_DOMAINS:
        logger.warning("No allowed domains configured — allowing all")
        return event

    if domain not in ALLOWED_DOMAINS:
        raise Exception(
            f"Email domain '{domain}' is not allowed. "
            f"Please use an email from: {', '.join(ALLOWED_DOMAINS)}"
        )

    return event
