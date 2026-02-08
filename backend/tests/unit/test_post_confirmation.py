"""Tests for Post Confirmation Cognito trigger (user entity creation)."""

import boto3
from cognito_triggers.post_confirmation import lambda_handler


def _make_event(trigger_source="PostConfirmation_ConfirmSignUp", sub="user-123", email="jane@cgiar.org", name="Jane Doe"):
    return {
        "triggerSource": trigger_source,
        "request": {
            "userAttributes": {
                "sub": sub,
                "email": email,
                "name": name,
            },
        },
        "response": {},
    }


class TestPostConfirmationCreateUser:
    def test_creates_user_on_signup(self, mock_users_dynamodb):
        event = _make_event()
        result = lambda_handler(event, None)

        # Verify the event is returned unmodified
        assert result is event

        # Verify user was written to DynamoDB
        table = boto3.resource("dynamodb", region_name="eu-central-1").Table("test-users")
        item = table.get_item(Key={"userId": "user-123"})["Item"]
        assert item["email"] == "jane@cgiar.org"
        assert item["name"] == "Jane Doe"
        assert "createdAt" in item

    def test_idempotent_no_overwrite(self, mock_users_dynamodb):
        """Second call should not overwrite existing user."""
        table = boto3.resource("dynamodb", region_name="eu-central-1").Table("test-users")
        table.put_item(Item={
            "userId": "user-123",
            "email": "original@cgiar.org",
            "name": "Original",
            "createdAt": "2024-01-01T00:00:00+00:00",
            "updatedAt": "2024-01-01T00:00:00+00:00",
        })

        event = _make_event(email="new@cgiar.org", name="New Name")
        lambda_handler(event, None)

        # Original data should be preserved
        item = table.get_item(Key={"userId": "user-123"})["Item"]
        assert item["email"] == "original@cgiar.org"
        assert item["name"] == "Original"

    def test_skips_forgot_password_trigger(self, mock_users_dynamodb):
        event = _make_event(trigger_source="PostConfirmation_ConfirmForgotPassword")
        result = lambda_handler(event, None)

        # Should return event without writing to DynamoDB
        assert result is event
        table = boto3.resource("dynamodb", region_name="eu-central-1").Table("test-users")
        response = table.scan()
        assert response["Count"] == 0
