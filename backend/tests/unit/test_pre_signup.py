"""Tests for Pre Sign-Up Cognito trigger (email domain validation)."""

import pytest
from cognito_triggers.pre_signup import lambda_handler


def _make_event(email):
    return {
        "request": {
            "userAttributes": {
                "email": email,
            },
        },
        "response": {},
    }


class TestPreSignUpAllowed:
    def test_cgiar_domain_allowed(self):
        event = _make_event("jane@cgiar.org")
        result = lambda_handler(event, None)
        assert result is event

    def test_synapsis_domain_allowed(self):
        event = _make_event("bob@synapsis-analytics.com")
        result = lambda_handler(event, None)
        assert result is event

    def test_case_insensitive(self):
        event = _make_event("Jane@CGIAR.ORG")
        result = lambda_handler(event, None)
        assert result is event

    def test_subdomain_not_allowed(self):
        """Subdomains like mail.cgiar.org should be rejected."""
        event = _make_event("user@mail.cgiar.org")
        with pytest.raises(Exception, match="not allowed"):
            lambda_handler(event, None)


class TestPreSignUpRejected:
    def test_gmail_rejected(self):
        event = _make_event("user@gmail.com")
        with pytest.raises(Exception, match="not allowed"):
            lambda_handler(event, None)

    def test_hotmail_rejected(self):
        event = _make_event("user@hotmail.com")
        with pytest.raises(Exception, match="not allowed"):
            lambda_handler(event, None)

    def test_empty_email_rejected(self):
        event = _make_event("")
        with pytest.raises(Exception, match="not allowed"):
            lambda_handler(event, None)

    def test_no_at_sign_rejected(self):
        event = _make_event("nodomain")
        with pytest.raises(Exception, match="not allowed"):
            lambda_handler(event, None)
