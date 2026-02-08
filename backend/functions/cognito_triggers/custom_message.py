"""CustomMessage trigger: branded HTML emails for signup confirmation and password reset."""

import os
import logging
import urllib.parse

import boto3

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

CONFIRM_SIGNUP_FUNCTION_NAME = os.environ.get("CONFIRM_SIGNUP_FUNCTION_NAME", "")

_confirm_signup_url_cache = None
_lambda_client = boto3.client("lambda")


def _get_confirm_signup_url() -> str:
    """Look up the ConfirmSignup Lambda Function URL and cache it."""
    global _confirm_signup_url_cache
    if _confirm_signup_url_cache is None:
        resp = _lambda_client.get_function_url_config(
            FunctionName=CONFIRM_SIGNUP_FUNCTION_NAME
        )
        _confirm_signup_url_cache = resp["FunctionUrl"]
        logger.info("Resolved confirm signup URL: %s", _confirm_signup_url_cache)
    return _confirm_signup_url_cache

BRAND_GREEN = "#006644"
BRAND_GOLD = "#C4A747"


def _email_wrapper(body_html: str) -> str:
    """Wrap body content in the branded email shell."""
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fcfcfc;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fcfcfc;">
<tr><td align="center" style="padding:24px 16px;">
  <!-- Header -->
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="background-color:{BRAND_GREEN};padding:20px 24px;border-radius:8px 8px 0 0;">
    <span style="color:#ffffff;font-size:20px;font-weight:bold;">MELIAF Study Stocktake</span>
  </td></tr>
  <!-- Body -->
  <tr><td style="background-color:#ffffff;padding:32px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
    {body_html}
  </td></tr>
  <!-- Footer -->
  <tr><td style="background-color:#ffffff;padding:16px 24px;border-top:1px solid #e5e7eb;border-radius:0 0 8px 8px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
    <span style="color:#9ca3af;font-size:12px;">CGIAR &mdash; MELIAF Study Stocktake</span>
  </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>"""


def _confirmation_email(code: str, email: str) -> tuple[str, str]:
    """Build subject and HTML body for signup confirmation."""
    subject = "MELIAF Study Stocktake \u2014 Verify your email"

    confirm_url = _get_confirm_signup_url()
    encoded_email = urllib.parse.quote(email, safe="")
    link = f"{confirm_url}?code={code}&email={encoded_email}"

    body = f"""\
<h2 style="color:#1a2e1a;margin:0 0 16px;">Verify your email address</h2>
<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
  Thanks for signing up for MELIAF Study Stocktake. Click the button below to verify your email address and activate your account.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
<tr><td style="background-color:{BRAND_GREEN};border-radius:6px;padding:12px 28px;">
  <a href="{link}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;display:inline-block;">Verify my email</a>
</td></tr>
</table>
<p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0 0 8px;">
  Or copy and paste this link into your browser:
</p>
<p style="color:#6b7280;font-size:13px;word-break:break-all;margin:0 0 16px;">
  <a href="{link}" style="color:{BRAND_GREEN};">{link}</a>
</p>
<p style="color:#9ca3af;font-size:12px;margin:0;">This link expires in 24 hours.</p>"""

    return subject, _email_wrapper(body)


def _forgot_password_email(code: str) -> tuple[str, str]:
    """Build subject and HTML body for password reset."""
    subject = "MELIAF Study Stocktake \u2014 Password reset code"

    body = f"""\
<h2 style="color:#1a2e1a;margin:0 0 16px;">Reset your password</h2>
<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
  Use the code below to reset your MELIAF Study Stocktake password. Enter it on the password reset page.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;text-align:center;width:100%;">
<tr><td style="border:2px solid {BRAND_GOLD};border-radius:8px;padding:16px 32px;background-color:#fffdf5;">
  <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a2e1a;">{code}</span>
</td></tr>
</table>
<p style="color:#9ca3af;font-size:12px;margin:0;">If you didn't request this, you can safely ignore this email.</p>"""

    return subject, _email_wrapper(body)


def lambda_handler(event, context):
    """Route CustomMessage triggers to branded email templates."""
    trigger_source = event.get("triggerSource", "")
    code = event["request"].get("codeParameter", "{####}")
    email = event["request"]["userAttributes"].get("email", "")

    logger.info("CustomMessage trigger: %s for %s", trigger_source, email)

    if trigger_source in ("CustomMessage_SignUp", "CustomMessage_ResendCode"):
        subject, html = _confirmation_email(code, email)
        event["response"]["emailSubject"] = subject
        event["response"]["emailMessage"] = html

    elif trigger_source == "CustomMessage_ForgotPassword":
        subject, html = _forgot_password_email(code)
        event["response"]["emailSubject"] = subject
        event["response"]["emailMessage"] = html

    else:
        logger.info("Unhandled trigger source: %s — using Cognito defaults", trigger_source)

    return event
