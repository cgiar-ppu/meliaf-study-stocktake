import json
from functions.health.app import lambda_handler


API_GW_EVENT = {
    "httpMethod": "GET",
    "path": "/health",
    "headers": {},
    "queryStringParameters": None,
    "body": None,
}


def test_health_returns_200():
    response = lambda_handler(API_GW_EVENT, None)
    assert response["statusCode"] == 200


def test_health_returns_healthy_status():
    response = lambda_handler(API_GW_EVENT, None)
    body = json.loads(response["body"])
    assert body["status"] == "healthy"
    assert body["service"] == "meliaf-study-stocktake-api"


def test_health_has_cors_header():
    response = lambda_handler(API_GW_EVENT, None)
    assert response["headers"]["Access-Control-Allow-Origin"] == "*"
