"""API Gateway response helpers with CORS headers."""

import json
import decimal


CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
}


def _serialize(obj):
    """Handle DynamoDB Decimal and other non-serializable types."""
    if isinstance(obj, decimal.Decimal):
        return int(obj) if obj == int(obj) else float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def success(body, status_code=200):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=_serialize),
    }


def created(body):
    return success(body, 201)


def error(message, status_code=400, details=None):
    body = {"error": message}
    if details:
        body["details"] = details
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body),
    }


def not_found(message="Resource not found"):
    return error(message, 404)


def server_error(message="Internal server error"):
    return error(message, 500)
