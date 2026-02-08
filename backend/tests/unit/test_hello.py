import json
from functions.hello.app import lambda_handler


API_GW_EVENT = {
    "httpMethod": "GET",
    "path": "/hello",
    "headers": {},
    "queryStringParameters": None,
    "body": None,
}


def test_hello_returns_200():
    response = lambda_handler(API_GW_EVENT, None)
    assert response["statusCode"] == 200


def test_hello_returns_message():
    response = lambda_handler(API_GW_EVENT, None)
    body = json.loads(response["body"])
    assert "Hello from MELIAF Study Stocktake API" in body["message"]
    assert "environment" in body


def test_hello_has_cors_header():
    response = lambda_handler(API_GW_EVENT, None)
    assert response["headers"]["Access-Control-Allow-Origin"] == "*"
