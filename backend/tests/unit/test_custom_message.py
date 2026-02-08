"""Tests for CustomMessage Cognito trigger (branded email templates)."""

from unittest.mock import patch
import cognito_triggers.custom_message as cm
from cognito_triggers.custom_message import lambda_handler

MOCK_FUNCTION_URL = "https://abc123.lambda-url.eu-central-1.on.aws/"


def _make_event(trigger_source, email="jane@cgiar.org", code="123456"):
    return {
        "triggerSource": trigger_source,
        "request": {
            "codeParameter": code,
            "userAttributes": {"email": email},
        },
        "response": {
            "emailSubject": "",
            "emailMessage": "",
        },
    }


@patch.object(cm, "_get_confirm_signup_url", return_value=MOCK_FUNCTION_URL)
class TestSignUpConfirmation:
    def test_subject_set(self, _mock):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        assert "Verify your email" in result["response"]["emailSubject"]

    def test_html_contains_brand(self, _mock):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "MELIAF Study Stocktake" in html

    def test_html_contains_green_header(self, _mock):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "#006644" in html

    def test_html_contains_verify_button(self, _mock):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "Verify my email" in html

    def test_link_includes_code_and_email(self, _mock):
        event = _make_event("CustomMessage_SignUp", email="bob@cgiar.org", code="{####}")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        # {####} must appear literally (not URL-encoded) so Cognito can replace it
        assert "code={####}" in html
        assert "email=bob%40cgiar.org" in html

    def test_link_points_to_function_url(self, _mock):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert MOCK_FUNCTION_URL in html

    def test_expiry_note(self, _mock):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "expires in 24 hours" in html

    def test_footer_present(self, _mock):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "CGIAR" in html


class TestForgotPassword:
    def test_subject_set(self):
        event = _make_event("CustomMessage_ForgotPassword")
        result = lambda_handler(event, None)
        assert "Password reset code" in result["response"]["emailSubject"]

    def test_html_contains_code(self):
        event = _make_event("CustomMessage_ForgotPassword", code="987654")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "987654" in html

    def test_html_contains_gold_border(self):
        event = _make_event("CustomMessage_ForgotPassword")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "#C4A747" in html

    def test_html_contains_safety_note(self):
        event = _make_event("CustomMessage_ForgotPassword")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "safely ignore" in html


@patch.object(cm, "_get_confirm_signup_url", return_value=MOCK_FUNCTION_URL)
class TestResendCode:
    """CustomMessage_ResendCode should produce the same branded email as SignUp."""

    def test_subject_set(self, _mock):
        event = _make_event("CustomMessage_ResendCode")
        result = lambda_handler(event, None)
        assert "Verify your email" in result["response"]["emailSubject"]

    def test_html_contains_brand(self, _mock):
        event = _make_event("CustomMessage_ResendCode")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "MELIAF Study Stocktake" in html

    def test_html_contains_verify_button(self, _mock):
        event = _make_event("CustomMessage_ResendCode")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "Verify my email" in html

    def test_link_includes_code_and_email(self, _mock):
        event = _make_event("CustomMessage_ResendCode", email="bob@cgiar.org", code="{####}")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "code={####}" in html
        assert "email=bob%40cgiar.org" in html


class TestUnhandledTriggers:
    def test_unknown_trigger_uses_defaults(self):
        event = _make_event("CustomMessage_AdminCreateUser")
        result = lambda_handler(event, None)
        assert result["response"]["emailSubject"] == ""
        assert result["response"]["emailMessage"] == ""

    def test_returns_event(self):
        event = _make_event("CustomMessage_AdminCreateUser")
        result = lambda_handler(event, None)
        assert result is event
