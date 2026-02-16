"""Tests for shared.response — API Gateway response helpers."""

import json
import decimal
import pytest
from shared.response import success, created, error, not_found, server_error, _serialize, CORS_HEADERS


class TestSerialize:
    def test_converts_decimal_integer_to_int(self):
        assert _serialize(decimal.Decimal("42")) == 42
        assert isinstance(_serialize(decimal.Decimal("42")), int)

    def test_converts_decimal_float_to_float(self):
        assert _serialize(decimal.Decimal("3.14")) == 3.14
        assert isinstance(_serialize(decimal.Decimal("3.14")), float)

    def test_raises_type_error_for_unknown_types(self):
        with pytest.raises(TypeError, match="not JSON serializable"):
            _serialize(set([1, 2, 3]))


class TestSuccess:
    def test_returns_200_with_cors_and_body(self):
        resp = success({"message": "ok"})
        assert resp["statusCode"] == 200
        assert resp["headers"] == CORS_HEADERS
        assert json.loads(resp["body"]) == {"message": "ok"}

    def test_custom_status_code(self):
        resp = success({"data": []}, status_code=202)
        assert resp["statusCode"] == 202

    def test_serializes_decimal_in_body(self):
        resp = success({"count": decimal.Decimal("5")})
        body = json.loads(resp["body"])
        assert body["count"] == 5

    def test_serializes_nested_decimal(self):
        resp = success({"item": {"price": decimal.Decimal("19.99")}})
        body = json.loads(resp["body"])
        assert body["item"]["price"] == 19.99


class TestCreated:
    def test_returns_201(self):
        resp = created({"id": "abc"})
        assert resp["statusCode"] == 201
        assert json.loads(resp["body"]) == {"id": "abc"}


class TestError:
    def test_returns_400_with_error_message(self):
        resp = error("Bad input")
        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert body == {"error": "Bad input"}

    def test_includes_details_when_provided(self):
        details = [{"field": "name", "message": "required"}]
        resp = error("Validation failed", details=details)
        body = json.loads(resp["body"])
        assert body["details"] == details

    def test_custom_status_code(self):
        resp = error("Conflict", status_code=409)
        assert resp["statusCode"] == 409

    def test_has_cors_headers(self):
        resp = error("fail")
        assert resp["headers"] == CORS_HEADERS


class TestNotFound:
    def test_returns_404_with_default_message(self):
        resp = not_found()
        assert resp["statusCode"] == 404
        assert json.loads(resp["body"])["error"] == "Resource not found"

    def test_returns_404_with_custom_message(self):
        resp = not_found("Study not found")
        assert resp["statusCode"] == 404
        assert json.loads(resp["body"])["error"] == "Study not found"


class TestServerError:
    def test_returns_500_with_default_message(self):
        resp = server_error()
        assert resp["statusCode"] == 500
        assert json.loads(resp["body"])["error"] == "Internal server error"

    def test_returns_500_with_custom_message(self):
        resp = server_error("DB connection failed")
        assert resp["statusCode"] == 500
        assert json.loads(resp["body"])["error"] == "DB connection failed"
