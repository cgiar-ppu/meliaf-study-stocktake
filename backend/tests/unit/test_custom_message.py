"""Tests for CustomMessage Cognito trigger (branded email templates)."""

from cognito_triggers.custom_message import lambda_handler


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


class TestSignUpConfirmation:
    def test_subject_set(self):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        assert "Verify your email" in result["response"]["emailSubject"]

    def test_html_contains_brand(self):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "MELIAF Study Stocktake" in html

    def test_html_contains_green_header(self):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "#006644" in html

    def test_html_contains_verify_button(self):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "Verify my email" in html

    def test_link_includes_code_and_email(self):
        event = _make_event("CustomMessage_SignUp", email="bob@cgiar.org", code="ABC123")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "code=ABC123" in html
        assert "email=bob%40cgiar.org" in html

    def test_link_points_to_confirm_signup_url(self):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "https://test-confirm.lambda-url.eu-central-1.on.aws/" in html

    def test_expiry_note(self):
        event = _make_event("CustomMessage_SignUp")
        result = lambda_handler(event, None)
        html = result["response"]["emailMessage"]
        assert "expires in 24 hours" in html

    def test_footer_present(self):
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


class TestUnhandledTriggers:
    def test_resend_code_uses_defaults(self):
        event = _make_event("CustomMessage_ResendCode")
        result = lambda_handler(event, None)
        # Response should be unchanged (Cognito defaults)
        assert result["response"]["emailSubject"] == ""
        assert result["response"]["emailMessage"] == ""

    def test_returns_event(self):
        event = _make_event("CustomMessage_ResendCode")
        result = lambda_handler(event, None)
        assert result is event
