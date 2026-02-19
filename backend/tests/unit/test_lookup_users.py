import json

import boto3
import pytest


def _seed_users(users):
    """Insert user records into the mocked Users table."""
    table = boto3.resource("dynamodb", region_name="eu-central-1").Table("test-users")
    for user in users:
        table.put_item(Item=user)


def _make_event(body):
    return {
        "httpMethod": "POST",
        "path": "/users/lookup",
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body) if body is not None else None,
        "requestContext": {},
    }


class TestLookupUsers:
    def test_happy_path_both_found(self, mock_users_dynamodb):
        from lookup_users.app import lambda_handler

        _seed_users([
            {"userId": "user-1", "email": "alice@cgiar.org", "name": "Alice Smith"},
            {"userId": "user-2", "email": "bob@cgiar.org", "name": "Bob Jones"},
        ])

        event = _make_event({"userIds": ["user-1", "user-2"]})
        result = lambda_handler(event, None)
        assert result["statusCode"] == 200

        body = json.loads(result["body"])
        assert "user-1" in body["users"]
        assert "user-2" in body["users"]
        assert body["users"]["user-1"]["name"] == "Alice Smith"
        assert body["users"]["user-2"]["email"] == "bob@cgiar.org"

    def test_partial_match(self, mock_users_dynamodb):
        from lookup_users.app import lambda_handler

        _seed_users([
            {"userId": "user-1", "email": "alice@cgiar.org", "name": "Alice Smith"},
        ])

        event = _make_event({"userIds": ["user-1", "nonexistent"]})
        result = lambda_handler(event, None)
        assert result["statusCode"] == 200

        body = json.loads(result["body"])
        assert "user-1" in body["users"]
        assert "nonexistent" not in body["users"]

    def test_empty_user_ids(self, mock_users_dynamodb):
        from lookup_users.app import lambda_handler

        event = _make_event({"userIds": []})
        result = lambda_handler(event, None)
        assert result["statusCode"] == 400

        body = json.loads(result["body"])
        assert "non-empty" in body["error"]

    def test_missing_user_ids(self, mock_users_dynamodb):
        from lookup_users.app import lambda_handler

        event = _make_event({})
        result = lambda_handler(event, None)
        assert result["statusCode"] == 400

    def test_exceeding_max_ids(self, mock_users_dynamodb):
        from lookup_users.app import lambda_handler

        event = _make_event({"userIds": [f"user-{i}" for i in range(26)]})
        result = lambda_handler(event, None)
        assert result["statusCode"] == 400

        body = json.loads(result["body"])
        assert "25" in body["error"]

    def test_invalid_json_body(self, mock_users_dynamodb):
        from lookup_users.app import lambda_handler

        event = {
            "httpMethod": "POST",
            "path": "/users/lookup",
            "headers": {"Content-Type": "application/json"},
            "body": "not json",
            "requestContext": {},
        }
        result = lambda_handler(event, None)
        assert result["statusCode"] == 400

        body = json.loads(result["body"])
        assert "Invalid JSON" in body["error"]

    def test_deduplicates_ids(self, mock_users_dynamodb):
        from lookup_users.app import lambda_handler

        _seed_users([
            {"userId": "user-1", "email": "alice@cgiar.org", "name": "Alice Smith"},
        ])

        event = _make_event({"userIds": ["user-1", "user-1", "user-1"]})
        result = lambda_handler(event, None)
        assert result["statusCode"] == 200

        body = json.loads(result["body"])
        assert "user-1" in body["users"]

    def test_user_without_name(self, mock_users_dynamodb):
        """SSO users may not have a name attribute."""
        from lookup_users.app import lambda_handler

        _seed_users([
            {"userId": "user-sso", "email": "sso@cgiar.org"},
        ])

        event = _make_event({"userIds": ["user-sso"]})
        result = lambda_handler(event, None)
        assert result["statusCode"] == 200

        body = json.loads(result["body"])
        assert body["users"]["user-sso"]["email"] == "sso@cgiar.org"
