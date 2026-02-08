import json
import os


def lambda_handler(event, context):
    """Hello stub endpoint."""
    environment = os.environ.get("ENVIRONMENT", "unknown")
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "message": "Hello from MELIAF Study Stocktake API",
            "environment": environment,
        }),
    }
