"""Tests for shared.identity — user identity extraction from JWT claims."""

import pytest
from shared.identity import get_user_identity, DEV_USER


def _event_with_claims(sub, email=None):
    """Build an API Gateway event with authorizer claims."""
    claims = {"sub": sub}
    if email is not None:
        claims["email"] = email
    return {"requestContext": {"authorizer": {"claims": claims}}}


class TestGetUserIdentity:
    def test_returns_identity_from_valid_claims(self):
        event = _event_with_claims("user-abc-123", "alice@cgiar.org")
        result = get_user_identity(event)
        assert result == {"user_id": "user-abc-123", "email": "alice@cgiar.org"}

    def test_returns_empty_email_when_claim_missing(self):
        event = _event_with_claims("user-abc-123")
        result = get_user_identity(event)
        assert result == {"user_id": "user-abc-123", "email": ""}

    def test_falls_back_to_dev_user_in_dev_env(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "dev")
        result = get_user_identity({"requestContext": {}})
        assert result == DEV_USER

    def test_falls_back_to_dev_user_in_test_env(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "test")
        result = get_user_identity({"requestContext": {}})
        assert result == DEV_USER

    def test_raises_in_prod_env_without_claims(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "prod")
        with pytest.raises(RuntimeError, match="authentication required"):
            get_user_identity({"requestContext": {}})

    def test_raises_in_staging_env_without_claims(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "staging")
        with pytest.raises(RuntimeError, match="authentication required"):
            get_user_identity({"requestContext": {}})

    def test_handles_missing_request_context(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "dev")
        result = get_user_identity({})
        assert result == DEV_USER

    def test_handles_missing_authorizer(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "dev")
        result = get_user_identity({"requestContext": {"authorizer": {}}})
        assert result == DEV_USER
