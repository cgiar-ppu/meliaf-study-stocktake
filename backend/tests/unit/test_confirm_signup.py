"""Tests for ConfirmSignup Lambda (Function URL handler)."""

from unittest.mock import patch, MagicMock
import botocore.exceptions

from confirm_signup.app import lambda_handler


def _make_event(code="123456", email="jane@cgiar.org"):
    return {
        "queryStringParameters": {"code": code, "email": email},
    }


class TestSuccessfulConfirmation:
    @patch("confirm_signup.app.cognito")
    def test_redirects_to_signin_confirmed(self, mock_cognito):
        mock_cognito.confirm_sign_up.return_value = {}
        result = lambda_handler(_make_event(), None)

        assert result["statusCode"] == 302
        assert "confirmed=true" in result["headers"]["Location"]
        assert "/signin" in result["headers"]["Location"]

    @patch("confirm_signup.app.cognito")
    def test_calls_cognito_with_correct_params(self, mock_cognito):
        mock_cognito.confirm_sign_up.return_value = {}
        lambda_handler(_make_event(code="ABC123", email="bob@cgiar.org"), None)

        mock_cognito.confirm_sign_up.assert_called_once_with(
            ClientId="test-client-id-123",
            Username="bob@cgiar.org",
            ConfirmationCode="ABC123",
        )


class TestMissingParams:
    @patch("confirm_signup.app.cognito")
    def test_missing_code_redirects_with_error(self, mock_cognito):
        event = {"queryStringParameters": {"email": "jane@cgiar.org"}}
        result = lambda_handler(event, None)

        assert result["statusCode"] == 302
        assert "error=confirmation_failed" in result["headers"]["Location"]
        mock_cognito.confirm_sign_up.assert_not_called()

    @patch("confirm_signup.app.cognito")
    def test_missing_email_redirects_with_error(self, mock_cognito):
        event = {"queryStringParameters": {"code": "123456"}}
        result = lambda_handler(event, None)

        assert result["statusCode"] == 302
        assert "error=confirmation_failed" in result["headers"]["Location"]

    @patch("confirm_signup.app.cognito")
    def test_no_query_params_redirects_with_error(self, mock_cognito):
        event = {"queryStringParameters": None}
        result = lambda_handler(event, None)

        assert result["statusCode"] == 302
        assert "error=confirmation_failed" in result["headers"]["Location"]


class TestExpiredCode:
    @patch("confirm_signup.app.cognito")
    def test_expired_code_redirects_with_error(self, mock_cognito):
        mock_cognito.exceptions.ExpiredCodeException = type(
            "ExpiredCodeException", (Exception,), {}
        )
        mock_cognito.confirm_sign_up.side_effect = (
            mock_cognito.exceptions.ExpiredCodeException("Expired")
        )
        result = lambda_handler(_make_event(), None)

        assert result["statusCode"] == 302
        assert "error=code_expired" in result["headers"]["Location"]


class TestAlreadyConfirmed:
    @patch("confirm_signup.app.cognito")
    def test_already_confirmed_treated_as_success(self, mock_cognito):
        mock_cognito.exceptions.NotAuthorizedException = type(
            "NotAuthorizedException", (Exception,), {}
        )
        mock_cognito.exceptions.ExpiredCodeException = type(
            "ExpiredCodeException", (Exception,), {}
        )
        mock_cognito.exceptions.CodeMismatchException = type(
            "CodeMismatchException", (Exception,), {}
        )
        mock_cognito.confirm_sign_up.side_effect = (
            mock_cognito.exceptions.NotAuthorizedException("Already confirmed")
        )
        result = lambda_handler(_make_event(), None)

        assert result["statusCode"] == 302
        assert "confirmed=true" in result["headers"]["Location"]


class TestInvalidCode:
    @patch("confirm_signup.app.cognito")
    def test_invalid_code_redirects_with_error(self, mock_cognito):
        mock_cognito.exceptions.CodeMismatchException = type(
            "CodeMismatchException", (Exception,), {}
        )
        mock_cognito.exceptions.ExpiredCodeException = type(
            "ExpiredCodeException", (Exception,), {}
        )
        mock_cognito.exceptions.NotAuthorizedException = type(
            "NotAuthorizedException", (Exception,), {}
        )
        mock_cognito.confirm_sign_up.side_effect = (
            mock_cognito.exceptions.CodeMismatchException("Mismatch")
        )
        result = lambda_handler(_make_event(), None)

        assert result["statusCode"] == 302
        assert "error=confirmation_failed" in result["headers"]["Location"]


class TestUnexpectedError:
    @patch("confirm_signup.app.cognito")
    def test_unexpected_error_redirects_with_error(self, mock_cognito):
        mock_cognito.exceptions.ExpiredCodeException = type(
            "ExpiredCodeException", (Exception,), {}
        )
        mock_cognito.exceptions.NotAuthorizedException = type(
            "NotAuthorizedException", (Exception,), {}
        )
        mock_cognito.exceptions.CodeMismatchException = type(
            "CodeMismatchException", (Exception,), {}
        )
        mock_cognito.confirm_sign_up.side_effect = RuntimeError("Boom")
        result = lambda_handler(_make_event(), None)

        assert result["statusCode"] == 302
        assert "error=confirmation_failed" in result["headers"]["Location"]


class TestRedirectUrl:
    @patch("confirm_signup.app.cognito")
    def test_redirect_uses_frontend_url(self, mock_cognito):
        mock_cognito.confirm_sign_up.return_value = {}
        result = lambda_handler(_make_event(), None)

        assert result["headers"]["Location"].startswith("http://localhost:8080/signin")
