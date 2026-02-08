import json


def lambda_handler(event, context):
    """Health check endpoint."""
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "status": "healthy",
            "service": "meliaf-study-stocktake-api",
        }),
    }
